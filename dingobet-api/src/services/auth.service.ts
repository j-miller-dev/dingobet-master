import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { env } from "../config/env.js";

const LOCKOUT_KEY = (email: string) => `login:lockout:${email}`;
const LOCKOUT_MAX_ATTEMPTS = 10;
const LOCKOUT_WINDOW_SECONDS = 15 * 60;
const SESSION_EXPIRY_DAYS = 7;

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function signAccessToken(payload: {
  sub: string;
  email: string;
  role: string;
}) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

function sessionExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_EXPIRY_DAYS);
  return date;
}

export async function loginUser(
  email: string,
  password: string,
  userAgent: string | null,
  ipAddress: string | null,
) {
  const lockKey = LOCKOUT_KEY(email);
  const attempts = await redis.get(lockKey);
  if (attempts && parseInt(attempts) >= LOCKOUT_MAX_ATTEMPTS) {
    throw new AuthError(
      "Account temporarily locked. Try again in 15 minutes.",
      429,
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AuthError("Invalid credentials", 401);

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    await redis.multi().incr(lockKey).expire(lockKey, LOCKOUT_WINDOW_SECONDS).exec();
    throw new AuthError("Invalid credentials", 401);
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = crypto.randomUUID();

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt: sessionExpiresAt(),
    },
  });

  await redis.del(lockKey);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      role: user.role,
    },
  };
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string | undefined,
  username: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthError("User already exists", 409);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email, firstName, lastName, username, passwordHash },
    });
    await tx.wallet.create({ data: { userId: newUser.id, balance: 0 } });
    return newUser;
  });

  return { userId: user.id };
}

export async function refreshTokens(
  refreshToken: string,
  userAgent: string | null,
  ipAddress: string | null,
) {
  const session = await prisma.session.findUnique({ where: { refreshToken } });
  if (!session) throw new AuthError("Invalid refresh token", 401);
  if (session.expiresAt < new Date())
    throw new AuthError("Refresh token expired", 401);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new AuthError("User not found", 401);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const newRefreshToken = crypto.randomUUID();

  await prisma.session.delete({ where: { id: session.id } });
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: newRefreshToken,
      userAgent,
      ipAddress,
      expiresAt: sessionExpiresAt(),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError("User not found", 404);

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new AuthError("Current password is incorrect", 400);

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
}

export async function resetPassword(userId: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
}

export async function logoutUser(refreshToken: string) {
  await prisma.session.delete({ where: { refreshToken } }).catch((error) => {
    if (error?.code === "P2025") return; // session already gone — treat as success
    throw error;
  });
}

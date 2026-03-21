import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validate } from "../middleware/validate.middleware.js";
import { prisma } from "../lib/prisma.js";
import { loginSchema, registerSchema } from "../schemas/auth.schemas.js";
const router = Router();

/**
 * LOGIN ROUTE
 */
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password required",
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      // sign-in access token, short-lived - verified on every Request
      const accessToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: (process.env.ACCESS_TOKEN_EXPIRY ??
            "15m") as jwt.SignOptions["expiresIn"],
        },
      );

      // generate fresh token, random string, stored in db so it can be revoked
      const refreshToken = crypto.randomUUID();

      // persist session with expiry, device info
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          userAgent: req.headers["user-agent"] ?? null,
          ipAddress: req.ip ?? null,
          expiresAt,
        },
      });
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * REGISTER ROUTE
 */

router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, username } = req.body;

      if (!email || !password || !firstName || !username) {
        return res.status(400).json({
          message: "All fields required",
        });
      }

      // check existing user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "User already exists",
        });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // create user + wallet (transaction)
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            username,
            passwordHash: hashedPassword,
          },
        });

        await tx.wallet.create({
          data: {
            userId: newUser.id,
            balance: 0,
          },
        });

        return newUser;
      });

      res.status(201).json({
        message: "User registered",
        userId: user.id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Registration failed",
      });
    }
  },
);

/**
 * REFRESH ROUTE
 * POST /api/auth/refresh
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    // 1. Get refreshToken from req.body

    const { refreshToken } = req.body;

    // 2. Find Session row by refreshToken — return 401 if not found
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });
    if (!session)
      return res.status(401).json({ message: "Invalid refresh token" });

    // 3. Check session.expiresAt > now — return 401 if expired
    if (session.expiresAt < new Date())
      return res.status(401).json({ message: "Refresh token expired" });

    // 4. Sign a new accessToken (jwt.sign) with user's id, email, role
    //    (need to fetch user to get email + role)

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) return res.status(401).json({ message: "User not found" });

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY ??
          "15m") as jwt.SignOptions["expiresIn"],
      },
    );

    // 5. Return { accessToken }
    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * LOGOUT ROUTE
 * POST /api/auth/logout
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    await prisma.session.delete({ where: { refreshToken } });

    res.json({ message: "Logged out" });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return res.json({ message: "Logged out" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ─── Mock all modules that connect to external services or validate env ───────
// These are hoisted before any imports, so they intercept every downstream
// module that tries to load them (env.ts, prisma.ts, redis.ts).

// Inline literal — vi.mock factories are hoisted before const declarations
vi.mock("../../src/config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 4000,
    FRONTEND_URL: "http://localhost:3000",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    JWT_SECRET: "test-jwt-secret-must-be-at-least-32-chars!!",
    ACCESS_TOKEN_EXPIRY: "15m",
    ODDS_API_KEY: "test-key",
    ODDS_API_BASE_URL: "https://api.the-odds-api.com/v4",
  },
}));

vi.mock("../../src/lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../src/lib/redis.js", () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    multi: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  },
}));

// Rate limiters become no-ops so tests don't get blocked
vi.mock("../../src/middleware/rateLimiter.js", () => ({
  globalLimiter: (_req: any, _res: any, next: any) => next(),
  walletLimiter: (_req: any, _res: any, next: any) => next(),
  betsLimiter: (_req: any, _res: any, next: any) => next(),
  adminLimiter: (_req: any, _res: any, next: any) => next(),
}));

// Sentry instrument is a side-effect import — replace with no-op
vi.mock("../../src/instrument.js", () => ({}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("$2b$10$mockedhash"),
  },
}));

// ─── Imports (after mocks are registered) ────────────────────────────────────
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { redis } from "../../src/lib/redis.js";
import bcrypt from "bcryptjs";

// Must match the literal used in vi.mock("../../src/config/env.js") above
const TEST_JWT_SECRET = "test-jwt-secret-must-be-at-least-32-chars!!";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockUser = {
  id: "cuid_user_123",
  email: "test@example.com",
  username: "testuser",
  firstName: "Test",
  lastName: "User",
  passwordHash: "$2b$10$mockedhash",
  role: "USER",
  isActive: true,
};

const mockSession = {
  id: "cuid_session_123",
  userId: mockUser.id,
  refreshToken: "mock-refresh-token-uuid",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
};

function makeAccessToken(overrides?: Partial<typeof mockUser>) {
  const user = { ...mockUser, ...overrides };
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    TEST_JWT_SECRET,
    { expiresIn: "15m" },
  );
}

beforeEach(() => {
  // auth.middleware.ts reads process.env.JWT_SECRET at call time (not load time)
  process.env.JWT_SECRET = TEST_JWT_SECRET;
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("returns 201 and userId on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (cb: any) =>
      cb({
        user: { create: vi.fn().mockResolvedValue(mockUser) },
        wallet: { create: vi.fn().mockResolvedValue({}) },
      }),
    );

    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: "User registered",
      userId: mockUser.id,
    });
  });

  it("returns 409 when email already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);

    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
    });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ message: "User already exists" });
  });

  it("returns 400 when request body fails schema validation", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 with tokens and user on valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
    vi.mocked(prisma.session.create).mockResolvedValueOnce(mockSession as any);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      },
    });
  });

  it("returns 401 when user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Invalid credentials" });
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Invalid credentials" });
  });

  it("returns 429 when account is locked out", async () => {
    vi.mocked(redis.get).mockResolvedValueOnce("10");

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/locked/i);
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe("POST /api/auth/refresh", () => {
  it("returns 200 with new tokens on valid refresh token", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
    vi.mocked(prisma.session.delete).mockResolvedValueOnce(mockSession as any);
    vi.mocked(prisma.session.create).mockResolvedValueOnce({
      ...mockSession,
      refreshToken: "new-refresh-token-uuid",
    } as any);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "mock-refresh-token-uuid" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it("returns 401 when refresh token is not found", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Invalid refresh token" });
  });

  it("returns 401 when refresh token is expired", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000), // already expired
    } as any);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "expired-token" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Refresh token expired" });
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("returns 200 on valid logout", async () => {
    vi.mocked(prisma.session.delete).mockResolvedValueOnce(mockSession as any);

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: "mock-refresh-token-uuid" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "Logged out" });
  });

  it("returns 400 when refresh token is missing", async () => {
    const res = await request(app).post("/api/auth/logout").send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: "Refresh token required" });
  });
});

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────

describe("PATCH /api/auth/change-password", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const res = await request(app).patch("/api/auth/change-password").send({
      currentPassword: "oldpassword",
      newPassword: "newpassword123",
    });

    expect(res.status).toBe(401);
  });

  it("returns 200 when authenticated with correct current password", async () => {
    const accessToken = makeAccessToken();
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any);

    const res = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "oldpassword", newPassword: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "Password updated" });
  });
});

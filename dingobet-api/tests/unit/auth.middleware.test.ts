import { describe, it, expect, vi, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate } from "../../src/middleware/auth.middleware.js";
import type { Request, Response, NextFunction } from "express";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../../src/config/env.js", () => ({
  env: {
    JWT_SECRET: "test-secret",
  },
}));

// Helpers - fake the three Express arguments
const makeReq = (authHeader?: string) =>
  ({ headers: { authorization: authHeader } }) as unknown as Request;

const makeRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res); // allows res.status(401).json(...)
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

describe("authenticate middleware", () => {
  it("returns 401 when Authorization header is missing", () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header does not start with Bearer", () => {
    const req = makeReq("Token abc123");
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches user and calls next() on a valid token", () => {
    const payload = { sub: "user-1", email: "a@b.com", role: "user" };
    vi.mocked(jwt.verify).mockReturnValueOnce(payload as any);

    const req = makeReq("Bearer valid.token.here");
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: "user-1", email: "a@b.com", role: "user" });
    expect(res.status).not.toHaveBeenCalled();
  });
  it("returns 401 when jwt.verify throws (expired or invalid token)", () => {
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error("jwt expired");
    });

    const req = makeReq("Bearer bad.token");
    const res = makeRes();
    const next = vi.fn() as NextFunction;
    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

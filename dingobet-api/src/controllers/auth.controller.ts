import { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  refreshTokens,
  changePassword,
  resetPassword,
  logoutUser,
  AuthError,
} from "../services/auth.service.js";
import logger from "../lib/logger.js";

function handleError(res: Response, error: unknown, context: string) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ message: error.message });
  }
  logger.error({ err: error }, context);
  res.status(500).json({ message: "Server error" });
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(
      email,
      password,
      req.headers["user-agent"] ?? null,
      req.ip ?? null,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error, "auth login error");
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, username } = req.body;
    const result = await registerUser(email, password, firstName, lastName, username);
    res.status(201).json({ message: "User registered", ...result });
  } catch (error) {
    handleError(res, error, "auth register error");
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    const result = await refreshTokens(
      refreshToken,
      req.headers["user-agent"] ?? null,
      req.ip ?? null,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error, "auth refresh error");
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    await changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: "Password updated" });
  } catch (error) {
    handleError(res, error, "auth change-password error");
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    await resetPassword(req.user!.id, newPassword);
    res.json({ message: "Password reset" });
  } catch (error) {
    handleError(res, error, "auth reset-password error");
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    await logoutUser(refreshToken);
    res.json({ message: "Logged out" });
  } catch (error) {
    handleError(res, error, "auth logout error");
  }
}

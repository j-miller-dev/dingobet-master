// stopping async errors from crashing the server

import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger.js";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error({ err }, "Unhandled error");

  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
}

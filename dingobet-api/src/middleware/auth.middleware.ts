import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express's Request type so TypeScript knows about req.user:
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

/**
 * AUTH MIDDLEWARE
 *
 * Protects routes by verifying the JWT access token.
 * Attach to any route that requires a logged-in user.
 *
 * 1. Get the Authorization header from req.headers
 * 2. Check it exists and starts with "Bearer " — return 401 if not
 * 3. Extract the token (split on " ")[1])
 * 4. Call jwt.verify(token, process.env.JWT_SECRET!) inside a try/catch
 *    — catch means token is invalid or expired — return 401
 * 5. Cast the decoded payload and attach to req.user:
 *    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role }
 * 6. Call next() to pass control to the route handler
 *
 */

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // TODO: implement above steps — remove underscore prefixes when implementing
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extract the token (split on " ")[1])
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      email: string;
      role: string;
    };
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

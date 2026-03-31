// Imports needed:
// - Request, Response, NextFunction from "express"

// Export a function: authorise(...roles: string[])
// This is a middleware factory — it takes the required role(s) and returns
// a middleware function. The "..." means you can pass multiple roles:
//   authorise("ADMIN")
//   authorise("ADMIN", "SUPER_ADMIN")

//   The returned middleware should:
//   1. Get req.user — if no user, return 401 (not authenticated)
//   2. Check if req.user.role is in the roles array
//   3. If not → return 403 { message: "Forbidden" }
//   4. If yes → call next() to pass through to the route handler

// The key concept here is the factory pattern — authorise() doesn't return a response itself, it returns a function
// that does. That returned function is what Express calls as middleware.

import { Request, Response, NextFunction } from "express";

export const authorise = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Not authorised" });
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    } else {
      next();
    }
  };
};

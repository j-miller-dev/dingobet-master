import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { Router, Request, Response } from "express";

const router: Router = Router();

/**
 * GET /api/users/me
 *
 * Returns the logged-in user's profile.
 * First protected route — proves auth middleware works.
 *
 * 1. Get the user id from req.user.id (set by auth middleware)
 * 2. Query prisma.user.findUnique({ where: { id } })
 *    — select only safe fields: id, email, username, firstName, lastName,
 *      phone, avatarUrl, role, kycStatus, isActive, createdAt
 * 3. Return 404 if not found
 * 4. Return the user object

*/
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/users/me
 *
 * Update the logged-in user's profile fields.
 *
 * 1. Get user id from req.user.id
 * 2. Destructure allowed fields from req.body:
 *    { firstName, lastName, phone, avatarUrl }
 *    — never let the user update email, role, passwordHash, kycStatus here
 * 3. Call prisma.user.update({ where: { id }, data: { firstName, lastName, phone, avatarUrl } })
 * 4. Return the updated user
 */

router.patch("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const { firstName, lastName, phone, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, phone, avatarUrl },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

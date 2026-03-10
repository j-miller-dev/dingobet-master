import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router: Router = Router();

router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const sports = await prisma.sport.findMany();
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;

// GET /api/notifications
// 1. Get userId from req.user
// 2. prisma.notification.findMany — where userId, orderBy createdAt desc
// 3. Also get unread count: prisma.notification.count({ where: { userId, isRead: false } })
// 4. Return { notifications, unreadCount }
//  Then wire it into src/routes/index.ts mounted at /notifications.

import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    return res.status(400).json({ message: "No notifications to show." });
  }
});

router.patch("/:id/read", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== userId)
      return res.status(404).json({ message: "Notification not found" });
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/read-all", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { Router, Request, Response } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { amountSchema } from "../schemas/wallet.schemas.js";
import { getIO } from "../lib/socket.js";

const router: Router = Router();
//  For the wallet, it's two endpoints:
// - GET /api/wallet — return balance + currency
// - GET /api/wallet/transactions — recent transactions for the logged-in user

//  Both are protected, both are simple Prisma reads. You could build these yourself in 15 minutes with what you know now.

router.use(authenticate);
router.get("/", async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const wallet = await prisma.wallet.findUnique({
      where: { userId: id },
      select: { balance: true, currency: true },
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found." });
    res.json(wallet);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      select: {
        id: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post(
  "/deposit",
  validate(amountSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });

      const updated = await prisma.$transaction(async (tx) => {
        const w = await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: amount } },
        });
        await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            type: "DEPOSIT",
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: Number(wallet.balance) + amount,
            status: "COMPLETED",
          },
        });
        return w;
      });

      // Notify the user their wallet has been updated — outside transaction so it only fires on success
      getIO().to(`user:${userId}`).emit("wallet:updated", {
        type: "deposit",
        amount,
        balance: updated.balance,
      });

      res.json({ balance: updated.balance, currency: updated.currency });
    } catch (error) {
      res.status(500).json({ message: "server error" });
    }
   


  },
);

router.post(
  "/withdraw",
  validate(amountSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      if (!amount || amount <= 0)
        return res.status(400).json({ message: "Invalid amount" });

      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });

      if (Number(wallet.balance) < amount)
        return res.status(400).json({ message: "Insufficient funds" });

      const updated = await prisma.$transaction(async (tx) => {
        const w = await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });
        await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            type: "WITHDRAWAL",
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: Number(wallet.balance) - amount,
            status: "COMPLETED",
          },
        });
        return w;
      });

      // Notify the user their wallet has been updated — outside transaction so it only fires on success
      getIO().to(`user:${userId}`).emit("wallet:updated", {
        type: "withdrawal",
        amount,
        balance: updated.balance,
      });

      res.json({ balance: updated.balance, currency: updated.currency });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;

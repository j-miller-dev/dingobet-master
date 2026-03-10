import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { Router, Request, Response } from "express";

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

export default router;

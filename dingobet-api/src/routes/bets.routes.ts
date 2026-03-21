import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.middleware.js";
import { placeBetSchema } from "../schemas/bets.schema.js";

const router: Router = Router();

router.post(
  "/",
  authenticate,
  validate(placeBetSchema),
  async (req: Request, res: Response) => {
    try {
      const { eventId, bookmaker, market, selection, stake } = req.body;
      const userId = req.user!.id;

      const validateEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!validateEvent || validateEvent.status != "UPCOMING")
        return res.status(404).json({ message: "No sport events UPCOMING" });

      const snapshot = await prisma.oddsSnapshot.findFirst({
        where: { eventId, bookmaker, market },
        orderBy: { fetchedAt: "desc" },
      });

      if (!snapshot)
        return res.status(404).json({ message: "Odds aren't available" });

      const outcome = (snapshot.outcomes as any[]).find(
        (o) => o.name === selection,
      );
      if (!outcome)
        return res.status(400).json({ message: "Selection not found" });

      const odds = outcome.price;
      const potentialPayout = Math.round(stake * odds * 100) / 100;

      const bet = await prisma.$transaction(async (tx) => {
        // tx works exactly like prisma, but every call is part of the same transaction
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });
        if (!wallet) throw new Error("wallet not found");
        if (Number(wallet.balance) < stake)
          throw new Error("Insufficient funds");

        await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: stake } },
        });

        const bet = await tx.bet.create({
          data: {
            userId,
            type: "SINGLE",
            stake,
            totalOdds: odds,
            potentialPayout,
            status: "PENDING",
          },
        });

        await tx.betLeg.create({
          data: {
            betId: bet.id,
            eventId,
            market,
            selection,
            odds,
            bookmaker,
            status: "PENDING",
          },
        });

        await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            betId: bet.id,
            type: "BET_PLACED",
            amount: stake,
            balanceBefore: wallet.balance,
            balanceAfter: Number(wallet.balance) - stake,
            status: "COMPLETED",
          },
        });
        // if anything throws here, ALL of the above rolls back automatically
        return bet;
      });

      return res.status(201).json(bet);
    } catch (error) {
      if (error instanceof Error && error.message === "Insufficient funds") {
        res.status(400).json({ message: "Insufficient funds" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  },
);

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const bets = await prisma.bet.findMany({
      where: { userId },
      include: { legs: true },
      orderBy: { placedAt: "desc" },
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const bet = await prisma.bet.findUnique({
      where: { id: req.params.id },
      include: {
        legs: {
          include: { event: { include: { homeTeam: true, awayTeam: true } } },
        },
      },
    });
    if (!bet || bet.userId !== userId)
      return res.status(404).json({ message: "Bet not found" });
    res.json(bet);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

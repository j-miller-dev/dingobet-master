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
      // --- STEP 1: Extract the incoming request data ---
      // legInputs is an array of legs from the request body.
      // Each leg has: eventId, bookmaker, market, selection.
      // stake is how much money the user is betting in total.
      // userId comes from the JWT token (set by the authenticate middleware).
      const { legs: legInputs, stake } = req.body;
      const userId = req.user!.id;

      // --- STEP 2: Validate each leg and resolve the odds ---
      // We can't trust the client to send us the correct odds — we always
      // look them up ourselves from the latest OddsSnapshot in the DB.
      // resolvedLegs will hold each leg with the odds we looked up added on.
      const resolvedLegs: {
        eventId: string;
        bookmaker: string;
        market: string;
        selection: string;
        odds: number;
      }[] = [];

      for (const legInput of legInputs) {
        // 2a. Make sure the event exists and is still open for betting.
        // We only allow bets on UPCOMING events — not LIVE, COMPLETED etc.
        const event = await prisma.event.findUnique({
          where: { id: legInput.eventId },
        });
        if (!event || event.status !== "UPCOMING")
          return res
            .status(400)
            .json({ message: `Event ${legInput.eventId} is not available` });

        // 2b. Find the most recent odds snapshot for this event/bookmaker/market combo.
        // Snapshots are never updated — new ones are always inserted (historical record).
        // So we order by fetchedAt desc and take the first (most recent).
        const snapshot = await prisma.oddsSnapshot.findFirst({
          where: {
            eventId: legInput.eventId,
            bookmaker: legInput.bookmaker,
            market: legInput.market,
          },
          orderBy: { fetchedAt: "desc" },
        });
        if (!snapshot)
          return res
            .status(404)
            .json({ message: `Odds not available for event ${legInput.eventId}` });

        // 2c. Each snapshot has an `outcomes` JSON array, e.g.:
        // [{ name: "Melbourne Victory", price: 2.5 }, { name: "Sydney FC", price 1.8 }]
        // Find the outcome matching the user's selection to get its price (decimal odds).
        const outcome = (snapshot.outcomes as any[]).find(
          (o) => o.name === legInput.selection,
        );
        if (!outcome)
          return res
            .status(400)
            .json({ message: `Selection "${legInput.selection}" not found` });

        // 2d. Push the validated leg + its resolved odds into our array.
        resolvedLegs.push({ ...legInput, odds: outcome.price });
      }

      // --- STEP 3: Calculate bet type and combined odds ---
      // A single leg = SINGLE bet. Two or more legs = MULTI (accumulator/parlay).
      const betType = resolvedLegs.length === 1 ? "SINGLE" : "MULTI";

      // For a multi, the total odds = product of all individual leg odds.
      // e.g. leg1 at 2.0 and leg2 at 3.0 = 6.0 combined odds.
      // reduce() starts at 1 and multiplies each leg's odds in.
      const totalOdds = resolvedLegs.reduce((acc, leg) => acc * leg.odds, 1);

      // Potential payout = stake × combined odds, rounded to 2 decimal places.
      const potentialPayout = Math.round(stake * totalOdds * 100) / 100;

      // --- STEP 4: Write everything to the database in one transaction ---
      // A Prisma transaction means ALL of these DB operations succeed together,
      // or if ANY of them fail, ALL of them are rolled back automatically.
      // This is critical — we never want to deduct wallet funds without creating
      // the bet, or create a bet without deducting funds.
      const bet = await prisma.$transaction(async (tx) => {
        // 4a. Fetch the user's wallet and check they have enough balance.
        // We do this INSIDE the transaction so the balance check and deduction
        // are atomic — no risk of two concurrent bets both passing the check.
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new Error("wallet not found");
        if (Number(wallet.balance) < stake) throw new Error("Insufficient funds");

        // 4b. Deduct the stake from the wallet.
        // `decrement` is a Prisma helper — it's equivalent to balance = balance - stake.
        await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: stake } },
        });

        // 4c. Create the parent Bet record.
        // This stores the overall bet summary — type, stake, odds, potential payout.
        const bet = await tx.bet.create({
          data: {
            userId,
            type: betType,
            stake,
            totalOdds,
            potentialPayout,
            status: "PENDING",
          },
        });

        // 4d. Create a BetLeg record for each leg.
        // For a SINGLE this loop runs once. For a MULTI it runs once per leg.
        // Each leg records which event, what selection, and the odds at the time
        // of placement — important because odds change, we need a historical record.
        for (const leg of resolvedLegs) {
          await tx.betLeg.create({
            data: {
              betId: bet.id,
              eventId: leg.eventId,
              market: leg.market,
              selection: leg.selection,
              odds: leg.odds,
              bookmaker: leg.bookmaker,
              status: "PENDING",
            },
          });
        }

        // 4e. Create a Transaction record for the wallet audit trail.
        // We snapshot balanceBefore and balanceAfter so the full history
        // of every wallet movement is preserved, even if the wallet balance changes later.
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

        // Return the bet so it's available outside the transaction block.
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

// Open src / routes / admin.routes.ts and build POST / sync - sports.
//
//   The steps inside the handler:
//
// 1. Call fetchSports() from the service
// 2. Loop over the results and upsert each one into prisma.sport
// 3. Return { message: "Sports synced", count: sports.length }
//
//   The Odds API returns each sport with these fields — map them to your schema:
// - key → id
//   - title → title
//     - group → group
//       - description → description
//         - has_outrights → hasOutrights
//           - active → isActive
//
//   Also import fetchSports from the service and authenticate from middleware — this route should be protected.

import { Router, Request, Response } from "express";
import { fetchEvents, fetchSports } from "../services/odds.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.middleware.js";
import { settleEventSchema } from "../schemas/admin.schemas.js";
import { getIO } from "../lib/socket.js";
import { authorise } from "../middleware/authorise.middleware.js";

const router: Router = Router();

router.post(
  "/sync-sports",
  authenticate,
  authorise("ADMIN", "SUPER_ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const sports = await fetchSports();
      for (const sport of sports) {
        await prisma.sport.upsert({
          where: { id: sport.key },
          update: {
            title: sport.title,
            group: sport.group,
            description: sport.description,
            hasOutrights: sport.has_outrights,
            isActive: sport.active,
          },
          create: {
            id: sport.key,
            title: sport.title,
            group: sport.group,
            description: sport.description,
            hasOutrights: sport.has_outrights,
            isActive: sport.active,
          },
        });
      }
      res.json({ message: "Sports synced", count: sports.length });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  },
);

router.post(
  "/sync-events/:sportKey",
  authenticate,
  authorise("ADMIN", "SUPER_ADMIN"),

  async (req: Request, res: Response) => {
    try {
      const { sportKey } = req.params;
      const events = await fetchEvents(sportKey);
      for (const event of events) {
        const [homeTeam, awayTeam] = await Promise.all([
          prisma.team.upsert({
            where: { name: event.home_team },
            update: {},
            create: { name: event.home_team },
          }),
          prisma.team.upsert({
            where: { name: event.away_team },
            update: {},
            create: { name: event.away_team },
          }),
        ]);
        await prisma.event.upsert({
          where: { externalId: event.id },
          update: {
            sportId: event.sport_key,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            commenceTime: new Date(event.commence_time),
          },
          create: {
            externalId: event.id,
            sportId: event.sport_key,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            commenceTime: new Date(event.commence_time),
          },
        });
      }
      res.json({ message: "Events synced", count: events.length });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  },
);

/**
 * SYNC ODDS ROUTE
 * POST /api/admin/sync-odds/:sportKey
 *
 * Fetches current odds for a sport and stores a new OddsSnapshot per bookmaker/market.
 * Snapshots are always INSERTED (not upserted) — they are historical records.
 *
 * The odds data comes from fetchEvents() — it already hits the /odds endpoint
 * which includes bookmakers and markets in the response. No new service function needed.
 *
 * IMPORTANT — the nested loop structure:
 *   for each event
 *     └─ find the event in DB by externalId  ← need the internal id for the foreign key
 *        for each bookmaker in event.bookmakers
 *          └─ for each market in bookmaker.markets
 *               └─ prisma.oddsSnapshot.create(...)
 *
 * Steps:
 * 1. Get sportKey from req.params
 * 2. Call fetchEvents(sportKey) — reuse the existing service function
 * 3. Track a snapshotCount (increment each time you create a snapshot)
 * 4. For each event in the results:
 *    a. Find the matching DB event:
 *       prisma.event.findUnique({ where: { externalId: event.id } })
 *       — skip this event (continue) if not found
 *    b. Loop over event.bookmakers
 *    c. Inside that, loop over bookmaker.markets
 *    d. Create a snapshot:
 *       prisma.oddsSnapshot.create({
 *         data: {
 *           eventId:   dbEvent.id,
 *           bookmaker: bookmaker.key,
 *           market:    market.key,
 *           outcomes:  market.outcomes,
 *         }
 *       })
 *    e. Increment snapshotCount
 * 5. Return { message: "Odds synced", count: snapshotCount }
 *
 * Odds API fields to map:
 *   event.id            → look up dbEvent by externalId
 *   bookmaker.key       → bookmaker  (e.g. "tab", "sportsbet")
 *   market.key          → market     (e.g. "h2h")
 *   market.outcomes     → outcomes   (array of { name, price, point? })
 *
 * NOTE: fetchedAt is handled automatically by @default(now()) in the schema.
 */

router.post(
  "/sync-odds/:sportKey",
  authenticate,

  authorise("ADMIN", "SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { sportKey } = req.params;
      const events = await fetchEvents(sportKey);

      let snapshotCount = 0;
      for (const event of events) {
        const dbEvent = await prisma.event.findUnique({
          where: { externalId: event.id },
        });
        if (!dbEvent) continue;

        for (const bookmaker of event.bookmakers) {
          for (const market of bookmaker.markets) {
            await prisma.oddsSnapshot.create({
              data: {
                eventId: dbEvent.id,
                bookmaker: bookmaker.key,
                market: market.key,
                outcomes: market.outcomes as any,
              },
            });

            snapshotCount++;
          }
        }

        // Notify any clients watching this event that odds have been updated.
        // Clients join event:{id} rooms via the subscribe:event socket event.
        getIO().to(`event:${dbEvent.id}`).emit("odds:updated", {
          eventId: dbEvent.id,
        });
      }

      res.json({ message: "Odds synced", count: snapshotCount });
    } catch (error) {
      res.status(500).json({ message: "Sync failed." });
    }
  },
);

/**
 * SETTLE EVENT ROUTE
 * POST /api/admin/settle-event/:eventId
 *
 * Marks an event as completed and settles all PENDING bets on it.
 *
 * Request body: { result: "HOME_WIN" | "AWAY_WIN" | "DRAW" }
 *
 * Steps:
 * 1. Get eventId from req.params, result from req.body
 *
 * 2. Load the event with its homeTeam and awayTeam relations:
 *    prisma.event.findUnique({
 *      where: { id: eventId },
 *      include: { homeTeam: true, awayTeam: true },
 *    })
 *    — return 404 if not found
 *    — return 400 if event.status is already "COMPLETED"
 *
 * 3. Update the event:
 *    prisma.event.update({
 *      where: { id: eventId },
 *      data: { status: "COMPLETED", result },
 *    })
 *
 * 4. Determine the winning team name from the result:
 *    result === "HOME_WIN" → event.homeTeam.name
 *    result === "AWAY_WIN" → event.awayTeam.name
 *    result === "DRAW"     → null (DRAW handling: void the leg, refund stake — skip for now, just mark LOST)
 *
 * 5. Fetch all PENDING BetLegs for this event, including their parent Bet:
 *    prisma.betLeg.findMany({
 *      where: { eventId, status: "PENDING" },
 *      include: { bet: true },
 *    })
 *
 * 6. For each leg, run a transaction:
 *    const won = leg.selection === winningTeamName
 *
 *    a. Update the BetLeg status:
 *       tx.betLeg.update({ where: { id: leg.id }, data: { status: won ? "WON" : "LOST" } })
 *
 *    b. If WON:
 *       — fetch the user's wallet: tx.wallet.findUnique({ where: { userId: leg.bet.userId } })
 *       — credit the wallet: tx.wallet.update({ data: { balance: { increment: leg.bet.potentialPayout } } })
 *       — update the Bet:
 *         tx.bet.update({
 *           where: { id: leg.betId },
 *           data: { status: "WON", actualPayout: leg.bet.potentialPayout, settledAt: new Date() },
 *         })
 *       — create a BET_WON Transaction:
 *         tx.transaction.create({
 *           data: {
 *             userId:        leg.bet.userId,
 *             walletId:      wallet.id,
 *             betId:         leg.betId,
 *             type:          "BET_WON",
 *             amount:        leg.bet.potentialPayout,
 *             balanceBefore: wallet.balance,
 *             balanceAfter:  Number(wallet.balance) + Number(leg.bet.potentialPayout),
 *             status:        "COMPLETED",
 *           },
 *         })
 *
 *    c. If LOST:
 *       — update the Bet:
 *         tx.bet.update({
 *           where: { id: leg.betId },
 *           data: { status: "LOST", settledAt: new Date() },
 *         })
 *
 * 7. Track settledCount (increment per leg processed)
 *
 * 8. Return { message: "Event settled", settled: settledCount }
 *
 * NOTE: This only handles SINGLE bets and h2h market for now.
 *       Multi-leg bets (MULTI/SYSTEM) can be added later.
 */

router.post(
  "/settle-event/:eventId",
  authenticate,

  authorise("ADMIN", "SUPER_ADMIN"),
  validate(settleEventSchema),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { result } = req.body;

      // Load the event with team names so we can match selections against the winning team.
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { homeTeam: true, awayTeam: true },
      });
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (event.status === "COMPLETED")
        return res.status(400).json({ message: "Event already completed" });

      // Mark the event as completed with the given result.
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "COMPLETED", result },
      });

      // Determine the winning team name to compare against each leg's selection.
      // DRAW has no winner — legs on a drawn match are VOID.
      const winningTeam =
        result === "HOME_WIN"
          ? event.homeTeam.name
          : result === "AWAY_WIN"
            ? event.awayTeam.name
            : null;

      // Fetch all pending legs for this event, including the parent bet.
      const legs = await prisma.betLeg.findMany({
        where: { eventId, status: "PENDING" },
        include: { bet: true },
      });

      let settledCount = 0;

      for (const leg of legs) {
        let settledStatus: string | null = null;
        let settledPayout: number | null = null;

        // Determine this leg's outcome.
        // DRAW → VOID. Otherwise compare selection to the winning team name.
        const legOutcome =
          result === "DRAW"
            ? "VOID"
            : leg.selection === winningTeam
              ? "WON"
              : "LOST";

        await prisma.$transaction(async (tx) => {
          // Update this leg's status.
          await tx.betLeg.update({
            where: { id: leg.id },
            data: { status: legOutcome },
          });

          // Re-fetch ALL legs on the parent bet to check overall settlement status.
          // For a SINGLE this is always one leg. For a MULTI there may be others
          // still PENDING on future events.
          const allLegs = await tx.betLeg.findMany({
            where: { betId: leg.betId },
          });

          const hasPendingLegs = allLegs.some((l) => l.status === "PENDING");

          // Not all legs settled yet — leave the bet PENDING and move on.
          if (hasPendingLegs) return;

          // All legs are now settled — determine the overall bet outcome.
          const hasLostLeg = allLegs.some((l) => l.status === "LOST");
          const allVoid = allLegs.every((l) => l.status === "VOID");
          const wonLegs = allLegs.filter((l) => l.status === "WON");

          if (hasLostLeg) {
            settledStatus = "LOST";
            // At least one leg lost — the whole bet is lost, no payout.
            await tx.bet.update({
              where: { id: leg.betId },
              data: { status: "LOST", settledAt: new Date() },
            });
          } else if (allVoid) {
            settledStatus = "VOID";
            settledPayout = Number(leg.bet.stake);

            // Every leg was voided (e.g. all events drew) — refund the full stake.
            const wallet = await tx.wallet.findUnique({
              where: { userId: leg.bet.userId },
            });
            await tx.wallet.update({
              where: { userId: leg.bet.userId },
              data: { balance: { increment: leg.bet.stake } },
            });
            await tx.bet.update({
              where: { id: leg.betId },
              data: { status: "VOID", settledAt: new Date() },
            });
            await tx.transaction.create({
              data: {
                userId: leg.bet.userId,
                walletId: wallet!.id,
                betId: leg.betId,
                type: "BET_REFUND",
                amount: leg.bet.stake,
                balanceBefore: wallet!.balance,
                balanceAfter: Number(wallet!.balance) + Number(leg.bet.stake),
                status: "COMPLETED",
              },
            });
          } else {
            // All legs WON, or a mix of WON + VOID — the bet is won.
            // If any legs were VOID, remove them from the parlay and recalculate
            // payout using only the WON legs' odds. Otherwise use stored potentialPayout.
            const payout =
              wonLegs.length === allLegs.length
                ? Number(leg.bet.potentialPayout)
                : Math.round(
                    Number(leg.bet.stake) *
                      wonLegs.reduce((acc, l) => acc * Number(l.odds), 1) *
                      100,
                  ) / 100;

            settledStatus = "WON";
            settledPayout = payout;

            const wallet = await tx.wallet.findUnique({
              where: { userId: leg.bet.userId },
            });
            await tx.wallet.update({
              where: { userId: leg.bet.userId },
              data: { balance: { increment: payout } },
            });
            await tx.bet.update({
              where: { id: leg.betId },
              data: {
                status: "WON",
                actualPayout: payout,
                settledAt: new Date(),
              },
            });
            await tx.transaction.create({
              data: {
                userId: leg.bet.userId,
                walletId: wallet!.id,
                betId: leg.betId,
                type: "BET_WON",
                amount: payout,
                balanceBefore: wallet!.balance,
                balanceAfter: Number(wallet!.balance) + payout,
                status: "COMPLETED",
              },
            });
          }
        });
        // Notify the user their bet has been settled
        if (settledStatus) {
          getIO().to(`user:${leg.bet.userId}`).emit("bet:settled", {
            betId: leg.betId,
            status: settledStatus,
            payout: settledPayout,
          });
        }
        settledCount++;
      }

      return res.json({ message: "Event settled", settled: settledCount });
    } catch (error) {
      res.status(500).json({ message: "Settlement failed" });
    }
  },
);

export default router;

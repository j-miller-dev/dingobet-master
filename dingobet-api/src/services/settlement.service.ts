import { prisma } from "../lib/prisma.js";
import { getIO } from "../lib/socket.js";

type EventResult = "HOME_WIN" | "AWAY_WIN" | "DRAW";

/**
 * Settle all PENDING bet legs for a completed event.
 *
 * Returns the number of legs processed.
 *
 * Handles:
 *  - SINGLE and MULTI bets
 *  - VOID legs (DRAW result) — refunds stake if all legs void, recalculates
 *    payout for mixed WON+VOID multis
 *  - Idempotent — safe to call twice, the event.status === "COMPLETED" guard
 *    in the caller prevents double-settlement
 */
export async function settleEvent(
  eventId: string,
  result: EventResult,
): Promise<number> {
  // Load the event with team names so we can match selections.
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!event) throw new Error(`Event ${eventId} not found`);
  if (event.status === "COMPLETED") return 0; // already settled — no-op

  // Mark the event completed.
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "COMPLETED", result },
  });

  // The winning team name — null for a DRAW (legs become VOID).
  const winningTeam =
    result === "HOME_WIN"
      ? event.homeTeam.name
      : result === "AWAY_WIN"
        ? event.awayTeam.name
        : null;

  // All pending legs on this event, with their parent bet included.
  const legs = await prisma.betLeg.findMany({
    where: { eventId, status: "PENDING" },
    include: { bet: true },
  });

  let settledCount = 0;

  for (const leg of legs) {
    // Determine this leg's outcome.
    const legOutcome =
      result === "DRAW" ? "VOID" : leg.selection === winningTeam ? "WON" : "LOST";

    let settledBetStatus: string | null = null;
    let settledPayout: number | null = null;

    await prisma.$transaction(async (tx) => {
      // Update this individual leg.
      await tx.betLeg.update({
        where: { id: leg.id },
        data: { status: legOutcome },
      });

      // Re-read all legs on the parent bet to decide if the whole bet can settle.
      // For a SINGLE this is one leg. For a MULTI some legs may still be PENDING.
      const allLegs = await tx.betLeg.findMany({ where: { betId: leg.betId } });
      if (allLegs.some((l) => l.status === "PENDING")) return; // multi — not done yet

      // All legs settled — work out the overall bet result.
      const hasLostLeg = allLegs.some((l) => l.status === "LOST");
      const allVoid = allLegs.every((l) => l.status === "VOID");
      const wonLegs = allLegs.filter((l) => l.status === "WON");

      if (hasLostLeg) {
        settledBetStatus = "LOST";
        await tx.bet.update({
          where: { id: leg.betId },
          data: { status: "LOST", settledAt: new Date() },
        });
      } else if (allVoid) {
        // Full refund.
        settledBetStatus = "VOID";
        settledPayout = Number(leg.bet.stake);
        const wallet = await tx.wallet.findUnique({ where: { userId: leg.bet.userId } });
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
        // WON (or WON + VOID mix — recalculate odds without void legs).
        const payout =
          wonLegs.length === allLegs.length
            ? Number(leg.bet.potentialPayout)
            : Math.round(
                Number(leg.bet.stake) *
                  wonLegs.reduce((acc, l) => acc * Number(l.odds), 1) *
                  100,
              ) / 100;

        settledBetStatus = "WON";
        settledPayout = payout;
        const wallet = await tx.wallet.findUnique({ where: { userId: leg.bet.userId } });
        await tx.wallet.update({
          where: { userId: leg.bet.userId },
          data: { balance: { increment: payout } },
        });
        await tx.bet.update({
          where: { id: leg.betId },
          data: { status: "WON", actualPayout: payout, settledAt: new Date() },
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

    // Notify the user and write a notification record if the bet fully settled.
    if (settledBetStatus) {
      getIO().to(`user:${leg.bet.userId}`).emit("bet:settled", {
        betId: leg.betId,
        status: settledBetStatus,
        payout: settledPayout,
      });
      await prisma.notification.create({
        data: {
          userId: leg.bet.userId,
          type: "BET_SETTLED",
          title:
            settledBetStatus === "WON"
              ? "Bet Won 🎉"
              : settledBetStatus === "VOID"
                ? "Bet Voided"
                : "Bet Lost",
          message:
            settledBetStatus === "WON"
              ? `Your bet paid out $${settledPayout}`
              : settledBetStatus === "VOID"
                ? `Your stake of $${leg.bet.stake} has been refunded`
                : "Your bet did not win this time",
        },
      });
    }

    settledCount++;
  }

  return settledCount;
}

/**
 * Derive a result enum from raw scores.
 * Returns null if scores are missing/incomplete (event not finished yet).
 */
export function deriveResult(
  homeTeam: string,
  awayTeam: string,
  scores: { name: string; score: string }[],
): EventResult | null {
  const home = scores.find((s) => s.name === homeTeam);
  const away = scores.find((s) => s.name === awayTeam);
  if (!home || !away) return null;
  const h = parseInt(home.score, 10);
  const a = parseInt(away.score, 10);
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return "HOME_WIN";
  if (a > h) return "AWAY_WIN";
  return "DRAW";
}

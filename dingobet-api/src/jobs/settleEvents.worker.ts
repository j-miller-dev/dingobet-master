import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { fetchScores } from "../services/odds.service.js";
import { settleEvent, deriveResult } from "../services/settlement.service.js";

const QUEUE_NAME = "settle-events";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

// ─── Queue ────────────────────────────────────────────────────────────────────
// The Queue is just the "mailbox" — we use it to register the repeating job.
// The Worker (below) is what actually processes each job.

const queue = new Queue(QUEUE_NAME, { connection: redis });

// Register a single repeating job on startup.
// BullMQ deduplicates by jobId, so restarting the server won't create duplicates.
export async function startSettlementQueue() {
  // Repeating job — fires every 5 minutes going forward.
  await queue.add(
    "poll-scores",
    {},
    {
      repeat: { every: POLL_INTERVAL_MS },
      jobId: "poll-scores-repeating",
    },
  );

  // One-shot job — fires immediately on startup so we don't wait the first interval.
  await queue.add("poll-scores-immediate", {});

  console.log(`[settlement] repeating job registered (every ${POLL_INTERVAL_MS / 1000}s) — immediate run queued`);
}

// ─── Worker ───────────────────────────────────────────────────────────────────
// The Worker picks up each job from the queue and runs the processor function.

export const settlementWorker = new Worker(
  QUEUE_NAME,
  async (_job) => {
    console.log("[settlement] polling scores...");

    // 1. Get all active sports that have been synced into the DB.
    const sports = await prisma.sport.findMany({ where: { isActive: true } });

    let totalSettled = 0;

    for (const sport of sports) {
      let scores: any[];
      try {
        scores = await fetchScores(sport.id);
      } catch (err: any) {
        // 401 means the API key is invalid or quota is exhausted — no point
        // trying remaining sports, they will all fail the same way.
        if (err?.message?.includes("401")) {
          console.warn("[settlement] Odds API returned 401 — quota exhausted or invalid key, skipping run");
          return;
        }
        console.warn(`[settlement] fetchScores failed for ${sport.id}:`, err);
        continue;
      }

      // 2. Filter to only completed events from the API response.
      const completed = scores.filter((s) => s.completed === true && s.scores);

      for (const apiEvent of completed) {
        // 3. Find the matching event in our DB that still needs settling.
        //    UPCOMING = not yet settled. COMPLETED = already done, skip.
        const dbEvent = await prisma.event.findFirst({
          where: { externalId: apiEvent.id, status: "UPCOMING" },
          include: { homeTeam: true, awayTeam: true },
        });
        if (!dbEvent) continue;

        // 4. Derive HOME_WIN / AWAY_WIN / DRAW from the raw score strings.
        const result = deriveResult(
          dbEvent.homeTeam.name,
          dbEvent.awayTeam.name,
          apiEvent.scores,
        );
        if (!result) {
          console.warn(`[settlement] could not derive result for event ${dbEvent.id}`);
          continue;
        }

        // 5. Settle — marks event COMPLETED, settles legs/bets, credits wallets,
        //    fires Socket.io notifications.
        try {
          const settled = await settleEvent(dbEvent.id, result);
          console.log(`[settlement] settled event ${dbEvent.id} (${result}) — ${settled} legs`);
          totalSettled += settled;
        } catch (err) {
          console.error(`[settlement] failed to settle event ${dbEvent.id}:`, err);
        }
      }
    }

    console.log(`[settlement] run complete — ${totalSettled} legs settled`);
  },
  { connection: redis },
);

settlementWorker.on("failed", (job, err) => {
  console.error(`[settlement] job ${job?.id} failed:`, err.message);
});

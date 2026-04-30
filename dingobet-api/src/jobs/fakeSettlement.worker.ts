import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { settleEvent } from "../services/settlement.service.js";
import { TEAMS_BY_SPORT, SPORT_CONFIG } from "../data/teams.js";

const QUEUE_NAME = "fake-settlement";
const POLL_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes

// ─── Settlement helpers ───────────────────────────────────────────────────────

// Weighted random result — rough real-world distribution.
const RESULTS = [
  ...Array(45).fill("HOME_WIN"),
  ...Array(40).fill("AWAY_WIN"),
  ...Array(15).fill("DRAW"),
] as const;

type EventResult = "HOME_WIN" | "AWAY_WIN" | "DRAW";

function randomResult(): EventResult {
  return RESULTS[Math.floor(Math.random() * RESULTS.length)];
}

// ─── Replenishment helpers ────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Returns a value between min and max snapped to the nearest `step`.
function randomInRange(min: number, max: number, step = 0.5): number {
  const steps = Math.round((max - min) / step);
  return min + Math.round(Math.random() * steps) * step;
}

function randomH2hOutcomes(homeName: string, awayName: string, hasDraw: boolean) {
  const homePrice = parseFloat((1.40 + Math.random() * 2.10).toFixed(2));
  const awayPrice = parseFloat((1.40 + Math.random() * 2.10).toFixed(2));
  const outcomes: { name: string; price: number }[] = [
    { name: homeName, price: homePrice },
    { name: awayName, price: awayPrice },
  ];
  if (hasDraw) {
    outcomes.push({ name: "Draw", price: parseFloat((2.80 + Math.random()).toFixed(2)) });
  }
  return outcomes;
}

const REPLENISH_MIN = 3;    // if UPCOMING count drops below this, top up
const REPLENISH_TARGET = 5; // top up to this many per sport

async function replenishEvents(): Promise<void> {
  for (const [sportId, config] of Object.entries(SPORT_CONFIG)) {
    const teamNames = TEAMS_BY_SPORT[sportId];
    if (!teamNames || teamNames.length < 2) continue;

    const upcomingCount = await prisma.event.count({
      where: { sportId, status: "UPCOMING" },
    });

    if (upcomingCount >= REPLENISH_MIN) continue;

    const needed = REPLENISH_TARGET - upcomingCount;
    console.log(`[fake-settlement] replenishing ${needed} event(s) for ${sportId}`);

    // Fetch only teams we know about for this sport
    const dbTeams = await prisma.team.findMany({
      where: { name: { in: teamNames } },
      select: { id: true, name: true },
    });

    if (dbTeams.length < 2) {
      console.warn(`[fake-settlement] not enough DB teams for ${sportId}, skipping`);
      continue;
    }

    for (let i = 0; i < needed; i++) {
      // Pick two distinct random teams
      const shuffled = [...dbTeams].sort(() => Math.random() - 0.5);
      const home = shuffled[0];
      const away = shuffled[1];

      // Stagger commence times 1–14 days from now
      const daysAhead = 1 + Math.floor(Math.random() * 13);
      const commenceTime = new Date();
      commenceTime.setDate(commenceTime.getDate() + daysAhead);
      commenceTime.setHours(19, 30, 0, 0);

      const externalId = `replenish_${sportId}_${home.id}_${away.id}_${Date.now()}_${i}`;

      let event: { id: string };
      try {
        event = await prisma.event.create({
          data: {
            externalId,
            sportId,
            homeTeamId: home.id,
            awayTeamId: away.id,
            commenceTime,
            status: "UPCOMING",
          },
          select: { id: true },
        });
      } catch {
        // externalId collision — skip this iteration
        continue;
      }

      // h2h odds
      await prisma.oddsSnapshot.create({
        data: {
          eventId: event.id,
          bookmaker: "DingoBet",
          market: "h2h",
          outcomes: randomH2hOutcomes(home.name, away.name, config.hasDraw),
        },
      });

      // Spreads
      if (config.hasSpreads && config.spreadOptions.length > 0) {
        const line = pick(config.spreadOptions);
        await prisma.oddsSnapshot.create({
          data: {
            eventId: event.id,
            bookmaker: "DingoBet",
            market: "spreads",
            outcomes: [
              { name: home.name, price: 1.91, point: -line },
              { name: away.name, price: 1.91, point: line },
            ],
          },
        });
      }

      // Totals
      const total = randomInRange(config.totalMin, config.totalMax, 0.5);
      await prisma.oddsSnapshot.create({
        data: {
          eventId: event.id,
          bookmaker: "DingoBet",
          market: "totals",
          outcomes: [
            { name: "Over",  price: 1.91, point: total },
            { name: "Under", price: 1.91, point: total },
          ],
        },
      });

      console.log(`[fake-settlement] created: ${home.name} v ${away.name} (${sportId}, +${daysAhead}d)`);
    }
  }
}

// ─── Queue ────────────────────────────────────────────────────────────────────

const queue = new Queue(QUEUE_NAME, { connection: redis });

export async function startFakeSettlementQueue() {
  await queue.add(
    "fake-settle",
    {},
    {
      repeat: { every: POLL_INTERVAL_MS },
      jobId: "fake-settle-repeating",
    },
  );

  // Also run immediately on startup.
  await queue.add("fake-settle-immediate", {});

  console.log(
    `[fake-settlement] repeating job registered (every ${POLL_INTERVAL_MS / 1000}s) — immediate run queued`,
  );
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const fakeSettlementWorker = new Worker(
  QUEUE_NAME,
  async (_job) => {
    console.log("[fake-settlement] scanning for events to settle...");

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const candidates = await prisma.event.findMany({
      where: {
        OR: [
          { status: "LIVE" },
          { status: "UPCOMING", commenceTime: { lte: tenMinutesAgo } },
        ],
      },
      select: {
        id: true,
        status: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (candidates.length === 0) {
      console.log("[fake-settlement] no events ready to settle");
      await replenishEvents();
      return;
    }

    let settled = 0;
    for (const event of candidates) {
      if (Math.random() > 0.6) continue; // stagger — try again next poll

      const result = randomResult();
      try {
        const legsSettled = await settleEvent(event.id, result);
        console.log(
          `[fake-settlement] settled ${event.homeTeam.name} v ${event.awayTeam.name} → ${result} (${legsSettled} legs)`,
        );
        settled++;
      } catch (err) {
        console.error(`[fake-settlement] failed to settle event ${event.id}:`, err);
      }
    }

    console.log(`[fake-settlement] run complete — settled ${settled}/${candidates.length} candidates`);
    await replenishEvents();
  },
  { connection: redis },
);

fakeSettlementWorker.on("failed", (job, err) => {
  console.error(`[fake-settlement] job ${job?.id} failed:`, err.message);
});

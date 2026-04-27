Create file
dingobet-api/src/jobs/settleEvents.worker.ts
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
1 import { Queue, Worker } from "bullmq";
2 import { redis } from "../lib/redis.js";
3 import { prisma } from "../lib/prisma.js";
4 import { fetchScores } from "../services/odds.service.js";
5 import { settleEvent, deriveResult } from "../services/settlement.service.js";
6
7 const QUEUE_NAME = "settle-events";
8 const POLL_INTERVAL_MS = 5 _ 60 _ 1000; // every 5 minutes
9
10 // ─── Queue ────────────────────────────────────────────────────────────────────
11 // The Queue is just the "mailbox" — we use it to register the repeating job.
12 // The Worker (below) is what actually processes each job.
13
14 const queue = new Queue(QUEUE_NAME, { connection: redis });
15
16 // Register a single repeating job on startup.
17 // BullMQ deduplicates by jobId, so restarting the server won't create duplicates.
18 export async function startSettlementQueue() {
19 await queue.add(
20 "poll-scores",
21 {},
22 {
23 repeat: { every: POLL_INTERVAL_MS },
24 jobId: "poll-scores-repeating",
25 },
26 );
27 console.log(`[settlement] repeating job registered (every ${POLL_INTERVAL_MS / 1000}s)`);
28 }
29
30 // ─── Worker ───────────────────────────────────────────────────────────────────
31 // The Worker picks up each job from the queue and runs the processor function.
32
33 export const settlementWorker = new Worker(
34 QUEUE_NAME,
35 async (\_job) => {
36 console.log("[settlement] polling scores...");
37
38 // 1. Get all active sports that have been synced into the DB.
39 const sports = await prisma.sport.findMany({ where: { isActive: true } });
40
41 let totalSettled = 0;
42
43 for (const sport of sports) {
44 let scores: any[];
45 try {
46 scores = await fetchScores(sport.id);
47 } catch (err) {
48 // One sport failing (e.g. Odds API quota) shouldn't abort the whole run.
49 console.warn(`[settlement] fetchScores failed for ${sport.id}:`, err);
50 continue;
51 }
52
53 // 2. Filter to only completed events from the API response.
54 const completed = scores.filter((s) => s.completed === true && s.scores);
55
56 for (const apiEvent of completed) {
57 // 3. Find the matching event in our DB that still needs settling.
58 // We look for UPCOMING (not yet settled) — COMPLETED means we already did it.
59 const dbEvent = await prisma.event.findFirst({
60 where: {
61 externalId: apiEvent.id,
62 status: "UPCOMING",
63 },
64 include: { homeTeam: true, awayTeam: true },
65 });
66 if (!dbEvent) continue; // already settled or not in our DB
67
68 // 4. Derive the result from the raw score strings.
69 const result = deriveResult(
70 dbEvent.homeTeam.name,
71 dbEvent.awayTeam.name,
72 apiEvent.scores,
73 );
74 if (!result) {
75 console.warn(`[settlement] could not derive result for event ${dbEvent.id}`);
76 continue;
77 }
78
79 // 5. Settle — this marks the event COMPLETED, settles all legs and bets,
80 // credits wallets, and fires Socket.io notifications.
81 try {
82 const settled = await settleEvent(dbEvent.id, result);
83 console.log(`[settlement] settled event ${dbEvent.id} (${result}) — ${settled} legs`);
84 totalSettled += settled;
85 } catch (err) {
86 console.error(`[settlement] failed to settle event ${dbEvent.id}:`, err);
87 }
88 }
89 }
90
91 console.log(`[settlement] run complete — ${totalSettled} legs settled`);
92 },
93 { connection: redis },
94 );
95
96 settlementWorker.on("failed", (job, err) => {
97 console.error(`[settlement] job ${job?.id} failed:`, err.message);
98 });

import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";

const QUEUE_NAME = "session-cleanup";
const INTERVAL_MS = 24 * 60 * 60 * 1000; // every 24 hours

const queue = new Queue(QUEUE_NAME, { connection: redis });

export async function startSessionCleanupQueue() {
  await queue.add(
    "cleanup",
    {},
    {
      repeat: { every: INTERVAL_MS },
      jobId: "session-cleanup-repeating",
    },
  );
  // Run once immediately on startup
  await queue.add("session-cleanup-immediate", {});
  console.log("[session-cleanup] repeating job registered (every 24h)");
}

export const sessionCleanupWorker = new Worker(
  QUEUE_NAME,
  async (_job) => {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      console.log(`[session-cleanup] deleted ${result.count} expired sessions`);
    }
  },
  { connection: redis },
);

sessionCleanupWorker.on("failed", (job, err) => {
  console.error(`[session-cleanup] job ${job?.id} failed:`, err.message);
});

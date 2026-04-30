import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";

const QUEUE_NAME = "live-events";
const POLL_INTERVAL_MS = 60 * 1000; // every minute

const queue = new Queue(QUEUE_NAME, { connection: redis });

export async function startLiveEventsQueue() {
  await queue.add(
    "check-live",
    {},
    {
      repeat: { every: POLL_INTERVAL_MS },
      jobId: "check-live-repeating",
    },
  );
  console.log("[live-events] repeating job registered (every 60s)");
}

export const liveEventsWorker = new Worker(
  QUEUE_NAME,
  async (_job) => {
    const now = new Date();
    const result = await prisma.event.updateMany({
      where: {
        status: "UPCOMING",
        commenceTime: { lte: now },
      },
      data: { status: "LIVE" },
    });
    if (result.count > 0) {
      console.log(`[live-events] flipped ${result.count} events to LIVE`);
    }
  },
  { connection: redis },
);

liveEventsWorker.on("failed", (job, err) => {
  console.error(`[live-events] job ${job?.id} failed:`, err.message);
});

import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { initSocket } from "./lib/socket.js";
import { registerSocketHandlers } from "./socket/handlers.js";
import { startSettlementQueue } from "./jobs/settleEvents.worker.js";
import { startLiveEventsQueue } from "./jobs/liveEvents.worker.js";
import { startSessionCleanupQueue } from "./jobs/sessionCleanup.worker.js";
import { startFakeSettlementQueue } from "./jobs/fakeSettlement.worker.js";

const PORT = process.env.PORT || 4000;

const server = createServer(app);
const io = initSocket(server);
registerSocketHandlers(io);

server.listen(PORT, async () => {
  console.log(`DingoBet API running on http://localhost:${PORT}`);
  await startSettlementQueue();
  await startLiveEventsQueue();
  await startSessionCleanupQueue();
  await startFakeSettlementQueue();
});

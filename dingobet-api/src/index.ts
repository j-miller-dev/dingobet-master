import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { initSocket } from "./lib/socket.js";
import { registerSocketHandlers } from "./socket/handlers.js";

const PORT = process.env.PORT || 4000;

const server = createServer(app);
const io = initSocket(server);
registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`DingoBet API running on http://localhost:${PORT}`);
});

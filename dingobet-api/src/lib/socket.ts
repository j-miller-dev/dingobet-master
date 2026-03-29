// IncomingMessage and ServerResponse are the type parameters Socket.io's Server generic needs.
// Server as HttpServer is the type for the raw Node HTTP server we'll attach Socket.io to.
import {
  Server as HttpServer,
  IncomingMessage,
  ServerResponse,
} from "node:http";

// Server is the Socket.io server class.
import { Server } from "socket.io";

// Module-level singleton — null until initSocket() is called.
// Same pattern as prisma.ts — one shared instance for the whole app.
let io: Server | null = null;

// Called once at startup in index.ts, after the HTTP server is created.
// Attaches Socket.io to the HTTP server and stores the instance.
export function initSocket(
  server: HttpServer<typeof IncomingMessage, typeof ServerResponse>,
): Server {
  // your code here
  io = new Server(server, { cors: { origin: process.env.FRONTEND_URL } });

  return io;
}

// Called by route handlers to emit events (e.g. after settling a bet).
// Throws if called before initSocket — prevents silent failures.
export function getIO(): Server {
  // your code here

  if (io === null) {
    throw new Error("Socket io not initialised.");
  } else {
    return io;
  }
}

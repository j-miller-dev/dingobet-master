// Imports needed:
// - Server, Socket from "socket.io"
// - jwt from "jsonwebtoken"
// - prisma from "../lib/prisma.js"

// Export one function: registerSocketHandlers(io: Server): void
// This is called once at startup and sets up all connection logic.

// Inside registerSocketHandlers:

//   io.on("connection", async (socket: Socket) => {
//
//     STEP 1 — Extract the JWT token
//     The client sends it as a query param on connection: socket.handshake.auth.token
//     If no token → socket.disconnect() and return
//
//     STEP 2 — Verify the token
//     jwt.verify(token, process.env.JWT_SECRET!)
//     Wrap in try/catch — if invalid/expired → socket.disconnect() and return
//     The payload will have an { id } field (the userId) — same as auth middleware
//
//     STEP 3 — Validate the user exists in the DB
//     prisma.user.findUnique({ where: { id: userId } })
//     If not found → socket.disconnect() and return
//
//     STEP 4 — Join the personal room
//     socket.join(`user:${userId}`)
//     This is how we target a specific user when emitting (e.g. bet settled)
//
//     STEP 5 — Listen for event room subscriptions
//     socket.on("subscribe:event", (eventId: string) => {
//       socket.join(`event:${eventId}`)
//     })
//
//     STEP 6 — Log the connection (optional but helpful for debugging)
//     console.log(`Socket connected: userId=${userId}`)
//
//   })

import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const registerSocketHandlers = (io: Server): void => {
  io.on("connection", async (socket: Socket) => {
    const token = socket.handshake.auth.token;
    // extract the JWT token
    if (!token) {
      socket.disconnect();
      return;
    }
    // verify the token
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const userId = payload.id;

      // validate the user exists in the DB
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        socket.disconnect();
        return;
      }
      // join the personal room
      socket.join(`user:${userId}`);
      // listen for event room subscriptions
      socket.on("subscribe:event", (eventId: string) => {
        socket.join(`event:${eventId}`);
      });
      // log the connection (useful for debugging)
      console.log(`Socket connected: userId=${userId}`);
    } catch (error) {
      socket.disconnect();
      return;
    }
  });
};

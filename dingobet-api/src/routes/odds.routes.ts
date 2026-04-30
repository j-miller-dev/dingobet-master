import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router: Router = Router();

/**
 * GET /api/odds/:eventId
 *
 * Returns the most recent odds snapshot for a single event.
 *
 * 1. Get eventId from req.params.eventId
 *
 * 2. Query prisma.oddsSnapshot.findFirst({
 *      where: { eventId },
 *      orderBy: { fetchedAt: "desc" },
 *    })
 *    — findFirst + orderBy desc gives you the latest snapshot for that event
 *
 * 3. If no snapshot found, return 404: { message: "No odds found for this event" }
 *
 * 4. Return the snapshot
 *
 * OddsSnapshot shape (from schema):
 *   id         String
 *   eventId    String
 *   bookmaker  String   — e.g. "tab", "sportsbet"
 *   market     String   — e.g. "h2h"
 *   outcomes   Json     — array of { name, price, point? }
 *   fetchedAt  DateTime
 *
 * This route is protected — user must be logged in to view odds.
 */

router.get("/:eventId", authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const market = req.query.market as string | undefined;

    const snapshot = await prisma.oddsSnapshot.findFirst({
      where: { eventId, ...(market ? { market } : {}) },
      orderBy: { fetchedAt: "desc" },
    });

    if (!snapshot) return res.status(404).json({ message: "No odds found for this event" });

    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ message: "Server contact failed" });
  }
});
export default router;

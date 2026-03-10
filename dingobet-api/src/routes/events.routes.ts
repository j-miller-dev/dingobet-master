import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router: Router = Router();

/**
 * GET /api/events
 *
 * Returns upcoming events from the DB.
 * Optionally filter by sport using a query string: ?sport=soccer_epl
 *
 * 1. Get the optional sport filter from req.query.sport
 * 2. Build a `where` object:
 *    — if sport is provided: { sportId: sport, status: "UPCOMING" }
 *    — if not: { status: "UPCOMING" }
 * 3. Call prisma.event.findMany({
 *      where,
 *      include: { homeTeam: true, awayTeam: true, sport: true },
 *      orderBy: { commenceTime: "asc" },
 *    })
 * 4. Return the events array
 *
 * NOTE: Use req.query.sport to get the query string value.
 * The URL would look like: GET /api/events?sport=soccer_epl
 */

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { sport } = req.query;

    const where = sport
      ? { sportId: sport as string, status: "UPCOMING" as const }
      : { status: "UPCOMING" as const };

    const events = await prisma.event.findMany({
      where,
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { commenceTime: "asc" },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server contact failed" });
  }
});

export default router;

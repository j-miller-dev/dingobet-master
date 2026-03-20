// Open src / routes / admin.routes.ts and build POST / sync - sports.
//
//   The steps inside the handler:
//
// 1. Call fetchSports() from the service
// 2. Loop over the results and upsert each one into prisma.sport
// 3. Return { message: "Sports synced", count: sports.length }
//
//   The Odds API returns each sport with these fields — map them to your schema:
// - key → id
//   - title → title
//     - group → group
//       - description → description
//         - has_outrights → hasOutrights
//           - active → isActive
//
//   Also import fetchSports from the service and authenticate from middleware — this route should be protected.

import { Router, Request, Response } from "express";
import { fetchEvents, fetchSports } from "../services/odds.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router: Router = Router();

router.post(
  "/sync-sports",
  authenticate,
  async (_req: Request, res: Response) => {
    try {
      const sports = await fetchSports();
      for (const sport of sports) {
        await prisma.sport.upsert({
          where: { id: sport.key },
          update: {
            title: sport.title,
            group: sport.group,
            description: sport.description,
            hasOutrights: sport.has_outrights,
            isActive: sport.active,
          },
          create: {
            id: sport.key,
            title: sport.title,
            group: sport.group,
            description: sport.description,
            hasOutrights: sport.has_outrights,
            isActive: sport.active,
          },
        });
      }
      res.json({ message: "Sports synced", count: sports.length });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  },
);

router.post(
  "/sync-events/:sportKey",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sportKey } = req.params;
      const events = await fetchEvents(sportKey);
      for (const event of events) {
        const [homeTeam, awayTeam] = await Promise.all([
          prisma.team.upsert({
            where: { name: event.home_team },
            update: {},
            create: { name: event.home_team },
          }),
          prisma.team.upsert({
            where: { name: event.away_team },
            update: {},
            create: { name: event.away_team },
          }),
        ]);
        await prisma.event.upsert({
          where: { externalId: event.id },
          update: {
            sportId: event.sport_key,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            commenceTime: new Date(event.commence_time),
          },
          create: {
            externalId: event.id,
            sportId: event.sport_key,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            commenceTime: new Date(event.commence_time),
          },
        });
      }
      res.json({ message: "Events synced", count: events.length });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  },
);

/**
 * SYNC ODDS ROUTE
 * POST /api/admin/sync-odds/:sportKey
 *
 * Fetches current odds for a sport and stores a new OddsSnapshot per bookmaker/market.
 * Snapshots are always INSERTED (not upserted) — they are historical records.
 *
 * The odds data comes from fetchEvents() — it already hits the /odds endpoint
 * which includes bookmakers and markets in the response. No new service function needed.
 *
 * IMPORTANT — the nested loop structure:
 *   for each event
 *     └─ find the event in DB by externalId  ← need the internal id for the foreign key
 *        for each bookmaker in event.bookmakers
 *          └─ for each market in bookmaker.markets
 *               └─ prisma.oddsSnapshot.create(...)
 *
 * Steps:
 * 1. Get sportKey from req.params
 * 2. Call fetchEvents(sportKey) — reuse the existing service function
 * 3. Track a snapshotCount (increment each time you create a snapshot)
 * 4. For each event in the results:
 *    a. Find the matching DB event:
 *       prisma.event.findUnique({ where: { externalId: event.id } })
 *       — skip this event (continue) if not found
 *    b. Loop over event.bookmakers
 *    c. Inside that, loop over bookmaker.markets
 *    d. Create a snapshot:
 *       prisma.oddsSnapshot.create({
 *         data: {
 *           eventId:   dbEvent.id,
 *           bookmaker: bookmaker.key,
 *           market:    market.key,
 *           outcomes:  market.outcomes,
 *         }
 *       })
 *    e. Increment snapshotCount
 * 5. Return { message: "Odds synced", count: snapshotCount }
 *
 * Odds API fields to map:
 *   event.id            → look up dbEvent by externalId
 *   bookmaker.key       → bookmaker  (e.g. "tab", "sportsbet")
 *   market.key          → market     (e.g. "h2h")
 *   market.outcomes     → outcomes   (array of { name, price, point? })
 *
 * NOTE: fetchedAt is handled automatically by @default(now()) in the schema.
 */

router.post(
  "/sync-odds/:sportKey",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sportKey } = req.params;
      const events = await fetchEvents(sportKey);

      let snapshotCount = 0;
      for (const event of events) {
        const dbEvent = await prisma.event.findUnique({
          where: { externalId: event.id },
        });
        if (!dbEvent) continue;

        for (const bookmaker of event.bookmakers) {
          for (const market of bookmaker.markets) {
            await prisma.oddsSnapshot.create({
              data: {
                eventId: dbEvent.id,
                bookmaker: bookmaker.key,
                market: market.key,
                outcomes: market.outcomes as any,
              },
            });

            snapshotCount++;
          }
        }
      }

      res.json({ message: "Odds synced", count: snapshotCount });
    } catch (error) {
      res.status(500).json({ message: "Sync failed." });
    }
  },
);

export default router;

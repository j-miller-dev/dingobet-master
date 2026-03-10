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

export default router;

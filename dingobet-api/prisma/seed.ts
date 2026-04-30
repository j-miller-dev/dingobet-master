import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { TEAMS_BY_SPORT } from "../src/data/teams.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(days: number, hour = 19, minute = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}


function h2hOdds(homePrice: number, awayPrice: number, drawPrice?: number) {
  const outcomes: { name: string; price: number }[] = [
    { name: "home", price: homePrice },
    { name: "away", price: awayPrice },
  ];
  if (drawPrice) outcomes.push({ name: "Draw", price: drawPrice });
  return outcomes;
}

function spreadsOdds(homeName: string, awayName: string, line: number) {
  return [
    { name: homeName, price: 1.91, point: -line },
    { name: awayName, price: 1.91, point: line },
  ];
}

function totalsOdds(total: number) {
  return [
    { name: "Over", price: 1.91, point: total },
    { name: "Under", price: 1.91, point: total },
  ];
}

// ─── Sports data ──────────────────────────────────────────────────────────────

const SPORTS = [
  // Soccer
  { id: "soccer_epl",               group: "Soccer",            title: "EPL" },
  { id: "soccer_spain_la_liga",     group: "Soccer",            title: "La Liga" },
  { id: "soccer_italy_serie_a",     group: "Soccer",            title: "Serie A" },
  { id: "soccer_germany_bundesliga",group: "Soccer",            title: "Bundesliga" },
  { id: "soccer_uefa_champs_league",group: "Soccer",            title: "Champions League" },
  // Basketball
  { id: "basketball_nba",           group: "Basketball",        title: "NBA" },
  { id: "basketball_nbl",           group: "Basketball",        title: "NBL" },
  // Rugby League
  { id: "rugbyleague_nrl",          group: "Rugby League",      title: "NRL" },
  // Rugby Union
  { id: "rugbyunion_super_rugby",   group: "Rugby Union",       title: "Super Rugby" },
  { id: "rugbyunion_six_nations",   group: "Rugby Union",       title: "Six Nations" },
  // Tennis
  { id: "tennis_atp_french_open",   group: "Tennis",            title: "ATP" },
  { id: "tennis_wta_french_open",   group: "Tennis",            title: "WTA" },
  // Cricket
  { id: "cricket_ipl",              group: "Cricket",           title: "IPL" },
  { id: "cricket_big_bash",         group: "Cricket",           title: "Big Bash League" },
  // American Football
  { id: "americanfootball_nfl",     group: "American Football", title: "NFL" },
  // Ice Hockey
  { id: "icehockey_nhl",            group: "Ice Hockey",        title: "NHL" },
  // Aussie Rules
  { id: "aussierules_afl",          group: "Aussie Rules",      title: "AFL" },
  // Baseball
  { id: "baseball_mlb",             group: "Baseball",          title: "MLB" },
  // Racing
  { id: "horse_racing",             group: "Horse Racing",      title: "Horse Racing" },
  { id: "greyhound_racing",         group: "Greyhound Racing",  title: "Greyhound Racing" },
];

// ─── Events data ──────────────────────────────────────────────────────────────
// [sportId, home, away, daysFromNow, homeOdds, awayOdds, drawOdds?, spread, total]

type EventRow = [string, string, string, number, number, number, number | null, number, number];

const EVENTS: EventRow[] = [
  // ── Already-started events (negative days = in the past) ──────────────────
  // These are immediately eligible for fake settlement on server startup.
  ["soccer_epl",                    "Nottingham Forest",  "Everton",          -1, 1.75, 4.50, 3.50, 1.5, 2.5],
  ["basketball_nba",                "New York Knicks",    "Toronto Raptors",  -1, 1.60, 2.40, null, 6.5, 210.5],
  ["rugbyleague_nrl",               "Wests Tigers",       "Canterbury Bulldogs", -1, 2.20, 1.72, null, 5.5, 39.5],
  ["icehockey_nhl",                 "New York Rangers",   "Pittsburgh Penguins", -2, 1.75, 2.15, null, 1.5, 6.0],
  ["aussierules_afl",               "Melbourne",          "St Kilda",         -2, 1.85, 2.00, null, 7.5, 153.5],
  ["baseball_mlb",                  "Atlanta Braves",     "New York Mets",    -1, 1.90, 1.95, null, 1.5, 8.0],
  ["cricket_ipl",                   "Punjab Kings",       "Sunrisers Hyderabad", -1, 2.00, 1.90, null, 8.5, 168.5],

  // EPL
  ["soccer_epl", "Arsenal",          "Chelsea",           2,  2.10, 3.50, 3.20, 1.5, 2.5],
  ["soccer_epl", "Manchester City",  "Liverpool",         4,  2.30, 3.10, 3.00, 0.5, 2.5],
  ["soccer_epl", "Tottenham",        "Manchester United", 6,  2.60, 2.80, 3.10, 1.5, 2.5],
  ["soccer_epl", "Newcastle",        "Aston Villa",       9,  2.40, 3.00, 3.10, 1.5, 2.5],
  ["soccer_epl", "Brighton",         "Brentford",         11, 2.20, 3.30, 3.20, 1.5, 2.5],

  // La Liga
  ["soccer_spain_la_liga", "Real Madrid",  "Barcelona",    3,  2.50, 2.90, 3.10, 0.5, 2.5],
  ["soccer_spain_la_liga", "Atletico Madrid","Sevilla",    5,  1.90, 4.00, 3.40, 1.5, 2.5],
  ["soccer_spain_la_liga", "Athletic Club", "Real Sociedad",8, 2.30, 3.10, 3.20, 1.5, 2.5],

  // Serie A
  ["soccer_italy_serie_a", "Inter Milan",  "AC Milan",     2,  2.20, 3.30, 3.10, 0.5, 2.5],
  ["soccer_italy_serie_a", "Juventus",     "Napoli",       7,  2.40, 3.00, 3.20, 1.5, 2.5],
  ["soccer_italy_serie_a", "Roma",         "Lazio",        10, 2.50, 2.90, 3.15, 1.5, 2.5],

  // Bundesliga
  ["soccer_germany_bundesliga", "Bayern Munich", "Borussia Dortmund", 4, 1.80, 4.50, 3.50, 1.5, 3.5],
  ["soccer_germany_bundesliga", "RB Leipzig",    "Bayer Leverkusen",  7, 2.60, 2.70, 3.20, 0.5, 2.5],

  // Champions League
  ["soccer_uefa_champs_league", "PSG",           "Bayern Munich",     5, 2.40, 2.90, 3.30, 0.5, 2.5],
  ["soccer_uefa_champs_league", "Real Madrid",   "Inter Milan",       8, 2.10, 3.50, 3.30, 1.5, 2.5],

  // NBA
  ["basketball_nba", "Boston Celtics",      "Miami Heat",          1,  1.55, 2.55, null, 8.5,  213.5],
  ["basketball_nba", "Golden State Warriors","Los Angeles Lakers", 2,  2.20, 1.72, null, 5.5,  224.5],
  ["basketball_nba", "Milwaukee Bucks",     "Chicago Bulls",       3,  1.45, 2.85, null, 9.5,  218.5],
  ["basketball_nba", "Phoenix Suns",        "Denver Nuggets",      4,  2.10, 1.80, null, 4.5,  221.5],
  ["basketball_nba", "Dallas Mavericks",    "Oklahoma City Thunder",5, 2.30, 1.65, null, 6.5,  216.5],

  // NBL
  ["basketball_nbl", "Sydney Kings",        "Melbourne United",    3,  1.90, 1.95, null, 3.5, 165.5],
  ["basketball_nbl", "Brisbane Bullets",    "Perth Wildcats",      6,  2.30, 1.65, null, 6.5, 160.5],

  // NRL
  ["rugbyleague_nrl", "Sydney Roosters",    "Melbourne Storm",     2,  2.10, 1.80, null, 4.5, 40.5],
  ["rugbyleague_nrl", "Penrith Panthers",   "Brisbane Broncos",    4,  1.70, 2.20, null, 6.5, 42.5],
  ["rugbyleague_nrl", "South Sydney Rabbitohs","Parramatta Eels",  7,  1.90, 1.95, null, 2.5, 38.5],
  ["rugbyleague_nrl", "Cronulla Sharks",    "Manly Sea Eagles",    9,  2.00, 1.90, null, 3.5, 41.5],

  // Super Rugby
  ["rugbyunion_super_rugby", "Blues",       "Chiefs",              3,  1.85, 2.00, null, 4.5, 45.5],
  ["rugbyunion_super_rugby", "Crusaders",   "Highlanders",         6,  1.60, 2.40, null, 8.5, 44.5],
  ["rugbyunion_super_rugby", "Brumbies",    "Waratahs",            8,  1.75, 2.10, null, 5.5, 42.5],

  // Six Nations
  ["rugbyunion_six_nations", "England",     "Ireland",             5,  2.50, 1.60, null, 5.5, 46.5],
  ["rugbyunion_six_nations", "France",      "Scotland",            8,  1.70, 2.20, null, 7.5, 48.5],

  // ATP
  ["tennis_atp_french_open", "Novak Djokovic",  "Carlos Alcaraz",  3,  2.20, 1.75, null, 1.5, 38.5],
  ["tennis_atp_french_open", "Rafael Nadal",    "Jannik Sinner",   5,  2.80, 1.45, null, 1.5, 37.5],
  ["tennis_atp_french_open", "Daniil Medvedev", "Casper Ruud",     7,  1.65, 2.30, null, 1.5, 36.5],

  // WTA
  ["tennis_wta_french_open", "Iga Swiatek",     "Aryna Sabalenka", 4,  1.50, 2.70, null, 1.5, 37.5],
  ["tennis_wta_french_open", "Coco Gauff",      "Elena Rybakina",  6,  2.10, 1.80, null, 1.5, 36.5],

  // IPL
  ["cricket_ipl", "Mumbai Indians",     "Chennai Super Kings",  1,  1.85, 2.00, null, 8.5,  169.5],
  ["cricket_ipl", "Royal Challengers",  "Kolkata Knight Riders",3,  2.10, 1.80, null, 10.5, 172.5],
  ["cricket_ipl", "Delhi Capitals",     "Rajasthan Royals",     5,  2.20, 1.72, null, 9.5,  171.5],

  // Big Bash
  ["cricket_big_bash", "Sydney Sixers",  "Melbourne Stars",     4,  1.80, 2.05, null, 7.5, 164.5],
  ["cricket_big_bash", "Brisbane Heat",  "Perth Scorchers",     7,  2.15, 1.75, null, 9.5, 167.5],

  // NFL
  ["americanfootball_nfl", "Kansas City Chiefs",   "San Francisco 49ers", 5,  1.80, 2.05, null, 3.5, 47.5],
  ["americanfootball_nfl", "Dallas Cowboys",       "Philadelphia Eagles", 8,  2.10, 1.80, null, 2.5, 46.5],
  ["americanfootball_nfl", "Buffalo Bills",        "Miami Dolphins",      12, 1.65, 2.30, null, 6.5, 49.5],

  // NHL
  ["icehockey_nhl", "Toronto Maple Leafs",  "Boston Bruins",        3,  2.10, 1.80, null, 1.5, 6.5],
  ["icehockey_nhl", "Edmonton Oilers",      "Vegas Golden Knights", 5,  1.90, 1.95, null, 0.5, 6.5],
  ["icehockey_nhl", "Colorado Avalanche",   "Dallas Stars",         7,  1.85, 2.00, null, 1.5, 5.5],

  // AFL
  ["aussierules_afl", "Collingwood",        "Richmond",            2,  1.75, 2.15, null, 10.5, 157.5],
  ["aussierules_afl", "Hawthorn",           "Carlton",             4,  2.20, 1.72, null, 8.5,  155.5],
  ["aussierules_afl", "Geelong",            "Brisbane Lions",      6,  1.90, 1.95, null, 5.5,  162.5],
  ["aussierules_afl", "Western Bulldogs",   "GWS Giants",          9,  2.00, 1.90, null, 3.5,  159.5],

  // MLB
  ["baseball_mlb", "New York Yankees",    "Boston Red Sox",        1,  1.80, 2.05, null, 1.5, 8.5],
  ["baseball_mlb", "Los Angeles Dodgers", "San Francisco Giants",  2,  1.55, 2.55, null, 1.5, 7.5],
  ["baseball_mlb", "Houston Astros",      "Texas Rangers",         4,  1.90, 1.95, null, 1.5, 8.5],
  ["baseball_mlb", "Chicago Cubs",        "St. Louis Cardinals",   6,  2.10, 1.80, null, 1.5, 8.5],
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database…");

  // ── 1. Demo user ──
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@dingobet.com" },
    update: {},
    create: {
      email: "demo@dingobet.com",
      username: "demouser",
      passwordHash,
      firstName: "Demo",
      lastName: "User",
      role: "USER",
    },
    include: { wallet: true },
  });

  // Create wallet if it doesn't exist yet
  let wallet = demoUser.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: demoUser.id, balance: 500, currency: "AUD" },
    });
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: demoUser.id,
        type: "DEPOSIT",
        amount: 500,
        balanceBefore: 0,
        balanceAfter: 500,
        status: "COMPLETED",
        reference: "SEED_DEPOSIT",
      },
    });
  }

  console.log(`  Demo user: demo@dingobet.com / Password123!`);

  // ── 2. Sports ──
  for (const sport of SPORTS) {
    await prisma.sport.upsert({
      where: { id: sport.id },
      update: { group: sport.group, title: sport.title, isActive: true },
      create: { ...sport, isActive: true },
    });
  }
  console.log(`  Seeded ${SPORTS.length} sports`);

  // ── 3. Teams (bulk upsert all known teams across every league) ──
  const allTeamNames = [...new Set(Object.values(TEAMS_BY_SPORT).flat())];
  for (const name of allTeamNames) {
    await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  Seeded ${allTeamNames.length} teams`);

  // ── 4. Events + odds ──
  let eventCount = 0;

  for (const [sportId, homeName, awayName, days, homeOdds, awayOdds, drawOdds, spread, total] of EVENTS) {
    // Upsert teams
    const homeTeam = await prisma.team.upsert({
      where: { name: homeName },
      update: {},
      create: { name: homeName },
    });
    const awayTeam = await prisma.team.upsert({
      where: { name: awayName },
      update: {},
      create: { name: awayName },
    });

    const externalId = `seed_${sportId}_${homeName}_${awayName}`.replace(/\s+/g, "_").toLowerCase();

    const event = await prisma.event.upsert({
      where: { externalId },
      update: { commenceTime: daysFromNow(days), status: "UPCOMING", result: null },
      create: {
        externalId,
        sportId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        commenceTime: daysFromNow(days),
        status: "UPCOMING",
      },
    });

    // Delete stale snapshots so re-seeding refreshes them
    await prisma.oddsSnapshot.deleteMany({ where: { eventId: event.id } });

    // h2h
    await prisma.oddsSnapshot.create({
      data: {
        eventId: event.id,
        bookmaker: "DingoBet",
        market: "h2h",
        outcomes: h2hOdds(homeOdds, awayOdds, drawOdds ?? undefined),
      },
    });

    // spreads (not for tennis / cricket — no spread market)
    const noSpreads = ["tennis_atp_french_open", "tennis_wta_french_open", "cricket_ipl", "cricket_big_bash"];
    if (!noSpreads.includes(sportId)) {
      await prisma.oddsSnapshot.create({
        data: {
          eventId: event.id,
          bookmaker: "DingoBet",
          market: "spreads",
          outcomes: spreadsOdds(homeName, awayName, spread),
        },
      });
    }

    // totals
    await prisma.oddsSnapshot.create({
      data: {
        eventId: event.id,
        bookmaker: "DingoBet",
        market: "totals",
        outcomes: totalsOdds(total),
      },
    });

    eventCount++;
  }

  console.log(`  Seeded ${eventCount} events with odds`);
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

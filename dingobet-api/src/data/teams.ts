// ─── Sport configuration ───────────────────────────────────────────────────────
// Used by the fake settlement worker when generating replacement events.

export interface SportConfig {
  hasDraw: boolean;
  hasSpreads: boolean;
  spreadOptions: number[];
  totalMin: number;
  totalMax: number;
}

export const SPORT_CONFIG: Record<string, SportConfig> = {
  soccer_epl:                 { hasDraw: true,  hasSpreads: true,  spreadOptions: [0.5, 1.5],                               totalMin: 1.5,   totalMax: 4.5   },
  soccer_spain_la_liga:       { hasDraw: true,  hasSpreads: true,  spreadOptions: [0.5, 1.5],                               totalMin: 1.5,   totalMax: 4.5   },
  soccer_italy_serie_a:       { hasDraw: true,  hasSpreads: true,  spreadOptions: [0.5, 1.5],                               totalMin: 1.5,   totalMax: 3.5   },
  soccer_germany_bundesliga:  { hasDraw: true,  hasSpreads: true,  spreadOptions: [0.5, 1.5],                               totalMin: 1.5,   totalMax: 4.5   },
  soccer_uefa_champs_league:  { hasDraw: true,  hasSpreads: true,  spreadOptions: [0.5, 1.5],                               totalMin: 1.5,   totalMax: 3.5   },
  basketball_nba:             { hasDraw: false, hasSpreads: true,  spreadOptions: [3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5],     totalMin: 205.5, totalMax: 235.5 },
  basketball_nbl:             { hasDraw: false, hasSpreads: true,  spreadOptions: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5],          totalMin: 155.5, totalMax: 175.5 },
  rugbyleague_nrl:            { hasDraw: false, hasSpreads: true,  spreadOptions: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5], totalMin: 32.5, totalMax: 52.5  },
  rugbyunion_super_rugby:     { hasDraw: false, hasSpreads: true,  spreadOptions: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5],    totalMin: 36.5,  totalMax: 56.5  },
  rugbyunion_six_nations:     { hasDraw: false, hasSpreads: true,  spreadOptions: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5],          totalMin: 36.5,  totalMax: 52.5  },
  tennis_atp_french_open:     { hasDraw: false, hasSpreads: false, spreadOptions: [],                                        totalMin: 33.5,  totalMax: 42.5  },
  tennis_wta_french_open:     { hasDraw: false, hasSpreads: false, spreadOptions: [],                                        totalMin: 32.5,  totalMax: 40.5  },
  cricket_ipl:                { hasDraw: false, hasSpreads: false, spreadOptions: [],                                        totalMin: 155.5, totalMax: 185.5 },
  cricket_big_bash:           { hasDraw: false, hasSpreads: false, spreadOptions: [],                                        totalMin: 148.5, totalMax: 178.5 },
  americanfootball_nfl:       { hasDraw: false, hasSpreads: true,  spreadOptions: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5],    totalMin: 40.5,  totalMax: 56.5  },
  icehockey_nhl:              { hasDraw: false, hasSpreads: true,  spreadOptions: [0.5, 1.5],                               totalMin: 5.0,   totalMax: 7.5   },
  aussierules_afl:            { hasDraw: false, hasSpreads: true,  spreadOptions: [3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5], totalMin: 140.5, totalMax: 170.5 },
  baseball_mlb:               { hasDraw: false, hasSpreads: true,  spreadOptions: [1.5],                                    totalMin: 6.5,   totalMax: 10.5  },
};

// ─── Teams by sport ───────────────────────────────────────────────────────────
// Comprehensive real-world team/player names per sport.
// Used by: seed.ts (bulk upsert), fakeSettlement.worker.ts (event replenishment).

export const TEAMS_BY_SPORT: Record<string, string[]> = {
  soccer_epl: [
    "Arsenal", "Chelsea", "Manchester City", "Liverpool", "Tottenham",
    "Manchester United", "Newcastle", "Aston Villa", "Brighton", "Brentford",
    "Nottingham Forest", "Everton", "West Ham", "Crystal Palace", "Fulham",
    "Wolverhampton", "Bournemouth", "Luton Town", "Burnley", "Sheffield United",
  ],
  soccer_spain_la_liga: [
    "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Athletic Club",
    "Real Sociedad", "Villarreal", "Real Betis", "Valencia", "Osasuna",
    "Celta Vigo", "Mallorca", "Las Palmas", "Getafe", "Rayo Vallecano",
    "Alaves", "Girona", "Cadiz", "Almeria", "Granada",
  ],
  soccer_italy_serie_a: [
    "Inter Milan", "AC Milan", "Juventus", "Napoli", "Roma",
    "Lazio", "Atalanta", "Fiorentina", "Bologna", "Torino",
    "Monza", "Lecce", "Frosinone", "Empoli", "Cagliari",
    "Genoa", "Hellas Verona", "Udinese", "Salernitana", "Sassuolo",
  ],
  soccer_germany_bundesliga: [
    "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
    "Union Berlin", "Freiburg", "Eintracht Frankfurt", "Wolfsburg",
    "Borussia Monchengladbach", "Augsburg", "Hoffenheim", "Werder Bremen",
    "Mainz", "Bochum", "Heidenheim", "Darmstadt", "Koln", "VfB Stuttgart",
  ],
  soccer_uefa_champs_league: [
    "Real Madrid", "Manchester City", "Bayern Munich", "PSG",
    "Inter Milan", "Barcelona", "Arsenal", "Atletico Madrid",
    "Porto", "Borussia Dortmund", "Napoli", "Benfica",
    "Ajax", "RB Leipzig", "Lazio", "Celtic",
  ],
  basketball_nba: [
    "Boston Celtics", "Miami Heat", "Golden State Warriors", "Los Angeles Lakers",
    "Milwaukee Bucks", "Chicago Bulls", "Phoenix Suns", "Denver Nuggets",
    "Dallas Mavericks", "Oklahoma City Thunder", "New York Knicks", "Toronto Raptors",
    "Memphis Grizzlies", "Minnesota Timberwolves", "Sacramento Kings", "Philadelphia 76ers",
    "Cleveland Cavaliers", "Brooklyn Nets", "Los Angeles Clippers", "Atlanta Hawks",
    "New Orleans Pelicans", "Utah Jazz", "Orlando Magic", "Washington Wizards",
    "Indiana Pacers", "Charlotte Hornets", "Houston Rockets", "San Antonio Spurs",
    "Detroit Pistons", "Portland Trail Blazers",
  ],
  basketball_nbl: [
    "Sydney Kings", "Melbourne United", "Brisbane Bullets", "Perth Wildcats",
    "Adelaide 36ers", "New Zealand Breakers", "South East Melbourne Phoenix",
    "Illawarra Hawks", "Cairns Taipans", "Tasmania JackJumpers",
  ],
  rugbyleague_nrl: [
    "Sydney Roosters", "Melbourne Storm", "Penrith Panthers", "Brisbane Broncos",
    "South Sydney Rabbitohs", "Parramatta Eels", "Cronulla Sharks", "Manly Sea Eagles",
    "Wests Tigers", "Canterbury Bulldogs", "St George Illawarra Dragons", "Canberra Raiders",
    "Gold Coast Titans", "North Queensland Cowboys", "Newcastle Knights",
    "New Zealand Warriors", "Dolphins",
  ],
  rugbyunion_super_rugby: [
    "Blues", "Chiefs", "Crusaders", "Highlanders", "Hurricanes",
    "Brumbies", "Waratahs", "Reds", "Western Force", "Fijian Drua",
    "Moana Pasifika", "Lions", "Sharks", "Bulls", "Stormers",
  ],
  rugbyunion_six_nations: [
    "England", "Ireland", "France", "Scotland", "Wales", "Italy",
  ],
  tennis_atp_french_open: [
    "Novak Djokovic", "Carlos Alcaraz", "Rafael Nadal", "Jannik Sinner",
    "Daniil Medvedev", "Casper Ruud", "Stefanos Tsitsipas", "Holger Rune",
    "Andrey Rublev", "Felix Auger-Aliassime", "Alexander Zverev", "Grigor Dimitrov",
    "Taylor Fritz", "Ben Shelton", "Tommy Paul", "Sebastian Korda",
  ],
  tennis_wta_french_open: [
    "Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Elena Rybakina",
    "Caroline Wozniacki", "Jessica Pegula", "Barbora Krejcikova", "Marketa Vondrousova",
    "Karolina Muchova", "Maria Sakkari", "Beatriz Haddad Maia", "Belinda Bencic",
    "Petra Kvitova", "Mirra Andreeva", "Madison Keys", "Emma Raducanu",
  ],
  cricket_ipl: [
    "Mumbai Indians", "Chennai Super Kings", "Royal Challengers Bangalore",
    "Kolkata Knight Riders", "Delhi Capitals", "Rajasthan Royals",
    "Punjab Kings", "Sunrisers Hyderabad", "Lucknow Super Giants", "Gujarat Titans",
  ],
  cricket_big_bash: [
    "Sydney Sixers", "Melbourne Stars", "Brisbane Heat", "Perth Scorchers",
    "Sydney Thunder", "Melbourne Renegades", "Adelaide Strikers", "Hobart Hurricanes",
  ],
  americanfootball_nfl: [
    "Kansas City Chiefs", "San Francisco 49ers", "Dallas Cowboys", "Philadelphia Eagles",
    "Buffalo Bills", "Miami Dolphins", "Baltimore Ravens", "Cincinnati Bengals",
    "Detroit Lions", "Green Bay Packers", "Minnesota Vikings", "Chicago Bears",
    "Seattle Seahawks", "Los Angeles Rams", "Las Vegas Raiders", "Denver Broncos",
    "New York Giants", "Washington Commanders", "Carolina Panthers", "Atlanta Falcons",
    "Tampa Bay Buccaneers", "New Orleans Saints", "Pittsburgh Steelers", "Cleveland Browns",
    "Houston Texans", "Jacksonville Jaguars", "Tennessee Titans", "Indianapolis Colts",
    "Los Angeles Chargers", "Arizona Cardinals", "New England Patriots", "New York Jets",
  ],
  icehockey_nhl: [
    "Boston Bruins", "Toronto Maple Leafs", "Edmonton Oilers", "Vegas Golden Knights",
    "Colorado Avalanche", "Dallas Stars", "New York Rangers", "Pittsburgh Penguins",
    "Carolina Hurricanes", "Florida Panthers", "Tampa Bay Lightning", "New Jersey Devils",
    "New York Islanders", "Washington Capitals", "Minnesota Wild", "Winnipeg Jets",
    "St. Louis Blues", "Nashville Predators", "Calgary Flames", "Vancouver Canucks",
    "Seattle Kraken", "Anaheim Ducks", "Los Angeles Kings", "San Jose Sharks",
    "Montreal Canadiens", "Ottawa Senators", "Detroit Red Wings", "Buffalo Sabres",
    "Columbus Blue Jackets", "Philadelphia Flyers", "Chicago Blackhawks", "Utah Hockey Club",
  ],
  aussierules_afl: [
    "Collingwood", "Richmond", "Hawthorn", "Carlton", "Geelong",
    "Brisbane Lions", "Western Bulldogs", "GWS Giants", "Melbourne",
    "St Kilda", "Essendon", "Fremantle", "West Coast Eagles",
    "North Melbourne", "Sydney Swans", "Adelaide Crows", "Port Adelaide",
    "Gold Coast Suns",
  ],
  baseball_mlb: [
    "New York Yankees", "Boston Red Sox", "Los Angeles Dodgers", "San Francisco Giants",
    "Houston Astros", "Texas Rangers", "Atlanta Braves", "New York Mets",
    "Chicago Cubs", "St. Louis Cardinals", "Philadelphia Phillies", "Miami Marlins",
    "Milwaukee Brewers", "Minnesota Twins", "Cleveland Guardians", "Detroit Tigers",
    "Toronto Blue Jays", "Baltimore Orioles", "Tampa Bay Rays", "Seattle Mariners",
    "Oakland Athletics", "Los Angeles Angels", "San Diego Padres", "Colorado Rockies",
    "Arizona Diamondbacks", "Kansas City Royals", "Pittsburgh Pirates",
    "Cincinnati Reds", "Chicago White Sox", "Washington Nationals",
  ],
};

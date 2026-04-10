import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Team {
  id: string;
  name: string;
}

interface Sport {
  id: string;
  title: string;
  group: string | null;
}

export interface SportEvent {
  id: string;
  externalId: string;
  sportId: string;
  commenceTime: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED" | "POSTPONED";
  homeScore: number | null;
  awayScore: number | null;
  result: "HOME_WIN" | "AWAY_WIN" | "DRAW" | null;
  homeTeam: Team;
  awayTeam: Team;
  sport: Sport;
}

async function fetchEvents(sportId?: string): Promise<SportEvent[]> {
  const { data } = await api.get("/events", {
    params: sportId ? { sport: sportId } : undefined,
  });
  return data;
}

export function useEvents(sportId?: string) {
  return useQuery({
    queryKey: ["events", sportId ?? "all"],
    queryFn: () => fetchEvents(sportId),
  });
}

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsSnapshot {
  id: string;
  eventId: string;
  bookmaker: string;
  market: string;
  outcomes: Outcome[];
  fetchedAt: string;
}

async function fetchOdds(eventId: string, market?: string): Promise<OddsSnapshot> {
  const params = market ? `?market=${market}` : "";
  const { data } = await api.get(`/odds/${eventId}${params}`);
  return data;
}

export function useOdds(eventId: string, market?: string) {
  return useQuery({
    queryKey: ["odds", eventId, market ?? "default"],
    queryFn: () => fetchOdds(eventId, market),
  });
}

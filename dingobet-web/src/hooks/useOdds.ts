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

async function fetchOdds(eventId: string): Promise<OddsSnapshot> {
  const { data } = await api.get(`/odds/${eventId}`);
  return data;
}

export function useOdds(eventId: string) {
  return useQuery({
    queryKey: ["odds", eventId],
    queryFn: () => fetchOdds(eventId),
  });
}

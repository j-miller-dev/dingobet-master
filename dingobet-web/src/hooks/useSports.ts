import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Sport {
  id: string;
  title: string;
  group: string | null;
}

async function fetchSports(): Promise<Sport[]> {
  const { data } = await api.get("/sports");
  return data;
}

export function useSports() {
  return useQuery({
    queryKey: ["sports"],
    queryFn: fetchSports,
  });
}

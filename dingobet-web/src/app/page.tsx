"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/home/HeroBanner";
import SportNav from "@/components/sports/SportNav";
import { useSports } from "@/hooks/useSports";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function Home() {
  useRequireAuth();
  const router = useRouter();
  const { data: sports = [] } = useSports();

  const groups = useMemo(() => {
    const seen = new Set<string>();
    return sports
      .filter((s) => s.group && !seen.has(s.group) && seen.add(s.group))
      .map((s) => ({ id: s.group!, title: s.group!, group: null }));
  }, [sports]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <HeroBanner />
      <SportNav
        sports={groups}
        selected={null}
        onSelect={(group) =>
          group && router.push(`/sport/${encodeURIComponent(group)}`)
        }
      />
    </main>
  );
}

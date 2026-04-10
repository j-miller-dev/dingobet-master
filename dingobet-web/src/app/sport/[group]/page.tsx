"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSports } from "@/hooks/useSports";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function SportGroupPage() {
  useRequireAuth();
  const { group } = useParams<{ group: string }>();
  const router = useRouter();
  const { data: sports = [] } = useSports();

  const leagues = useMemo(
    () => sports.filter((s) => s.group === decodeURIComponent(group)),
    [sports, group],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{decodeURIComponent(group)}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {leagues.map((league) => (
          <button
            key={league.id}
            onClick={() => router.push(`/sport/${group}/${league.id}`)}
            className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm
  hover:border-orange-400 hover:shadow-md transition-all"
          >
            <p className="font-semibold text-gray-900">{league.title}</p>
          </button>
        ))}
      </div>
    </main>
  );
}

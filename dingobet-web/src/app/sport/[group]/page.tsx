"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSports } from "@/hooks/useSports";
import { useEvents } from "@/hooks/useEvents";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import EventCard from "@/components/events/EventCard";
import type { SportEvent } from "@/hooks/useEvents";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ─── Available markets ────────────────────────────────────────────────────────

const MARKETS = [
  { key: "h2h",     label: "Head to Head" },
  { key: "spreads", label: "Handicap" },
  { key: "totals",  label: "Totals" },
];

// Sports where spreads don't exist — hide that tab
const NO_SPREADS = ["Tennis", "Cricket"];

// ─── Default league per sport group ──────────────────────────────────────────
// The league whose title matches this string will be selected on first load.
// Falls back to the first league alphabetically if no match.

const DEFAULT_LEAGUE: Record<string, string> = {
  "American Football": "NFL",
  "Aussie Rules":      "AFL",
  "Baseball":          "MLB",
  "Basketball":        "NBA",
  "Cricket":           "Big Bash League",
  "Ice Hockey":        "NHL",
  "Rugby League":      "NRL",
  "Rugby Union":       "Six Nations",
  "Soccer":            "EPL",
  "Tennis":            "ATP",
  "Horse Racing":      "Horse Racing",
  "Greyhound Racing":  "Greyhound Racing",
};

// ─── All-group events hook ────────────────────────────────────────────────────
// Fetches all events and filters client-side to the current group.

function useGroupEvents(group: string, enabled: boolean) {
  return useQuery<SportEvent[]>({
    queryKey: ["events", "group", group],
    queryFn: async () => {
      const { data } = await api.get("/events");
      return (data as SportEvent[]).filter((e) => e.sport.group === group);
    },
    enabled,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SportGroupPage() {
  useRequireAuth();
  const { group } = useParams<{ group: string }>();
  const decodedGroup = decodeURIComponent(group);

  const { data: sports = [] } = useSports();
  const pillBarRef = useRef<HTMLDivElement>(null);

  // All leagues for this group, popular default sorted first
  const leagues = useMemo(() => {
    const inGroup = sports.filter((s) => s.group === decodedGroup);
    const preferred = DEFAULT_LEAGUE[decodedGroup];
    return [...inGroup].sort((a, b) => {
      if (a.title === preferred) return -1;
      if (b.title === preferred) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [sports, decodedGroup]);

  // undefined = not yet resolved, null = ALL, string = sport id
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [selectedMarket, setSelectedMarket] = useState("h2h");

  const availableMarkets = MARKETS.filter(
    (m) => !(m.key === "spreads" && NO_SPREADS.includes(decodedGroup)),
  );

  // Once leagues load, default to the top one
  useEffect(() => {
    if (leagues.length > 0 && selectedId === undefined) {
      setSelectedId(leagues[0].id);
    }
  }, [leagues, selectedId]);

  const isReady = selectedId !== undefined;
  const isAll = selectedId === null;

  // Events — either for the selected league, or all for the group.
  // Neither query fires until selectedId is resolved (isReady).
  const { data: leagueEvents = [], isLoading: leagueLoading } = useEvents(
    isReady && !isAll ? (selectedId ?? undefined) : undefined,
  );
  const { data: groupEvents = [], isLoading: groupLoading } = useGroupEvents(
    decodedGroup,
    isReady && isAll,
  );

  const events: SportEvent[] = useMemo(() => {
    const raw = isAll ? groupEvents : leagueEvents;
    return [...raw].sort(
      (a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime(),
    );
  }, [isAll, groupEvents, leagueEvents]);

  const isLoading = isAll ? groupLoading : leagueLoading;

  const selectedLeague = leagues.find((l) => l.id === selectedId);

  function selectLeague(id: string | null) {
    setSelectedId(id);
    // Scroll the active pill into view
    const bar = pillBarRef.current;
    if (!bar) return;
    const pill = bar.querySelector(`[data-id="${id ?? "all"}"]`) as HTMLElement | null;
    pill?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div className="min-h-screen bg-orange-50/40 pb-24">
      {/* ── League pill bar ── */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div
          ref={pillBarRef}
          className="flex gap-2 overflow-x-auto px-3 py-3 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {/* ALL pill */}
          <button
            data-id="all"
            onClick={() => selectLeague(null)}
            className={[
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              isAll
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            All
          </button>

          {leagues.map((league) => (
            <button
              key={league.id}
              data-id={league.id}
              onClick={() => selectLeague(league.id)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                selectedId === league.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {league.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── Market sub-header ── */}
      <div className="flex gap-2 border-b border-gray-100 bg-white px-3 py-2">
        {availableMarkets.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMarket(m.key)}
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              selectedMarket === m.key
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
            ].join(" ")}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Events list ── */}
      <div className="space-y-3 px-3 pt-4">
        {isLoading && (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        )}

        {!isLoading && events.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">
            No upcoming events for {selectedLeague?.title ?? decodedGroup}.
          </p>
        )}

        {events.map((event) => (
          <EventCard key={event.id} event={event} market={selectedMarket} />
        ))}
      </div>
    </div>
  );
}

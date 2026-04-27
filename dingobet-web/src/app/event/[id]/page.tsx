"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBetSlipStore } from "@/store/betSlipStore";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsSnapshot {
  id: string;
  bookmaker: string;
  market: string;
  outcomes: Outcome[];
  fetchedAt: string;
}

interface EventDetail {
  id: string;
  commenceTime: string;
  sport: { title: string; group: string };
  homeTeam: { name: string };
  awayTeam: { name: string };
  oddsSnapshots: OddsSnapshot[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MARKET_LABELS: Record<string, string> = {
  h2h:       "Head to Head",
  spreads:   "Handicap",
  totals:    "Totals",
  outrights: "Outrights",
};

function marketLabel(key: string) {
  return MARKET_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchEvent(id: string): Promise<EventDetail> {
  const { data } = await api.get(`/events/${id}`);
  return data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { selections, addSelection, removeSelection } = useBetSlipStore();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent(id),
    enabled: !!id,
  });

  // Group snapshots by market — keep only the most recent per market
  const markets = useMemo(() => {
    if (!event) return [];
    const seen = new Map<string, OddsSnapshot>();
    for (const snap of event.oddsSnapshots) {
      if (!seen.has(snap.market)) seen.set(snap.market, snap);
    }
    // Sort: h2h first, then alphabetically
    return [...seen.entries()]
      .sort(([a], [b]) => {
        if (a === "h2h") return -1;
        if (b === "h2h") return 1;
        return a.localeCompare(b);
      })
      .map(([, snap]) => snap);
  }, [event]);

  const [selectedMarket, setSelectedMarket] = useState<string>("h2h");

  // Default to first available market once loaded
  useEffect(() => {
    if (markets.length > 0 && !markets.find((m) => m.market === selectedMarket)) {
      setSelectedMarket(markets[0].market);
    }
  }, [markets, selectedMarket]);

  const activeSnapshot = markets.find((m) => m.market === selectedMarket);

  // Live odds subscription
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit("subscribe:event", id);

    const handler = (data: { eventId: string }) => {
      if (data.eventId === id) {
        queryClient.invalidateQueries({ queryKey: ["event", id] });
      }
    };

    socket.on("odds:updated", handler);
    return () => { socket.off("odds:updated", handler); };
  }, [id, queryClient]);

  const isSelected = (market: string, outcomeName: string) =>
    selections.some((s) => s.eventId === id && s.market === market && s.selection === outcomeName);

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-gray-400">Loading…</p>;
  }

  if (!event) {
    return <p className="py-12 text-center text-sm text-gray-500">Event not found.</p>;
  }

  return (
    <div className="min-h-screen bg-orange-50/40 pb-24">
      {/* ── Event header ── */}
      <div className="bg-white px-4 py-5 border-b border-gray-200">
        <p className="mb-3 text-xs font-semibold text-orange-500">{event.sport.title}</p>

        <div className="flex items-center justify-between gap-4">
          <span className="flex-1 text-right text-base font-bold text-gray-900 leading-tight">
            {event.homeTeam.name}
          </span>
          <span className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-400">
            VS
          </span>
          <span className="flex-1 text-left text-base font-bold text-gray-900 leading-tight">
            {event.awayTeam.name}
          </span>
        </div>

        <p className="mt-3 text-center text-xs text-gray-400">{formatDate(event.commenceTime)}</p>
      </div>

      {/* ── Market tab pills ── */}
      {markets.length > 0 && (
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div
            className="flex gap-2 overflow-x-auto px-3 py-3"
            style={{ scrollbarWidth: "none" }}
          >
            {markets.map((m) => (
              <button
                key={m.market}
                onClick={() => setSelectedMarket(m.market)}
                className={[
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  selectedMarket === m.market
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                ].join(" ")}
              >
                {marketLabel(m.market)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Outcomes ── */}
      <div className="px-3 pt-4 space-y-2">
        {!activeSnapshot && (
          <p className="py-12 text-center text-sm text-gray-400">No odds available.</p>
        )}

        {activeSnapshot && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {marketLabel(activeSnapshot.market)}
            </p>
            <div className="flex gap-2">
              {activeSnapshot.outcomes.map((outcome) => {
                const selected = isSelected(activeSnapshot.market, outcome.name);
                return (
                  <button
                    key={outcome.name}
                    onClick={() => {
                      if (selected) {
                        removeSelection(event.id);
                      } else {
                        addSelection({
                          eventId: event.id,
                          bookmaker: activeSnapshot.bookmaker,
                          market: activeSnapshot.market,
                          selection: outcome.name,
                          price: outcome.price,
                          label: outcome.name,
                        });
                      }
                    }}
                    className={[
                      "flex flex-1 flex-col items-center rounded-lg border px-2 py-3 text-xs transition-colors",
                      selected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600",
                    ].join(" ")}
                  >
                    {outcome.point !== undefined && (
                      <span className="text-[10px] opacity-70 mb-0.5">
                        {outcome.point > 0 ? `+${outcome.point}` : outcome.point}
                      </span>
                    )}
                    <span className="w-full truncate text-center font-medium leading-tight">
                      {outcome.name}
                    </span>
                    <span className="mt-1.5 text-sm font-bold">{outcome.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

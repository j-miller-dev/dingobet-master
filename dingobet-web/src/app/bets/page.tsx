"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BetEvent {
  homeTeam: { name: string };
  awayTeam: { name: string };
  sport: { title: string };
}

interface BetLeg {
  id: string;
  selection: string;
  market: string;
  odds: string;
  line: string | null;
  status: string;
  event: BetEvent;
}

interface Bet {
  id: string;
  type: string;
  status: string;
  placedAt: string;
  stake: string;
  totalOdds: string;
  potentialPayout: string;
  legs: BetLeg[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

type Filter = "ALL" | "PENDING" | "WON" | "LOST" | "VOID";

const FILTERS: Filter[] = ["ALL", "PENDING", "WON", "LOST", "VOID"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  WON:     "bg-green-100 text-green-700",
  LOST:    "bg-red-100 text-red-700",
  VOID:    "bg-yellow-100 text-yellow-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchBets(): Promise<Bet[]> {
  const { data } = await api.get("/bets");
  return data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyBetsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ALL");

  const { data: bets = [], isLoading, isError } = useQuery({
    queryKey: ["bets"],
    queryFn: fetchBets,
  });

  // Invalidate bets list when a bet settles via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["bets"] });
    };

    socket.on("bet:settled", handler);
    return () => { socket.off("bet:settled", handler); };
  }, [queryClient]);

  const filtered = filter === "ALL" ? bets : bets.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-orange-50/40 pb-24">
      {/* ── Filter pill bar ── */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div
          className="flex gap-2 overflow-x-auto px-3 py-3 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors capitalize",
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="space-y-3 px-3 pt-4">
        {isLoading && (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        )}

        {isError && (
          <p className="py-12 text-center text-sm text-red-500">Failed to load bets.</p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">
            {filter === "ALL" ? "No bets placed yet." : `No ${filter.toLowerCase()} bets.`}
          </p>
        )}

        {filtered.map((bet) => (
          <div
            key={bet.id}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                  {bet.type}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[bet.status] ?? STATUS_STYLES.PENDING}`}
                >
                  {bet.status}
                </span>
              </div>
              <span className="text-xs text-gray-400">{formatDate(bet.placedAt)}</span>
            </div>

            {/* Legs */}
            <div className="mt-3 space-y-1.5">
              {bet.legs.map((leg) => {
                const matchup = `${leg.event.homeTeam.name} v ${leg.event.awayTeam.name}`;
                const isTotals = leg.market === "totals";
                const isSpreads = leg.market === "spreads";
                const selectionLine = isTotals
                  ? `${leg.selection}${leg.line ? ` ${leg.line}` : ""} — ${matchup}`
                  : isSpreads
                  ? `${leg.selection}${leg.line ? ` (${Number(leg.line) > 0 ? "+" : ""}${leg.line})` : ""} — ${matchup}`
                  : leg.selection;

                return (
                  <div
                    key={leg.id}
                    className="rounded-lg bg-gray-50 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{selectionLine}</p>
                        {leg.market === "h2h" && (
                          <p className="mt-0.5 text-xs text-gray-400">{matchup}</p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-400">{leg.event.sport.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{leg.odds}</span>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[leg.status] ?? STATUS_STYLES.PENDING}`}>
                          {leg.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-500">
                Stake <span className="font-semibold text-gray-900">${bet.stake}</span>
              </span>
              <span className="text-xs text-gray-500">
                Odds <span className="font-semibold text-gray-900">{bet.totalOdds}x</span>
              </span>
              <span className="text-xs text-gray-500">
                {bet.status === "WON" ? "Won" : "Potential"}{" "}
                <span
                  className={`font-semibold ${bet.status === "WON" ? "text-green-600" : "text-gray-900"}`}
                >
                  ${bet.potentialPayout}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

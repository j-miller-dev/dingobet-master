"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface BetLeg {
  id: string;
  selection: string;
  market: string;
  odds: string;
  status: string;
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

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  VOID: "bg-yellow-100 text-yellow-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MyBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/bets")
      .then((res) => setBets(res.data))
      .catch(() => setError("Failed to load bets"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (bets.length === 0)
    return <div className="p-6 text-gray-500">No bets placed yet.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bets</h1>
      {bets.map((bet) => (
        <div
          key={bet.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                {bet.type}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[bet.status] ?? STATUS_STYLES.PENDING}`}
              >
                {bet.status}
              </span>
            </div>
            <span className="text-xs text-gray-400">{formatDate(bet.placedAt)}</span>
          </div>

          {/* Legs */}
          <div className="mt-3 space-y-1">
            {bet.legs.map((leg) => (
              <div
                key={leg.id}
                className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900">{leg.selection}</span>
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="uppercase text-xs">{leg.market}</span>
                  <span className="font-bold text-gray-900">{leg.odds}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[leg.status] ?? STATUS_STYLES.PENDING}`}
                  >
                    {leg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: stake / odds / payout */}
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500">
              Stake: <span className="font-semibold text-gray-900">${bet.stake}</span>
            </span>
            <span className="text-gray-500">
              Odds: <span className="font-semibold text-gray-900">{bet.totalOdds}</span>
            </span>
            <span className="text-gray-500">
              Payout:{" "}
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
  );
};

export default MyBets;

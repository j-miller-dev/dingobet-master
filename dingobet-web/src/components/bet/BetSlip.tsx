"use client";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useState } from "react";
import api from "@/lib/api";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

const BetSlip = () => {
  const { selections, removeSelection, stake, setStake, clear } =
    useBetSlipStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const combinedOdds = selections.reduce((acc, s) => acc * s.price, 1);
  const potentialPayout = (combinedOdds * parseFloat(stake || "0")).toFixed(2);

  const placeBet = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post("/bets", {
        stake: parseFloat(stake),
        legs: selections.map(({ eventId, bookmaker, market, selection }) => ({
          eventId,
          bookmaker,
          market,
          selection,
        })),
      });
      clear();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place your bet";
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (key: string) => {
    if (key === "⌫") {
      setStake(stake.slice(0, -1));
      return;
    }
    // only one decimal point
    if (key === "." && stake.includes(".")) return;
    // max 2 decimal places
    const dotIndex = stake.indexOf(".");
    if (dotIndex !== -1 && stake.length - dotIndex > 2) return;
    // max value
    const next = stake + key;
    if (parseFloat(next) > 10000) return;
    setStake(next);
  };

  if (selections.length === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-400 p-4 flex flex-col">
      <h2>My BetSlip</h2>

      <h3>selections</h3>
      <div className="mt-3 flex gap-2 flex-col">
        {selections.map((selection) => (
          <div key={selection.eventId}>
            <span>{selection.label}</span>
            <span>{selection.price}</span>
            <span>({selection.market})</span>
            <button onClick={() => removeSelection(selection.eventId)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <span>Combined Odds: {combinedOdds.toFixed(2)}</span>

      <div className="mt-3 rounded-md bg-white px-3 py-2 text-right text-xl font-mono text-gray-900 min-h-[2.5rem]">
        {stake || <span className="text-gray-400">0.00</span>}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className="rounded-md bg-white py-3 text-lg font-semibold text-gray-900 active:bg-gray-200"
          >
            {key}
          </button>
        ))}
      </div>

      <span className="mt-2">Potential Payout: {potentialPayout}</span>
      {error && <span className="mt-1 text-sm text-red-700">{error}</span>}
      <button
        onClick={placeBet}
        disabled={loading || !stake || parseFloat(stake) <= 0}
        className="mt-2 p-4 font-extrabold disabled:opacity-50"
      >
        {loading ? "Placing..." : "Place Bet"}
      </button>
    </div>
  );
};

export default BetSlip;

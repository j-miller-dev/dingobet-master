"use client";

import { useBetSlipStore } from "@/store/betSlipStore";
import { useState, useRef } from "react";
import api from "@/lib/api";
import { XMarkIcon, TicketIcon } from "@heroicons/react/24/outline";
import BetToast from "@/components/ui/BetToast";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

const BetSlip = () => {
  const { selections, removeSelection, stake, setStake, clear, isOpen, setIsOpen } = useBetSlipStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<"multi" | "singles">("multi");

  // Swipe down to close
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 60) setIsOpen(false);
    touchStartY.current = null;
  };

  const stakeNum = parseFloat(stake || "0");
  const combinedOdds = selections.reduce((acc, s) => acc * s.price, 1);
  const isMulti = selections.length > 1;

  // Multi: one payout. Singles: stake × each leg's own odds, summed.
  const potentialPayout = mode === "singles"
    ? selections.reduce((acc, s) => acc + stakeNum * s.price, 0)
    : stakeNum > 0 ? combinedOdds * stakeNum : 0;

  const totalOutlay = mode === "singles" ? stakeNum * selections.length : stakeNum;

  const placeBet = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "singles") {
        // Fire one request per selection
        await Promise.all(
          selections.map((s) =>
            api.post("/bets", {
              stake: stakeNum,
              legs: [{ eventId: s.eventId, bookmaker: s.bookmaker, market: s.market, selection: s.selection }],
            }),
          ),
        );
      } else {
        await api.post("/bets", {
          stake: stakeNum,
          legs: selections.map(({ eventId, bookmaker, market, selection }) => ({
            eventId, bookmaker, market, selection,
          })),
        });
      }
      clear();
      setShowSuccess(true);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to place your bet",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (key: string) => {
    if (key === "⌫") { setStake(stake.slice(0, -1)); return; }
    if (key === "." && stake.includes(".")) return;
    const dotIndex = stake.indexOf(".");
    if (dotIndex !== -1 && stake.length - dotIndex > 2) return;
    const next = stake + key;
    if (parseFloat(next) > 10000) return;
    setStake(next);
  };

  if (!isOpen) return <BetToast show={showSuccess} onClose={() => setShowSuccess(false)} />;

  if (selections.length === 0) {
    return (
      <>
        <BetToast show={showSuccess} onClose={() => setShowSuccess(false)} />
        <div
          className="fixed bottom-[68px] left-0 right-0 z-40 rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-bold text-gray-900">Bet Slip</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 py-10">
            <TicketIcon className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">Your bet slip is empty.</p>
            <p className="text-xs text-gray-300">Tap the odds on any event to add a selection.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BetToast show={showSuccess} onClose={() => setShowSuccess(false)} />

      <div
        className="fixed bottom-[68px] left-0 right-0 z-40 flex flex-col max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-bold text-gray-900">Bet Slip</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Multi / Singles toggle — only shown when 2+ selections */}
            {isMulti && (
              <div className="flex rounded-full bg-gray-100 p-0.5 text-xs font-semibold">
                {(["multi", "singles"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={[
                      "rounded-full px-3 py-1 capitalize transition-colors",
                      mode === m ? "bg-orange-500 text-white" : "text-gray-500",
                    ].join(" ")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Selections ── */}
        <div className="flex flex-col gap-2 px-4 pt-3">
          {selections.map((s) => (
            <div
              key={s.eventId}
              className="flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-400 uppercase">{s.market}</p>
                {mode === "singles" && stakeNum > 0 && (
                  <p className="text-xs font-semibold text-green-600 mt-0.5">
                    Returns ${(stakeNum * s.price).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="ml-3 flex items-center gap-2.5">
                <span className="text-sm font-bold text-orange-600">{s.price.toFixed(2)}</span>
                <button onClick={() => removeSelection(s.eventId)} className="text-gray-300 hover:text-red-400">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Odds summary ── */}
        {isMulti && mode === "multi" && (
          <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
            <span className="text-xs font-semibold text-gray-500">Combined odds</span>
            <span className="text-sm font-bold text-orange-600">{combinedOdds.toFixed(2)}x</span>
          </div>
        )}
        {isMulti && mode === "singles" && (
          <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-xs font-semibold text-gray-500">Total outlay</span>
            <span className="text-sm font-bold text-gray-700">
              ${stakeNum > 0 ? totalOutlay.toFixed(2) : "—"} ({selections.length} bets)
            </span>
          </div>
        )}

        {/* ── Stake display ── */}
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs font-semibold text-gray-400">Stake</span>
          <span className="font-mono text-xl font-bold text-gray-900">
            {stake ? `$${stake}` : <span className="text-gray-300">$0.00</span>}
          </span>
        </div>

        {/* ── Potential returns ── */}
        <div className="mx-4 mt-2 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
          <span className="text-xs font-semibold text-gray-500">Potential return</span>
          <span className={`text-lg font-bold ${potentialPayout > 0 ? "text-green-600" : "text-gray-300"}`}>
            ${potentialPayout.toFixed(2)}
          </span>
        </div>

        {/* ── Numpad ── */}
        <div className="mt-3 grid grid-cols-3 gap-1 px-4">
          {KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="rounded-xl bg-gray-100 py-3.5 text-lg font-semibold text-gray-800 active:bg-gray-200 transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <p className="mx-4 mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* ── Place Bet ── */}
        <div className="px-4 pb-4 pt-3">
          <button
            onClick={placeBet}
            disabled={loading || !stake || stakeNum <= 0}
            className="w-full rounded-xl bg-orange-500 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
          >
            {loading
              ? "Placing…"
              : mode === "singles"
              ? `Place ${selections.length} Singles`
              : `Place Bet${isMulti ? ` (${selections.length} legs)` : ""}`
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default BetSlip;

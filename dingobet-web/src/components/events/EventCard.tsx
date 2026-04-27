"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { SportEvent } from "@/hooks/useEvents";
import { useOdds } from "@/hooks/useOdds";
import { useBetSlipStore } from "@/store/betSlipStore";
import { getSocket } from "@/lib/socket";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventCard({ event }: { event: SportEvent }) {
  const queryClient = useQueryClient();
  const { data: odds } = useOdds(event.id);
  const { selections, addSelection, removeSelection } = useBetSlipStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit("subscribe:event", event.id);

    const handleOddsUpdated = (data: { eventId: string }) => {
      if (data.eventId === event.id) {
        queryClient.invalidateQueries({ queryKey: ["odds", event.id] });
      }
    };

    socket.on("odds:updated", handleOddsUpdated);

    return () => {
      socket.off("odds:updated", handleOddsUpdated);
    };
  }, [event.id, queryClient]);
  const isSelected = (outcomeName: string) =>
    selections.some(
      (s) => s.eventId === event.id && s.selection === outcomeName,
    );

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      {/* Tapping the header/teams navigates to the event detail page */}
      <Link href={`/event/${event.id}`} className="block">
        {/* Date + league */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-orange-500">{event.sport.title}</span>
          <span className="text-xs text-gray-400">{formatTime(event.commenceTime)}</span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1 text-right text-sm font-bold text-gray-900 leading-tight">
            {event.homeTeam.name}
          </span>
          <span className="shrink-0 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-400">
            VS
          </span>
          <span className="flex-1 text-left text-sm font-bold text-gray-900 leading-tight">
            {event.awayTeam.name}
          </span>
        </div>
      </Link>

      {/* Odds buttons */}
      {odds && (
        <div className="mt-4 flex gap-2">
          {odds.outcomes.map((outcome) => (
            <button
              key={outcome.name}
              onClick={() => {
                if (isSelected(outcome.name)) {
                  removeSelection(event.id);
                } else {
                  addSelection({
                    eventId: event.id,
                    bookmaker: odds.bookmaker,
                    market: odds.market,
                    selection: outcome.name,
                    price: outcome.price,
                    label: outcome.name,
                  });
                }
              }}
              className={[
                "flex flex-1 flex-col items-center rounded-lg border px-2 py-2.5 text-xs transition-colors",
                isSelected(outcome.name)
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600",
              ].join(" ")}
            >
              <span className="w-full truncate text-center leading-tight">{outcome.name}</span>
              <span className="mt-1 text-sm font-bold">{outcome.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

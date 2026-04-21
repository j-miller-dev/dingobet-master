"use client";

import type { SportEvent } from "@/hooks/useEvents";
import { useOdds } from "@/hooks/useOdds";

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
  const { data: odds } = useOdds(event.id);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-medium text-orange-600">
        {event.sport.title}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-semibold text-gray-900">
          {event.homeTeam.name}
        </span>
        <span
          className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-bold
  text-gray-500"
        >
          VS
        </span>
        <span className="flex-1 text-left font-semibold text-gray-900">
          {event.awayTeam.name}
        </span>
      </div>
      <p
        className="mt-2 text-center text-xs
  text-gray-400"
      >
        {formatTime(event.commenceTime)}
      </p>
      {odds && (
        <div className="mt-3 flex gap-2">
          {odds.outcomes.map((outcome) => (
            <button
              key={outcome.name}
              className="flex flex-1 flex-col items-center rounded-md bg-gray-50 px-2 py-2
  text-xs hover:bg-orange-50 hover:text-orange-600 transition-colors border border-gray-200"
            >
              <span
                className="text-gray-500 truncate w-full
  text-center"
              >
                {outcome.name}
              </span>
              <span
                className="font-bold text-gray-900
  mt-1"
              >
                {outcome.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

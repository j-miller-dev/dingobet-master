"use client";

import { useParams } from "next/navigation";
import { useEvents } from "@/hooks/useEvents";
import EventCard from "@/components/events/EventCard";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function LeagueEventsPage() {
  useRequireAuth();
  const { group, leagueId } = useParams<{ group: string; leagueId: string }>();

  const { data: events = [], isLoading } = useEvents(leagueId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {decodeURIComponent(leagueId)}
      </h1>
      {isLoading ? (
        <p className="text-gray-400">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-400">No upcoming events.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}

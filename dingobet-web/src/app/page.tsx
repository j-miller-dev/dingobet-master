"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSports } from "@/hooks/useSports";
import { useEvents } from "@/hooks/useEvents";
import type { SportEvent } from "@/hooks/useEvents";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/components/home/LandingPage";
import { ChevronRightIcon, FireIcon } from "@heroicons/react/24/outline";
import { ErrorState } from "@/components/ui/Skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFootballBall,
  faBaseballBall,
  faBasketballBall,
  faFutbol,
  faTableTennisPaddleBall,
  faHockeyPuck,
  faVolleyball,
  faGolfBallTee,
  faHorse,
  faDog,
  faMedal,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORT_ICONS: Record<string, IconDefinition> = {
  "American Football": faFootballBall,
  "Aussie Rules":      faFootballBall,
  Baseball:            faBaseballBall,
  Basketball:          faBasketballBall,
  Boxing:              faMedal,
  Cricket:             faBaseballBall,
  Golf:                faGolfBallTee,
  "Ice Hockey":        faHockeyPuck,
  "Mixed Martial Arts": faMedal,
  "Rugby League":      faFootballBall,
  "Rugby Union":       faFootballBall,
  Soccer:              faFutbol,
  Tennis:              faTableTennisPaddleBall,
  Volleyball:          faVolleyball,
  "Horse Racing":      faHorse,
  "Greyhound Racing":  faDog,
  "Harness Racing":    faHorse,
};

const RACING_GROUPS = ["Horse Racing", "Greyhound Racing", "Harness Racing"];

const FEATURE_PILLS = [
  { emoji: "⚡", label: "Live Odds" },
  { emoji: "🏆", label: "Multi-Leg Parlays" },
  { emoji: "💰", label: "Instant Deposits" },
  { emoji: "📱", label: "Mobile Friendly" },
  { emoji: "🔒", label: "Secure & Safe" },
];

type Tab = "sports" | "racing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Live";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Feature pills ────────────────────────────────────────────────────────────

function FeaturePills() {
  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {FEATURE_PILLS.map((p) => (
        <span
          key={p.label}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm"
        >
          <span aria-hidden="true">{p.emoji}</span>
          {p.label}
        </span>
      ))}
    </div>
  );
}

// ─── Promo banner ─────────────────────────────────────────────────────────────

function PromoBanner() {
  return (
    <div className="mx-3 mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 p-5 shadow-lg shadow-orange-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-100">
            Welcome to DingoBet
          </p>
          <h2 className="mt-1 text-[1.35rem] font-extrabold leading-tight text-white">
            Live odds on<br />every market
          </h2>
          <p className="mt-2 text-xs text-orange-100">
            Multi-leg parlays · Same-day payouts
          </p>
        </div>
        <span className="text-5xl select-none" aria-hidden="true">🏆</span>
      </div>
    </div>
  );
}

// ─── Next Up card ─────────────────────────────────────────────────────────────

function NextUpCard({ event }: { event: SportEvent }) {
  const time = timeUntil(event.commenceTime);
  const isLive = time === "Live";

  return (
    <Link
      href={`/event/${event.id}`}
      className="flex w-44 shrink-0 flex-col gap-2.5 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-[0.97]"
    >
      {/* Sport + time */}
      <div className="flex items-center justify-between">
        <span className="max-w-[90px] truncate rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
          {event.sport.group ?? event.sport.title}
        </span>
        <span className={`shrink-0 text-[10px] font-bold ${isLive ? "text-green-500" : "text-gray-400"}`}>
          {isLive ? "🔴 Live" : `in ${time}`}
        </span>
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-1">
        <p className="truncate text-xs font-bold leading-tight text-gray-900">
          {event.homeTeam.name}
        </p>
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">vs</span>
        <p className="truncate text-xs font-bold leading-tight text-gray-900">
          {event.awayTeam.name}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-auto flex items-center justify-between text-orange-500">
        <span className="text-[10px] font-semibold">View odds</span>
        <ChevronRightIcon className="h-3 w-3" />
      </div>
    </Link>
  );
}

// ─── Sport card ───────────────────────────────────────────────────────────────

function SportCard({
  group,
  eventCount,
  onClick,
}: {
  group: string;
  eventCount: number;
  onClick: () => void;
}) {
  const icon = SPORT_ICONS[group];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/50 active:scale-[0.97]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-xl text-orange-500">
        {icon ? <FontAwesomeIcon icon={icon} /> : <span className="text-base">🎯</span>}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-xs font-bold leading-tight text-gray-900">{group}</span>
        {eventCount > 0 ? (
          <span className="text-[10px] font-medium text-orange-500">{eventCount} upcoming</span>
        ) : (
          <span className="text-[10px] font-medium text-gray-400">View markets</span>
        )}
      </div>
    </button>
  );
}

// ─── Sport grid skeleton ──────────────────────────────────────────────────────

function SportGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const token    = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const router   = useRouter();

  const { data: sports = [], isLoading: sportsLoading, isError: sportsError } = useSports();
  const { data: events = [] } = useEvents();
  const [tab, setTab] = useState<Tab>("sports");

  // Unique alphabetical sport groups
  const groups = useMemo(() => {
    const seen = new Set<string>();
    return sports
      .filter((s) => s.group && !seen.has(s.group) && seen.add(s.group))
      .map((s) => s.group!)
      .sort((a, b) => a.localeCompare(b));
  }, [sports]);

  // Upcoming event count per group (for badge on sport cards)
  const eventsByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      const group = event.sport.group;
      if (group) counts[group] = (counts[group] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  const sportsGroups = groups.filter((g) => !RACING_GROUPS.includes(g));
  const racingGroups = groups.filter((g) => RACING_GROUPS.includes(g));

  // First 10 non-racing upcoming events for the Next Up strip
  const nextUpEvents = useMemo(
    () => events.filter((e) => !RACING_GROUPS.includes(e.sport.group ?? "")).slice(0, 10),
    [events],
  );

  if (!hydrated) return null;
  if (!token) return <LandingPage />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Sticky tab bar ── */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl">
          {(["sports", "racing"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-200",
                tab === t
                  ? "border-b-2 border-orange-400 text-orange-500"
                  : "text-gray-400 hover:text-gray-500",
              ].join(" ")}
            >
              <span className={tab === t ? "text-orange-500" : "text-gray-400"}>
                <FontAwesomeIcon icon={t === "sports" ? faFutbol : faHorse} />
              </span>
              <span>{t === "sports" ? "Sports" : "Racing"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl">

        {/* ══════════════════ SPORTS TAB ══════════════════ */}
        {tab === "sports" && (
          <>
            {/* Feature pills */}
            <FeaturePills />

            {/* Promo banner */}
            <PromoBanner />

            {/* Next Up strip */}
            {nextUpEvents.length > 0 && (
              <section className="mb-6 px-3">
                <div className="mb-3 flex items-center gap-1.5">
                  <FireIcon className="h-4 w-4 text-orange-500" />
                  <h2 className="text-sm font-bold text-gray-900">Next Up</h2>
                  <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                    {nextUpEvents.length} events
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {nextUpEvents.map((event) => (
                    <NextUpCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* All Sports grid */}
            <section className="px-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">All Sports</h2>
                <span className="text-xs text-gray-400">
                  {sportsGroups.length} categories
                </span>
              </div>

              {sportsError && <ErrorState message="Failed to load sports." />}
              {sportsLoading ? (
                <SportGridSkeleton />
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {sportsGroups.map((group) => (
                    <SportCard
                      key={group}
                      group={group}
                      eventCount={eventsByGroup[group] ?? 0}
                      onClick={() => router.push(`/sport/${encodeURIComponent(group)}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════ RACING TAB ══════════════════ */}
        {tab === "racing" && (
          <section className="px-3 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Racing</h2>
              <span className="text-xs text-gray-400">
                {racingGroups.length} categories
              </span>
            </div>

            {racingGroups.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl" aria-hidden="true">🏇</span>
                <p className="mt-3 text-sm font-medium text-gray-400">
                  No racing markets available right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {racingGroups.map((group) => (
                  <SportCard
                    key={group}
                    group={group}
                    eventCount={eventsByGroup[group] ?? 0}
                    onClick={() => router.push(`/sport/${encodeURIComponent(group)}`)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

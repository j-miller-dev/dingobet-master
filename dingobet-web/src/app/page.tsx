"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSports } from "@/hooks/useSports";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/components/home/LandingPage";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { SkeletonSportRow, ErrorState } from "@/components/ui/Skeleton";

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
// ─── Sport icon map (emoji placeholders — swap for real icons later) ──────────

const SPORT_ICONS: Record<string, IconDefinition> = {
  "American Football": faFootballBall,
  "Aussie Rules": faFootballBall,
  Baseball: faBaseballBall,
  Basketball: faBasketballBall,
  Boxing: faMedal,
  Cricket: faBaseballBall,
  Golf: faGolfBallTee,
  "Ice Hockey": faHockeyPuck,
  "Mixed Martial Arts": faMedal,
  "Rugby League": faFootballBall,
  "Rugby Union": faFootballBall,
  Soccer: faFutbol,
  Tennis: faTableTennisPaddleBall,
  Volleyball: faVolleyball,
  "Horse Racing": faHorse,
  "Greyhound Racing": faDog,
  "Harness Racing": faHorse,
};

const RACING_GROUPS = ["Horse Racing", "Greyhound Racing", "Harness Racing"];

type Tab = "sports" | "racing";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const router = useRouter();
  const { data: sports = [], isLoading, isError } = useSports();
  const [tab, setTab] = useState<Tab>("sports");

  // Deduplicate into unique groups, sorted alphabetically
  const groups = useMemo(() => {
    const seen = new Set<string>();
    return sports
      .filter((s) => s.group && !seen.has(s.group) && seen.add(s.group))
      .map((s) => s.group!)
      .sort((a, b) => a.localeCompare(b));
  }, [sports]);

  const sportsGroups = groups.filter((g) => !RACING_GROUPS.includes(g));
  const racingGroups = groups.filter((g) => RACING_GROUPS.includes(g));
  const activeGroups = tab === "sports" ? sportsGroups : racingGroups;

  if (!hydrated) return null;
  if (!token) return <LandingPage />;

  return (
    <div className="min-h-screen bg-orange-50/40 pb-24">
      {/* ── Racing / Sports toggle ── */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="flex">
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

      {/* ── Sport list ── */}
      <div className="px-3 pt-4 space-y-2">
        {isError && <ErrorState message="Failed to load sports." />}

        {isLoading ? (
          [0, 1, 2, 3, 4, 5].map((i) => <SkeletonSportRow key={i} />)
        ) : activeGroups.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {tab === "racing"
              ? "No racing markets available."
              : "No sports available."}
          </p>
        ) : null}

        {activeGroups.map((group) => (
          <button
            key={group}
            onClick={() => router.push(`/sport/${encodeURIComponent(group)}`)}
            className="flex w-full items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm active:bg-orange-50 transition-colors"
          >
            <span className="text-xl text-orange-500">
              {SPORT_ICONS[group] && (
                <FontAwesomeIcon icon={SPORT_ICONS[group]} />
              )}
            </span>
            <span className="flex-1 text-left text-base font-semibold text-gray-900">
              {group}
            </span>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

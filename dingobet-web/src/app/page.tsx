"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSports } from "@/hooks/useSports";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/components/home/LandingPage";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

// ─── Sport icon map (emoji placeholders — swap for real icons later) ──────────

const SPORT_ICONS: Record<string, string> = {
  "American Football": "🏈",
  "Aussie Rules":      "🏉",
  "Baseball":          "⚾",
  "Basketball":        "🏀",
  "Boxing":            "🥊",
  "Cricket":           "🏏",
  "Golf":              "⛳",
  "Ice Hockey":        "🏒",
  "Mixed Martial Arts":"🥋",
  "Rugby League":      "🏉",
  "Rugby Union":       "🏉",
  "Soccer":            "⚽",
  "Tennis":            "🎾",
  "Volleyball":        "🏐",
  "Horse Racing":      "🏇",
  "Greyhound Racing":  "🐕",
  "Harness Racing":    "🐎",
};

const RACING_GROUPS = ["Horse Racing", "Greyhound Racing", "Harness Racing"];

type Tab = "sports" | "racing";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const { data: sports = [], isLoading } = useSports();
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
                "flex-1 py-3.5 text-sm font-semibold capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-400 hover:text-gray-600",
              ].join(" ")}
            >
              {t === "sports" ? "⚽ Sports" : "🏇 Racing"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sport list ── */}
      <div className="px-3 pt-4 space-y-2">
        {isLoading && (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        )}

        {!isLoading && activeGroups.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">
            {tab === "racing" ? "No racing markets available." : "No sports available."}
          </p>
        )}

        {activeGroups.map((group) => (
          <button
            key={group}
            onClick={() => router.push(`/sport/${encodeURIComponent(group)}`)}
            className="flex w-full items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm active:bg-orange-50 transition-colors"
          >
            <span className="text-2xl leading-none">
              {SPORT_ICONS[group] ?? "🎯"}
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

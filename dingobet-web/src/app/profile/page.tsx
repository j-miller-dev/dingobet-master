"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ firstName, lastName }: { firstName: string; lastName?: string }) {
  const initials = [firstName[0], lastName?.[0]].filter(Boolean).join("").toUpperCase();
  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white">
      {initials}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm/6 font-medium text-gray-900">{label}</label>
      <div className="mt-2">
        <div className="block w-full rounded-md border-0 bg-gray-50 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-200 sm:text-sm/6">
          {value}
        </div>
      </div>
    </div>
  );
}

function BetCard({ bet }: { bet: Bet }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{bet.type}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[bet.status] ?? STATUS_STYLES.PENDING}`}>
            {bet.status}
          </span>
        </div>
        <span className="text-xs text-gray-400">{formatDate(bet.placedAt)}</span>
      </div>
      <div className="mt-3 space-y-1">
        {bet.legs.map((leg) => (
          <div key={leg.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium text-gray-900">{leg.selection}</span>
            <div className="flex items-center gap-3 text-gray-500">
              <span className="text-xs uppercase">{leg.market}</span>
              <span className="font-bold text-gray-900">{leg.odds}</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[leg.status] ?? STATUS_STYLES.PENDING}`}>
                {leg.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm">
        <span className="text-gray-500">Stake: <span className="font-semibold text-gray-900">${bet.stake}</span></span>
        <span className="text-gray-500">Odds: <span className="font-semibold text-gray-900">{bet.totalOdds}</span></span>
        <span className="text-gray-500">
          Payout:{" "}
          <span className={`font-semibold ${bet.status === "WON" ? "text-green-600" : "text-gray-900"}`}>
            ${bet.potentialPayout}
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "account" | "history" | "security";
const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "history", label: "Bet History" },
  { id: "security", label: "Security" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [bets, setBets] = useState<Bet[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsError, setBetsError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  // Fetch bets when history tab is opened
  useEffect(() => {
    if (activeTab !== "history" || bets.length > 0) return;
    setBetsLoading(true);
    api
      .get("/bets")
      .then((res) => setBets(res.data))
      .catch(() => setBetsError("Failed to load bets"))
      .finally(() => setBetsLoading(false));
  }, [activeTab, bets.length]);

  if (!user) return null;

  const wonBets = bets.filter((b) => b.status === "WON").length;
  const totalWagered = bets.reduce((acc, b) => acc + parseFloat(b.stake), 0);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <div className="pb-20">
      {/* Profile header */}
      <div className="border-b border-gray-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-5">
            <Avatar firstName={user.firstName} lastName={user.lastName} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3">
          <StatCard label="Bets placed" value={bets.length} />
          <StatCard label="Bets won" value={wonBets} />
          <StatCard label="Total wagered" value={`$${totalWagered.toFixed(2)}`} />
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-3xl overflow-x-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex gap-x-6 text-sm/6 font-semibold text-gray-500">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "border-b-2 py-4 transition-colors",
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent hover:text-gray-700",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Account ── */}
        {activeTab === "account" && (
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Personal Information</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Your account details as registered.</p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 md:col-span-2">
                <div className="sm:col-span-3">
                  <ReadOnlyField label="First name" value={user.firstName} />
                </div>
                <div className="sm:col-span-3">
                  <ReadOnlyField label="Last name" value={user.lastName ?? "—"} />
                </div>
                <div className="col-span-full">
                  <ReadOnlyField label="Email address" value={user.email} />
                </div>
                <div className="col-span-full">
                  <ReadOnlyField label="Username" value={`@${user.username}`} />
                </div>
                <div className="col-span-full">
                  <ReadOnlyField label="Role" value={user.role} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Bet History ── */}
        {activeTab === "history" && (
          <div>
            {betsLoading && <p className="text-gray-500">Loading...</p>}
            {betsError && <p className="text-red-600">{betsError}</p>}
            {!betsLoading && !betsError && bets.length === 0 && (
              <p className="text-gray-500">No bets placed yet.</p>
            )}
            <div className="space-y-4">
              {bets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          </div>
        )}

        {/* ── Security ── */}
        {activeTab === "security" && (
          <div className="divide-y divide-gray-200">
            {/* Change password */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Change password</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Update your password associated with your account.</p>
              </div>
              <form className="grid grid-cols-1 gap-y-6 md:col-span-2 sm:max-w-md">
                {["Current password", "New password", "Confirm password"].map((label, i) => (
                  <div key={label}>
                    <label className="block text-sm/6 font-medium text-gray-900">{label}</label>
                    <div className="mt-2">
                      <input
                        type="password"
                        autoComplete={i === 0 ? "current-password" : "new-password"}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-500 sm:text-sm/6"
                      />
                    </div>
                  </div>
                ))}
                <div>
                  <button
                    type="submit"
                    className="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>

            {/* Log out */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-12 md:grid-cols-3">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Log out</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Sign out of your current session on this device.</p>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-700"
                >
                  Log out
                </button>
              </div>
            </div>

            {/* Delete account */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 pt-12 md:grid-cols-3">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Delete account</h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500"
                >
                  Yes, delete my account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

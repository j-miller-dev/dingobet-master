"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import SplashScreen from "@/components/ui/SplashScreen";

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
  WON:     "bg-green-100 text-green-700",
  LOST:    "bg-red-100 text-red-700",
  VOID:    "bg-yellow-100 text-yellow-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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

// ─── Password input ────────────────────────────────────────────────────────────

function PwdField({
  label, value, onChange, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-900">{label}</label>
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-xl border-0 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-200 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-500"
      />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "account" | "history" | "security";
const TABS: { id: Tab; label: string }[] = [
  { id: "account",  label: "Account" },
  { id: "history",  label: "Bet History" },
  { id: "security", label: "Security" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, refreshToken, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [bets, setBets] = useState<Bet[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsError, setBetsError] = useState<string | null>(null);

  // ── Change password modal ──────────────────────────────────────────────────
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwd, setChangePwd] = useState({ current: "", next: "" });
  const [changePwdError, setChangePwdError] = useState<string | null>(null);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdSuccess, setChangePwdSuccess] = useState(false);

  // ── Reset password flow ────────────────────────────────────────────────────
  const [resetStep, setResetStep] = useState<"idle" | "loading" | "form">("idle");
  const [resetPwd, setResetPwd] = useState({ next: "", confirm: "" });
  const [resetPwdError, setResetPwdError] = useState<string | null>(null);
  const [resetPwdLoading, setResetPwdLoading] = useState(false);

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch {}
    clearAuth();
    router.push("/");
  };

  const closeChangePwd = () => {
    setChangePwdOpen(false);
    setChangePwdError(null);
    setChangePwdSuccess(false);
    setChangePwd({ current: "", next: "" });
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwdError(null);
    setChangePwdLoading(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: changePwd.current,
        newPassword: changePwd.next,
      });
      setChangePwdSuccess(true);
      setTimeout(closeChangePwd, 1600);
    } catch (err: unknown) {
      setChangePwdError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Failed to update password",
      );
    } finally {
      setChangePwdLoading(false);
    }
  };

  const handleResetStart = () => {
    setResetStep("loading");
    setTimeout(() => setResetStep("form"), 1800);
  };

  const closeReset = () => {
    setResetStep("idle");
    setResetPwdError(null);
    setResetPwd({ next: "", confirm: "" });
  };

  const handleResetSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPwdError(null);
    if (resetPwd.next !== resetPwd.confirm) {
      setResetPwdError("Passwords do not match");
      return;
    }
    if (resetPwd.next.length < 8) {
      setResetPwdError("Password must be at least 8 characters");
      return;
    }
    setResetPwdLoading(true);
    try {
      await api.patch("/auth/reset-password", { newPassword: resetPwd.next });
      closeReset();
    } catch (err: unknown) {
      setResetPwdError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Failed to reset password",
      );
    } finally {
      setResetPwdLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

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
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">

            {/* Change password */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Change password</p>
                <p className="text-xs text-gray-500 mt-0.5">Update your account password</p>
              </div>
              <button
                onClick={() => setChangePwdOpen(true)}
                className="ml-4 shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-500"
              >
                Change →
              </button>
            </div>

            {/* Reset password */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Reset password</p>
                <p className="text-xs text-gray-500 mt-0.5">Can't remember your current password?</p>
              </div>
              <button
                onClick={handleResetStart}
                className="ml-4 shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-500"
              >
                Reset →
              </button>
            </div>

            {/* Log out */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Log out</p>
                <p className="text-xs text-gray-500 mt-0.5">Sign out of your account on this device</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                Log out
              </button>
            </div>

            {/* Delete account */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Delete account</p>
                <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all data</p>
              </div>
              <button
                type="button"
                className="ml-4 shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reset password: splash loading ── */}
      {resetStep === "loading" && <SplashScreen />}

      {/* ── Change password modal ── */}
      <Dialog open={changePwdOpen} onClose={closeChangePwd} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <DialogPanel className="w-full rounded-t-2xl bg-white px-6 pt-5 pb-8 shadow-xl sm:max-w-md sm:rounded-2xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900">
                Change password
              </DialogTitle>
              <button onClick={closeChangePwd} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {changePwdSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Password updated!</p>
              </div>
            ) : (
              <form onSubmit={handleChangePwd} className="space-y-4">
                <PwdField
                  label="Current password"
                  value={changePwd.current}
                  onChange={(v) => setChangePwd((p) => ({ ...p, current: v }))}
                  autoComplete="current-password"
                />
                <PwdField
                  label="New password"
                  value={changePwd.next}
                  onChange={(v) => setChangePwd((p) => ({ ...p, next: v }))}
                  autoComplete="new-password"
                />
                {changePwdError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    {changePwdError}
                  </p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeChangePwd}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changePwdLoading}
                    className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40 transition-colors"
                  >
                    {changePwdLoading ? "Saving…" : "Save & Apply"}
                  </button>
                </div>
              </form>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* ── Reset password modal ── */}
      <Dialog open={resetStep === "form"} onClose={closeReset} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <DialogPanel className="w-full rounded-t-2xl bg-white px-6 pt-5 pb-8 shadow-xl sm:max-w-md sm:rounded-2xl">
            {/* Header */}
            <div className="mb-1 flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900">
                Set new password
              </DialogTitle>
              <button onClick={closeReset} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 text-xs text-gray-400">Choose a new password for your account.</p>

            <form onSubmit={handleResetSave} className="space-y-4">
              <PwdField
                label="New password"
                value={resetPwd.next}
                onChange={(v) => setResetPwd((p) => ({ ...p, next: v }))}
                autoComplete="new-password"
              />
              <PwdField
                label="Confirm new password"
                value={resetPwd.confirm}
                onChange={(v) => setResetPwd((p) => ({ ...p, confirm: v }))}
                autoComplete="new-password"
              />
              {resetPwdError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {resetPwdError}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeReset}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPwdLoading}
                  className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40 transition-colors"
                >
                  {resetPwdLoading ? "Saving…" : "Save & Apply"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TicketIcon,
  TrophyIcon,
  ArrowPathIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = "DEPOSIT" | "WITHDRAWAL" | "BET_PLACED" | "BET_WON" | "BET_REFUND" | "BONUS";

interface Transaction {
  id: string;
  type: TxType;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  status: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TX_META: Record<TxType, { label: string; icon: React.ElementType; color: string; sign: "+" | "-" }> = {
  DEPOSIT:     { label: "Deposit",    icon: ArrowDownTrayIcon, color: "text-green-600 bg-green-50",  sign: "+" },
  WITHDRAWAL:  { label: "Withdrawal", icon: ArrowUpTrayIcon,   color: "text-red-500 bg-red-50",      sign: "-" },
  BET_PLACED:  { label: "Bet placed", icon: TicketIcon,        color: "text-orange-500 bg-orange-50", sign: "-" },
  BET_WON:     { label: "Bet won",    icon: TrophyIcon,        color: "text-green-600 bg-green-50",  sign: "+" },
  BET_REFUND:  { label: "Refund",     icon: ArrowPathIcon,     color: "text-blue-500 bg-blue-50",    sign: "+" },
  BONUS:       { label: "Bonus",      icon: SparklesIcon,      color: "text-purple-500 bg-purple-50", sign: "+" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // "deposit" | "withdraw" | null
  const [mode, setMode] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    Promise.all([
      api.get("/wallet"),
      api.get("/wallet/transactions"),
    ]).then(([w, t]) => {
      setBalance(Number(w.data.balance));
      setTransactions(t.data);
    }).finally(() => setLoading(false));
  }, [token, router]);

  const handleAction = async () => {
    if (!mode || !amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/wallet/${mode}`, { amount: parseFloat(amount) });
      setBalance(Number(res.data.balance));
      // Prepend a synthetic tx so the list updates instantly
      const [txRes] = await Promise.all([api.get("/wallet/transactions")]);
      setTransactions(txRes.data);
      setMode(null);
      setAmount("");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-8">
      {/* ── Balance card ── */}
      <div className="rounded-2xl bg-orange-500 px-6 py-8 text-center text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Available Balance</p>
        <p className="mt-2 text-5xl font-bold tracking-tight">
          ${balance?.toFixed(2) ?? "0.00"}
        </p>
        <p className="mt-1 text-sm opacity-60">AUD</p>
      </div>

      {/* ── Action buttons ── */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => { setMode(mode === "deposit" ? null : "deposit"); setError(null); setAmount(""); }}
          className={[
            "rounded-full py-3 text-sm font-semibold transition-all",
            mode === "deposit"
              ? "bg-orange-500 text-white"
              : "bg-orange-50 text-orange-600 ring-1 ring-orange-200 hover:bg-orange-100",
          ].join(" ")}
        >
          Deposit
        </button>
        <button
          onClick={() => { setMode(mode === "withdraw" ? null : "withdraw"); setError(null); setAmount(""); }}
          className={[
            "rounded-full py-3 text-sm font-semibold transition-all",
            mode === "withdraw"
              ? "bg-gray-900 text-white"
              : "bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100",
          ].join(" ")}
        >
          Withdraw
        </button>
      </div>

      {/* ── Inline amount form ── */}
      {mode && (
        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700 capitalize">{mode} amount</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-lg font-semibold text-gray-900 focus:border-orange-400 focus:outline-none"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleAction}
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="mt-3 w-full rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-orange-400"
          >
            {submitting ? "Processing…" : `Confirm ${mode}`}
          </button>
        </div>
      )}

      {/* ── Transaction history ── */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Transaction history
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const meta = TX_META[tx.type] ?? TX_META.DEPOSIT;
              const Icon = meta.icon;
              const isCredit = meta.sign === "+";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-gray-900"}`}>
                      {meta.sign}${Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">${Number(tx.balanceAfter).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

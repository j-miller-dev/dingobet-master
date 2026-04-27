"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  TicketIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  GiftIcon,
  CheckBadgeIcon,
  XCircleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  BET_SETTLED:         TicketIcon,
  DEPOSIT_COMPLETE:    ArrowDownTrayIcon,
  WITHDRAWAL_COMPLETE: ArrowUpTrayIcon,
  PROMO:               GiftIcon,
  KYC_APPROVED:        CheckBadgeIcon,
  KYC_REJECTED:        XCircleIcon,
};

const TYPE_COLOR: Record<string, string> = {
  BET_SETTLED:         "bg-orange-100 text-orange-600",
  DEPOSIT_COMPLETE:    "bg-green-100 text-green-600",
  WITHDRAWAL_COMPLETE: "bg-blue-100 text-blue-600",
  PROMO:               "bg-purple-100 text-purple-600",
  KYC_APPROVED:        "bg-green-100 text-green-600",
  KYC_REJECTED:        "bg-red-100 text-red-600",
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  const { data } = await api.get("/notifications");
  return data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function markAllRead() {
    await api.post("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="min-h-screen bg-orange-50/40 pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-orange-500 hover:text-orange-600"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="divide-y divide-gray-100">
        {isLoading && (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <BellIcon className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </div>
        )}

        {notifications.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? BellIcon;
          const colorClass = TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-500";

          return (
            <button
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={[
                "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors",
                n.isRead ? "bg-white" : "bg-orange-50/60",
              ].join(" ")}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400">{formatTime(n.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500 leading-snug">{n.message}</p>
              </div>
              {!n.isRead && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

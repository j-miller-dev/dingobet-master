"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { ArrowLeftIcon, BellIcon } from "@heroicons/react/24/outline";
import api from "@/lib/api";

const HIDDEN_ROUTES = ["/login", "/register"];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const balance = useWalletStore((s) => s.balance);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then((r) => r.data),
    enabled: !!user,
  });
  const unreadCount: number = notifData?.unreadCount ?? 0;

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  const showBack = pathname.startsWith("/sport/") || pathname.startsWith("/event/");

  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo ↔ Back arrow crossfade */}
        <div className="relative flex h-8 min-w-[100px] items-center">
          <Link
            href="/"
            aria-hidden={showBack}
            className={[
              "absolute whitespace-nowrap text-xl font-bold text-orange-600 transition-all duration-200 ease-in-out",
              showBack ? "pointer-events-none -translate-x-2 opacity-0" : "translate-x-0 opacity-100",
            ].join(" ")}
          >
            DingoBet
          </Link>
          <button
            onClick={() => router.back()}
            aria-hidden={!showBack}
            className={[
              "absolute flex items-center gap-1.5 text-orange-600 transition-all duration-200 ease-in-out",
              showBack ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0",
            ].join(" ")}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">Back</span>
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {/* Bell */}
            <Link href="/notifications" className="relative">
              <BellIcon className="h-6 w-6 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Wallet balance */}
            <Link
              href="/wallet"
              className="rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 ring-1 ring-orange-200 transition-colors hover:bg-orange-100"
            >
              {balance === null ? "···" : `$${balance.toFixed(2)}`}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const HIDDEN_ROUTES = ["/login", "/register"];
const POLL_MS = 30_000; // refresh balance every 30 s

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchBalance = () =>
      api.get("/wallet").then((r) => setBalance(Number(r.data.balance)));

    fetchBalance();
    const id = setInterval(fetchBalance, POLL_MS);
    return () => clearInterval(id);
  }, [token]);

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  const showBack = pathname.startsWith("/sport/");

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
          <Link
            href="/wallet"
            className="rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 ring-1 ring-orange-200 transition-colors hover:bg-orange-100"
          >
            {balance === null ? "···" : `$${balance.toFixed(2)}`}
          </Link>
        )}
      </div>
    </nav>
  );
}

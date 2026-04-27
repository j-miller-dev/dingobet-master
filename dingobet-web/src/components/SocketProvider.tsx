"use client";

import { useEffect, useState, useCallback } from "react";
import { Transition } from "@headlessui/react";
import { TrophyIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { getSocket } from "@/lib/socket";

//  You're building a React context provider that wraps a
//   singleton Socket.IO client (socket.ts) so components across the app can share a single
//  real-time WebSocket connection.

interface SettledPayload {
  betId: string;
  status: "WON" | "LOST" | "VOID";
  payout: number;
}

interface SettledToast {
  status: "WON" | "LOST" | "VOID";
  payout: number;
}

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const { setBalance, fetchBalance } = useWalletStore();
  const [toast, setToast] = useState<SettledToast | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  // auto dismiss after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4000);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket();

    // attach token before connecting
    socket.auth = { token };
    socket.connect();

    // Fetch initial balance once connected
    socket.once("connect", () => fetchBalance());
    socket.on("wallet:updated", (data: { balance: number }) => {
      setBalance(data.balance);
    });
    socket.on("bet:settled", (data: SettledPayload) => {
      setToast({ status: data.status, payout: data.payout });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => {
      socket.off("wallet:updated");
      socket.off("bet:settled");
      socket.disconnect();
    };
  }, [token, setBalance, fetchBalance]);


  const toastStyles: Record<string, string> = {
    WON: "text-green-600",
    LOST: "text-gray-500",
    VOID: "text-orange-500",
  };
  const toastMessages: Record<string, { title: string; body: (p: number) => string }> = {
    WON:  { title: "Bet won! 🎉",  body: (p) => `$${p.toFixed(2)} has been added to your wallet.` },
    LOST: { title: "Bet settled",   body: () => "Better luck next time!" },
    VOID: { title: "Bet voided",    body: (p) => p > 0 ? `$${p.toFixed(2)} refunded to your wallet.` : "Your stake has been refunded." },
  };
  return (
    <>
      {children}
      {/* ── Bet settled toast ── */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <Transition show={!!toast}>
          <div className="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-closed:data-enter:scale-95 data-leave:duration-150 data-leave:ease-in">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <TrophyIcon className={`size-6 shrink-0 ${toastStyles[toast?.status ?? "LOST"]}`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${toastStyles[toast?.status ?? "LOST"]}`}>
                    {toast ? toastMessages[toast.status].title : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {toast ? toastMessages[toast.status].body(toast.payout) : ""}
                  </p>
                </div>
                <button onClick={dismissToast} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </>
  );
}


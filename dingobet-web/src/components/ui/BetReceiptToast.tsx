"use client";

import { useEffect } from "react";
import { Transition } from "@headlessui/react";
import { TicketIcon } from "@heroicons/react/24/outline";

export interface BetReceiptData {
  id: string;
  placedAt: string;
  stake: number;
  totalOdds: number;
  potentialPayout: number;
  /** Number of singles placed in one go */
  count?: number;
}

interface Props {
  receipt: BetReceiptData | null;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 3000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BetReceiptToast({ receipt, onClose }: Props) {
  const show = receipt !== null;

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <div className="pointer-events-none fixed bottom-[68px] left-0 right-0 z-50 px-3 pb-2">
      <Transition show={show}>
        <div className="pointer-events-auto w-full rounded-xl bg-gray-900 shadow-xl ring-1 ring-white/5 transition data-closed:translate-y-3 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-150 data-leave:ease-in">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
              <TicketIcon className="h-4 w-4 text-orange-400" />
            </div>
            {receipt && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">
                    Ref{" "}
                    <span className="font-mono font-semibold text-white">
                      #{receipt.id.slice(-8).toUpperCase()}
                    </span>
                    {receipt.count && receipt.count > 1 && (
                      <span className="ml-1.5 text-orange-400">
                        ×{receipt.count}
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-xs text-gray-500">
                    {formatTime(receipt.placedAt)}
                  </p>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  <span className="text-gray-400">
                    Stake{" "}
                    <span className="font-semibold text-gray-200">
                      ${receipt.stake.toFixed(2)}
                    </span>
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="font-semibold text-orange-400">
                    {receipt.totalOdds.toFixed(2)}×
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="text-gray-400">
                    Win{" "}
                    <span className="font-semibold text-green-400">
                      ${receipt.potentialPayout.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
}

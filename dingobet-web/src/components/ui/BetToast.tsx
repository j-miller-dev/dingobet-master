"use client";

import { useEffect } from "react";
import { Transition } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";

const AUTO_DISMISS_MS = 3000;

interface BetToastProps {
  show: boolean;
  onClose: () => void;
}

export default function BetToast({ show, onClose }: BetToastProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed left-0 right-0 top-14 z-50 px-3"
    >
      <Transition show={show}>
        <div className="pointer-events-auto w-full rounded-xl bg-white shadow-lg ring-1 ring-black/5 transition data-closed:-translate-y-2 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in">
          <div className="flex items-center gap-3 px-4 py-3">
            <CheckCircleIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Bet placed!</p>
              <p className="text-xs text-gray-500">Successfully placed. Good luck!</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </Transition>
    </div>
  );
}

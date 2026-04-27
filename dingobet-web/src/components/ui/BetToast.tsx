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
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      <Transition show={show}>
        <div className="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-closed:data-enter:scale-95 data-leave:duration-150 data-leave:ease-in">
          <div className="p-4">
            <div className="flex items-start">
              <div className="shrink-0">
                <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">Bet placed!</p>
                <p className="mt-1 text-sm text-gray-500">Your bet has been successfully placed. Good luck!</p>
              </div>
              <div className="ml-4 flex shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-orange-500"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

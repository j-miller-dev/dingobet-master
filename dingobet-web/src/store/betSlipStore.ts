// 1. Bet slip store (Zustand) — holds the selected outcome globally so any component can read/write it
"use client";

import { create } from "zustand";

interface BetSlipSelection {
  eventId: string;
  bookmaker: string;
  market: string;
  selection: string;
  price: number;
  label: string; // e.g. "Melbourne Victory vs Sydney FC"
}

interface BetSlipState {
  selections: BetSlipSelection[];
  stake: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addSelection: (s: BetSlipSelection) => void;
  removeSelection: (eventId: string) => void;
  setStake: (stake: string) => void;
  clear: () => void;
}

export const useBetSlipStore = create<BetSlipState>((set) => ({
  selections: [],
  stake: "",
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  addSelection: (s) =>
    set((state) => {
      const filtered = state.selections.filter((x) => x.eventId !== s.eventId);
      return { selections: [...filtered, s], isOpen: true };
    }),
  removeSelection: (eventId) =>
    set((state) => ({
      selections: state.selections.filter((x) => x.eventId !== eventId),
    })),
  setStake: (stake) => set({ stake }),
  clear: () => set({ selections: [], stake: "", isOpen: false }),
}));

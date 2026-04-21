// 1. Bet slip store (Zustand) — holds the selected outcome globally so any component can read/write it

import { create } from "zustand";

interface Selection {
  eventId: string;
  bookmaker: string;
  market: string;
  selection: string;
  price: number;
  label: string; // e.g. "Melbourne Victory vs Sydney FC"
}

interface BetSlipState {
  selection: Selection | null;
  stake: string;
  setSelection: (s: Selection | null) => void;
  setStake: (stake: string) => void;
  clear: () => void;
}

export const useBetSlipStore = create<BetSlipState>((set) => ({
  selection: null,
  stake: "",
  setSelection: (selection) => set({ selection, stake: "" }),
  setStake: (stake) => set({ stake }),
  clear: () => set({ selection: null, stake: "" }),
}));

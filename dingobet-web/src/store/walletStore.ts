import { create } from "zustand";
import api from "@/lib/api";

interface WalletState {
  balance: number | null;
  setBalance: (balance: number) => void;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
  fetchBalance: async () => {
    const { data } = await api.get("/wallet");
    set({ balance: Number(data.balance) });
  },
}));

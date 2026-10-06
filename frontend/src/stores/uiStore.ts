import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Banner, BankTab, Dialogue, DialogueAction, LoanMode, NpcId, PanelId, SectorId, ShopFocus } from "@/types";

export type TipId = "first-harvest" | "storm-warning";

interface UiState {
  panel: PanelId | null;
  shopFocus: ShopFocus;
  bankTab: BankTab;
  loanMode: LoanMode;
  selectedSector: SectorId | null;
  dialogue: Dialogue | null;
  banner: Banner | null;
  seenTips: TipId[];
  openShop: (focus?: ShopFocus) => void;
  openBank: (tab?: BankTab, loanMode?: LoanMode) => void;
  openDistrict: (sector: SectorId) => void;
  openInfo: () => void;
  closePanel: () => void;
  say: (npc: NpcId, text: string, actions?: DialogueAction[]) => void;
  dismissDialogue: () => void;
  showBanner: (text: string) => void;
  clearBanner: (id: number) => void;
  markTipSeen: (tip: TipId) => boolean;
}

let sequence = 0;
const nextId = (): number => {
  sequence += 1;
  return sequence;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      panel: null,
      shopFocus: {},
      bankTab: "collateral",
      loanMode: "borrow",
      selectedSector: null,
      dialogue: null,
      banner: null,
      seenTips: [],
      openShop: (focus = {}) => set({ panel: "shop", shopFocus: focus }),
      openBank: (tab = "collateral", loanMode = "borrow") => set({ panel: "bank", bankTab: tab, loanMode }),
      openDistrict: (sector) => set({ panel: "district", selectedSector: sector }),
      openInfo: () => set({ panel: "info" }),
      closePanel: () => set({ panel: null }),
      say: (npc, text, actions = []) => set({ dialogue: { id: nextId(), npc, text, actions } }),
      dismissDialogue: () => set({ dialogue: null }),
      showBanner: (text) => set({ banner: { id: nextId(), text } }),
      clearBanner: (id) => {
        if (get().banner?.id === id) set({ banner: null });
      },
      markTipSeen: (tip) => {
        if (get().seenTips.includes(tip)) return false;
        set({ seenTips: [...get().seenTips, tip] });
        return true;
      },
    }),
    { name: "vestopia.ui", partialize: (state) => ({ seenTips: state.seenTips }) },
  ),
);

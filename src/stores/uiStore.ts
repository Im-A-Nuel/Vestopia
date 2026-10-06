import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Banner, BankTab, Dialogue, NpcId, PanelId, SectorId, ShopFocus } from "@/types";

export type TipId = "first-harvest" | "storm-warning";

interface UiState {
  panel: PanelId | null;
  shopFocus: ShopFocus;
  bankTab: BankTab;
  selectedSector: SectorId | null;
  dialogue: Dialogue | null;
  banner: Banner | null;
  seenTips: TipId[];
  openShop: (focus?: ShopFocus) => void;
  openBank: (tab?: BankTab) => void;
  openDistrict: (sector: SectorId) => void;
  openInfo: () => void;
  closePanel: () => void;
  say: (npc: NpcId, text: string) => void;
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
      selectedSector: null,
      dialogue: null,
      banner: null,
      seenTips: [],
      openShop: (focus = {}) => set({ panel: "shop", shopFocus: focus }),
      openBank: (tab = "collateral") => set({ panel: "bank", bankTab: tab }),
      openDistrict: (sector) => set({ panel: "district", selectedSector: sector }),
      openInfo: () => set({ panel: "info" }),
      closePanel: () => set({ panel: null }),
      say: (npc, text) => set({ dialogue: { id: nextId(), npc, text } }),
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

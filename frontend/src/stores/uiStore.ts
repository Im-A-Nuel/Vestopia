import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Banner,
  DayTheme,
  QuestId,
  BankTab,
  Dialogue,
  DialogueAction,
  LoanMode,
  NpcId,
  PanelId,
  SectorId,
  ShopFocus,
  ZoomAction,
  ZoomRequest,
} from "@/types";

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
  zoomRequest: ZoomRequest | null;
  theme: DayTheme;
  quests: QuestId[];
  questsOpen: boolean;
  completeQuest: (id: QuestId) => boolean;
  setQuestsOpen: (open: boolean) => void;
  resetProgress: () => void;
  toggleTheme: () => void;
  requestZoom: (action: ZoomAction) => void;
  openShop: (focus?: ShopFocus) => void;
  openBank: (tab?: BankTab, loanMode?: LoanMode) => void;
  openDistrict: (sector: SectorId) => void;
  openInfo: () => void;
  closePanel: () => void;
  say: (npc: NpcId, text: string, actions?: DialogueAction[], persistent?: boolean) => void;
  dismissDialogue: () => void;
  showBanner: (text: string, sector?: SectorId) => void;
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
      zoomRequest: null,
      theme: "day",
      quests: [],
      questsOpen: true,
      completeQuest: (id) => {
        if (get().quests.includes(id)) return false;
        set({ quests: [...get().quests, id] });
        return true;
      },
      setQuestsOpen: (open) => set({ questsOpen: open }),
      resetProgress: () => set({ quests: [], questsOpen: true, seenTips: [] }),
      toggleTheme: () => set({ theme: get().theme === "day" ? "night" : "day" }),
      requestZoom: (action) => set({ zoomRequest: { id: nextId(), action } }),
      openShop: (focus = {}) => set({ panel: "shop", shopFocus: focus }),
      openBank: (tab = "collateral", loanMode = "borrow") => set({ panel: "bank", bankTab: tab, loanMode }),
      openDistrict: (sector) => set({ panel: "district", selectedSector: sector }),
      openInfo: () => set({ panel: "info" }),
      closePanel: () => set({ panel: null }),
      say: (npc, text, actions = [], persistent = actions.length > 0) =>
        set({ dialogue: { id: nextId(), npc, text, actions, persistent } }),
      dismissDialogue: () => set({ dialogue: null }),
      showBanner: (text, sector) => set({ banner: { id: nextId(), text, sector } }),
      clearBanner: (id) => {
        if (get().banner?.id === id) set({ banner: null });
      },
      markTipSeen: (tip) => {
        if (get().seenTips.includes(tip)) return false;
        set({ seenTips: [...get().seenTips, tip] });
        return true;
      },
    }),
    {
      name: "vestopia.ui",
      partialize: (state) => ({
        seenTips: state.seenTips,
        theme: state.theme,
        quests: state.quests,
        questsOpen: state.questsOpen,
      }),
    },
  ),
);

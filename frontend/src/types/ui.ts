import type { NpcId, PlayerView, SectorId, StockId } from "./game";

export type PanelId = "shop" | "bank" | "district" | "info";

export type BankTab = "collateral" | "loan";

export interface ShopFocus {
  stockId?: StockId;
  sector?: SectorId;
}

export type DialogueActionKind = "repay" | "collateral";

export interface DialogueAction {
  kind: DialogueActionKind;
  label: string;
}

export interface Dialogue {
  id: number;
  npc: NpcId;
  text: string;
  actions: DialogueAction[];
}

export type TradeMode = "buy" | "sell";

export type SectorFilter = SectorId | "all";

export type CollateralMode = "deposit" | "withdraw";

export type LoanMode = "borrow" | "repay";

export type ConnectionStatus = "online" | "reconnecting";

export interface Banner {
  id: number;
  text: string;
}

export interface VillageBridge {
  fontFamily: string;
  getPlayer: () => PlayerView | null;
  subscribe: (listener: (next: PlayerView, previous: PlayerView | null) => void) => () => void;
  openDistrict: (sector: SectorId) => void;
  openShop: (focus: ShopFocus) => void;
  openBank: () => void;
  harvest: (stockId: StockId) => void;
  reportError: () => void;
}

export interface ActivityEntry {
  id: number;
  message: string;
  at: number;
}

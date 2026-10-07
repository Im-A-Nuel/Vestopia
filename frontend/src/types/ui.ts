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
  persistent: boolean;
}

export type TradeMode = "buy" | "sell";

export type SectorFilter = SectorId | "all";

export type ShopSort = "district" | "price-high" | "price-low" | "dividend" | "change";

export type CollateralMode = "deposit" | "withdraw";

export type LoanMode = "borrow" | "repay";

export type ZoomAction = "in" | "out" | "reset";

export interface ZoomRequest {
  id: number;
  action: ZoomAction;
}

export type QuestId = "first-shares" | "unlock-district" | "collateral" | "borrow" | "harvest";

export interface QuestConfig {
  id: QuestId;
  title: string;
  hint: string;
}

export type DayTheme = "day" | "night";

export interface MapTree {
  x: number;
  y: number;
  scale: number;
  variant: number;
}

export type ConnectionStatus = "online" | "reconnecting";

export interface Banner {
  id: number;
  text: string;
  sector?: SectorId;
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
  subscribeZoom: (listener: (action: ZoomAction) => void) => () => void;
  getTheme: () => DayTheme;
  subscribeTheme: (listener: (theme: DayTheme) => void) => () => void;
}

export interface ActivityEntry {
  id: number;
  message: string;
  at: number;
}

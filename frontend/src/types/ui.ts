import type { NpcId, PlayerView, SectorId, StockId } from "./game";

export type PanelId = "shop" | "bank" | "district" | "info";

export type BankTab = "collateral" | "loan";

export interface ShopFocus {
  stockId?: StockId;
  sector?: SectorId;
}

export interface Dialogue {
  id: number;
  npc: NpcId;
  text: string;
}

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
}

export interface ActivityEntry {
  id: number;
  message: string;
  at: number;
}

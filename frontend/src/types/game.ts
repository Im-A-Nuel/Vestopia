export type SectorId = "tech" | "commodity" | "consumer" | "agri";

export type StockId = "aapl" | "nvda" | "nem" | "xom" | "ko" | "pg" | "de" | "adm";

export type WeatherState = "sunny" | "cloudy" | "stormy";

export type LotLevel = 0 | 1 | 2 | 3;

export type HarvestKind = "chip" | "gold-cart" | "oil-barrel" | "goods-crate" | "harvest-basket";

export type NpcId = "guide" | "merchant" | "banker";

export interface StockConfig {
  id: StockId;
  ticker: string;
  token: string;
  name: string;
  sector: SectorId;
  basePrice: number;
  dividendRate: number;
  harvest: HarvestKind;
}

export interface SectorConfig {
  id: SectorId;
  district: string;
  label: string;
  lockedHint: string;
  lore: string;
  center: { x: number; y: number };
}

export interface StockView {
  id: StockId;
  price: number;
  previousPrice: number;
  walletShares: number;
  collateralShares: number;
  value: number;
  collateralValue: number;
  level: LotLevel;
  pendingHarvest: number;
}

export interface SectorView {
  id: SectorId;
  value: number;
  unlocked: boolean;
}

export interface PlayerView {
  koin: number;
  debt: number;
  healthFactor: number;
  borrowLimit: number;
  borrowable: number;
  collateralValue: number;
  portfolioValue: number;
  weather: WeatherState;
  starterClaimed: boolean;
  totalPendingHarvest: number;
  stocks: StockView[];
  sectors: SectorView[];
}

export type StockLedger = Record<StockId, number>;

export interface PlayerLedger {
  starterClaimed: boolean;
  koin: number;
  shares: StockLedger;
  collateral: StockLedger;
  pending: StockLedger;
  debt: number;
}

export interface MarketSnapshot {
  prices: StockLedger;
  previousPrices: StockLedger;
}

export type GameChange =
  | { type: "price"; stockId: StockId; percent: number }
  | { type: "value"; stockId: StockId; delta: number }
  | { type: "level"; stockId: StockId; from: LotLevel; to: LotLevel }
  | { type: "lot-filled"; stockId: StockId }
  | { type: "lot-emptied"; stockId: StockId }
  | { type: "unlock"; sector: SectorId }
  | { type: "relock"; sector: SectorId }
  | { type: "weather"; from: WeatherState; to: WeatherState }
  | { type: "harvest-ready"; stockId: StockId; amount: number }
  | { type: "harvest-collected"; stockId: StockId; amount: number }
  | { type: "collateral"; stockId: StockId; locked: boolean }
  | { type: "koin"; delta: number }
  | { type: "debt"; delta: number };

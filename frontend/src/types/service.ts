import type { MarketSnapshot, PlayerView, SectorId, StockId } from "./game";

export type Amount = number | "max";

export type ActionStatus = "success" | "error";

export type ActionErrorCode =
  | "invalid_amount"
  | "insufficient_koin"
  | "insufficient_shares"
  | "exceeds_borrow_limit"
  | "unsafe_withdraw"
  | "already_claimed"
  | "nothing_to_harvest"
  | "unknown_stock"
  | "passkey_unsupported"
  | "unauthorized"
  | "unknown";

export interface ActionResult {
  status: ActionStatus;
  message: string;
  code?: ActionErrorCode;
}

export type MarketEventId = "tech_boom" | "gold_crash" | "drought" | "holiday_sale" | "reset" | "harvest_day";

export interface MarketEventPreset {
  id: MarketEventId;
  title: string;
  banner: string;
  sector?: SectorId;
  priceMultipliers: Partial<Record<StockId, number>>;
  resetsPrices: boolean;
  paysDividends: boolean;
}

export interface LatestEvent {
  id: MarketEventId;
  banner: string;
  triggeredAt: number;
  sequence: number;
}

export interface GameService {
  getPlayer(address: string): Promise<PlayerView>;
  claimStarter(address: string): Promise<ActionResult>;
  buy(address: string, stockId: StockId, koinAmount: number): Promise<ActionResult>;
  sell(address: string, stockId: StockId, koinAmount: Amount): Promise<ActionResult>;
  deposit(address: string, stockId: StockId, koinAmount: Amount): Promise<ActionResult>;
  withdraw(address: string, stockId: StockId, koinAmount: Amount): Promise<ActionResult>;
  borrow(address: string, koinAmount: number): Promise<ActionResult>;
  repay(address: string, koinAmount: Amount): Promise<ActionResult>;
  harvest(address: string, stockId: StockId): Promise<ActionResult>;
  harvestAll(address: string): Promise<ActionResult>;
  triggerEvent(eventId: MarketEventId): Promise<ActionResult>;
  getLatestEvent(): Promise<LatestEvent | null>;
  getEventLog(): Promise<LatestEvent[]>;
  getMarket(): Promise<MarketSnapshot>;
  resetDemo(): Promise<ActionResult>;
}

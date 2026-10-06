import { STOCKS } from "@/config";
import type { MarketSnapshot, PlayerLedger, StockId, StockLedger } from "@/types";

export const createStockLedger = (initial: (stockId: StockId) => number): StockLedger =>
  STOCKS.reduce((ledger, stock) => ({ ...ledger, [stock.id]: initial(stock.id) }), {} as StockLedger);

export const createPlayerLedger = (): PlayerLedger => ({
  starterClaimed: false,
  koin: 0,
  shares: createStockLedger(() => 0),
  collateral: createStockLedger(() => 0),
  pending: createStockLedger(() => 0),
  costBasis: createStockLedger(() => 0),
  debt: 0,
});

export const createMarketSnapshot = (): MarketSnapshot => {
  const prices = createStockLedger((id) => STOCKS.find((stock) => stock.id === id)?.basePrice ?? 0);
  return { prices, previousPrices: { ...prices } };
};

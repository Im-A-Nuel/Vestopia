import { SECTORS, STOCKS, getStock } from "@/config";
import type { MarketSnapshot, PlayerLedger, PlayerView, SectorView, StockView } from "@/types";
import { getLotLevel, isSectorUnlocked } from "./level";
import { getBorrowLimit, getHealthFactor, getWeather } from "./loan";

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export const buildPlayerView = (ledger: PlayerLedger, market: MarketSnapshot): PlayerView => {
  const stocks: StockView[] = STOCKS.map((stock) => {
    const price = market.prices[stock.id];
    const walletShares = ledger.shares[stock.id];
    const collateralShares = ledger.collateral[stock.id];
    const value = (walletShares + collateralShares) * price;
    return {
      id: stock.id,
      price,
      previousPrice: market.previousPrices[stock.id],
      walletShares,
      collateralShares,
      value,
      collateralValue: collateralShares * price,
      level: getLotLevel(value),
      pendingHarvest: ledger.pending[stock.id],
    };
  });

  const sectors: SectorView[] = SECTORS.map((sector) => {
    const value = sum(stocks.filter((stock) => getStock(stock.id).sector === sector.id).map((stock) => stock.value));
    return { id: sector.id, value, unlocked: isSectorUnlocked(value) };
  });

  const collateralValue = sum(stocks.map((stock) => stock.collateralValue));
  const healthFactor = getHealthFactor(collateralValue, ledger.debt);
  const borrowLimit = getBorrowLimit(collateralValue);

  return {
    koin: ledger.koin,
    debt: ledger.debt,
    healthFactor,
    borrowLimit,
    borrowable: Math.max(0, borrowLimit - ledger.debt),
    collateralValue,
    portfolioValue: sum(stocks.map((stock) => stock.value)),
    weather: getWeather(healthFactor),
    starterClaimed: ledger.starterClaimed,
    totalPendingHarvest: sum(stocks.map((stock) => stock.pendingHarvest)),
    stocks,
    sectors,
  };
};

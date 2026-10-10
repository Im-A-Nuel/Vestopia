import { STOCKS } from "@/config";
import type {
  LotLevel,
  MarketSnapshot,
  PlayerView,
  SectorId,
  SectorView,
  StockId,
  StockView,
  WeatherState,
} from "@/types";
import { healthToNumber, koinToNumber, priceToNumber, sharesToNumber } from "./units";

export interface LensStockRaw {
  token: string;
  ticker: string;
  sector: number | bigint;
  price: bigint;
  previousPrice: bigint;
  walletBal: bigint;
  collateralBal: bigint;
  value: bigint;
  collateralValue: bigint;
  level: number | bigint;
  pendingHarvest: bigint;
  costBasis: bigint;
}

export interface LensSectorRaw {
  value: bigint;
  unlocked: boolean;
}

export interface LensPlayerRaw {
  koin: bigint;
  debt: bigint;
  healthFactor: bigint;
  weather: number | bigint;
  starterClaimed: boolean;
  totalPendingHarvest: bigint;
  collateralValue: bigint;
  borrowLimit: bigint;
  borrowable: bigint;
  portfolioValue: bigint;
  stocks: readonly LensStockRaw[];
  sectors: readonly LensSectorRaw[];
}

/** Contract sector ids (contracts/config/stocks.json order). */
export const SECTOR_BY_INDEX: readonly SectorId[] = ["tech", "media", "retail", "consumer", "agri", "commodity"];

const WEATHER_BY_INDEX: readonly WeatherState[] = ["sunny", "cloudy", "stormy"];

export const toWeather = (value: number | bigint): WeatherState => WEATHER_BY_INDEX[Number(value)] ?? "stormy";

const toLevel = (value: number | bigint): LotLevel => Math.min(3, Math.max(0, Number(value))) as LotLevel;

const emptyStock = (id: StockId, basePrice: number): StockView => ({
  id,
  price: basePrice,
  previousPrice: basePrice,
  walletShares: 0,
  collateralShares: 0,
  value: 0,
  collateralValue: 0,
  costBasis: 0,
  level: 0,
  pendingHarvest: 0,
});

const mapStock = (id: StockId, raw: LensStockRaw): StockView => {
  const price = priceToNumber(raw.price);
  const previous = priceToNumber(raw.previousPrice);
  return {
    id,
    price,
    previousPrice: previous > 0 ? previous : price,
    walletShares: sharesToNumber(raw.walletBal),
    collateralShares: sharesToNumber(raw.collateralBal),
    value: koinToNumber(raw.value),
    collateralValue: koinToNumber(raw.collateralValue),
    costBasis: koinToNumber(raw.costBasis),
    level: toLevel(raw.level),
    pendingHarvest: koinToNumber(raw.pendingHarvest),
  };
};

/** Matches Lens stocks to frontend stocks by `ticker.toLowerCase()`; stocks Lens does not list stay empty. */
export const mapLensStocks = (raw: readonly LensStockRaw[]): StockView[] => {
  const byId = new Map(raw.map((item) => [item.ticker.toLowerCase(), item]));
  return STOCKS.map((stock) => {
    const item = byId.get(stock.id);
    return item ? mapStock(stock.id, item) : emptyStock(stock.id, stock.basePrice);
  });
};

export const mapLensPlayer = (raw: LensPlayerRaw): PlayerView => {
  const stocks = mapLensStocks(raw.stocks);
  const sectors: SectorView[] = SECTOR_BY_INDEX.map((id, index) => {
    const item = raw.sectors[index];
    return { id, value: item ? koinToNumber(item.value) : 0, unlocked: item?.unlocked ?? false };
  });
  return {
    koin: koinToNumber(raw.koin),
    debt: koinToNumber(raw.debt),
    healthFactor: healthToNumber(raw.healthFactor),
    borrowLimit: koinToNumber(raw.borrowLimit),
    borrowable: koinToNumber(raw.borrowable),
    collateralValue: koinToNumber(raw.collateralValue),
    portfolioValue: koinToNumber(raw.portfolioValue),
    weather: toWeather(raw.weather),
    starterClaimed: raw.starterClaimed,
    totalPendingHarvest: koinToNumber(raw.totalPendingHarvest),
    stocks,
    sectors,
  };
};

export const lensToMarket = (raw: LensPlayerRaw): MarketSnapshot => {
  const stocks = mapLensStocks(raw.stocks);
  const prices = {} as MarketSnapshot["prices"];
  const previousPrices = {} as MarketSnapshot["previousPrices"];
  stocks.forEach((stock) => {
    prices[stock.id] = stock.price;
    previousPrices[stock.id] = stock.previousPrice;
  });
  return { prices, previousPrices };
};

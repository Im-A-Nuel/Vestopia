import type { StockConfig, StockId } from "@/types";

export const STOCKS: readonly StockConfig[] = [
  { id: "aapl", ticker: "AAPL", token: "sAAPL", name: "Apple", sector: "tech", basePrice: 230, dividendRate: 0.01, harvest: "chip" },
  { id: "nvda", ticker: "NVDA", token: "sNVDA", name: "Nvidia", sector: "tech", basePrice: 140, dividendRate: 0.005, harvest: "chip" },
  { id: "nem", ticker: "NEM", token: "sNEM", name: "Newmont", sector: "commodity", basePrice: 55, dividendRate: 0.04, harvest: "gold-cart" },
  { id: "xom", ticker: "XOM", token: "sXOM", name: "Exxon Mobil", sector: "commodity", basePrice: 115, dividendRate: 0.05, harvest: "oil-barrel" },
  { id: "ko", ticker: "KO", token: "sKO", name: "Coca-Cola", sector: "consumer", basePrice: 70, dividendRate: 0.05, harvest: "goods-crate" },
  { id: "pg", ticker: "PG", token: "sPG", name: "Procter & Gamble", sector: "consumer", basePrice: 165, dividendRate: 0.04, harvest: "goods-crate" },
  { id: "de", ticker: "DE", token: "sDE", name: "John Deere", sector: "agri", basePrice: 480, dividendRate: 0.04, harvest: "harvest-basket" },
  { id: "adm", ticker: "ADM", token: "sADM", name: "Archer-Daniels-Midland", sector: "agri", basePrice: 52, dividendRate: 0.05, harvest: "harvest-basket" },
];

export const STOCK_IDS: readonly StockId[] = STOCKS.map((stock) => stock.id);

export const getStock = (id: StockId): StockConfig => {
  const stock = STOCKS.find((item) => item.id === id);
  if (!stock) {
    throw new Error(`Unknown stock: ${id}`);
  }
  return stock;
};

export const getStocksBySector = (sector: StockConfig["sector"]): StockConfig[] =>
  STOCKS.filter((stock) => stock.sector === sector);

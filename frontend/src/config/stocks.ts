import type { ArtworkFormat, HarvestKind, SectorId, StockConfig, StockId } from "@/types";

type StockRow = [StockId, string, string, SectorId, number, number, HarvestKind, ArtworkFormat];

const ROWS: readonly StockRow[] = [
  ["aapl", "AAPL", "Apple", "tech", 230, 0.01, "chip", "png"],
  ["nvda", "NVDA", "Nvidia", "tech", 140, 0.005, "chip", "png"],
  ["msft", "MSFT", "Microsoft", "tech", 430, 0.008, "chip", "png"],
  ["amd", "AMD", "AMD", "tech", 160, 0, "chip", "svg"],
  ["avgo", "AVGO", "Broadcom", "tech", 170, 0.013, "chip", "svg"],
  ["intc", "INTC", "Intel", "tech", 22, 0.02, "chip", "svg"],
  ["csco", "CSCO", "Cisco", "tech", 55, 0.03, "chip", "png"],
  ["nem", "NEM", "Newmont", "commodity", 55, 0.04, "gold-cart", "svg"],
  ["xom", "XOM", "Exxon Mobil", "commodity", 115, 0.05, "oil-barrel", "svg"],
  ["cat", "CAT", "Caterpillar", "commodity", 360, 0.016, "gold-cart", "png"],
  ["ko", "KO", "Coca-Cola", "consumer", 70, 0.05, "goods-crate", "png"],
  ["pg", "PG", "Procter & Gamble", "consumer", 165, 0.04, "goods-crate", "svg"],
  ["wmt", "WMT", "Walmart", "consumer", 80, 0.012, "goods-crate", "png"],
  ["cost", "COST", "Costco", "consumer", 900, 0.006, "goods-crate", "png"],
  ["de", "DE", "John Deere", "agri", 480, 0.04, "harvest-basket", "svg"],
  ["adm", "ADM", "Archer-Daniels-Midland", "agri", 52, 0.05, "harvest-basket", "svg"],
  ["amzn", "AMZN", "Amazon", "retail", 190, 0, "goods-crate", "png"],
  ["ebay", "EBAY", "eBay", "retail", 60, 0.018, "goods-crate", "png"],
  ["gme", "GME", "GameStop", "retail", 25, 0, "goods-crate", "png"],
  ["hd", "HD", "Home Depot", "retail", 380, 0.025, "goods-crate", "png"],
  ["mcd", "MCD", "McDonald's", "retail", 290, 0.024, "goods-crate", "png"],
  ["nke", "NKE", "Nike", "retail", 75, 0.02, "goods-crate", "png"],
  ["sbux", "SBUX", "Starbucks", "retail", 95, 0.025, "goods-crate", "png"],
  ["tsla", "TSLA", "Tesla", "retail", 250, 0, "goods-crate", "png"],
  ["dis", "DIS", "Disney", "media", 100, 0.01, "chip", "png"],
  ["googl", "GOOGL", "Alphabet", "media", 165, 0.005, "chip", "png"],
  ["meta", "META", "Meta", "media", 560, 0.004, "chip", "png"],
  ["nflx", "NFLX", "Netflix", "media", 700, 0, "chip", "png"],
  ["rddt", "RDDT", "Reddit", "media", 120, 0, "chip", "png"],
  ["spot", "SPOT", "Spotify", "media", 450, 0, "chip", "png"],
  ["vz", "VZ", "Verizon", "media", 41, 0.065, "chip", "png"],
];

export const STOCKS: readonly StockConfig[] = ROWS.map(
  ([id, ticker, name, sector, basePrice, dividendRate, harvest, artwork]) => ({
    id,
    ticker,
    token: `s${ticker}`,
    name,
    sector,
    basePrice,
    dividendRate,
    harvest,
    artwork,
  }),
);

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

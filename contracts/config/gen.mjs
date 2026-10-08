// Regenerates stocks.json + prices.json from frontend/src/config/stocks.ts (rows) and sectors.ts (order).
// Usage: node config/gen.mjs
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync(new URL("../../frontend/src/config/stocks.ts", import.meta.url), "utf8");
const secSrc = readFileSync(new URL("../../frontend/src/config/sectors.ts", import.meta.url), "utf8");
const sectors = [...secSrc.matchAll(/^\s+id: "(\w+)",/gm)].map((m) => m[1]);
const rows = [...src.matchAll(/^\s+\["(\w+)", "(\w+)", "([^"]+)", "(\w+)", ([\d.]+), ([\d.]+),/gm)];
const stocks = rows.map(([, id, ticker, name, sector, price, div]) => ({
  id, ticker, name, symbol: `s${ticker}`, sector: sectors.indexOf(sector), sectorId: sector,
  basePrice: Number(price), dividendRateBps: Math.round(Number(div) * 10000),
}));
const prices = Object.fromEntries(stocks.map((s) => [s.ticker, Math.round(s.basePrice * 1e8)]));
writeFileSync(new URL("./stocks.json", import.meta.url), JSON.stringify({ sectors, stocks }, null, 2) + "\n");
writeFileSync(new URL("./prices.json", import.meta.url), JSON.stringify(prices, null, 2) + "\n");
console.log(stocks.length, "stocks,", sectors.length, "sectors");

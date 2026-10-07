import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ASSETS, LAYOUT, MARKET_EVENTS, SECTORS, STOCKS, getStocksBySector } from "@/config";

const publicFile = (url: string): string => join(process.cwd(), "public", url);

describe("stock roster", () => {
  it("uses unique ids and tickers", () => {
    expect(new Set(STOCKS.map((stock) => stock.id)).size).toBe(STOCKS.length);
    expect(new Set(STOCKS.map((stock) => stock.ticker)).size).toBe(STOCKS.length);
  });

  it("has positive prices and sensible dividend rates", () => {
    STOCKS.forEach((stock) => {
      expect(stock.basePrice).toBeGreaterThan(0);
      expect(stock.dividendRate).toBeGreaterThanOrEqual(0);
      expect(stock.dividendRate).toBeLessThan(0.1);
    });
  });

  it.each(STOCKS.map((stock) => [stock.id]))("ships building art and an icon for %s", (id) => {
    const stock = STOCKS.find((item) => item.id === id)!;
    expect(existsSync(publicFile(ASSETS.lot(stock.id)))).toBe(true);
    expect(existsSync(publicFile(ASSETS.stockIcon(stock.id)))).toBe(true);
  });
});

describe("map layout", () => {
  it("defines exactly one district per sector", () => {
    expect(LAYOUT.districts.map((district) => district.id).sort()).toEqual(SECTORS.map((sector) => sector.id).sort());
  });

  it.each(SECTORS.map((sector) => [sector.id]))("reserves one lot per %s stock", (id) => {
    const district = LAYOUT.districts.find((item) => item.id === id)!;
    expect(district.lots).toBe(getStocksBySector(id).length);
  });

  it("keeps every district inside the world without overlaps", () => {
    const frames = SECTORS.map((sector) => sector.frame);
    frames.forEach((frame) => {
      expect(frame.left).toBeGreaterThanOrEqual(0);
      expect(frame.top).toBeGreaterThanOrEqual(0);
      expect(frame.left + frame.width).toBeLessThanOrEqual(LAYOUT.world.width);
      expect(frame.top + frame.height).toBeLessThanOrEqual(LAYOUT.world.height);
    });
    frames.forEach((a, i) =>
      frames.slice(i + 1).forEach((b) => {
        const overlap =
          a.left < b.left + b.width &&
          b.left < a.left + a.width &&
          a.top < b.top + b.height &&
          b.top < a.top + a.height;
        expect(overlap).toBe(false);
      }),
    );
  });

  it.each(SECTORS.map((sector) => [sector.id]))("ships ground art and an icon for the %s district", (id) => {
    expect(existsSync(publicFile(ASSETS.district(id)))).toBe(true);
    expect(existsSync(publicFile(ASSETS.sectorIcon(id)))).toBe(true);
  });
});

describe("market events", () => {
  it("only moves stocks that exist", () => {
    const ids = new Set(STOCKS.map((stock) => stock.id));
    MARKET_EVENTS.forEach((event) =>
      Object.keys(event.priceMultipliers).forEach((id) =>
        expect(ids.has(id as (typeof STOCKS)[number]["id"])).toBe(true),
      ),
    );
  });
});

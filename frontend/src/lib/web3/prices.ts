import { keccak256, toBytes } from "viem";
import { STOCKS } from "@/config";
import basePriceData from "@/config/prices.json";
import type { MarketEventPreset } from "@/types";

export type PriceMap = Record<string, bigint>;

/** Oracle price id: keccak256(bytes(TICKER)). */
export const priceId = (ticker: string): `0x${string}` => keccak256(toBytes(ticker));

export const BASE_PRICES: PriceMap = Object.fromEntries(
  Object.entries(basePriceData as Record<string, number>).map(([ticker, price]) => [ticker, BigInt(price)]),
);

/** Multiplies each price by `multiplier` using integer basis points; returns only the tickers that change. */
export const applyMultipliers = (current: PriceMap, multipliers: Readonly<Record<string, number>>): PriceMap => {
  const next: PriceMap = {};
  Object.entries(multipliers).forEach(([ticker, multiplier]) => {
    const price = current[ticker];
    if (price === undefined || !Number.isFinite(multiplier) || multiplier <= 0) return;
    next[ticker] = (price * BigInt(Math.round(multiplier * 10000))) / 10000n;
  });
  return next;
};

/** Prices an event wants to write (CURRENT on-chain prices times the preset; `reset` returns base prices). */
export const eventPriceChanges = (event: MarketEventPreset, current: PriceMap): PriceMap => {
  if (event.resetsPrices) return { ...BASE_PRICES };
  const byTicker: Record<string, number> = {};
  Object.entries(event.priceMultipliers).forEach(([stockId, multiplier]) => {
    const stock = STOCKS.find((item) => item.id === stockId);
    if (stock && multiplier !== undefined) byTicker[stock.ticker] = multiplier;
  });
  return applyMultipliers(current, byTicker);
};

export const oldestPriceAgeSeconds = (updatedAt: readonly number[], nowSeconds: number): number =>
  updatedAt.length === 0
    ? Number.POSITIVE_INFINITY
    : Math.max(...updatedAt.map((time) => Math.max(0, nowSeconds - time)));

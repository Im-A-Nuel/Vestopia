import { ABIS, ADDRESSES, STOCK_ADDRESSES } from "@/config";
import { oldestPriceAgeSeconds, priceId, type PriceMap } from "@/lib/web3/prices";
import type { TxReport } from "@/types";
import { sendFrom, serverClient } from "./chain";
import { getAdminKey } from "./env";

export interface OracleSnapshot {
  prices: PriceMap;
  /** Seconds since the oldest price was written. Over 3600 makes borrow / withdraw-with-debt revert. */
  oldestAgeSeconds: number;
}

export const TICKERS: readonly string[] = Object.keys(STOCK_ADDRESSES);

/** One multicall for all 31 prices. */
export const readOracle = async (): Promise<OracleSnapshot> => {
  const rows = (await serverClient.multicall({
    allowFailure: false,
    contracts: TICKERS.map((ticker) => ({
      address: ADDRESSES.oracle,
      abi: ABIS.oracle,
      functionName: "getPrice",
      args: [priceId(ticker)],
    })),
  })) as unknown as [bigint, bigint, number][];
  const prices: PriceMap = {};
  rows.forEach((row, index) => {
    prices[TICKERS[index]] = row[0];
  });
  const age = oldestPriceAgeSeconds(
    rows.map((row) => Number(row[1])),
    Math.floor(Date.now() / 1000),
  );
  return { prices, oldestAgeSeconds: age };
};

/** Writes the given prices (ticker -> 8-decimal price) in one setPrices transaction from the admin key. */
export const sendPrices = (label: string, prices: PriceMap): Promise<TxReport> => {
  const entries = Object.entries(prices);
  return sendFrom(getAdminKey(), {
    label,
    address: ADDRESSES.oracle,
    abi: ABIS.oracle,
    functionName: "setPrices",
    args: [entries.map(([ticker]) => priceId(ticker)), entries.map(([, price]) => price)],
  });
};

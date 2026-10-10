import { STOCKS } from "@/config";

export interface PlayerStockValue {
  ticker: string;
  /** Koin value of the stock the player owns, 18 decimals. */
  value: bigint;
}

export interface PlayerHoldings {
  address: `0x${string}`;
  stocks: readonly PlayerStockValue[];
}

export interface DividendPayout {
  ticker: string;
  players: `0x${string}`[];
  amounts: bigint[];
}

export const dividendBps = (rate: number): number => Math.round(rate * 10000);

export const DIVIDEND_BPS: Readonly<Record<string, number>> = Object.fromEntries(
  STOCKS.map((stock) => [stock.ticker, dividendBps(stock.dividendRate)]),
);

/** amount = value * dividendRateBps / 10000 per stock; skips zero amounts and stocks nobody is paid for. */
export const computeDividends = (
  holdings: readonly PlayerHoldings[],
  rates: Readonly<Record<string, number>> = DIVIDEND_BPS,
): DividendPayout[] => {
  const payouts: DividendPayout[] = [];
  Object.entries(rates).forEach(([ticker, bps]) => {
    if (bps <= 0) return;
    const payout: DividendPayout = { ticker, players: [], amounts: [] };
    holdings.forEach((holding) => {
      const stock = holding.stocks.find((item) => item.ticker === ticker);
      if (!stock) return;
      const amount = (stock.value * BigInt(bps)) / 10000n;
      if (amount <= 0n) return;
      payout.players.push(holding.address);
      payout.amounts.push(amount);
    });
    if (payout.players.length > 0) payouts.push(payout);
  });
  return payouts;
};

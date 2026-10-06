import { createMarketSnapshot, createPlayerLedger } from "@/lib";
import type { LatestEvent, MarketSnapshot, PlayerLedger } from "@/types";

const PLAYERS_KEY = "vestopia.mock.players";
const MARKET_KEY = "vestopia.mock.market";
const EVENT_KEY = "vestopia.mock.event";

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};

export const loadPlayers = (): Record<string, PlayerLedger> => readJson(PLAYERS_KEY, {});

export const savePlayers = (players: Record<string, PlayerLedger>): void => writeJson(PLAYERS_KEY, players);

export const loadPlayer = (address: string): PlayerLedger => {
  const stored = loadPlayers()[address];
  const empty = createPlayerLedger();
  return stored
    ? {
        ...empty,
        ...stored,
        shares: { ...empty.shares, ...stored.shares },
        collateral: { ...empty.collateral, ...stored.collateral },
        pending: { ...empty.pending, ...stored.pending },
      }
    : empty;
};

export const loadMarket = (): MarketSnapshot => {
  const fresh = createMarketSnapshot();
  const stored = readJson<MarketSnapshot | null>(MARKET_KEY, null);
  return stored
    ? {
        prices: { ...fresh.prices, ...stored.prices },
        previousPrices: { ...fresh.previousPrices, ...stored.previousPrices },
      }
    : fresh;
};

export const saveMarket = (market: MarketSnapshot): void => writeJson(MARKET_KEY, market);

export const loadLatestEvent = (): LatestEvent | null => readJson<LatestEvent | null>(EVENT_KEY, null);

export const saveLatestEvent = (event: LatestEvent): void => writeJson(EVENT_KEY, event);

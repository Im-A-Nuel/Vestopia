import {
  COPY,
  MAX_LTV,
  MOCK_LATENCY_MS,
  SHARE_DUST,
  STARTER_KOIN,
  STOCKS,
  STOCK_IDS,
  getMarketEvent,
  getStock,
} from "@/config";
import { buildPlayerView, createMarketSnapshot, formatCoins, formatShares, getHealthFactor } from "@/lib";
import type {
  ActionErrorCode,
  ActionResult,
  Amount,
  GameService,
  MarketEventId,
  MarketSnapshot,
  PlayerLedger,
  StockId,
} from "@/types";
import {
  clearMockData,
  loadEventLog,
  loadLatestEvent,
  loadMarket,
  loadPlayer,
  loadPlayers,
  saveLatestEvent,
  saveMarket,
  savePlayers,
} from "./mockStorage";

const TOLERANCE = 1e-6;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const success = (message: string): ActionResult => ({ status: "success", message });

const failure = (code: ActionErrorCode, message: string): ActionResult => ({ status: "error", code, message });

const invalidAmount = (): ActionResult => failure("invalid_amount", COPY.errors.invalidAmount);

const isKnownStock = (stockId: StockId): boolean => STOCK_IDS.includes(stockId);

const isPositive = (amount: number): boolean => Number.isFinite(amount) && amount > 0;

const settle = (shares: number): number => (shares < SHARE_DUST ? 0 : shares);

const collateralValueOf = (ledger: PlayerLedger, market: MarketSnapshot): number =>
  STOCKS.reduce((total, stock) => total + ledger.collateral[stock.id] * market.prices[stock.id], 0);

interface Transfer {
  shares: number;
  koin: number;
}

const resolveTransfer = (amount: Amount, available: number, price: number): Transfer | null => {
  if (amount === "max") return { shares: available, koin: available * price };
  if (!isPositive(amount)) return null;
  const shares = amount / price;
  if (shares > available + SHARE_DUST) return null;
  return { shares: Math.min(shares, available), koin: amount };
};

type Mutation = (ledger: PlayerLedger, market: MarketSnapshot) => ActionResult;

const mutatePlayer = async (address: string, mutation: Mutation): Promise<ActionResult> => {
  await wait(MOCK_LATENCY_MS);
  const market = loadMarket();
  const ledger = loadPlayer(address);
  const result = mutation(ledger, market);
  if (result.status === "success") {
    savePlayers({ ...loadPlayers(), [address]: ledger });
  }
  return result;
};

const sharesError = (): ActionResult => failure("insufficient_shares", COPY.errors.insufficientShares);

const moveShares = (
  address: string,
  stockId: StockId,
  amount: Amount,
  direction: "deposit" | "withdraw",
): Promise<ActionResult> =>
  mutatePlayer(address, (ledger, market) => {
    if (!isKnownStock(stockId)) return failure("unknown_stock", COPY.errors.generic);
    const price = market.prices[stockId];
    const from = direction === "deposit" ? ledger.shares : ledger.collateral;
    const to = direction === "deposit" ? ledger.collateral : ledger.shares;
    const transfer = resolveTransfer(amount, from[stockId], price);
    if (!transfer) return amount === "max" || isPositive(amount) ? sharesError() : invalidAmount();
    if (transfer.shares <= 0) return invalidAmount();

    from[stockId] = settle(from[stockId] - transfer.shares);
    to[stockId] += transfer.shares;

    if (direction === "withdraw") {
      const remaining = collateralValueOf(ledger, market);
      const overLimit = ledger.debt > remaining * MAX_LTV + TOLERANCE;
      const unhealthy = ledger.debt > 0 && getHealthFactor(remaining, ledger.debt) < 1;
      if (overLimit || unhealthy) return failure("unsafe_withdraw", COPY.errors.unsafeWithdraw);
    }

    const verb = direction === "deposit" ? "Deposited" : "Withdrew";
    return success(`${verb} ${formatShares(transfer.shares)} ${getStock(stockId).name} shares.`);
  });

const creditHarvest = (ledger: PlayerLedger, stockIds: readonly StockId[]): number => {
  const total = stockIds.reduce((sum, id) => sum + ledger.pending[id], 0);
  stockIds.forEach((id) => {
    ledger.pending[id] = 0;
  });
  ledger.koin += total;
  return total;
};

const payDividends = (market: MarketSnapshot): void => {
  const players = loadPlayers();
  Object.keys(players).forEach((address) => {
    const ledger = loadPlayer(address);
    STOCKS.forEach((stock) => {
      const value = (ledger.shares[stock.id] + ledger.collateral[stock.id]) * market.prices[stock.id];
      ledger.pending[stock.id] += value * stock.dividendRate;
    });
    players[address] = ledger;
  });
  savePlayers(players);
};

const applyPriceEvent = (market: MarketSnapshot, eventId: MarketEventId): MarketSnapshot => {
  const event = getMarketEvent(eventId);
  const base = createMarketSnapshot().prices;
  const next: MarketSnapshot = { prices: { ...market.prices }, previousPrices: { ...market.prices } };
  if (event.resetsPrices) {
    next.prices = { ...base };
    return next;
  }
  STOCK_IDS.forEach((id) => {
    next.prices[id] = market.prices[id] * (event.priceMultipliers[id] ?? 1);
  });
  return next;
};

export const mockGameService: GameService = {
  async getPlayer(address) {
    return buildPlayerView(loadPlayer(address), loadMarket());
  },

  claimStarter(address) {
    return mutatePlayer(address, (ledger) => {
      if (ledger.starterClaimed) return failure("already_claimed", COPY.errors.alreadyClaimed);
      ledger.starterClaimed = true;
      ledger.koin += STARTER_KOIN;
      return success(`You received ${formatCoins(STARTER_KOIN)} Coins.`);
    });
  },

  buy(address, stockId, koinAmount) {
    return mutatePlayer(address, (ledger, market) => {
      if (!isKnownStock(stockId)) return failure("unknown_stock", COPY.errors.generic);
      if (!isPositive(koinAmount)) return invalidAmount();
      if (koinAmount > ledger.koin + TOLERANCE) return failure("insufficient_koin", COPY.errors.insufficientKoin);
      const shares = koinAmount / market.prices[stockId];
      ledger.koin = Math.max(0, ledger.koin - koinAmount);
      ledger.shares[stockId] += shares;
      ledger.costBasis[stockId] += koinAmount;
      return success(
        `Bought ${formatShares(shares)} ${getStock(stockId).name} shares for ${formatCoins(koinAmount)} Coins.`,
      );
    });
  },

  sell(address, stockId, koinAmount) {
    return mutatePlayer(address, (ledger, market) => {
      if (!isKnownStock(stockId)) return failure("unknown_stock", COPY.errors.generic);
      const transfer = resolveTransfer(koinAmount, ledger.shares[stockId], market.prices[stockId]);
      if (!transfer) return koinAmount === "max" || isPositive(koinAmount) ? sharesError() : invalidAmount();
      if (transfer.shares <= 0) return invalidAmount();
      const held = ledger.shares[stockId] + ledger.collateral[stockId];
      const keptFraction = held > 0 ? Math.max(0, 1 - transfer.shares / held) : 0;
      ledger.costBasis[stockId] = keptFraction < 1e-9 ? 0 : ledger.costBasis[stockId] * keptFraction;
      ledger.shares[stockId] = settle(ledger.shares[stockId] - transfer.shares);
      ledger.koin += transfer.koin;
      return success(
        `Sold ${formatShares(transfer.shares)} ${getStock(stockId).name} shares for ${formatCoins(transfer.koin)} Coins.`,
      );
    });
  },

  deposit(address, stockId, koinAmount) {
    return moveShares(address, stockId, koinAmount, "deposit");
  },

  withdraw(address, stockId, koinAmount) {
    return moveShares(address, stockId, koinAmount, "withdraw");
  },

  borrow(address, koinAmount) {
    return mutatePlayer(address, (ledger, market) => {
      if (!isPositive(koinAmount)) return invalidAmount();
      const limit = collateralValueOf(ledger, market) * MAX_LTV;
      if (ledger.debt + koinAmount > limit + TOLERANCE) return failure("exceeds_borrow_limit", COPY.errors.borrowLimit);
      ledger.debt += koinAmount;
      ledger.koin += koinAmount;
      return success(`Borrowed ${formatCoins(koinAmount)} Coins.`);
    });
  },

  repay(address, koinAmount) {
    return mutatePlayer(address, (ledger) => {
      const payable = Math.min(ledger.debt, ledger.koin);
      const amount = koinAmount === "max" ? payable : Math.min(koinAmount, ledger.debt);
      if (!isPositive(amount)) return invalidAmount();
      if (amount > ledger.koin + TOLERANCE) return failure("insufficient_koin", COPY.errors.insufficientKoin);
      ledger.koin = Math.max(0, ledger.koin - amount);
      ledger.debt = ledger.debt - amount < TOLERANCE ? 0 : ledger.debt - amount;
      return success(`Repaid ${formatCoins(amount)} Coins.`);
    });
  },

  harvest(address, stockId) {
    return mutatePlayer(address, (ledger) => {
      if (!isKnownStock(stockId)) return failure("unknown_stock", COPY.errors.generic);
      if (ledger.pending[stockId] <= TOLERANCE) return failure("nothing_to_harvest", COPY.errors.nothingToHarvest);
      const total = creditHarvest(ledger, [stockId]);
      return success(`Harvested ${formatCoins(total)} Coins.`);
    });
  },

  harvestAll(address) {
    return mutatePlayer(address, (ledger) => {
      const pending = STOCK_IDS.reduce((sum, id) => sum + ledger.pending[id], 0);
      if (pending <= TOLERANCE) return failure("nothing_to_harvest", COPY.errors.nothingToHarvest);
      const total = creditHarvest(ledger, STOCK_IDS);
      return success(`Harvested ${formatCoins(total)} Coins.`);
    });
  },

  async triggerEvent(eventId) {
    await wait(MOCK_LATENCY_MS);
    const event = getMarketEvent(eventId);
    const market = loadMarket();
    if (event.paysDividends) {
      payDividends(market);
    } else {
      saveMarket(applyPriceEvent(market, eventId));
    }
    const previous = loadLatestEvent();
    saveLatestEvent({
      id: event.id,
      banner: event.banner,
      triggeredAt: Date.now(),
      sequence: (previous?.sequence ?? 0) + 1,
    });
    return success(`${event.title} triggered.`);
  },

  async getLatestEvent() {
    return loadLatestEvent();
  },

  async getEventLog() {
    return loadEventLog();
  },

  async getMarket() {
    return loadMarket();
  },

  async resetDemo() {
    await wait(MOCK_LATENCY_MS);
    clearMockData();
    return success("Demo data was reset.");
  },
};

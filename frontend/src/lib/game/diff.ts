import type { GameChange, PlayerView } from "@/types";

const EPSILON = 1e-6;

const changed = (a: number, b: number): boolean => Math.abs(a - b) > EPSILON;

export const diffPlayers = (previous: PlayerView, next: PlayerView): GameChange[] => {
  const changes: GameChange[] = [];

  if (changed(previous.koin, next.koin)) {
    changes.push({ type: "koin", delta: next.koin - previous.koin });
  }

  if (previous.weather !== next.weather) {
    changes.push({ type: "weather", from: previous.weather, to: next.weather });
  }

  next.sectors.forEach((sector) => {
    const before = previous.sectors.find((item) => item.id === sector.id);
    if (!before || before.unlocked === sector.unlocked) return;
    changes.push({ type: sector.unlocked ? "unlock" : "relock", sector: sector.id });
  });

  next.stocks.forEach((stock) => {
    const before = previous.stocks.find((item) => item.id === stock.id);
    if (!before) return;

    const priceMoved = changed(before.price, stock.price);
    if (priceMoved && before.price > 0) {
      changes.push({ type: "price", stockId: stock.id, percent: (stock.price / before.price - 1) * 100 });
    } else if (changed(before.value, stock.value)) {
      changes.push({ type: "value", stockId: stock.id, delta: stock.value - before.value });
    }

    if (before.level !== stock.level) {
      if (before.level === 0) changes.push({ type: "lot-filled", stockId: stock.id });
      else if (stock.level === 0) changes.push({ type: "lot-emptied", stockId: stock.id });
      else changes.push({ type: "level", stockId: stock.id, from: before.level, to: stock.level });
    }

    const wasLocked = before.collateralShares > EPSILON;
    const isLocked = stock.collateralShares > EPSILON;
    if (wasLocked !== isLocked) {
      changes.push({ type: "collateral", stockId: stock.id, locked: isLocked });
    }

    if (stock.pendingHarvest > before.pendingHarvest + EPSILON) {
      changes.push({ type: "harvest-ready", stockId: stock.id, amount: stock.pendingHarvest - before.pendingHarvest });
    } else if (stock.pendingHarvest < before.pendingHarvest - EPSILON) {
      changes.push({ type: "harvest-collected", stockId: stock.id, amount: before.pendingHarvest - stock.pendingHarvest });
    }
  });

  return changes;
};

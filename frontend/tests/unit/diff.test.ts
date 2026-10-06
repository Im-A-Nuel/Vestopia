import { describe, expect, it } from "vitest";
import { buildPlayerView, createMarketSnapshot, createPlayerLedger, diffPlayers } from "@/lib";
import type { PlayerView } from "@/types";

const view = (
  mutate: (ledger: ReturnType<typeof createPlayerLedger>, market: ReturnType<typeof createMarketSnapshot>) => void,
): PlayerView => {
  const ledger = createPlayerLedger();
  const market = createMarketSnapshot();
  mutate(ledger, market);
  return buildPlayerView(ledger, market);
};

describe("diffPlayers", () => {
  it("reports nothing for identical views", () => {
    const player = view((ledger) => {
      ledger.koin = 10;
    });
    expect(diffPlayers(player, player)).toEqual([]);
  });

  it("detects a first purchase that unlocks a district", () => {
    const before = view(() => undefined);
    const after = view((ledger, market) => {
      ledger.koin = 700;
      ledger.shares.nvda = 300 / market.prices.nvda;
    });
    const types = diffPlayers(before, after).map((change) => change.type);
    expect(types).toEqual(expect.arrayContaining(["koin", "unlock", "lot-filled", "value"]));
  });

  it("detects price moves as percentages", () => {
    const before = view((ledger) => {
      ledger.shares.nem = 10;
    });
    const after = view((ledger, market) => {
      ledger.shares.nem = 10;
      market.prices.nem *= 0.6;
    });
    const price = diffPlayers(before, after).find((change) => change.type === "price");
    expect(price).toMatchObject({ stockId: "nem" });
    expect(price && price.type === "price" ? price.percent : 0).toBeCloseTo(-40, 6);
  });

  it("detects debt, weather and collateral changes", () => {
    const before = view((ledger) => {
      ledger.shares.nem = 10;
    });
    const after = view((ledger, market) => {
      ledger.collateral.nem = 10;
      ledger.debt = 0.9 * 10 * market.prices.nem * 0.5;
    });
    const types = diffPlayers(before, after).map((change) => change.type);
    expect(types).toEqual(expect.arrayContaining(["debt", "collateral"]));
  });

  it("detects harvest becoming ready and being collected", () => {
    const empty = view(() => undefined);
    const ready = view((ledger) => {
      ledger.pending.nvda = 1.5;
    });
    expect(diffPlayers(empty, ready)).toContainEqual({ type: "harvest-ready", stockId: "nvda", amount: 1.5 });
    expect(diffPlayers(ready, empty)).toContainEqual({ type: "harvest-collected", stockId: "nvda", amount: 1.5 });
  });
});

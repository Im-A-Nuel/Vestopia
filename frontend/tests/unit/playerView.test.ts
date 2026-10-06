import { describe, expect, it } from "vitest";
import { buildPlayerView, createMarketSnapshot, createPlayerLedger } from "@/lib";

describe("buildPlayerView", () => {
  it("opens a district at 100 Coins and levels lots by value", () => {
    const ledger = createPlayerLedger();
    const market = createMarketSnapshot();
    ledger.shares.nvda = 300 / market.prices.nvda;
    const view = buildPlayerView(ledger, market);

    expect(view.sectors.find((sector) => sector.id === "tech")?.unlocked).toBe(true);
    expect(view.sectors.find((sector) => sector.id === "agri")?.unlocked).toBe(false);
    expect(view.stocks.find((stock) => stock.id === "nvda")?.level).toBe(2);
    expect(view.stocks.find((stock) => stock.id === "aapl")?.level).toBe(0);
    expect(view.portfolioValue).toBeCloseTo(300, 6);
  });

  it("counts collateral toward value and the borrow limit", () => {
    const ledger = createPlayerLedger();
    const market = createMarketSnapshot();
    ledger.collateral.nem = 600 / market.prices.nem;
    const view = buildPlayerView(ledger, market);

    expect(view.portfolioValue).toBeCloseTo(600, 6);
    expect(view.borrowLimit).toBeCloseTo(300, 6);
    expect(view.borrowable).toBeCloseTo(300, 6);
    expect(view.weather).toBe("sunny");
  });

  it("turns stormy when debt is close to the liquidation line", () => {
    const ledger = createPlayerLedger();
    const market = createMarketSnapshot();
    ledger.collateral.nem = 360 / market.prices.nem;
    ledger.debt = 280;
    expect(buildPlayerView(ledger, market).weather).toBe("stormy");
  });
});

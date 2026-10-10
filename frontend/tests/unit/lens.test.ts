import { maxUint256, parseUnits, zeroAddress } from "viem";
import { describe, expect, it, vi } from "vitest";
import { STOCKS } from "@/config";
import { lensToMarket, mapLensPlayer, type LensPlayerRaw, type LensStockRaw } from "@/lib/web3";
import { koinToShares, numberToWei, sharesToKoin } from "@/lib/web3";
import { createChainGameService } from "@/services/chainGameService";

const koin = (value: string): bigint => parseUnits(value, 18);
const price = (value: string): bigint => parseUnits(value, 8);

const lensStock = (ticker: string, overrides: Partial<LensStockRaw> = {}): LensStockRaw => ({
  token: zeroAddress,
  ticker,
  sector: 0,
  price: price("230"),
  previousPrice: 0n,
  walletBal: 0n,
  collateralBal: 0n,
  value: 0n,
  collateralValue: 0n,
  level: 0,
  pendingHarvest: 0n,
  costBasis: 0n,
  ...overrides,
});

const lensPlayer = (overrides: Partial<LensPlayerRaw> = {}): LensPlayerRaw => ({
  koin: koin("935"),
  debt: 0n,
  healthFactor: maxUint256,
  weather: 0,
  starterClaimed: true,
  totalPendingHarvest: koin("5"),
  collateralValue: koin("230"),
  borrowLimit: koin("115"),
  borrowable: koin("115"),
  portfolioValue: koin("300"),
  stocks: [
    lensStock("AAPL", {
      walletBal: koin("0.3043478"),
      collateralBal: koin("1"),
      value: koin("300"),
      collateralValue: koin("230"),
      level: 2,
      pendingHarvest: koin("5"),
      costBasis: koin("70"),
      previousPrice: price("253"),
    }),
    lensStock("NVDA", { price: price("140") }),
  ],
  sectors: [
    { value: koin("300"), unlocked: true },
    { value: 0n, unlocked: false },
    { value: 0n, unlocked: false },
    { value: 0n, unlocked: false },
    { value: 0n, unlocked: false },
    { value: 0n, unlocked: false },
  ],
  ...overrides,
});

describe("mapLensPlayer", () => {
  it("converts decimals and matches stocks by lowercase ticker", () => {
    const view = mapLensPlayer(lensPlayer());
    const aapl = view.stocks.find((stock) => stock.id === "aapl");
    expect(view.koin).toBe(935);
    expect(view.healthFactor).toBe(Number.POSITIVE_INFINITY);
    expect(view.weather).toBe("sunny");
    expect(aapl?.price).toBe(230);
    expect(aapl?.previousPrice).toBe(253);
    expect(aapl?.walletShares).toBeCloseTo(0.3043478, 7);
    expect(aapl?.collateralShares).toBe(1);
    expect(aapl?.costBasis).toBe(70);
    expect(aapl?.level).toBe(2);
    expect(aapl?.pendingHarvest).toBe(5);
    expect(view.stocks).toHaveLength(STOCKS.length);
  });

  it("falls back to price when previousPrice is 0 and fills stocks Lens does not list", () => {
    const view = mapLensPlayer(lensPlayer());
    expect(view.stocks.find((stock) => stock.id === "nvda")?.previousPrice).toBe(140);
    const msft = view.stocks.find((stock) => stock.id === "msft");
    expect(msft?.price).toBe(430);
    expect(msft?.level).toBe(0);
  });

  it("maps weather and sectors by contract index", () => {
    const view = mapLensPlayer(lensPlayer({ weather: 2, debt: koin("100"), healthFactor: koin("1.05") }));
    expect(view.weather).toBe("stormy");
    expect(view.healthFactor).toBeCloseTo(1.05);
    expect(view.sectors.find((sector) => sector.id === "tech")?.unlocked).toBe(true);
    expect(view.sectors.find((sector) => sector.id === "media")?.unlocked).toBe(false);
    expect(mapLensPlayer(lensPlayer({ weather: 1 })).weather).toBe("cloudy");
  });
});

describe("lensToMarket", () => {
  it("returns prices and previous prices for every stock", () => {
    const market = lensToMarket(lensPlayer());
    expect(market.prices.aapl).toBe(230);
    expect(market.previousPrices.aapl).toBe(253);
    expect(Object.keys(market.prices)).toHaveLength(STOCKS.length);
  });
});

describe("koin and shares conversion", () => {
  it("rounds shares down", () => {
    const shares = koinToShares(koin("100"), price("230"));
    expect(shares).toBe((koin("100") * 10n ** 8n) / price("230"));
    expect(sharesToKoin(shares, price("230"))).toBeLessThanOrEqual(koin("100"));
  });

  it("returns 0 shares for a zero price and 0 wei for bad numbers", () => {
    expect(koinToShares(koin("1"), 0n)).toBe(0n);
    expect(numberToWei(-1)).toBe(0n);
    expect(numberToWei(Number.NaN)).toBe(0n);
    expect(numberToWei(1.5)).toBe(koin("1.5"));
  });
});

const noWallet = {
  getAccount: async () => null,
  getChainId: async () => null,
  getWalletClient: () => ({ writeContract: vi.fn() }),
};

describe("createChainGameService", () => {
  it("reads the player with one Lens call", async () => {
    const readContract = vi.fn().mockResolvedValue(lensPlayer());
    const service = createChainGameService({ publicClient: { readContract } as never, wallet: noWallet });
    const view = await service.getPlayer("0x0000000000000000000000000000000000000001");
    expect(readContract).toHaveBeenCalledTimes(1);
    expect(readContract.mock.calls[0][0].functionName).toBe("getPlayer");
    expect(view.koin).toBe(935);
  });

  it("uses the zero address for the market snapshot", async () => {
    const readContract = vi.fn().mockResolvedValue(lensPlayer());
    const service = createChainGameService({ publicClient: { readContract } as never, wallet: noWallet });
    await service.getMarket();
    expect(readContract.mock.calls[0][0].args).toEqual([zeroAddress]);
  });

  it("turns an RPC failure into a friendly error", async () => {
    const readContract = vi.fn().mockRejectedValue(new Error("fetch failed: ECONNREFUSED http://secret-rpc"));
    const service = createChainGameService({ publicClient: { readContract } as never, wallet: noWallet });
    await expect(service.getPlayer(zeroAddress)).rejects.toThrow("We can't reach Monad Testnet");
  });
});

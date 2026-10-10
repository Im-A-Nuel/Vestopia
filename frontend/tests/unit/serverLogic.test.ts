import { parseEther } from "viem";
import { describe, expect, it, vi } from "vitest";
import { getMarketEvent } from "@/config";
import {
  BASE_PRICES,
  applyMultipliers,
  computeDividends,
  eventPriceChanges,
  oldestPriceAgeSeconds,
  priceId,
} from "@/lib/web3";
import { decideDrip, type DripConfig } from "@/lib/server/drip";
import { exclusive } from "@/lib/server/lock";
import { planWindows } from "@/lib/server/players";
import { takeHit } from "@/lib/server/rateLimit";
import { createChainGameService } from "@/services/chainGameService";

const A = "0x00000000000000000000000000000000000000a1" as const;
const B = "0x00000000000000000000000000000000000000b2" as const;
const koin = (value: string): bigint => parseEther(value);

describe("dividend math", () => {
  const holdings = [
    {
      address: A,
      stocks: [
        { ticker: "AAPL", value: koin("300") },
        { ticker: "AMD", value: koin("500") },
      ],
    },
    {
      address: B,
      stocks: [
        { ticker: "AAPL", value: 0n },
        { ticker: "KO", value: koin("200") },
      ],
    },
  ];

  it("pays value * rateBps / 10000 and skips zero rates, zero amounts and stocks without payees", () => {
    const payouts = computeDividends(holdings);
    expect(payouts.map((payout) => payout.ticker).sort()).toEqual(["AAPL", "KO"]);
    const aapl = payouts.find((payout) => payout.ticker === "AAPL");
    expect(aapl?.players).toEqual([A]);
    expect(aapl?.amounts).toEqual([koin("3")]);
    const ko = payouts.find((payout) => payout.ticker === "KO");
    expect(ko?.amounts).toEqual([koin("10")]);
  });

  it("rounds down and handles an empty player list", () => {
    const tiny = computeDividends([{ address: A, stocks: [{ ticker: "AAPL", value: 99n }] }]);
    expect(tiny).toEqual([]);
    expect(computeDividends([])).toEqual([]);
  });
});

describe("event prices", () => {
  const current = { NVDA: 14_000_000_000n, AAPL: 23_000_000_000n, NEM: 5_500_000_000n };

  it("multiplies CURRENT prices with integer math", () => {
    const next = eventPriceChanges(getMarketEvent("tech_boom"), current);
    expect(next.NVDA).toBe(17_500_000_000n);
    expect(next.AAPL).toBe(25_300_000_000n);
    expect(Object.keys(next).sort()).toEqual(["AAPL", "NVDA"]);
  });

  it("ignores unknown tickers and bad multipliers", () => {
    expect(applyMultipliers(current, { FOO: 2, AAPL: -1, NEM: Number.NaN })).toEqual({});
  });

  it("reset restores the base prices", () => {
    const next = eventPriceChanges(getMarketEvent("reset"), current);
    expect(next.AAPL).toBe(23_000_000_000n);
    expect(Object.keys(next)).toHaveLength(31);
    expect(next).toEqual(BASE_PRICES);
  });

  it("hashes ids like the contract and measures the oldest price age", () => {
    expect(priceId("AAPL")).toMatch(/^0x[0-9a-f]{64}$/);
    expect(oldestPriceAgeSeconds([100, 40, 90], 200)).toBe(160);
    expect(oldestPriceAgeSeconds([], 200)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("drip rules", () => {
  const config: DripConfig = {
    amount: parseEther("0.1"),
    minBalance: parseEther("0.05"),
    dailyCap: parseEther("1"),
    reserve: parseEther("0.02"),
    perIpPerHour: 5,
    attemptCooldownMs: 15000,
  };
  const facts = { recipientBalance: 0n, alreadyDripped: false, spentToday: 0n, dripWalletBalance: parseEther("5") };

  it("sends to a wallet with no MON", () => {
    expect(decideDrip(facts, config)).toBe("send");
  });

  it("skips wallets that already have enough MON, even before the once-per-address rule", () => {
    expect(decideDrip({ ...facts, recipientBalance: parseEther("0.06"), alreadyDripped: true }, config)).toBe(
      "skip_has_funds",
    );
  });

  it("enforces once per address, the daily cap and the faucet reserve", () => {
    expect(decideDrip({ ...facts, alreadyDripped: true }, config)).toBe("already_dripped");
    expect(decideDrip({ ...facts, spentToday: parseEther("0.95") }, config)).toBe("daily_cap");
    expect(decideDrip({ ...facts, dripWalletBalance: parseEther("0.11") }, config)).toBe("faucet_empty");
  });
});

describe("server helpers", () => {
  it("plans 100-block windows without gaps or overlap", () => {
    const windows = planWindows(1000n, 1250n);
    expect(windows).toEqual([
      [1000n, 1099n],
      [1100n, 1199n],
      [1200n, 1250n],
    ]);
    expect(planWindows(10n, 5n)).toEqual([]);
  });

  it("limits hits per window", () => {
    const key = `test-${Math.random()}`;
    expect(takeHit(key, 2, 1000, 0)).toBe(true);
    expect(takeHit(key, 2, 1000, 10)).toBe(true);
    expect(takeHit(key, 2, 1000, 20)).toBe(false);
    expect(takeHit(key, 2, 1000, 2000)).toBe(true);
  });

  it("rejects a second run of the same action while the first is in flight", async () => {
    let release: () => void = () => undefined;
    const first = exclusive("test-lock", () => new Promise<string>((resolve) => (release = () => resolve("done"))));
    await expect(exclusive("test-lock", async () => "again")).rejects.toThrow(/already running/);
    release();
    await expect(first).resolves.toBe("done");
    await expect(exclusive("test-lock", async () => "free")).resolves.toBe("free");
  });
});

describe("chain service server calls", () => {
  const reply = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

  const build = (fetcher: ReturnType<typeof vi.fn>, balance = 0n) =>
    createChainGameService({
      publicClient: { getBalance: vi.fn(async () => balance) } as never,
      wallet: { getAccount: async () => null, getChainId: async () => null, getWalletClient: () => ({}) as never },
      fetcher: fetcher as never,
    });

  it("triggerEvent posts the event id and returns tx reports", async () => {
    const fetcher = vi.fn(async () =>
      reply({ status: "success", message: "Tech boom triggered.", txs: [{ label: "x", hash: "0x1", gasUsed: "5" }] }),
    );
    const result = await build(fetcher).triggerEvent("tech_boom");
    expect(fetcher).toHaveBeenCalledWith(
      "/api/event",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ eventId: "tech_boom" }) }),
    );
    expect(result).toMatchObject({ status: "success", txs: [{ gasUsed: "5" }] });
  });

  it("maps a 401 to unauthorized and server errors to a friendly message", async () => {
    const denied = await build(vi.fn(async () => reply({ message: "Admin sign-in required." }, 401))).triggerEvent(
      "reset",
    );
    expect(denied.code).toBe("unauthorized");
    const broken = await build(
      vi.fn(async () => {
        throw new Error("offline");
      }),
    ).triggerEvent("reset");
    expect(broken.status).toBe("error");
  });

  it("reads the latest event and log from the server", async () => {
    const latest = { id: "reset", banner: "b", triggeredAt: 1, sequence: 2 };
    const fetcher = vi.fn(async (url: string) =>
      url.endsWith("latest") ? reply({ latest }) : reply({ log: [latest] }),
    );
    const service = build(fetcher);
    expect(await service.getLatestEvent()).toEqual(latest);
    expect(await service.getEventLog()).toEqual([latest]);
  });

  it("resetDemo resets prices and explains that balances stay", async () => {
    const result = await build(
      vi.fn(async () => reply({ status: "success", message: "Reset markets triggered.", txs: [] })),
    ).resetDemo();
    expect(result.message).toMatch(/balances stay on-chain/);
  });
});

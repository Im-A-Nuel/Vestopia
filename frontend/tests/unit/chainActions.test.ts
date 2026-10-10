import { parseUnits } from "viem";
import { describe, expect, it, vi } from "vitest";
import { ADDRESSES, MONAD_TESTNET_CHAIN_ID, STOCK_ADDRESSES } from "@/config";
import { getTxPhase } from "@/lib/web3";
import type { LensPlayerRaw } from "@/lib/web3";
import { createChainGameService } from "@/services/chainGameService";

const ME = "0x3C550a7C70d3b8e3F2D5755Fa0cD63Dc1275fD9A";
const AAPL = STOCK_ADDRESSES.AAPL;
const koin = (value: string): bigint => parseUnits(value, 18);

const lens = (stock: Record<string, unknown> = {}, player: Record<string, unknown> = {}): LensPlayerRaw =>
  ({
    koin: koin("500"),
    debt: koin("100"),
    healthFactor: koin("2"),
    weather: 0,
    starterClaimed: true,
    totalPendingHarvest: 0n,
    collateralValue: 0n,
    borrowLimit: 0n,
    borrowable: 0n,
    portfolioValue: 0n,
    sectors: [],
    stocks: [
      {
        token: AAPL,
        ticker: "AAPL",
        sector: 0,
        price: 230n * 10n ** 8n,
        previousPrice: 0n,
        walletBal: koin("2"),
        collateralBal: koin("1.5"),
        value: 0n,
        collateralValue: 0n,
        level: 0,
        pendingHarvest: 0n,
        costBasis: 0n,
        ...stock,
      },
    ],
    ...player,
  }) as unknown as LensPlayerRaw;

interface SetupOptions {
  player?: LensPlayerRaw;
  allowance?: bigint;
  chainId?: number | null;
  account?: string | null;
  balance?: bigint;
  fetcher?: ReturnType<typeof vi.fn>;
}

const setup = (options: SetupOptions = {}) => {
  const calls: string[] = [];
  const player = options.player ?? lens();
  const readContract = vi.fn(async (args: { functionName: string }) =>
    args.functionName === "allowance" ? (options.allowance ?? 0n) : player,
  );
  const simulate = vi.fn(async (args: { address: string; functionName: string; args: unknown[] }) => {
    calls.push(`simulate:${args.functionName}`);
    return { request: args, result: 7n * 10n ** 17n };
  });
  const write = vi.fn(async (request: { functionName: string }) => {
    calls.push(`write:${request.functionName}`);
    return "0xabc";
  });
  const service = createChainGameService({
    publicClient: {
      readContract,
      simulateContract: simulate,
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success" })),
      getBalance: vi.fn(async () => options.balance ?? koin("1")),
    } as never,
    fetcher: (options.fetcher ?? vi.fn(async () => new Response("{}"))) as never,
    wallet: {
      getAccount: async () => (options.account === undefined ? ME : options.account),
      getChainId: async () => (options.chainId === undefined ? MONAD_TESTNET_CHAIN_ID : options.chainId),
      getWalletClient: () => ({ writeContract: write }) as never,
    },
  });
  return { calls, simulate, write, service };
};

const argsOf = (mock: ReturnType<typeof vi.fn>, index = 0): unknown[] => mock.mock.calls[index][0].args;

describe("chain write actions", () => {
  it("buy sends Koin wei to the market, simulating before writing", async () => {
    const { service, calls, simulate } = setup();
    const result = await service.buy(ME, "aapl", 100);
    expect(result.status).toBe("success");
    expect(calls).toEqual(["simulate:buy", "write:buy"]);
    expect(simulate.mock.calls[0][0].address).toBe(ADDRESSES.market);
    expect(argsOf(simulate)).toEqual([AAPL, koin("100")]);
    expect(getTxPhase()).toBeNull();
  });

  it("sell converts Koin to shares rounded down", async () => {
    const { service, simulate } = setup();
    await service.sell(ME, "aapl", 230);
    expect(argsOf(simulate)).toEqual([AAPL, koin("1")]);
    await service.sell(ME, "aapl", 100);
    expect(argsOf(simulate, 1)).toEqual([AAPL, (koin("100") * 10n ** 8n) / (230n * 10n ** 8n)]);
  });

  it("sell max uses the exact wallet balance", async () => {
    const { service, simulate } = setup({ player: lens({ walletBal: 1234567890123456789n }) });
    await service.sell(ME, "aapl", "max");
    expect(argsOf(simulate)).toEqual([AAPL, 1234567890123456789n]);
  });

  it("clamps dust above the balance but rejects real overspending without sending", async () => {
    const dust = setup({ player: lens({ walletBal: koin("1") - 1n }) });
    expect((await dust.service.sell(ME, "aapl", 230)).status).toBe("success");
    const over = setup();
    const result = await over.service.sell(ME, "aapl", 10_000);
    expect(result.code).toBe("insufficient_shares");
    expect(over.simulate).not.toHaveBeenCalled();
  });

  it("deposit approves first when the allowance is too small", async () => {
    const { service, calls } = setup({ allowance: 0n });
    const result = await service.deposit(ME, "aapl", "max");
    expect(result.status).toBe("success");
    expect(calls).toEqual(["simulate:approve", "write:approve", "simulate:deposit", "write:deposit"]);
  });

  it("deposit skips approve when the allowance already covers it", async () => {
    const { service, calls } = setup({ allowance: koin("100") });
    await service.deposit(ME, "aapl", "max");
    expect(calls).toEqual(["simulate:deposit", "write:deposit"]);
  });

  it("withdraw max uses the exact collateral balance", async () => {
    const { service, simulate } = setup({ player: lens({ collateralBal: 999n }) });
    await service.withdraw(ME, "aapl", "max");
    expect(argsOf(simulate)).toEqual([AAPL, 999n]);
    expect(simulate.mock.calls[0][0].address).toBe(ADDRESSES.bank);
  });

  it("repay max passes the debt, capped by the Koin balance", async () => {
    const full = setup();
    await full.service.repay(ME, "max");
    expect(argsOf(full.simulate)).toEqual([koin("100")]);
    const poor = setup({ player: lens({}, { koin: koin("40") }) });
    await poor.service.repay(ME, "max");
    expect(argsOf(poor.simulate)).toEqual([koin("40")]);
  });

  it("borrow, harvest and claimStarter hit the right contracts", async () => {
    const { service, simulate } = setup();
    await service.borrow(ME, 25);
    await service.harvest(ME, "aapl");
    await service.harvestAll(ME);
    await service.claimStarter(ME);
    const names = simulate.mock.calls.map(
      (call) => `${call[0].address === ADDRESSES.bank ? "bank" : "market"}.${call[0].functionName}`,
    );
    expect(names).toEqual(["bank.borrow", "market.harvest", "market.harvestAll", "market.claimStarter"]);
  });

  it("asks the faucet when the wallet has no MON, then registers the player after the claim", async () => {
    const fetcher = vi.fn(async () => new Response("{}"));
    const { service } = setup({ balance: 0n, fetcher });
    expect((await service.claimStarter(ME)).status).toBe("success");
    const paths = fetcher.mock.calls.map((call) => (call as unknown as [string])[0]);
    expect(paths).toEqual(["/api/drip", "/api/players/register"]);
  });

  it("does not ask the faucet when the wallet already has MON", async () => {
    const fetcher = vi.fn(async () => new Response("{}"));
    const { service } = setup({ fetcher });
    await service.claimStarter(ME);
    const paths = fetcher.mock.calls.map((call) => (call as unknown as [string])[0]);
    expect(paths).toEqual(["/api/players/register"]);
  });

  it("refuses to act on the wrong network or the wrong account", async () => {
    const wrongChain = setup({ chainId: 1 });
    expect((await wrongChain.service.buy(ME, "aapl", 1)).code).toBe("wrong_network");
    expect(wrongChain.simulate).not.toHaveBeenCalled();
    const other = setup({ account: "0x0000000000000000000000000000000000000001" });
    expect((await other.service.buy(ME, "aapl", 1)).code).toBe("wrong_account");
    const none = setup({ account: null });
    expect((await none.service.buy(ME, "aapl", 1)).code).toBe("no_wallet");
  });

  it("maps a rejected signature to cancelled", async () => {
    const { service, write } = setup();
    write.mockRejectedValueOnce(Object.assign(new Error("denied"), { code: 4001 }));
    const result = await service.buy(ME, "aapl", 1);
    expect(result).toMatchObject({ status: "error", code: "cancelled" });
  });

  it("blocks a second action while one is in flight", async () => {
    const { service, write } = setup();
    let release: (hash: string) => void = () => undefined;
    write.mockImplementationOnce(() => new Promise<string>((resolve) => (release = resolve)));
    const first = service.buy(ME, "aapl", 1);
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    expect((await service.buy(ME, "aapl", 1)).code).toBe("busy");
    release("0xabc");
    expect((await first).status).toBe("success");
  });

  it("rejects non-positive amounts before touching the wallet", async () => {
    const { service, simulate } = setup();
    expect((await service.buy(ME, "aapl", 0)).code).toBe("invalid_amount");
    expect((await service.borrow(ME, -5)).code).toBe("invalid_amount");
    expect(simulate).not.toHaveBeenCalled();
  });
});

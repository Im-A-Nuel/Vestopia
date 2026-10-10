import { parseEther, zeroAddress, type Abi, type Address, type PublicClient, type WalletClient } from "viem";
import { ABIS, ADDRESSES, COPY, MONAD_TESTNET_CHAIN_ID, SHARE_DUST, STOCK_ADDRESSES, getStock } from "@/config";
import { formatCoins, formatShares } from "@/lib/format";
import {
  FriendlyError,
  koinToShares,
  koinToNumber,
  lensToMarket,
  mapContractError,
  mapLensPlayer,
  numberToWei,
  setTxPhase,
  sharesToNumber,
  type ErrorContext,
  type LensPlayerRaw,
  type LensStockRaw,
} from "@/lib/web3";
import type {
  ActionErrorCode,
  ActionResult,
  Amount,
  GameService,
  LatestEvent,
  MarketEventId,
  MarketSnapshot,
  PlayerView,
  StockId,
  TxReport,
} from "@/types";

/** A wallet holding less MON than this asks the server faucet for gas before its first claim. */
const LOW_GAS = parseEther("0.02");

const SHARE_DUST_WEI = BigInt(Math.round(SHARE_DUST * 1e18));

export interface ChainWallet {
  getAccount: () => Promise<string | null>;
  getChainId: () => Promise<number | null>;
  getWalletClient: (address: string) => Pick<WalletClient, "writeContract">;
}

export interface ChainGameDeps {
  publicClient: Pick<PublicClient, "readContract" | "simulateContract" | "waitForTransactionReceipt" | "getBalance">;
  wallet: ChainWallet;
  /** Used for the server routes (/api/drip, /api/event, ...). Defaults to the browser fetch. */
  fetcher?: typeof fetch;
}

interface ServerReply {
  status?: string;
  message?: string;
  code?: string;
  txs?: TxReport[];
}

interface TxStep {
  address: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  label: string;
}

const success = (message: string): ActionResult => ({ status: "success", message });

const failure = (code: ActionResult["code"], message: string): ActionResult => ({ status: "error", code, message });

const invalidAmount = (): ActionResult => failure("invalid_amount", COPY.errors.invalidAmount);

const isPositive = (amount: number): boolean => Number.isFinite(amount) && amount > 0;

export const createChainGameService = ({ publicClient, wallet, fetcher }: ChainGameDeps): GameService => {
  let inFlight = false;
  const send: typeof fetch = (input, init) => (fetcher ?? fetch)(input, init);

  const postJson = async (path: string, body: unknown): Promise<{ ok: boolean; status: number; data: ServerReply }> => {
    const response = await send(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ServerReply;
    return { ok: response.ok, status: response.status, data };
  };

  /** New wallets have no MON: ask the server faucet (once per address) before the first claim. Never blocks the claim. */
  const ensureGas = async (address: string): Promise<void> => {
    try {
      const balance = await publicClient.getBalance({ address: address as Address });
      if (balance >= LOW_GAS) return;
      setTxPhase("Getting a little MON for gas...");
      await postJson("/api/drip", { address });
    } catch {
      // The claim itself reports "needs MON" if the faucet could not help.
    }
  };

  /** Lets the server know about a new player so Harvest Day can pay them. Best effort. */
  const registerPlayer = (address: string): void => {
    void postJson("/api/players/register", { address }).catch(() => undefined);
  };

  const toResult = (reply: { ok: boolean; status: number; data: ServerReply }): ActionResult => {
    if (reply.status === 401) return failure("unauthorized", COPY.errors.unauthorized);
    const code: ActionErrorCode | undefined = reply.ok ? undefined : "unknown";
    return {
      status: reply.ok && reply.data.status !== "error" ? "success" : "error",
      message: reply.data.message ?? COPY.errors.generic,
      code,
      txs: reply.data.txs,
    };
  };

  const triggerEvent = async (eventId: MarketEventId): Promise<ActionResult> => {
    try {
      return toResult(await postJson("/api/event", { eventId }));
    } catch {
      return failure("unknown", COPY.errors.generic);
    }
  };

  const readLens = async (address: string): Promise<LensPlayerRaw> => {
    try {
      return (await publicClient.readContract({
        address: ADDRESSES.lens,
        abi: ABIS.lens,
        functionName: "getPlayer",
        args: [address as Address],
      })) as LensPlayerRaw;
    } catch {
      throw new FriendlyError(COPY.errors.network);
    }
  };

  const stockToken = (stockId: StockId): Address | null => STOCK_ADDRESSES[getStock(stockId).ticker] ?? null;

  const findStock = (player: LensPlayerRaw, stockId: StockId): LensStockRaw | null =>
    player.stocks.find((item) => item.ticker.toLowerCase() === stockId) ?? null;

  const ensureWallet = async (address: string): Promise<void> => {
    const account = await wallet.getAccount();
    if (!account) throw new FriendlyError(COPY.errors.noWallet, "no_wallet");
    if (account.toLowerCase() !== address.toLowerCase())
      throw new FriendlyError(COPY.errors.wrongAccount, "wrong_account");
    const chainId = await wallet.getChainId();
    if (chainId !== MONAD_TESTNET_CHAIN_ID) throw new FriendlyError(COPY.errors.wrongNetwork, "wrong_network");
  };

  /** Simulate, ask the wallet to sign, wait for the receipt. Returns the simulated return value. */
  const sendStep = async (address: string, step: TxStep): Promise<unknown> => {
    setTxPhase(`${step.label}: checking...`);
    const { request, result } = await publicClient.simulateContract({
      account: address as Address,
      address: step.address,
      abi: step.abi,
      functionName: step.functionName,
      args: step.args,
    } as Parameters<typeof publicClient.simulateContract>[0]);
    setTxPhase(`${step.label}: confirm in your wallet`);
    const hash = await wallet
      .getWalletClient(address)
      .writeContract(request as Parameters<WalletClient["writeContract"]>[0]);
    setTxPhase(`${step.label}: confirming on Monad...`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new FriendlyError(COPY.errors.reverted);
    return result;
  };

  /** Runs `body` under the in-flight lock, maps every error to an ActionResult and clears the phase. */
  const guarded = async (
    address: string,
    context: ErrorContext,
    body: () => Promise<ActionResult>,
  ): Promise<ActionResult> => {
    if (inFlight) return failure("busy", COPY.errors.busy);
    inFlight = true;
    try {
      await ensureWallet(address);
      return await body();
    } catch (error) {
      const mapped = mapContractError(error, context);
      return failure(mapped.code, mapped.message);
    } finally {
      inFlight = false;
      setTxPhase(null);
    }
  };

  const market = (functionName: string, args: readonly unknown[], label: string): TxStep => ({
    address: ADDRESSES.market,
    abi: ABIS.market,
    functionName,
    args,
    label,
  });

  const bank = (functionName: string, args: readonly unknown[], label: string): TxStep => ({
    address: ADDRESSES.bank,
    abi: ABIS.bank,
    functionName,
    args,
    label,
  });

  /** Resolves a Koin amount (or "max") into exact share wei for a stock the player holds in `balance`. */
  const resolveShares = (amount: Amount, balance: bigint, price: bigint): bigint | ActionResult => {
    if (amount === "max")
      return balance > 0n ? balance : failure("insufficient_shares", COPY.errors.insufficientShares);
    if (!isPositive(amount)) return invalidAmount();
    let shares = koinToShares(numberToWei(amount), price);
    if (shares === 0n) return invalidAmount();
    if (shares > balance) {
      if (shares - balance > SHARE_DUST_WEI) return failure("insufficient_shares", COPY.errors.insufficientShares);
      shares = balance;
    }
    return shares;
  };

  const withStock = async (
    address: string,
    stockId: StockId,
  ): Promise<{ token: Address; raw: LensStockRaw } | ActionResult> => {
    const token = stockToken(stockId);
    if (!token) return failure("unknown_stock", COPY.errors.generic);
    const raw = findStock(await readLens(address), stockId);
    if (!raw) return failure("unknown_stock", COPY.errors.generic);
    return { token, raw };
  };

  const isResult = (value: unknown): value is ActionResult =>
    typeof value === "object" && value !== null && "status" in value;

  const moveShares = (
    address: string,
    stockId: StockId,
    amount: Amount,
    kind: "sell" | "deposit" | "withdraw",
  ): Promise<ActionResult> =>
    guarded(address, { insufficient: "shares" }, async () => {
      const found = await withStock(address, stockId);
      if (isResult(found)) return found;
      const { token, raw } = found;
      const balance = kind === "withdraw" ? raw.collateralBal : raw.walletBal;
      const shares = resolveShares(amount, balance, raw.price);
      if (isResult(shares)) return shares;
      const name = getStock(stockId).name;
      const label = formatShares(sharesToNumber(shares));

      if (kind === "sell") {
        const out = (await sendStep(address, market("sell", [token, shares], "Selling"))) as bigint;
        return success(`Sold ${label} ${name} shares for ${formatCoins(koinToNumber(out))} Coins.`);
      }
      if (kind === "withdraw") {
        await sendStep(address, bank("withdraw", [token, shares], "Withdrawing"));
        return success(`Withdrew ${label} ${name} shares.`);
      }

      const allowance = (await publicClient.readContract({
        address: token,
        abi: ABIS.stock,
        functionName: "allowance",
        args: [address as Address, ADDRESSES.bank],
      })) as bigint;
      const needsApproval = allowance < shares;
      if (needsApproval) {
        await sendStep(address, {
          address: token,
          abi: ABIS.stock,
          functionName: "approve",
          args: [ADDRESSES.bank, shares],
          label: "Step 1 of 2 (approve)",
        });
      }
      await sendStep(address, bank("deposit", [token, shares], needsApproval ? "Step 2 of 2 (deposit)" : "Depositing"));
      return success(`Deposited ${label} ${name} shares.`);
    });

  return {
    async getPlayer(address): Promise<PlayerView> {
      return mapLensPlayer(await readLens(address));
    },

    /** Prices only: Lens.getPlayer(address(0)) carries every price/previousPrice in one eth_call. */
    async getMarket(): Promise<MarketSnapshot> {
      return lensToMarket(await readLens(zeroAddress));
    },

    claimStarter: (address) =>
      guarded(address, { insufficient: "koin" }, async () => {
        await ensureGas(address);
        await sendStep(address, market("claimStarter", [], "Claiming"));
        registerPlayer(address);
        return success("Your starter Coins arrived.");
      }),

    buy: (address, stockId, koinAmount) =>
      guarded(address, { insufficient: "koin" }, async () => {
        if (!isPositive(koinAmount)) return invalidAmount();
        const token = stockToken(stockId);
        if (!token) return failure("unknown_stock", COPY.errors.generic);
        const shares = (await sendStep(address, market("buy", [token, numberToWei(koinAmount)], "Buying"))) as bigint;
        return success(
          `Bought ${formatShares(sharesToNumber(shares))} ${getStock(stockId).name} shares for ${formatCoins(koinAmount)} Coins.`,
        );
      }),

    sell: (address, stockId, koinAmount) => moveShares(address, stockId, koinAmount, "sell"),

    deposit: (address, stockId, koinAmount) => moveShares(address, stockId, koinAmount, "deposit"),

    withdraw: (address, stockId, koinAmount) => moveShares(address, stockId, koinAmount, "withdraw"),

    borrow: (address, koinAmount) =>
      guarded(address, { insufficient: "koin" }, async () => {
        if (!isPositive(koinAmount)) return invalidAmount();
        await sendStep(address, bank("borrow", [numberToWei(koinAmount)], "Borrowing"));
        return success(`Borrowed ${formatCoins(koinAmount)} Coins.`);
      }),

    repay: (address, koinAmount) =>
      guarded(address, { insufficient: "koin" }, async () => {
        let wei: bigint;
        if (koinAmount === "max") {
          const player = await readLens(address);
          wei = player.debt < player.koin ? player.debt : player.koin;
        } else {
          if (!isPositive(koinAmount)) return invalidAmount();
          wei = numberToWei(koinAmount);
        }
        if (wei === 0n) return invalidAmount();
        const repaid = (await sendStep(address, bank("repay", [wei], "Repaying"))) as bigint;
        return success(`Repaid ${formatCoins(koinToNumber(repaid))} Coins.`);
      }),

    harvest: (address, stockId) =>
      guarded(address, { insufficient: "koin" }, async () => {
        const token = stockToken(stockId);
        if (!token) return failure("unknown_stock", COPY.errors.generic);
        const amount = (await sendStep(address, market("harvest", [token], "Harvesting"))) as bigint;
        return success(`Harvested ${formatCoins(koinToNumber(amount))} Coins.`);
      }),

    harvestAll: (address) =>
      guarded(address, { insufficient: "koin" }, async () => {
        const total = (await sendStep(address, market("harvestAll", [], "Harvesting"))) as bigint;
        return success(`Harvested ${formatCoins(koinToNumber(total))} Coins.`);
      }),

    triggerEvent,

    async getLatestEvent(): Promise<LatestEvent | null> {
      const response = await send("/api/event/latest");
      if (!response.ok) return null;
      return ((await response.json()) as { latest: LatestEvent | null }).latest;
    },

    async getEventLog(): Promise<LatestEvent[]> {
      const response = await send("/api/event/log");
      if (!response.ok) return [];
      return ((await response.json()) as { log: LatestEvent[] }).log;
    },

    /** On-chain balances cannot be erased: this only puts every price back to its starting value. */
    async resetDemo(): Promise<ActionResult> {
      const result = await triggerEvent("reset");
      return result.status === "success"
        ? { ...result, message: "Prices were reset to their starting values. Player balances stay on-chain." }
        : result;
    },
  };
};

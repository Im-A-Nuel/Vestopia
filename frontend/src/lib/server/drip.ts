import { formatEther, getAddress, isAddress, parseEther, type Address } from "viem";
import { BadRequestError } from "./http";
import { RateLimitError, takeHit } from "./rateLimit";
import { addressOf, assertTestnet, sendNative, serverClient } from "./chain";
import { getDripKey, numberFromEnv } from "./env";
import { exclusive } from "./lock";
import { getState, saveState } from "./state";

export interface DripConfig {
  amount: bigint;
  /** A wallet holding at least this much MON is not topped up. */
  minBalance: bigint;
  dailyCap: bigint;
  /** MON the drip wallet always keeps for its own gas. */
  reserve: bigint;
  perIpPerHour: number;
  attemptCooldownMs: number;
}

export const getDripConfig = (): DripConfig => ({
  amount: parseEther(String(numberFromEnv("DRIP_AMOUNT_MON", 0.1))),
  minBalance: parseEther(String(numberFromEnv("DRIP_MIN_BALANCE_MON", 0.05))),
  dailyCap: parseEther(String(numberFromEnv("DRIP_DAILY_CAP_MON", 2))),
  reserve: parseEther("0.02"),
  perIpPerHour: numberFromEnv("DRIP_PER_IP_PER_HOUR", 5),
  attemptCooldownMs: 15_000,
});

export type DripDecision = "skip_has_funds" | "already_dripped" | "daily_cap" | "faucet_empty" | "send";

export interface DripFacts {
  recipientBalance: bigint;
  alreadyDripped: boolean;
  spentToday: bigint;
  dripWalletBalance: bigint;
}

/** Pure decision logic so the rules can be unit-tested. */
export const decideDrip = (facts: DripFacts, config: DripConfig): DripDecision => {
  if (facts.recipientBalance >= config.minBalance) return "skip_has_funds";
  if (facts.alreadyDripped) return "already_dripped";
  if (facts.spentToday + config.amount > config.dailyCap) return "daily_cap";
  if (facts.dripWalletBalance < config.amount + config.reserve) return "faucet_empty";
  return "send";
};

export type DripOutcome =
  | { status: "sent"; hash: string; amountMon: string }
  | { status: "skipped"; reason: string }
  | { status: "denied"; code: DripDecision; message: string };

const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);

const DENIED_MESSAGES: Record<Exclude<DripDecision, "send" | "skip_has_funds">, string> = {
  already_dripped: "This wallet already received its gas MON. Ask a teammate for more test MON.",
  daily_cap: "The gas faucet is resting for today. Try again tomorrow.",
  faucet_empty: "The gas faucet is empty right now. Ask a teammate for test MON.",
};

export const requestDrip = async (rawAddress: string, ip: string): Promise<DripOutcome> => {
  if (!isAddress(rawAddress)) throw new BadRequestError("Enter a valid wallet address.");
  const recipient = getAddress(rawAddress) as Address;
  const config = getDripConfig();
  const key = getDripKey();

  if (!takeHit(`drip:ip:${ip}`, config.perIpPerHour, 60 * 60 * 1000)) {
    throw new RateLimitError("Too many requests from your network. Try again later.");
  }
  if (!takeHit(`drip:addr:${recipient}`, 1, config.attemptCooldownMs)) {
    throw new RateLimitError("Please wait a few seconds before asking again.");
  }

  return exclusive(`drip:${recipient}`, async () => {
    await assertTestnet();
    const state = await getState();
    const now = Date.now();
    if (state.drip.day !== dayKey(now)) {
      state.drip.day = dayKey(now);
      state.drip.spentWei = "0";
    }
    const [recipientBalance, dripWalletBalance] = await Promise.all([
      serverClient.getBalance({ address: recipient }),
      serverClient.getBalance({ address: addressOf(key) }),
    ]);
    const decision = decideDrip(
      {
        recipientBalance,
        alreadyDripped: state.drip.addresses[recipient] !== undefined,
        spentToday: BigInt(state.drip.spentWei),
        dripWalletBalance,
      },
      config,
    );
    if (decision === "skip_has_funds") return { status: "skipped", reason: "Wallet already has enough MON." };
    if (decision !== "send") return { status: "denied", code: decision, message: DENIED_MESSAGES[decision] };

    const tx = await sendNative(key, recipient, config.amount);
    state.drip.addresses[recipient] = now;
    state.drip.spentWei = (BigInt(state.drip.spentWei) + config.amount).toString();
    await saveState();
    return { status: "sent", hash: tx.hash, amountMon: formatEther(config.amount) };
  });
};

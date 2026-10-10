import { ContractFunctionRevertedError, decodeErrorResult, toFunctionSelector, type Abi, type Hex } from "viem";
import { ABIS, COPY } from "@/config";
import type { ActionErrorCode } from "@/types";

/** An error whose message is already safe and friendly to show to the player. */
export class FriendlyError extends Error {
  readonly code: ActionErrorCode;

  constructor(message: string, code: ActionErrorCode = "unknown") {
    super(message);
    this.code = code;
  }
}

export const friendlyMessage = (error: unknown): string =>
  error instanceof FriendlyError ? error.message : COPY.errors.network;

export interface MappedError {
  code: ActionErrorCode;
  message: string;
}

export interface ErrorContext {
  /** What an ERC-20 "insufficient balance" means for the action being sent. */
  insufficient: "koin" | "shares";
}

const ERC20_ERRORS = [
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
] as const;

const ERC20_BALANCE_SELECTOR = toFunctionSelector(ERC20_ERRORS[0].replace("error ", ""));
const ERC20_ALLOWANCE_SELECTOR = toFunctionSelector(ERC20_ERRORS[1].replace("error ", ""));

const ALL_ERROR_ABI: Abi = [...ABIS.market, ...ABIS.bank, ...ABIS.stock, ...ABIS.koin].filter(
  (item) => item.type === "error",
);

const USER_REJECTED_CODES = new Set([4001, "ACTION_REJECTED"]);

const ERROR_TABLE: Record<string, MappedError> = {
  ExceedsBorrowLimit: { code: "exceeds_borrow_limit", message: COPY.errors.borrowLimit },
  UnsafeWithdraw: { code: "unsafe_withdraw", message: COPY.errors.unsafeWithdraw },
  AlreadyClaimed: { code: "already_claimed", message: COPY.errors.alreadyClaimed },
  NothingToHarvest: { code: "nothing_to_harvest", message: COPY.errors.nothingToHarvest },
  StalePrice: { code: "stale_price", message: COPY.errors.stalePrice },
  InsufficientCollateral: { code: "insufficient_shares", message: COPY.errors.insufficientShares },
  ZeroAmount: { code: "invalid_amount", message: COPY.errors.invalidAmount },
  NoDebt: { code: "invalid_amount", message: "You don't have a loan to repay." },
  RepayTooLarge: { code: "invalid_amount", message: "That is more than your loan." },
  NotListed: { code: "unknown_stock", message: COPY.errors.generic },
  InvalidPrice: { code: "stale_price", message: COPY.errors.stalePrice },
};

const unknownError = (message: string = COPY.errors.generic): MappedError => ({ code: "unknown", message });

const errorChain = (error: unknown): unknown[] => {
  const chain: unknown[] = [];
  let current: unknown = error;
  while (current && chain.length < 12) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
};

const decodeRevertName = (item: unknown): string | null => {
  if (!(item instanceof ContractFunctionRevertedError)) return null;
  if (item.data?.errorName) return item.data.errorName;
  const raw: Hex | undefined = item.raw;
  if (!raw) return null;
  const selector = raw.slice(0, 10).toLowerCase();
  if (selector === ERC20_BALANCE_SELECTOR.toLowerCase()) return "ERC20InsufficientBalance";
  if (selector === ERC20_ALLOWANCE_SELECTOR.toLowerCase()) return "ERC20InsufficientAllowance";
  try {
    return decodeErrorResult({ abi: ALL_ERROR_ABI, data: raw }).errorName;
  } catch {
    return null;
  }
};

/** Turns any viem / wallet error into an ActionErrorCode plus an NPC-style English message. */
export const mapContractError = (error: unknown, context: ErrorContext): MappedError => {
  if (error instanceof FriendlyError) return { code: error.code, message: error.message };

  const chain = errorChain(error);

  for (const item of chain) {
    const code = (item as { code?: unknown }).code;
    if (
      USER_REJECTED_CODES.has(code as number | string) ||
      (item as { name?: string }).name === "UserRejectedRequestError"
    ) {
      return { code: "cancelled", message: COPY.errors.cancelled };
    }
  }

  for (const item of chain) {
    const name = decodeRevertName(item);
    if (!name) continue;
    if (name === "ERC20InsufficientBalance") {
      return context.insufficient === "koin"
        ? { code: "insufficient_koin", message: COPY.errors.insufficientKoin }
        : { code: "insufficient_shares", message: COPY.errors.insufficientShares };
    }
    if (name === "ERC20InsufficientAllowance") return unknownError();
    const mapped = ERROR_TABLE[name];
    if (mapped) return mapped;
  }

  for (const item of chain) {
    const name = (item as { name?: string }).name;
    if (name === "InsufficientFundsError") return { code: "insufficient_gas", message: COPY.errors.insufficientGas };
    if (name === "HttpRequestError" || name === "TimeoutError" || name === "RpcRequestError") {
      return { code: "unknown", message: COPY.errors.network };
    }
  }

  const text = chain
    .map((item) => (item as { message?: string }).message ?? "")
    .join(" ")
    .toLowerCase();
  if (text.includes("insufficient funds") || text.includes("exceeds the balance of the account")) {
    return { code: "insufficient_gas", message: COPY.errors.insufficientGas };
  }
  return unknownError();
};

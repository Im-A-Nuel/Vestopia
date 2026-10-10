import { ContractFunctionRevertedError, UserRejectedRequestError, encodeErrorResult, type Abi } from "viem";
import { describe, expect, it } from "vitest";
import { ABIS } from "@/config";
import { FriendlyError, mapContractError } from "@/lib/web3";

const revert = (abi: Abi, errorName: string): ContractFunctionRevertedError =>
  new ContractFunctionRevertedError({
    abi,
    functionName: "borrow",
    data: encodeErrorResult({ abi, errorName } as never),
  });

const wrap = (cause: Error): Error => Object.assign(new Error("wrapper"), { cause });

const koinCtx = { insufficient: "koin" } as const;
const shareCtx = { insufficient: "shares" } as const;

describe("mapContractError", () => {
  it.each([
    ["ExceedsBorrowLimit", "exceeds_borrow_limit"],
    ["UnsafeWithdraw", "unsafe_withdraw"],
    ["NothingToHarvest", "nothing_to_harvest"],
    ["AlreadyClaimed", "already_claimed"],
    ["StalePrice", "stale_price"],
    ["ZeroAmount", "invalid_amount"],
  ])("maps %s", (name, code) => {
    const abi = name === "ExceedsBorrowLimit" || name === "UnsafeWithdraw" ? ABIS.bank : ABIS.market;
    const mapped = mapContractError(wrap(revert(abi, name)), koinCtx);
    expect(mapped.code).toBe(code);
    expect(mapped.message.length).toBeGreaterThan(5);
  });

  it("maps a wallet rejection to a friendly cancelled message", () => {
    const mapped = mapContractError(wrap(new UserRejectedRequestError(new Error("denied"))), koinCtx);
    expect(mapped.code).toBe("cancelled");
    expect(mapped.message).toMatch(/cancelled/i);
  });

  it("maps a raw 4001 error code to cancelled", () => {
    expect(mapContractError(Object.assign(new Error("x"), { code: 4001 }), koinCtx).code).toBe("cancelled");
  });

  it("uses the context to explain ERC-20 insufficient balance", () => {
    const erc20 = {
      type: "error",
      name: "ERC20InsufficientBalance",
      inputs: [
        { name: "sender", type: "address" },
        { name: "balance", type: "uint256" },
        { name: "needed", type: "uint256" },
      ],
    } as const;
    const data = encodeErrorResult({
      abi: [erc20],
      errorName: "ERC20InsufficientBalance",
      args: ["0x0000000000000000000000000000000000000001", 1n, 2n],
    });
    const error = new ContractFunctionRevertedError({ abi: ABIS.market, functionName: "buy", data });
    expect(mapContractError(error, koinCtx).code).toBe("insufficient_koin");
    expect(mapContractError(error, shareCtx).code).toBe("insufficient_shares");
  });

  it("maps out-of-gas wallets, RPC failures and unknown errors", () => {
    const noGas = Object.assign(new Error("x"), { name: "InsufficientFundsError" });
    expect(mapContractError(noGas, koinCtx).code).toBe("insufficient_gas");
    const rpc = wrap(Object.assign(new Error("x"), { name: "HttpRequestError" }));
    expect(mapContractError(rpc, koinCtx).message).toMatch(/Monad Testnet/);
    expect(mapContractError(new Error("boom"), koinCtx).code).toBe("unknown");
  });

  it("keeps FriendlyError codes", () => {
    expect(mapContractError(new FriendlyError("hi", "wrong_network"), koinCtx)).toEqual({
      code: "wrong_network",
      message: "hi",
    });
  });
});

import { createPublicClient, createWalletClient, http, type Abi, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { MONAD_RPC_URL, MONAD_TESTNET_CHAIN_ID, monadTestnet } from "@/config";
import type { TxReport } from "@/types";
import { ServerConfigError } from "./env";
import { serialize } from "./lock";

export const serverClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC_URL, { retryCount: 3, retryDelay: 400 }),
});

interface Globals {
  __vestopiaChecked?: boolean;
}

const globals = globalThis as Globals;

/** Refuses to run against anything but Monad Testnet (chain id 10143). */
export const assertTestnet = async (): Promise<void> => {
  if (globals.__vestopiaChecked) return;
  const id = await serverClient.getChainId();
  if (id !== MONAD_TESTNET_CHAIN_ID) throw new ServerConfigError("The configured RPC is not Monad Testnet.");
  globals.__vestopiaChecked = true;
};

export const addressOf = (key: Hex): Address => privateKeyToAccount(key).address;

const walletFor = (key: Hex) =>
  createWalletClient({ account: privateKeyToAccount(key), chain: monadTestnet, transport: http(MONAD_RPC_URL) });

export interface TxCall {
  label: string;
  address: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
}

/** Simulate, send, wait for the receipt. Sends from one account are serialized to keep nonces ordered. */
export const sendFrom = (key: Hex, call: TxCall): Promise<TxReport> => {
  const account = privateKeyToAccount(key);
  return serialize(account.address, async () => {
    await assertTestnet();
    const { request } = await serverClient.simulateContract({
      account,
      address: call.address,
      abi: call.abi,
      functionName: call.functionName,
      args: call.args,
    } as Parameters<typeof serverClient.simulateContract>[0]);
    const wallet = walletFor(key);
    const hash = await wallet.writeContract(request as Parameters<typeof wallet.writeContract>[0]);
    const receipt = await serverClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`Transaction "${call.label}" reverted.`);
    return { label: call.label, hash, gasUsed: receipt.gasUsed.toString() };
  });
};

/** Sends native MON. Serialized per sender with every other transaction from the same key. */
export const sendNative = (key: Hex, to: Address, value: bigint): Promise<TxReport> => {
  const account = privateKeyToAccount(key);
  return serialize(account.address, async () => {
    await assertTestnet();
    const hash = await walletFor(key).sendTransaction({ to, value });
    const receipt = await serverClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("The MON transfer reverted.");
    return { label: "Gas drip", hash, gasUsed: receipt.gasUsed.toString() };
  });
};

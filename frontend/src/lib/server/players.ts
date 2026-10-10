import { getAddress, isAddress, parseAbiItem, type Address } from "viem";
import { ABIS, ADDRESSES } from "@/config";
import deployment from "@/config/deployment.json";
import { serverClient } from "./chain";
import { getState, saveState } from "./state";

/** The public RPC rejects eth_getLogs ranges larger than 100 blocks. */
export const LOG_WINDOW = 100;

const STARTER_CLAIMED = parseAbiItem("event StarterClaimed(address indexed player)");

export type BlockWindow = [from: bigint, to: bigint];

/** Splits [from, to] into consecutive windows of at most `size` blocks. */
export const planWindows = (from: bigint, to: bigint, size: number = LOG_WINDOW): BlockWindow[] => {
  const windows: BlockWindow[] = [];
  for (let start = from; start <= to; start += BigInt(size)) {
    const end = start + BigInt(size) - 1n;
    windows.push([start, end > to ? to : end]);
  }
  return windows;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(task: () => Promise<T>, attempts = 4): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      await sleep(300 * 2 ** attempt);
    }
  }
  throw lastError;
};

export interface ScanResult {
  scannedTo: number;
  added: number;
  /** False when the call stopped early (window budget or a failing RPC); run it again to continue. */
  complete: boolean;
}

interface ScanOptions {
  concurrency?: number;
  maxWindows?: number;
}

/**
 * Incremental scan of StarterClaimed logs from the last scanned block (or the deploy block).
 * Windows run in parallel in batches; the cursor only moves past a batch when every window in it succeeded,
 * so there are never gaps.
 */
export const scanPlayers = async ({ concurrency = 8, maxWindows = 1500 }: ScanOptions = {}): Promise<ScanResult> => {
  const state = await getState();
  const head = await serverClient.getBlockNumber();
  const start = BigInt(
    state.players.lastScannedBlock !== null ? state.players.lastScannedBlock + 1 : deployment.deployBlock,
  );
  const windows = planWindows(start, head).slice(0, maxWindows);
  const known = new Set(state.players.addresses);
  let added = 0;
  let complete = windows.length === 0 || windows[windows.length - 1][1] === head;

  for (let index = 0; index < windows.length; index += concurrency) {
    const batch = windows.slice(index, index + concurrency);
    try {
      const results = await Promise.all(
        batch.map(([fromBlock, toBlock]) =>
          withRetry(() =>
            serverClient.getLogs({ address: ADDRESSES.market, event: STARTER_CLAIMED, fromBlock, toBlock }),
          ),
        ),
      );
      results.flat().forEach((log) => {
        const player = log.args.player;
        if (player && !known.has(player)) {
          known.add(player);
          state.players.addresses.push(player);
          added += 1;
        }
      });
      state.players.lastScannedBlock = Number(batch[batch.length - 1][1]);
    } catch {
      complete = false;
      break;
    }
  }
  await saveState();
  return { scannedTo: state.players.lastScannedBlock ?? 0, added, complete };
};

/** Fast path: the client reports a claim; the server only saves the address after checking it on-chain. */
export const registerPlayer = async (address: string): Promise<boolean> => {
  if (!isAddress(address)) return false;
  const player = getAddress(address) as Address;
  const state = await getState();
  if (state.players.addresses.includes(player)) return true;
  const claimed = (await serverClient.readContract({
    address: ADDRESSES.market,
    abi: ABIS.market,
    functionName: "starterClaimed",
    args: [player],
  })) as boolean;
  if (!claimed) return false;
  state.players.addresses.push(player);
  await saveState();
  return true;
};

export const getPlayerList = async (): Promise<Address[]> => (await getState()).players.addresses as Address[];

import { formatEther } from "viem";
import type { ChainHealth } from "@/types";
import { addressOf, serverClient } from "./chain";
import { getAdminKey, getDripKey } from "./env";
import { readOracle } from "./oracle";
import { getState } from "./state";

interface Globals {
  __vestopiaHealth?: { at: number; value: ChainHealth };
}

const globals = globalThis as Globals;

const CACHE_MS = 5000;

const balanceOf = async (read: () => `0x${string}`): Promise<string | null> => {
  try {
    return formatEther(await serverClient.getBalance({ address: addressOf(read()) }));
  } catch {
    return null;
  }
};

/** No secrets: only chain facts and counts. Cached for a few seconds because it is public. */
export const getHealth = async (): Promise<ChainHealth> => {
  const cached = globals.__vestopiaHealth;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  const [chainId, block, adminBalanceMon, dripBalanceMon, oracle, state] = await Promise.all([
    serverClient.getChainId(),
    serverClient.getBlockNumber(),
    balanceOf(getAdminKey),
    balanceOf(getDripKey),
    readOracle().catch(() => null),
    getState(),
  ]);
  const value: ChainHealth = {
    chainId: chainId,
    block: block.toString(),
    adminBalanceMon,
    dripBalanceMon,
    oraclePriceAgeSeconds: oracle ? oracle.oldestAgeSeconds : null,
    oracleStale: oracle ? oracle.oldestAgeSeconds >= 3600 : false,
    players: state.players.addresses.length,
    lastScannedBlock: state.players.lastScannedBlock,
    checkedAt: Date.now(),
  };
  globals.__vestopiaHealth = { at: Date.now(), value };
  return value;
};

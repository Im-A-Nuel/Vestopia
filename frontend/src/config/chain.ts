import { defineChain, type Abi, type Address } from "viem";
import koinAbi from "./abi/Koin.json";
import oracleAbi from "./abi/SimOracle.json";
import stockAbi from "./abi/SimStock.json";
import bankAbi from "./abi/VillageBank.json";
import lensAbi from "./abi/VillageLens.json";
import marketAbi from "./abi/VillageMarket.json";
import deployment from "./deployment.json";

export const MONAD_TESTNET_CHAIN_ID = 10143;

export const DEFAULT_MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";

export const MONAD_RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || DEFAULT_MONAD_RPC_URL;

export const EXPLORER_URL = "https://testnet.monadexplorer.com";

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_RPC_URL] } },
  blockExplorers: { default: { name: "Monad Explorer", url: EXPLORER_URL } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
  testnet: true,
});

export const ABIS = {
  koin: koinAbi as Abi,
  oracle: oracleAbi as Abi,
  stock: stockAbi as Abi,
  bank: bankAbi as Abi,
  lens: lensAbi as Abi,
  market: marketAbi as Abi,
} as const;

export const ADDRESSES = {
  koin: deployment.koin as Address,
  oracle: deployment.oracle as Address,
  market: deployment.market as Address,
  bank: deployment.bank as Address,
  lens: deployment.lens as Address,
} as const;

export const STOCK_ADDRESSES: Readonly<Record<string, Address>> = Object.fromEntries(
  Object.entries(deployment.stocks)
    .filter(([ticker]) => !ticker.startsWith("_"))
    .map(([ticker, address]) => [ticker, address as Address]),
);

export const GAME_BACKEND = process.env.NEXT_PUBLIC_GAME_BACKEND === "chain" ? "chain" : "mock";

/** Privy App ID is public by design. Empty means: use the browser-wallet login only. */
export const PRIVY_APP_ID = (process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "").trim();

/** Privy is loaded only in chain mode and only when an App ID is set (mock mode never loads it). */
export const PRIVY_ENABLED = GAME_BACKEND === "chain" && PRIVY_APP_ID !== "";

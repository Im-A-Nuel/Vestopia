import { createWalletClient, custom, getAddress, isAddress, type WalletClient } from "viem";
import { COPY, MONAD_RPC_URL, MONAD_TESTNET_CHAIN_ID, EXPLORER_URL, monadTestnet } from "@/config";
import { FriendlyError } from "./errors";

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

/**
 * Extension point for other login methods. The injected wallet below is the only
 * implementation today; a Mera passkey connector would implement `WalletConnector`
 * and be returned from `selectConnector()` (connectors.ts) without touching the game service.
 */
export interface WalletConnector {
  id: string;
  isAvailable: () => boolean;
  connect: () => Promise<string>;
  getAccount: () => Promise<string | null>;
  getChainId: () => Promise<number | null>;
  switchToTestnet: () => Promise<void>;
  getWalletClient: (address: string) => WalletClient;
  subscribe: (handlers: WalletHandlers) => () => void;
  /** Optional: end the wallet session (Privy log out). */
  disconnect?: () => Promise<void>;
}

export interface WalletHandlers {
  onAccount: (address: string | null) => void;
  onChain: (chainId: number) => void;
}

const MONAD_CHAIN_PARAMS = {
  chainId: `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: [MONAD_RPC_URL],
  blockExplorerUrls: [EXPLORER_URL],
};

const REJECTED = 4001;
const UNKNOWN_CHAIN = 4902;

const errorCode = (error: unknown): number | undefined =>
  typeof error === "object" && error !== null ? (error as { code?: number }).code : undefined;

const getProvider = (): Eip1193Provider | null =>
  typeof window === "undefined" ? null : ((window as { ethereum?: Eip1193Provider }).ethereum ?? null);

const requireProvider = (): Eip1193Provider => {
  const provider = getProvider();
  if (!provider) throw new FriendlyError(COPY.errors.noWallet, "no_wallet");
  return provider;
};

const toChainId = (value: unknown): number | null => {
  if (typeof value === "string") return Number.parseInt(value, value.startsWith("0x") ? 16 : 10);
  return typeof value === "number" ? value : null;
};

const firstAccount = (value: unknown): string | null => {
  const first = Array.isArray(value) ? value[0] : null;
  return typeof first === "string" && isAddress(first) ? getAddress(first) : null;
};

export const injectedConnector: WalletConnector = {
  id: "injected",
  isAvailable: () => getProvider() !== null,

  async connect() {
    const provider = requireProvider();
    try {
      const account = firstAccount(await provider.request({ method: "eth_requestAccounts" }));
      if (!account) throw new FriendlyError(COPY.errors.connectFailed);
      return account;
    } catch (error) {
      if (error instanceof FriendlyError) throw error;
      if (errorCode(error) === REJECTED) throw new FriendlyError(COPY.errors.cancelled, "cancelled");
      throw new FriendlyError(COPY.errors.connectFailed);
    }
  },

  async getAccount() {
    const provider = getProvider();
    if (!provider) return null;
    try {
      return firstAccount(await provider.request({ method: "eth_accounts" }));
    } catch {
      return null;
    }
  },

  async getChainId() {
    const provider = getProvider();
    if (!provider) return null;
    try {
      return toChainId(await provider.request({ method: "eth_chainId" }));
    } catch {
      return null;
    }
  },

  async switchToTestnet() {
    const provider = requireProvider();
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_CHAIN_PARAMS.chainId }],
      });
    } catch (error) {
      if (errorCode(error) === REJECTED) throw new FriendlyError(COPY.errors.cancelled, "cancelled");
      if (errorCode(error) !== UNKNOWN_CHAIN) throw new FriendlyError(COPY.errors.wrongNetwork, "wrong_network");
      try {
        await provider.request({ method: "wallet_addEthereumChain", params: [MONAD_CHAIN_PARAMS] });
      } catch (addError) {
        if (errorCode(addError) === REJECTED) throw new FriendlyError(COPY.errors.cancelled, "cancelled");
        throw new FriendlyError(COPY.errors.wrongNetwork, "wrong_network");
      }
    }
  },

  getWalletClient(address) {
    return createWalletClient({
      account: address as `0x${string}`,
      chain: monadTestnet,
      transport: custom(requireProvider()),
    });
  },

  subscribe({ onAccount, onChain }) {
    const provider = getProvider();
    if (!provider?.on) return () => undefined;
    const accountsChanged = (accounts: unknown): void => onAccount(firstAccount(accounts));
    const chainChanged = (chainId: unknown): void => {
      const next = toChainId(chainId);
      if (next !== null) onChain(next);
    };
    provider.on("accountsChanged", accountsChanged);
    provider.on("chainChanged", chainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", accountsChanged);
      provider.removeListener?.("chainChanged", chainChanged);
    };
  },
};

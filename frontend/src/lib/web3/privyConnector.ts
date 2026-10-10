import { createWalletClient, custom, getAddress, type EIP1193Provider } from "viem";
import { COPY, MONAD_TESTNET_CHAIN_ID, monadTestnet } from "@/config";
import { FriendlyError } from "./errors";
import { privyBridge, type PrivyBridgeApi, type PrivyWalletLike } from "./privyBridge";
import type { WalletConnector } from "./wallet";

/** "eip155:10143" -> 10143 */
export const parseCaip2ChainId = (value: string): number | null => {
  const id = Number(value.split(":").pop());
  return Number.isInteger(id) && id > 0 ? id : null;
};

const toChecksum = (address: string): string => getAddress(address);

/** Login with email, Google or an external wallet through Privy; embedded wallets need no browser extension. */
export const createPrivyConnector = (bridge: PrivyBridgeApi = privyBridge): WalletConnector => {
  /** Privy not ready (still loading or blocked): throw instead of reporting "no wallet", so a session is not dropped by mistake. */
  const settle = async (): Promise<void> => {
    if (!(await bridge.waitSettled())) throw new FriendlyError(COPY.errors.connectFailed);
  };

  const requireWallet = (): PrivyWalletLike => {
    const wallet = bridge.getState().wallet;
    if (!wallet) throw new FriendlyError(COPY.errors.connectFailed);
    return wallet;
  };

  /** EIP-1193 facade: the Privy provider is fetched lazily so `getWalletClient` can stay synchronous. */
  const lazyProvider = {
    request: async (args: { method: string; params?: unknown }) => {
      const provider = await requireWallet().getEthereumProvider();
      return provider.request(args as Parameters<typeof provider.request>[0]);
    },
  };

  return {
    id: "privy",
    isAvailable: () => true,

    async connect() {
      await settle();
      const current = bridge.getState();
      if (current.authenticated && current.wallet) return toChecksum(current.wallet.address);
      const actions = bridge.getActions();
      if (!actions) throw new FriendlyError(COPY.errors.connectFailed);
      const pending = bridge.waitForWallet();
      actions.openLogin();
      const wallet = await pending;
      return toChecksum(wallet.address);
    },

    async getAccount() {
      await settle();
      const wallet = bridge.getState().wallet;
      return wallet ? toChecksum(wallet.address) : null;
    },

    async getChainId() {
      await settle();
      const wallet = bridge.getState().wallet;
      return wallet ? parseCaip2ChainId(wallet.chainId) : null;
    },

    async switchToTestnet() {
      const wallet = requireWallet();
      try {
        await wallet.switchChain(MONAD_TESTNET_CHAIN_ID);
      } catch {
        throw new FriendlyError(COPY.errors.wrongNetwork, "wrong_network");
      }
    },

    getWalletClient(address) {
      return createWalletClient({
        account: address as `0x${string}`,
        chain: monadTestnet,
        transport: custom(lazyProvider as unknown as EIP1193Provider),
      });
    },

    subscribe({ onAccount, onChain }) {
      let lastAccount: string | null | undefined;
      let lastChain: number | null | undefined;
      return bridge.subscribe((state) => {
        if (!state.settled) return;
        const account = state.wallet ? toChecksum(state.wallet.address) : null;
        const chain = state.wallet ? parseCaip2ChainId(state.wallet.chainId) : null;
        if (lastAccount !== undefined && account !== lastAccount) onAccount(account);
        if (lastChain !== undefined && chain !== null && chain !== lastChain) onChain(chain);
        lastAccount = account;
        lastChain = chain;
      });
    },

    async disconnect() {
      await bridge.getActions()?.logout();
    },
  };
};

export const privyConnector: WalletConnector = createPrivyConnector();

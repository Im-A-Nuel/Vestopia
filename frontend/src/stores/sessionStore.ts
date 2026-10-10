import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COPY, GAME_BACKEND, MONAD_TESTNET_CHAIN_ID } from "@/config";
import {
  FriendlyError,
  generateAddress,
  getActiveConnectorId,
  getConnector,
  isPasskeySupported,
  setActiveConnectorId,
  type ConnectorId,
} from "@/lib";
import type { ActionResult } from "@/types";

interface SessionState {
  address: string | null;
  /** Which login method opened this session. Persisted so a reload uses the same wallet. */
  connectorId: ConnectorId;
  /** Chain id the wallet is currently on (chain backend only). */
  chainId: number | null;
  login: (connectorId?: ConnectorId) => Promise<ActionResult>;
  logout: () => void;
  setAddress: (address: string | null) => void;
  setChainId: (chainId: number | null) => void;
  switchNetwork: () => Promise<ActionResult>;
}

const fail = (error: unknown): ActionResult =>
  error instanceof FriendlyError
    ? { status: "error", code: error.code, message: error.message }
    : { status: "error", code: "unknown", message: COPY.errors.generic };

export const isWrongNetwork = (chainId: number | null): boolean =>
  GAME_BACKEND === "chain" && chainId !== null && chainId !== MONAD_TESTNET_CHAIN_ID;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      address: null,
      connectorId: "injected",
      chainId: null,
      login: async (connectorId = "injected") => {
        if (GAME_BACKEND === "chain") {
          const previous = getActiveConnectorId();
          setActiveConnectorId(connectorId);
          const connector = getConnector();
          try {
            const address = await connector.connect();
            let chainId = await connector.getChainId();
            if (chainId !== MONAD_TESTNET_CHAIN_ID) {
              try {
                await connector.switchToTestnet();
                chainId = await connector.getChainId();
              } catch {
                // The village shows a one-click "Switch to Monad Testnet" banner instead.
              }
            }
            set({ address, chainId, connectorId });
            return { status: "success", message: "Wallet connected." };
          } catch (error) {
            setActiveConnectorId(previous);
            return fail(error);
          }
        }
        if (!isPasskeySupported()) {
          return { status: "error", code: "passkey_unsupported", message: COPY.errors.passkeyUnsupported };
        }
        set({ address: generateAddress() });
        return { status: "success", message: "Signed in with passkey." };
      },
      logout: () => {
        if (GAME_BACKEND === "chain") void getConnector().disconnect?.().catch(() => undefined);
        setActiveConnectorId("injected");
        set({ address: null, chainId: null, connectorId: "injected" });
      },
      setAddress: (address) => set({ address }),
      setChainId: (chainId) => set({ chainId }),
      switchNetwork: async () => {
        const connector = getConnector();
        try {
          await connector.switchToTestnet();
          set({ chainId: await connector.getChainId() });
          return { status: "success", message: "Switched to Monad Testnet." };
        } catch (error) {
          return fail(error);
        }
      },
    }),
    {
      name: "vestopia.session",
      partialize: (state) => ({ address: state.address, connectorId: state.connectorId }),
      onRehydrateStorage: () => (state) => {
        if (state) setActiveConnectorId(state.connectorId ?? "injected");
      },
    },
  ),
);

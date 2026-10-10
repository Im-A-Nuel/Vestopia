"use client";

import { useEffect } from "react";
import { GAME_BACKEND } from "@/config";
import { getConnector } from "@/lib";
import { useGameStore, useSessionStore } from "@/stores";

/** Keeps the session in step with the wallet: account switches, network switches and disconnects. */
export const useWalletSync = (): void => {
  const address = useSessionStore((state) => state.address);

  useEffect(() => {
    if (GAME_BACKEND !== "chain" || !address) return;
    const connector = getConnector();
    const session = useSessionStore.getState();

    const applyAccount = (account: string | null): void => {
      const current = useSessionStore.getState().address;
      if (account === null) {
        useGameStore.getState().reset();
        useSessionStore.getState().logout();
      } else if (current && account.toLowerCase() !== current.toLowerCase()) {
        useGameStore.getState().reset();
        useSessionStore.getState().setAddress(account);
      }
    };

    // A rejection means "wallet not ready yet": keep the session instead of signing the player out.
    void connector.getChainId().then((chainId) => session.setChainId(chainId)).catch(() => undefined);
    void connector.getAccount().then(applyAccount).catch(() => undefined);

    return connector.subscribe({
      onAccount: applyAccount,
      onChain: (chainId) => useSessionStore.getState().setChainId(chainId),
    });
  }, [address]);
};

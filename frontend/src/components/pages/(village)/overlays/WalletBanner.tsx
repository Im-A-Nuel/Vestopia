"use client";

import { toast } from "sonner";
import { GAME_BACKEND } from "@/config";
import { isWrongNetwork, useGameStore, useSessionStore } from "@/stores";

export function WalletBanner() {
  const chainId = useSessionStore((state) => state.chainId);
  const switchNetwork = useSessionStore((state) => state.switchNetwork);
  const txPhase = useGameStore((state) => state.txPhase);

  if (GAME_BACKEND !== "chain") return null;

  const onSwitch = async (): Promise<void> => {
    const result = await switchNetwork();
    if (result.status === "error") toast.error(result.message);
  };

  if (isWrongNetwork(chainId)) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-muted px-4 py-2 text-sm font-bold text-caution">
        <span>Your wallet is on a different network.</span>
        <button type="button" className="btn btn-primary" onClick={() => void onSwitch()}>
          Switch to Monad Testnet
        </button>
      </div>
    );
  }

  if (!txPhase) return null;
  return (
    <p role="status" className="bg-muted px-4 py-2 text-center text-sm font-bold">
      {txPhase}
    </p>
  );
}

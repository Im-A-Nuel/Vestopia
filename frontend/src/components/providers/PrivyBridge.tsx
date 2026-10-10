"use client";

import { useLogin, usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { useEffect } from "react";
import { privyBridge, type Eip1193Provider, type PrivyWalletLike } from "@/lib/web3";

const adapt = (wallet: ConnectedWallet): PrivyWalletLike => ({
  address: wallet.address,
  chainId: wallet.chainId,
  switchChain: (chainId) => wallet.switchChain(chainId),
  getEthereumProvider: async () => (await wallet.getEthereumProvider()) as unknown as Eip1193Provider,
});

/** Prefer the account Privy treats as the user's wallet; fall back to the first connected one. */
const pickWallet = (wallets: ConnectedWallet[], primary: string | undefined): ConnectedWallet | null =>
  wallets.find((wallet) => wallet.address.toLowerCase() === primary?.toLowerCase()) ?? wallets[0] ?? null;

/** Pushes the live Privy state into `privyBridge` so non-React game code can use it. Renders nothing. */
export function PrivyBridge() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  useLogin({ onError: (error) => privyBridge.failLogin(error) });

  const wallet = authenticated ? pickWallet(wallets, user?.wallet?.address) : null;

  useEffect(() => {
    privyBridge.update(
      {
        // A logged-out user is settled right away; a logged-in user is settled once the wallet list is loaded.
        settled: ready && (!authenticated || walletsReady),
        authenticated,
        wallet: wallet ? adapt(wallet) : null,
      },
      { openLogin: () => login(), logout: () => logout() },
    );
  }, [ready, authenticated, walletsReady, wallet, login, logout]);

  return null;
}

"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_APP_ID, monadTestnet } from "@/config";
import { PrivyBridge } from "./PrivyBridge";

export function PrivyShell() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          // Embedded wallets sign silently, so the game does not interrupt every action with a modal.
          showWalletUIs: false,
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
      }}
    >
      <PrivyBridge />
    </PrivyProvider>
  );
}

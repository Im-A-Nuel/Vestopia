import { PRIVY_ENABLED } from "@/config";
import { privyConnector } from "./privyConnector";
import { injectedConnector, type WalletConnector } from "./wallet";

export type ConnectorId = "injected" | "privy";

let activeId: ConnectorId = "injected";

/** Picks the connector for an id. Privy is only used when it is configured; otherwise the browser wallet. */
export const selectConnector = (
  id: ConnectorId,
  privyEnabled: boolean = PRIVY_ENABLED,
  privy: WalletConnector = privyConnector,
): WalletConnector => (id === "privy" && privyEnabled ? privy : injectedConnector);

export const setActiveConnectorId = (id: ConnectorId): void => {
  activeId = id;
};

export const getActiveConnectorId = (): ConnectorId => activeId;

/** The active login method. The session store sets the id; the game service never needs to know which one. */
export const getConnector = (): WalletConnector => selectConnector(activeId);

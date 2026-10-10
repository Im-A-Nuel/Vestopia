import { COPY } from "@/config";
import { FriendlyError } from "./errors";
import type { Eip1193Provider } from "./wallet";

/** The small part of a Privy wallet the game needs. `PrivyBridge` adapts the real SDK object to this. */
export interface PrivyWalletLike {
  address: string;
  /** CAIP-2 string such as "eip155:10143". */
  chainId: string;
  switchChain: (chainId: number) => Promise<void>;
  getEthereumProvider: () => Promise<Eip1193Provider>;
}

export interface PrivyBridgeState {
  /** Privy and its wallet list finished loading (a logged-out user is "settled" with no wallet). */
  settled: boolean;
  authenticated: boolean;
  wallet: PrivyWalletLike | null;
}

export interface PrivyBridgeActions {
  openLogin: () => void;
  logout: () => Promise<void>;
}

type Listener = (state: PrivyBridgeState) => void;

interface Waiter {
  resolve: (wallet: PrivyWalletLike) => void;
  reject: (error: Error) => void;
}

const SETTLE_TIMEOUT_MS = 10_000;

/**
 * Game services are plain modules and cannot use React hooks. `PrivyBridge` (a client component inside
 * PrivyProvider) pushes the live Privy state in here, and the `privy` connector reads it back out.
 */
export const createPrivyBridge = () => {
  let state: PrivyBridgeState = { settled: false, authenticated: false, wallet: null };
  let actions: PrivyBridgeActions | null = null;
  const listeners = new Set<Listener>();
  let waiters: Waiter[] = [];

  const update = (next: PrivyBridgeState, nextActions: PrivyBridgeActions): void => {
    state = next;
    actions = nextActions;
    if (next.authenticated && next.wallet) {
      const ready = waiters;
      waiters = [];
      ready.forEach((waiter) => waiter.resolve(next.wallet as PrivyWalletLike));
    }
    listeners.forEach((listener) => listener(next));
  };

  const reset = (): void => {
    state = { settled: false, authenticated: false, wallet: null };
    actions = null;
    waiters = [];
    listeners.clear();
  };

  /** Resolves true when Privy is ready, or false after a timeout so a blocked SDK never hangs the game. */
  const waitSettled = (timeoutMs: number = SETTLE_TIMEOUT_MS): Promise<boolean> =>
    new Promise((resolve) => {
      if (state.settled) return resolve(true);
      const timer = setTimeout(() => done(false), timeoutMs);
      const unsubscribe = subscribe((next) => {
        if (next.settled) done(true);
      });
      function done(settled: boolean): void {
        clearTimeout(timer);
        unsubscribe();
        resolve(settled);
      }
    });

  /** Resolves with the wallet once the user is logged in. Rejected by `failLogin`. */
  const waitForWallet = (): Promise<PrivyWalletLike> =>
    new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
    });

  /** Called when the login modal is closed or fails. Never exposes SDK internals. */
  const failLogin = (reason: unknown): void => {
    const cancelled = reason === "exited_auth_flow" || reason === "user_exited_auth_flow";
    const error = cancelled
      ? new FriendlyError(COPY.errors.cancelled, "cancelled")
      : new FriendlyError(COPY.errors.connectFailed);
    const pending = waiters;
    waiters = [];
    pending.forEach((waiter) => waiter.reject(error));
  };

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    update,
    reset,
    subscribe,
    waitSettled,
    waitForWallet,
    failLogin,
    getState: (): PrivyBridgeState => state,
    getActions: (): PrivyBridgeActions | null => actions,
  };
};

export type PrivyBridgeApi = ReturnType<typeof createPrivyBridge>;

export const privyBridge: PrivyBridgeApi = createPrivyBridge();

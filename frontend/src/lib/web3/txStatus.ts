export type TxPhase = string | null;

type Listener = (phase: TxPhase) => void;

const listeners = new Set<Listener>();

let current: TxPhase = null;

/** Tiny pub/sub so the service can tell the UI what step of a transaction it is on. */
export const setTxPhase = (phase: TxPhase): void => {
  current = phase;
  listeners.forEach((listener) => listener(phase));
};

export const getTxPhase = (): TxPhase => current;

export const subscribeTxPhase = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

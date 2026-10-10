export class BusyError extends Error {}

interface Globals {
  __vestopiaHeld?: Set<string>;
  __vestopiaTails?: Map<string, Promise<unknown>>;
}

const globals = globalThis as Globals;

/** Rejects (instead of queueing) when `name` is already running, so a double-click cannot repeat an action. */
export const exclusive = async <T>(name: string, task: () => Promise<T>): Promise<T> => {
  const held = (globals.__vestopiaHeld ??= new Set<string>());
  if (held.has(name)) throw new BusyError("That action is already running. Wait for it to finish.");
  held.add(name);
  try {
    return await task();
  } finally {
    held.delete(name);
  }
};

/** Runs tasks one after another per key. Used per sender account so two transactions never share a nonce. */
export const serialize = <T>(key: string, task: () => Promise<T>): Promise<T> => {
  const tails = (globals.__vestopiaTails ??= new Map<string, Promise<unknown>>());
  const previous = tails.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  tails.set(key, next);
  return next;
};

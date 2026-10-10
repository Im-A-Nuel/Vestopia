import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LatestEvent } from "@/types";

export interface ServerState {
  players: { addresses: string[]; lastScannedBlock: number | null };
  drip: { addresses: Record<string, number>; day: string; spentWei: string };
  events: { latest: LatestEvent | null; log: LatestEvent[] };
}

const MAX_LOG = 20;

const STATE_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(STATE_DIR, "server-state.json");

const emptyState = (): ServerState => ({
  players: { addresses: [], lastScannedBlock: null },
  drip: { addresses: {}, day: "", spentWei: "0" },
  events: { latest: null, log: [] },
});

interface Globals {
  __vestopiaState?: Promise<ServerState>;
  __vestopiaWrite?: Promise<void>;
}

const globals = globalThis as Globals;

const load = async (): Promise<ServerState> => {
  try {
    const parsed = JSON.parse(await readFile(STATE_FILE, "utf8")) as Partial<ServerState>;
    const fresh = emptyState();
    return {
      players: { ...fresh.players, ...parsed.players },
      drip: { ...fresh.drip, ...parsed.drip },
      events: { ...fresh.events, ...parsed.events },
    };
  } catch {
    return emptyState();
  }
};

/**
 * Server state lives in memory (shared through globalThis) and is mirrored to `.data/server-state.json`
 * so a dev-server restart keeps the player list, drip history and event log.
 * A serverless host has no durable disk: swap this module for a real store (KV / Postgres) there.
 */
export const getState = (): Promise<ServerState> => {
  globals.__vestopiaState ??= load();
  return globals.__vestopiaState;
};

export const saveState = async (): Promise<void> => {
  const state = await getState();
  const snapshot = JSON.stringify(state, null, 2);
  const previous = globals.__vestopiaWrite ?? Promise.resolve();
  globals.__vestopiaWrite = previous
    .catch(() => undefined)
    .then(async () => {
      try {
        await mkdir(STATE_DIR, { recursive: true });
        const temp = `${STATE_FILE}.tmp`;
        await writeFile(temp, snapshot, "utf8");
        await rename(temp, STATE_FILE);
      } catch {
        // Read-only disk (serverless): keep working from memory.
      }
    });
  await globals.__vestopiaWrite;
};

export const appendEvent = async (event: Omit<LatestEvent, "sequence">): Promise<LatestEvent> => {
  const state = await getState();
  const entry: LatestEvent = { ...event, sequence: (state.events.latest?.sequence ?? 0) + 1 };
  state.events.latest = entry;
  state.events.log = [entry, ...state.events.log].slice(0, MAX_LOG);
  await saveState();
  return entry;
};

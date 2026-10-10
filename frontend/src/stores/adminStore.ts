import { toast } from "sonner";
import { create } from "zustand";
import { gameService } from "@/services";
import { COPY, GAME_BACKEND } from "@/config";
import type { ActionResult, ChainHealth, LatestEvent, MarketEventId, MarketSnapshot, TxReport } from "@/types";

interface AdminState {
  market: MarketSnapshot | null;
  log: LatestEvent[];
  pendingId: MarketEventId | null;
  health: ChainHealth | null;
  lastTxs: TxReport[];
  keepaliveBusy: boolean;
  refreshHealth: () => Promise<void>;
  keepalive: () => Promise<ActionResult>;
  refresh: () => Promise<void>;
  trigger: (eventId: MarketEventId) => Promise<ActionResult>;
  resetDemo: () => Promise<ActionResult>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  market: null,
  log: [],
  pendingId: null,
  health: null,
  lastTxs: [],
  keepaliveBusy: false,
  refreshHealth: async () => {
    if (GAME_BACKEND !== "chain") return;
    try {
      const response = await fetch("/api/health");
      if (response.ok) set({ health: (await response.json()) as ChainHealth });
    } catch {
      return;
    }
  },
  keepalive: async () => {
    set({ keepaliveBusy: true });
    let result: ActionResult;
    try {
      const response = await fetch("/api/keepalive", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as Partial<ActionResult>;
      result = {
        status: response.ok ? "success" : "error",
        message: data.message ?? COPY.errors.generic,
        txs: data.txs,
      };
    } catch {
      result = { status: "error", message: COPY.errors.generic };
    }
    set({ keepaliveBusy: false, lastTxs: result.txs ?? get().lastTxs });
    if (result.status === "error") toast.error(result.message);
    else toast.success(result.message);
    await get().refreshHealth();
    return result;
  },
  refresh: async () => {
    const [market, log] = await Promise.all([gameService.getMarket(), gameService.getEventLog()]);
    set({ market, log });
  },
  trigger: async (eventId) => {
    set({ pendingId: eventId });
    const result = await gameService.triggerEvent(eventId);
    set({ pendingId: null, lastTxs: result.txs ?? get().lastTxs });
    if (result.status === "error") toast.error(result.message);
    else toast.success(result.message);
    await get().refresh();
    return result;
  },
  resetDemo: async () => {
    const result = await gameService.resetDemo();
    if (result.txs) set({ lastTxs: result.txs });
    if (result.status === "error") toast.error(result.message);
    else toast.success(result.message);
    await get().refresh();
    return result;
  },
}));

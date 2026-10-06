import { toast } from "sonner";
import { create } from "zustand";
import { gameService } from "@/services";
import type { ActionResult, LatestEvent, MarketEventId, MarketSnapshot } from "@/types";

interface AdminState {
  market: MarketSnapshot | null;
  log: LatestEvent[];
  pendingId: MarketEventId | null;
  refresh: () => Promise<void>;
  trigger: (eventId: MarketEventId) => Promise<ActionResult>;
  resetDemo: () => Promise<ActionResult>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  market: null,
  log: [],
  pendingId: null,
  refresh: async () => {
    const [market, log] = await Promise.all([gameService.getMarket(), gameService.getEventLog()]);
    set({ market, log });
  },
  trigger: async (eventId) => {
    set({ pendingId: eventId });
    const result = await gameService.triggerEvent(eventId);
    set({ pendingId: null });
    if (result.status === "error") toast.error(result.message);
    else toast.success(result.message);
    await get().refresh();
    return result;
  },
  resetDemo: async () => {
    const result = await gameService.resetDemo();
    if (result.status === "error") toast.error(result.message);
    else toast.success(result.message);
    await get().refresh();
    return result;
  },
}));

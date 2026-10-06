import { create } from "zustand";
import { gameService } from "@/services";
import type { LatestEvent, MarketEventId } from "@/types";
import { useUiStore } from "./uiStore";

interface EventState {
  latest: LatestEvent | null;
  lastSeenSequence: number | null;
  refresh: () => Promise<void>;
  trigger: (eventId: MarketEventId) => ReturnType<typeof gameService.triggerEvent>;
}

export const useEventStore = create<EventState>()((set, get) => ({
  latest: null,
  lastSeenSequence: null,
  refresh: async () => {
    try {
      const latest = await gameService.getLatestEvent();
      const seen = get().lastSeenSequence;
      set({ latest, lastSeenSequence: latest?.sequence ?? 0 });
      if (latest && seen !== null && latest.sequence > seen) {
        useUiStore.getState().showBanner(latest.banner);
      }
    } catch {
      return;
    }
  },
  trigger: (eventId) => gameService.triggerEvent(eventId),
}));

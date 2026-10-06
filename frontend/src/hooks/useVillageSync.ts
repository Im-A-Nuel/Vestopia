"use client";

import { useEffect } from "react";
import { POLL_INTERVAL_MS } from "@/config";
import { useEventStore, useGameStore, useSessionStore } from "@/stores";

export const useVillageSync = (): void => {
  const address = useSessionStore((state) => state.address);

  useEffect(() => {
    if (!address) return;
    const tick = (): void => {
      if (document.hidden) return;
      void useGameStore.getState().refresh();
      void useEventStore.getState().refresh();
    };
    tick();
    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [address]);
};

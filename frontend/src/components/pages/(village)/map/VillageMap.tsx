"use client";

import type Phaser from "phaser";
import { useCallback, useEffect, useRef, useState } from "react";
import { COPY } from "@/config";
import { useGameStore, useUiStore } from "@/stores";
import type { VillageBridge } from "@/types";

type MapStatus = "loading" | "ready" | "failed";

const readFontFamily = (): string =>
  getComputedStyle(document.documentElement).getPropertyValue("--font-pixel").trim() || "monospace";

const createBridge = (fontFamily: string, onError: () => void): VillageBridge => ({
  fontFamily,
  getPlayer: () => useGameStore.getState().player,
  subscribe: (listener) =>
    useGameStore.subscribe((state, previous) => {
      if (state.player) listener(state.player, previous.player);
    }),
  openDistrict: (sector) => useUiStore.getState().openDistrict(sector),
  openShop: (focus) => useUiStore.getState().openShop(focus),
  openBank: () => useUiStore.getState().openBank(),
  harvest: (stockId) => void useGameStore.getState().harvest(stockId),
  reportError: onError,
});

export function VillageMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  const fail = useCallback((): void => setStatus("failed"), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let game: Phaser.Game | null = null;
    let cancelled = false;

    const boot = async (): Promise<void> => {
      try {
        const fontFamily = readFontFamily();
        await document.fonts.load(`10px ${fontFamily}`).catch(() => undefined);
        const { createVillageGame } = await import("./createVillageGame");
        if (cancelled) return;
        game = createVillageGame(container, createBridge(fontFamily, fail));
        game.events.once("ready", () => setStatus((current) => (current === "failed" ? current : "ready")));
      } catch {
        if (!cancelled) fail();
      }
    };

    setStatus("loading");
    void boot();

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [attempt, fail]);

  return (
    <div className="bg-grass absolute inset-0 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label="Village map. Use the location buttons to open places with a keyboard."
      />
      {status === "loading" && (
        <p role="status" className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">
          Loading the map...
        </p>
      )}
      {status === "failed" && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-default px-6 text-center"
        >
          <p className="font-bold">{COPY.errors.mapFailed}</p>
          <button type="button" className="btn btn-primary" onClick={() => setAttempt((value) => value + 1)}>
            Reload the map
          </button>
        </div>
      )}
    </div>
  );
}

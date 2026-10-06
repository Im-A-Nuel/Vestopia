"use client";

import type Phaser from "phaser";
import { useEffect, useRef, useState } from "react";
import { useGameStore, useUiStore } from "@/stores";
import type { VillageBridge } from "@/types";

const readFontFamily = (): string =>
  getComputedStyle(document.documentElement).getPropertyValue("--font-pixel").trim() || "monospace";

const createBridge = (fontFamily: string): VillageBridge => ({
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
});

export default function VillageMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let game: Phaser.Game | null = null;
    let cancelled = false;

    const boot = async (): Promise<void> => {
      const fontFamily = readFontFamily();
      await document.fonts.load(`10px ${fontFamily}`).catch(() => undefined);
      const { createVillageGame } = await import("./createVillageGame");
      if (cancelled) return;
      game = createVillageGame(container, createBridge(fontFamily));
      game.events.once("ready", () => setReady(true));
    };

    void boot();

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#7BB661]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label="Village map. Use the location buttons to open places with a keyboard."
      />
      {!ready && (
        <p role="status" className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">
          Loading the map...
        </p>
      )}
    </div>
  );
}

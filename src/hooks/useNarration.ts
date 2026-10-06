"use client";

import { useEffect } from "react";
import { COPY, getSector } from "@/config";
import { diffPlayers } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";

export const useNarration = (): void => {
  useEffect(
    () =>
      useGameStore.subscribe((state, previous) => {
        if (!state.player || !previous.player) return;
        const ui = useUiStore.getState();

        diffPlayers(previous.player, state.player).forEach((change) => {
          if (change.type === "unlock") {
            const sector = getSector(change.sector);
            ui.showBanner(COPY.unlockedBanner(sector.district));
            ui.say("guide", sector.lore);
          }
          if (change.type === "relock") {
            ui.say("guide", COPY.relocked(getSector(change.sector).district));
          }
          if (change.type === "weather" && change.to === "stormy") {
            ui.say("banker", COPY.stormWarning);
          }
          if (change.type === "harvest-collected" && ui.markTipSeen("first-harvest")) {
            ui.say("guide", COPY.firstHarvest);
          }
        });
      }),
    [],
  );
};

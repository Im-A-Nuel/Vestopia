"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { QUESTS } from "@/config";
import { diffPlayers } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { PlayerView, QuestId } from "@/types";

const reached = (player: PlayerView): QuestId[] => {
  const done: QuestId[] = [];
  if (player.portfolioValue > 0) done.push("first-shares");
  if (player.sectors.some((sector) => sector.unlocked)) done.push("unlock-district");
  if (player.collateralValue > 0) done.push("collateral");
  if (player.debt > 0) done.push("borrow");
  return done;
};

const complete = (ids: QuestId[]): void => {
  const ui = useUiStore.getState();
  ids.forEach((id) => {
    if (!ui.completeQuest(id)) return;
    const quest = QUESTS.find((item) => item.id === id);
    if (quest) toast.success(`Quest complete: ${quest.title}`);
  });
};

export const useQuestProgress = (): void => {
  useEffect(() => {
    const initial = useGameStore.getState().player;
    if (initial) reached(initial).forEach((id) => useUiStore.getState().completeQuest(id));
    return useGameStore.subscribe((state, previous) => {
      if (!state.player) return;
      const ids = reached(state.player);
      if (
        previous.player &&
        diffPlayers(previous.player, state.player).some((change) => change.type === "harvest-collected")
      ) {
        ids.push("harvest");
      }
      complete(ids);
    });
  }, []);
};

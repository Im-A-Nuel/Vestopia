"use client";

import { ASSETS, SECTORS } from "@/config";
import { useGameStore, useUiStore } from "@/stores";
import { GameImage } from "@/components/pages/(shared)";

export function LocationBar() {
  const player = useGameStore((state) => state.player);
  const openShop = useUiStore((state) => state.openShop);
  const openBank = useUiStore((state) => state.openBank);
  const openDistrict = useUiStore((state) => state.openDistrict);

  if (!player) return null;

  return (
    <nav aria-label="Village locations" className="flex gap-2 overflow-x-auto border-t border-line bg-surface px-4 py-2">
      <button type="button" className="btn btn-primary shrink-0" onClick={() => openShop({})}>
        Village Shop
      </button>
      <button type="button" className="btn btn-primary shrink-0" onClick={() => openBank()}>
        Village Bank
      </button>
      {SECTORS.map((sector) => {
        const unlocked = player.sectors.find((item) => item.id === sector.id)?.unlocked ?? false;
        return (
          <button key={sector.id} type="button" className="btn btn-secondary shrink-0" onClick={() => openDistrict(sector.id)}>
            <GameImage src={ASSETS.sectorIcon(sector.id)} alt="" width={20} />
            {sector.district}
            <span className="text-xs font-semibold text-soft">{unlocked ? "" : "Locked"}</span>
          </button>
        );
      })}
    </nav>
  );
}

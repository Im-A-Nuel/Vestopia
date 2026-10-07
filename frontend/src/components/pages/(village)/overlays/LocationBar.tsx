"use client";

import { ASSETS, SECTORS } from "@/config";
import { useGameStore, useUiStore } from "@/stores";
import { GameImage } from "@/components/pages/(shared)";

const LOCATION_BUTTON = "btn shrink-0 !px-3 !py-1.5 text-sm sm:!px-4 sm:text-[0.9375rem]";

export function LocationBar() {
  const player = useGameStore((state) => state.player);
  const openShop = useUiStore((state) => state.openShop);
  const openBank = useUiStore((state) => state.openBank);
  const openDistrict = useUiStore((state) => state.openDistrict);

  if (!player) return null;

  return (
    <nav
      aria-label="Village locations"
      className="px-safe pb-safe flex snap-x gap-2 overflow-x-auto border-t border-line bg-surface pt-2"
    >
      <button type="button" className={`${LOCATION_BUTTON} btn-primary`} onClick={() => openShop({})}>
        Village Shop
      </button>
      <button type="button" className={`${LOCATION_BUTTON} btn-primary`} onClick={() => openBank()}>
        Village Bank
      </button>
      {SECTORS.map((sector) => {
        const unlocked = player.sectors.find((item) => item.id === sector.id)?.unlocked ?? false;
        return (
          <button
            key={sector.id}
            type="button"
            className={`${LOCATION_BUTTON} btn-secondary`}
            onClick={() => openDistrict(sector.id)}
          >
            <GameImage src={ASSETS.sectorIcon(sector.id)} alt="" width={20} />
            <span className="flex items-center gap-2 leading-tight">
              {sector.district}
              {!unlocked && <span className="text-xs font-semibold text-soft">Locked</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

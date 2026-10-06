"use client";

import { ASSETS, SECTORS } from "@/config";
import { useGameStore, useUiStore } from "@/stores";
import { GameImage } from "@/components/pages/(shared)";

const LOCATION_BUTTON =
  "btn min-w-0 !px-2 !py-1.5 text-sm sm:shrink-0 sm:!px-4 sm:text-[0.9375rem] short:shrink-0 short:!px-4";

export function LocationBar() {
  const player = useGameStore((state) => state.player);
  const openShop = useUiStore((state) => state.openShop);
  const openBank = useUiStore((state) => state.openBank);
  const openDistrict = useUiStore((state) => state.openDistrict);

  if (!player) return null;

  return (
    <nav
      aria-label="Village locations"
      className="px-safe pb-safe grid grid-cols-3 gap-2 border-t border-line bg-surface pt-2 sm:flex sm:overflow-x-auto short:flex short:overflow-x-auto"
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
            <span className="flex flex-col items-start leading-tight sm:flex-row sm:items-center sm:gap-2 short:flex-row short:items-center short:gap-2">
              {sector.district}
              {!unlocked && <span className="text-xs font-semibold text-soft">Locked</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

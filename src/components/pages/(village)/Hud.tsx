"use client";

import { APP_NAME, ASSETS } from "@/config";
import { formatCoins } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { WeatherState } from "@/types";
import { GameImage } from "@/components/pages/(shared)";

const WEATHER_LABELS: Record<WeatherState, string> = {
  sunny: "Sunny",
  cloudy: "Cloudy",
  stormy: "Stormy",
};

export function Hud() {
  const player = useGameStore((state) => state.player);
  const busy = useGameStore((state) => state.busy);
  const harvestAll = useGameStore((state) => state.harvestAll);
  const openInfo = useUiStore((state) => state.openInfo);

  if (!player) return null;

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-4 py-2">
      <p className="pixel-text text-xs text-main">{APP_NAME}</p>

      <dl className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
        <div className="flex items-center gap-2">
          <GameImage src={ASSETS.koinIcon} alt="" width={24} />
          <div>
            <dt className="label-text">Coins</dt>
            <dd className="tabular font-extrabold" aria-live="polite">
              {formatCoins(player.koin)}
            </dd>
          </div>
        </div>
        <div>
          <dt className="label-text">Portfolio Value</dt>
          <dd className="tabular font-extrabold">
            {formatCoins(player.portfolioValue)} <span className="text-xs font-semibold text-soft">Simulated</span>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <GameImage
            src={ASSETS.weatherIcon(player.weather)}
            alt=""
            width={28}
            className={player.weather === "stormy" ? "animate-attention" : undefined}
          />
          <div>
            <dt className="label-text">Weather</dt>
            <dd className="font-extrabold">{WEATHER_LABELS[player.weather]}</dd>
          </div>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        {player.totalPendingHarvest > 0 && (
          <button type="button" className="btn btn-primary animate-attention" disabled={busy} onClick={() => void harvestAll()}>
            Harvest All ({formatCoins(player.totalPendingHarvest)})
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={openInfo}>
          Info
        </button>
      </div>
    </header>
  );
}

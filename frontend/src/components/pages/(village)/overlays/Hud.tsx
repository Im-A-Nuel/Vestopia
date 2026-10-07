"use client";

import { useEffect, useRef, useState } from "react";
import { APP_NAME, ASSETS } from "@/config";
import { formatCoins, formatSigned } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { WeatherState } from "@/types";
import { AnimatedNumber, GameImage } from "@/components/pages/(shared)";
import { ThemeToggle } from "./ThemeToggle";

const WEATHER_LABELS: Record<WeatherState, string> = {
  sunny: "Sunny",
  cloudy: "Cloudy",
  stormy: "Stormy",
};

const DELTA_VISIBLE_MS = 1800;

interface CoinDelta {
  id: number;
  value: number;
}

export function Hud() {
  const player = useGameStore((state) => state.player);
  const busy = useGameStore((state) => state.busy);
  const connection = useGameStore((state) => state.connection);
  const harvestAll = useGameStore((state) => state.harvestAll);
  const openInfo = useUiStore((state) => state.openInfo);
  const koin = player?.koin ?? null;
  const previousKoin = useRef<number | null>(null);
  const deltaId = useRef(0);
  const [delta, setDelta] = useState<CoinDelta | null>(null);

  useEffect(() => {
    if (koin === null) return;
    const previous = previousKoin.current;
    previousKoin.current = koin;
    if (previous === null || Math.abs(koin - previous) < 0.005) return;
    deltaId.current += 1;
    const next = { id: deltaId.current, value: koin - previous };
    setDelta(next);
    const timer = window.setTimeout(
      () => setDelta((current) => (current?.id === next.id ? null : current)),
      DELTA_VISIBLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [koin]);

  if (!player) return null;

  return (
    <header className="px-safe pt-safe flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface pb-2 short:gap-y-0">
      <p className="pixel-text hidden text-xs text-accent sm:block">{APP_NAME}</p>

      <dl className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
        <div className="relative">
          <dt className="label-text">Coins</dt>
          <dd className="flex items-center gap-2 text-sm font-extrabold sm:text-base">
            <GameImage src={ASSETS.koinIcon} alt="" width={20} className="hidden sm:block" />
            <AnimatedNumber value={player.koin} />
            {delta && (
              <span
                key={delta.id}
                aria-hidden="true"
                className={`animate-delta tabular pointer-events-none absolute -top-1 left-full ml-1 text-xs font-extrabold ${
                  delta.value > 0 ? "text-positive" : "text-negative"
                }`}
              >
                {formatSigned(delta.value)}
              </span>
            )}
            <span className="sr-only" aria-live="polite">
              {delta ? `${delta.value > 0 ? "Gained" : "Spent"} ${formatCoins(Math.abs(delta.value))} Coins` : ""}
            </span>
          </dd>
        </div>
        <div>
          <dt className="label-text">Portfolio Value</dt>
          <dd className="text-sm font-extrabold sm:text-base">
            <AnimatedNumber value={player.portfolioValue} />{" "}
            <span className="hidden text-xs font-semibold text-soft sm:inline">Simulated</span>
          </dd>
        </div>
        <div>
          <dt className="label-text">Weather</dt>
          <dd className="flex items-center gap-2 text-sm font-extrabold sm:text-base">
            <GameImage
              src={ASSETS.weatherIcon(player.weather)}
              alt=""
              width={24}
              className={player.weather === "stormy" ? "animate-attention" : undefined}
            />
            {WEATHER_LABELS[player.weather]}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        {connection === "reconnecting" && (
          <p role="status" className="rounded-control bg-muted px-3 py-2 text-xs font-bold text-caution">
            Reconnecting...
          </p>
        )}
        {player.totalPendingHarvest > 0 && (
          <button
            type="button"
            className="btn btn-primary animate-attention"
            disabled={busy}
            onClick={() => void harvestAll()}
          >
            Harvest All ({formatCoins(player.totalPendingHarvest)})
          </button>
        )}
        <ThemeToggle />
        <button type="button" className="btn btn-secondary" onClick={openInfo}>
          Info
        </button>
      </div>
    </header>
  );
}

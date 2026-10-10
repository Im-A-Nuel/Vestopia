"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { COPY } from "@/config";
import { useMounted, useNarration, useQuestProgress, useVillageSync, useWalletSync } from "@/hooks";
import { useGameStore, useSessionStore, useUiStore } from "@/stores";
import { EventBanner, Hud, LocationBar, MapControls, NpcDialogue, QuestTracker, WalletBanner } from "./overlays";

const VillageMap = dynamic(() => import("./map").then((module) => module.VillageMap), { ssr: false });
const ShopPanel = dynamic(() => import("./panels").then((module) => module.ShopPanel), { ssr: false });
const BankPanel = dynamic(() => import("./panels").then((module) => module.BankPanel), { ssr: false });
const DistrictPanel = dynamic(() => import("./panels").then((module) => module.DistrictPanel), { ssr: false });
const InfoPanel = dynamic(() => import("./panels").then((module) => module.InfoPanel), { ssr: false });

function StatusScreen({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
      <p role="status" className="text-base font-bold">
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </main>
  );
}

export function VillageScreen() {
  const router = useRouter();
  const mounted = useMounted();
  const address = useSessionStore((state) => state.address);
  const player = useGameStore((state) => state.player);
  const status = useGameStore((state) => state.status);
  const error = useGameStore((state) => state.error);
  const refresh = useGameStore((state) => state.refresh);
  const claimStarter = useGameStore((state) => state.claimStarter);
  const panel = useUiStore((state) => state.panel);
  const say = useUiStore((state) => state.say);

  useVillageSync();
  useWalletSync();
  const [claimError, setClaimError] = useState<string | null>(null);
  const claiming = useRef(false);
  useNarration();
  useQuestProgress();

  useEffect(() => {
    if (mounted && !address) router.replace("/");
  }, [mounted, address, router]);

  const needsStarter = player !== null && !player.starterClaimed;

  const tryClaim = useCallback((): void => {
    if (claiming.current) return;
    claiming.current = true;
    setClaimError(null);
    void claimStarter()
      .then((result) => {
        if (result.status === "success") say("guide", COPY.welcome, [], true);
        else if (result.code !== "already_claimed") setClaimError(result.message);
      })
      .finally(() => {
        claiming.current = false;
      });
  }, [claimStarter, say]);

  useEffect(() => {
    if (needsStarter) tryClaim();
  }, [needsStarter, tryClaim]);

  if (!mounted || !address) return <StatusScreen message="Opening your village..." />;
  if (!player && status === "error")
    return <StatusScreen message={error ?? COPY.errors.generic} onRetry={() => void refresh()} />;
  if (!player) return <StatusScreen message="Loading your village..." />;
  if (needsStarter && claimError)
    return (
      <StatusScreen message={claimError} onRetry={tryClaim}>
        <WalletBanner />
      </StatusScreen>
    );

  return (
    <main className="flex h-dvh flex-col">
      <WalletBanner />
      <Hud />
      <div className="relative min-h-0 flex-1">
        <VillageMap />
        <MapControls />
        <QuestTracker />
        <EventBanner />
        <NpcDialogue />
      </div>
      <LocationBar />
      {panel === "shop" && <ShopPanel />}
      {panel === "bank" && <BankPanel />}
      {panel === "district" && <DistrictPanel />}
      {panel === "info" && <InfoPanel />}
    </main>
  );
}

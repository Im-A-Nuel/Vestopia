"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COPY } from "@/config";
import { useMounted, useNarration, useVillageSync } from "@/hooks";
import { useGameStore, useSessionStore, useUiStore } from "@/stores";
import { EventBanner, Hud, LocationBar, NpcDialogue } from "./overlays";

const VillageMap = dynamic(() => import("./map").then((module) => module.VillageMap), { ssr: false });
const ShopPanel = dynamic(() => import("./panels").then((module) => module.ShopPanel), { ssr: false });
const BankPanel = dynamic(() => import("./panels").then((module) => module.BankPanel), { ssr: false });
const DistrictPanel = dynamic(() => import("./panels").then((module) => module.DistrictPanel), { ssr: false });
const InfoPanel = dynamic(() => import("./panels").then((module) => module.InfoPanel), { ssr: false });

function StatusScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
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
  const refresh = useGameStore((state) => state.refresh);
  const claimStarter = useGameStore((state) => state.claimStarter);
  const panel = useUiStore((state) => state.panel);
  const say = useUiStore((state) => state.say);

  useVillageSync();
  useNarration();

  useEffect(() => {
    if (mounted && !address) router.replace("/");
  }, [mounted, address, router]);

  const needsStarter = player !== null && !player.starterClaimed;

  useEffect(() => {
    if (!needsStarter) return;
    void claimStarter().then((result) => {
      if (result.status === "success") say("guide", COPY.welcome);
    });
  }, [needsStarter, claimStarter, say]);

  if (!mounted || !address) return <StatusScreen message="Opening your village..." />;
  if (!player && status === "error")
    return <StatusScreen message={COPY.errors.generic} onRetry={() => void refresh()} />;
  if (!player) return <StatusScreen message="Loading your village..." />;

  return (
    <main className="flex h-dvh flex-col">
      <Hud />
      <div className="relative min-h-0 flex-1">
        <VillageMap />
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

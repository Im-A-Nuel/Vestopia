"use client";

import { useEffect } from "react";
import { ASSETS, BANNER_DURATION_MS } from "@/config";
import { useUiStore } from "@/stores";
import { GameImage } from "@/components/pages/(shared)";

export function EventBanner() {
  const banner = useUiStore((state) => state.banner);
  const clearBanner = useUiStore((state) => state.clearBanner);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => clearBanner(banner.id), BANNER_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [banner, clearBanner]);

  if (!banner) return null;

  return (
    <div
      key={banner.id}
      role="status"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-3"
    >
      <p className="animate-banner-drop flex max-w-xl items-center gap-3 rounded-control bg-shade px-4 py-3 text-sm font-bold text-white">
        {banner.sector && <GameImage src={ASSETS.sectorIcon(banner.sector)} alt="" width={24} className="shrink-0" />}
        <span>{banner.text}</span>
      </p>
    </div>
  );
}

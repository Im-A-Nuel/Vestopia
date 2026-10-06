"use client";

import { useEffect } from "react";
import { BANNER_DURATION_MS } from "@/config";
import { useUiStore } from "@/stores";

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
      <p className="animate-banner-drop max-w-xl rounded-control bg-ink px-5 py-3 text-center text-sm font-bold text-white">
        {banner.text}
      </p>
    </div>
  );
}

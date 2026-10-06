"use client";

import { useUiStore } from "@/stores";
import type { ZoomAction } from "@/types";

const CONTROLS: { action: ZoomAction; label: string; text: string }[] = [
  { action: "in", label: "Zoom in", text: "+" },
  { action: "out", label: "Zoom out", text: "-" },
  { action: "reset", label: "Fit the whole village", text: "Fit" },
];

export function MapControls() {
  const requestZoom = useUiStore((state) => state.requestZoom);

  return (
    <div
      role="group"
      aria-label="Map zoom"
      className="absolute top-1/2 right-2 z-10 flex -translate-y-1/2 flex-col gap-2 pr-[env(safe-area-inset-right)]"
    >
      {CONTROLS.map((control) => (
        <button
          key={control.action}
          type="button"
          aria-label={control.label}
          className="btn btn-secondary !min-h-11 !min-w-11 !px-2 shadow-sm"
          onClick={() => requestZoom(control.action)}
        >
          {control.text}
        </button>
      ))}
    </div>
  );
}

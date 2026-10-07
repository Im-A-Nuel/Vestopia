"use client";

import { ASSETS } from "@/config";
import { useUiStore } from "@/stores";
import { GameImage } from "@/components/pages/(shared)";

export function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const night = theme === "night";

  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-pressed={night}
      aria-label={night ? "Switch to day" : "Switch to night"}
      onClick={toggleTheme}
    >
      <GameImage src={night ? ASSETS.themeIcon.night : ASSETS.themeIcon.day} alt="" width={20} />
      <span className="hidden sm:inline">{night ? "Night" : "Day"}</span>
    </button>
  );
}

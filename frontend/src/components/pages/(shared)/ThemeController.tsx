"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores";

export function ThemeController() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}

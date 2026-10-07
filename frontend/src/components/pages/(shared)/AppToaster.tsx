"use client";

import { Toaster } from "sonner";
import { useUiStore } from "@/stores";

export function AppToaster() {
  const theme = useUiStore((state) => state.theme);

  return (
    <Toaster
      theme={theme === "night" ? "dark" : "light"}
      position="bottom-right"
      offset={{ bottom: 72, right: 16 }}
      mobileOffset={{ bottom: 84, left: 12, right: 12 }}
      closeButton
    />
  );
}

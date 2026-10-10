"use client";

import dynamic from "next/dynamic";
import { PRIVY_ENABLED } from "@/config";

// Loaded in the browser only, and only when Privy is configured. Mock mode never evaluates this import.
const PrivyShell = dynamic(() => import("./PrivyShell").then((module) => module.PrivyShell), { ssr: false });

/** Renders nothing unless chain mode has a Privy App ID. Does not wrap the app, so pages still render on the server. */
export function PrivyRoot() {
  if (!PRIVY_ENABLED) return null;
  return <PrivyShell />;
}

"use client";

import { useSyncExternalStore } from "react";

const subscribe = (): (() => void) => () => undefined;

export const useMounted = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

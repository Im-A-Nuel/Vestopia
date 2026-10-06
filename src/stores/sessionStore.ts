import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COPY } from "@/config";
import { generateAddress, isPasskeySupported } from "@/lib";
import type { ActionResult } from "@/types";

interface SessionState {
  address: string | null;
  login: () => Promise<ActionResult>;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      address: null,
      login: async () => {
        if (!isPasskeySupported()) {
          return { status: "error", code: "passkey_unsupported", message: COPY.errors.passkeyUnsupported };
        }
        set({ address: generateAddress() });
        return { status: "success", message: "Signed in with passkey." };
      },
      logout: () => set({ address: null }),
    }),
    { name: "vestopia.session" },
  ),
);

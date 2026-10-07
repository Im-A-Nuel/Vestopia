"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { COPY } from "@/config";
import { shortenAddress } from "@/lib";
import { useGameStore, useSessionStore, useUiStore } from "@/stores";
import { Modal } from "@/components/pages/(shared)";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });

export function InfoPanel() {
  const router = useRouter();
  const address = useSessionStore((state) => state.address);
  const logout = useSessionStore((state) => state.logout);
  const activity = useGameStore((state) => state.activity);
  const resetGame = useGameStore((state) => state.reset);
  const resetDemo = useGameStore((state) => state.resetDemo);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const closePanel = useUiStore((state) => state.closePanel);
  const resetProgress = useUiStore((state) => state.resetProgress);

  const signOut = (): void => {
    closePanel();
    resetGame();
    logout();
    router.replace("/");
  };

  const wipeDemo = async (): Promise<void> => {
    setResetting(true);
    const result = await resetDemo();
    setResetting(false);
    if (result.status === "error") return;
    toast.success(result.message);
    resetProgress();
    signOut();
  };

  return (
    <Modal title="Info" onClose={closePanel}>
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-1">
          <h3 className="label-text">About</h3>
          <p className="text-sm">{COPY.disclaimer}</p>
          <p className="text-sm text-soft">{COPY.infoFooter}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="label-text">Account</h3>
          <p className="tabular break-all text-sm font-bold" title={address ?? undefined}>
            {address ? shortenAddress(address) : "Not signed in"}
          </p>
          <p className="text-sm text-soft">{COPY.demoNotice}</p>
          <p className="text-sm text-soft">View on Explorer will be available after the contracts are deployed.</p>
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="label-text">Contracts</h3>
          <p className="text-sm text-soft">
            This build runs on simulated data. Contract addresses will be listed here after deployment.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="label-text">Recent Transactions</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-soft">Nothing yet. Buy shares at the Village Shop to see your activity here.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {activity.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-3 text-sm">
                  <span>{entry.message}</span>
                  <span className="tabular shrink-0 text-xs text-soft">{timeFormatter.format(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-secondary" onClick={signOut}>
            Sign out
          </button>
          {confirmingReset ? (
            <div role="alert" className="flex flex-col gap-2 rounded-control border border-caution p-3">
              <p className="text-sm font-bold text-caution">
                This erases every village, price and event stored in this browser. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-caution flex-1"
                  disabled={resetting}
                  onClick={() => void wipeDemo()}
                >
                  {resetting ? "Resetting..." : "Erase demo data"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmingReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmingReset(true)}>
              Reset demo data
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

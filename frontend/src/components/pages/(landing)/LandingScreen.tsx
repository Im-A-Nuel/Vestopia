"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { APP_NAME, ASSETS, COPY, GAME_BACKEND, PRIVY_ENABLED } from "@/config";
import { useMounted } from "@/hooks";
import type { ConnectorId } from "@/lib";
import { useSessionStore } from "@/stores";
import { GameImage } from "@/components/pages/(shared)";

const PRINCIPLES = [
  { term: "Districts", detail: "Each sector you own opens a district on the map." },
  { term: "Lots", detail: "Every company you buy gets its own lot, and the building grows with its value." },
  { term: "Harvests", detail: "Dividends show up as harvests you can collect as Coins." },
  { term: "Weather", detail: "Borrow against your shares and your loan risk turns into weather." },
] as const;

export function LandingScreen() {
  const router = useRouter();
  const mounted = useMounted();
  const address = useSessionStore((state) => state.address);
  const login = useSessionStore((state) => state.login);
  const logout = useSessionStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (connectorId: ConnectorId = "injected"): Promise<void> => {
    setLoading(true);
    setError(null);
    const result = await login(connectorId);
    if (result.status === "error") {
      setError(result.message);
      toast.error(result.message);
      setLoading(false);
      return;
    }
    router.push("/village");
  };

  const returning = mounted && address !== null;

  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 px-4 py-8 short:grid-cols-2 short:gap-6 short:py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="pixel-text text-3xl text-accent sm:text-4xl">{APP_NAME}</h1>
          <p className="text-lg font-semibold text-ink">{COPY.tagline}</p>
        </div>

        <div className="flex flex-col gap-3">
          {returning ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={() => router.push("/village")}>
                Return to your village
              </button>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Sign out
              </button>
            </div>
          ) : PRIVY_ENABLED ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={() => void start("privy")}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={loading}
                onClick={() => void start("injected")}
              >
                Use browser wallet
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary self-start"
              disabled={loading}
              onClick={() => void start()}
            >
              {loading
                ? GAME_BACKEND === "chain"
                  ? "Connecting..."
                  : "Signing in..."
                : GAME_BACKEND === "chain"
                  ? "Connect wallet"
                  : "Start with Passkey"}
            </button>
          )}
          <p role={error ? "alert" : undefined} className="min-h-5 text-sm text-negative">
            {error}
          </p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map((item) => (
            <div key={item.term} className="flex flex-col gap-0.5">
              <dt className="font-extrabold">{item.term}</dt>
              <dd className="text-sm text-soft">{item.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1 text-xs text-soft">
          <p>{GAME_BACKEND === "chain" ? COPY.chainNotice : COPY.demoNotice}</p>
          <p>{COPY.disclaimer}</p>
        </div>
      </section>

      <div className="order-first overflow-hidden rounded-panel border border-line bg-muted short:order-last lg:order-last">
        <GameImage
          src={ASSETS.title}
          alt="A small village with a farmhouse in the middle, a tech office, a mine, a factory, and a farm around it."
          width={1920}
          height={1080}
          priority
          className="h-auto w-full"
        />
      </div>
    </main>
  );
}

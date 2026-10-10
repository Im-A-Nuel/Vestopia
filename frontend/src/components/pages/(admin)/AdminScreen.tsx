"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { COPY, EXPLORER_URL, GAME_BACKEND, MARKET_EVENTS, POLL_INTERVAL_MS, STOCKS, getMarketEvent } from "@/config";
import { formatPercent, formatPrice } from "@/lib";
import { useAdminStore } from "@/stores";

type GateStatus = "checking" | "locked" | "verifying" | "open";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });

const HEALTH_POLL_MS = 10000;

const STALE_WARNING_SECONDS = 30 * 60;

const formatAge = (seconds: number | null): string => {
  if (seconds === null) return "Unknown";
  if (seconds < 90) return `${Math.round(seconds)} s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
};

const percentTone = (value: number): string => {
  if (Math.abs(value) < 0.05) return "text-soft";
  return value > 0 ? "text-positive" : "text-negative";
};

export function AdminScreen() {
  const [gate, setGate] = useState<GateStatus>("checking");
  const [password, setPassword] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const market = useAdminStore((state) => state.market);
  const log = useAdminStore((state) => state.log);
  const pendingId = useAdminStore((state) => state.pendingId);
  const refresh = useAdminStore((state) => state.refresh);
  const trigger = useAdminStore((state) => state.trigger);
  const resetDemo = useAdminStore((state) => state.resetDemo);
  const health = useAdminStore((state) => state.health);
  const lastTxs = useAdminStore((state) => state.lastTxs);
  const keepaliveBusy = useAdminStore((state) => state.keepaliveBusy);
  const refreshHealth = useAdminStore((state) => state.refreshHealth);
  const keepalive = useAdminStore((state) => state.keepalive);
  const onChain = GAME_BACKEND === "chain";

  useEffect(() => {
    let cancelled = false;
    const check = async (): Promise<void> => {
      try {
        const response = await fetch("/api/admin/verify");
        if (!cancelled) setGate(response.ok ? "open" : "locked");
      } catch {
        if (!cancelled) setGate("locked");
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gate !== "open") return;
    void refresh();
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [gate, refresh]);

  useEffect(() => {
    if (gate !== "open" || !onChain) return;
    void refreshHealth();
    const interval = window.setInterval(() => {
      if (!document.hidden) void refreshHealth();
    }, HEALTH_POLL_MS);
    return () => window.clearInterval(interval);
  }, [gate, onChain, refreshHealth]);

  const unlock = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setGate("verifying");
      setGateError(null);
      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (response.ok) {
          setPassword("");
          setGate("open");
          return;
        }
        setGateError(response.status === 401 ? COPY.errors.unauthorized : COPY.errors.generic);
      } catch {
        setGateError(COPY.errors.generic);
      }
      setGate("locked");
    },
    [password],
  );

  const lock = async (): Promise<void> => {
    await fetch("/api/admin/verify", { method: "DELETE" }).catch(() => undefined);
    setGate("locked");
  };

  const wipe = async (): Promise<void> => {
    const result = await resetDemo();
    if (result.status === "success") setConfirmingReset(false);
  };

  if (gate === "checking") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
        <p role="status" className="text-soft">
          Checking your session...
        </p>
      </main>
    );
  }

  if (gate !== "open") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-5 px-4 py-10">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <form onSubmit={unlock} className="flex flex-col gap-3">
          <label htmlFor="admin-password" className="label-text">
            Admin password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            className="field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(gateError)}
            aria-describedby="admin-password-error"
          />
          <p id="admin-password-error" role={gateError ? "alert" : undefined} className="min-h-5 text-sm text-negative">
            {gateError}
          </p>
          <button type="submit" className="btn btn-primary" disabled={password === "" || gate === "verifying"}>
            {gate === "verifying" ? "Checking..." : "Unlock admin panel"}
          </button>
        </form>
      </main>
    );
  }

  const latest = log[0];

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold">Admin</h1>
          <p className="text-sm text-soft">
            Trigger a market event. Villages open in this browser update on their next refresh.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void lock()}>
          Lock admin panel
        </button>
      </header>

      <section aria-labelledby="events-heading" className="flex flex-col gap-3">
        <h2 id="events-heading" className="text-lg font-extrabold">
          Market events
        </h2>
        <ul className="flex flex-col gap-3">
          {MARKET_EVENTS.map((event) => (
            <li key={event.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-extrabold">{event.title}</p>
                <p className="text-sm text-soft">{event.banner}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={pendingId !== null}
                onClick={() => void trigger(event.id)}
              >
                {pendingId === event.id ? "Triggering..." : "Trigger"}
              </button>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="text-sm text-soft">
          {latest ? `Last triggered: ${getMarketEvent(latest.id).title}.` : "No event triggered yet."}
        </p>
      </section>

      {onChain && (
        <section aria-labelledby="chain-heading" className="flex flex-col gap-3">
          <h2 id="chain-heading" className="text-lg font-extrabold">
            Chain status
          </h2>
          <p className="text-sm font-bold">Safe order for a live demo: Keepalive first, then trigger events.</p>
          {(health?.oraclePriceAgeSeconds ?? 0) >= STALE_WARNING_SECONDS && (
            <p role="alert" className="rounded-control border border-caution p-3 text-sm font-bold text-caution">
              Prices are older than 30 minutes. Press &quot;Keepalive now&quot; before triggering events, or borrowing
              will stop working after 1 hour.
            </p>
          )}
          <div className="panel flex flex-col gap-3 p-4">
            {health ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="label-text">Oracle price age</dt>
                  <dd
                    className={`font-extrabold ${
                      (health.oraclePriceAgeSeconds ?? 0) >= STALE_WARNING_SECONDS ? "text-negative" : "text-positive"
                    }`}
                  >
                    {formatAge(health.oraclePriceAgeSeconds)}
                    {health.oracleStale ? " (stale: borrowing is blocked)" : ""}
                  </dd>
                </div>
                <div>
                  <dt className="label-text">Latest event</dt>
                  <dd className="font-extrabold">{latest ? getMarketEvent(latest.id).title : "None yet"}</dd>
                </div>
                <div>
                  <dt className="label-text">Players registered</dt>
                  <dd className="font-extrabold">{health.players}</dd>
                </div>
                <div>
                  <dt className="label-text">Block</dt>
                  <dd className="tabular font-extrabold">{health.block}</dd>
                </div>
                <div>
                  <dt className="label-text">Admin wallet</dt>
                  <dd className="tabular font-extrabold">
                    {health.adminBalanceMon ? `${Number(health.adminBalanceMon).toFixed(3)} MON` : "Not configured"}
                  </dd>
                </div>
                <div>
                  <dt className="label-text">Gas faucet wallet</dt>
                  <dd className="tabular font-extrabold">
                    {health.dripBalanceMon ? `${Number(health.dripBalanceMon).toFixed(3)} MON` : "Not configured"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p role="status" className="text-sm text-soft">
                Loading chain status...
              </p>
            )}
            <button
              type="button"
              className="btn btn-secondary self-start"
              disabled={keepaliveBusy || pendingId !== null}
              onClick={() => void keepalive()}
            >
              {keepaliveBusy ? "Refreshing prices..." : "Keepalive now"}
            </button>
            <p className="text-xs text-soft">
              Keepalive re-sends the current prices so they stay fresh. Prices older than 1 hour block borrowing.
            </p>
          </div>
          {lastTxs.length > 0 && (
            <div className="panel flex flex-col gap-1 p-4">
              <h3 className="label-text">Last transactions</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {lastTxs.map((tx) => (
                  <li key={tx.hash} className="flex flex-wrap justify-between gap-3">
                    <span>{tx.label}</span>
                    <span className="tabular text-xs text-soft">
                      gas {Number(tx.gasUsed).toLocaleString("en-US")} ·{" "}
                      <a className="underline" href={`${EXPLORER_URL}/tx/${tx.hash}`} target="_blank" rel="noreferrer">
                        {tx.hash.slice(0, 10)}...
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="prices-heading" className="flex flex-col gap-3">
        <h2 id="prices-heading" className="text-lg font-extrabold">
          Current prices
        </h2>
        {market ? (
          <div className="panel overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Simulated prices and change since the starting price</caption>
              <thead>
                <tr className="border-b border-line text-soft">
                  <th scope="col" className="px-4 py-2 font-bold">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-bold">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-bold">
                    Since start
                  </th>
                </tr>
              </thead>
              <tbody>
                {STOCKS.map((stock) => {
                  const change = (market.prices[stock.id] / stock.basePrice - 1) * 100;
                  return (
                    <tr key={stock.id} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-4 py-2 font-bold">
                        {stock.name} <span className="font-normal text-soft">{stock.ticker}</span>
                      </th>
                      <td className="tabular px-4 py-2 text-right">{formatPrice(market.prices[stock.id])}</td>
                      <td className={`tabular px-4 py-2 text-right font-bold ${percentTone(change)}`}>
                        {formatPercent(Math.abs(change) < 0.05 ? 0 : change)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p role="status" className="text-sm text-soft">
            Loading prices...
          </p>
        )}
      </section>

      <section aria-labelledby="history-heading" className="flex flex-col gap-3">
        <h2 id="history-heading" className="text-lg font-extrabold">
          Recent events
        </h2>
        {log.length === 0 ? (
          <p className="text-sm text-soft">Nothing here yet. Trigger an event above and it will be listed.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {log.map((entry) => (
              <li key={entry.sequence} className="flex justify-between gap-3 text-sm">
                <span>{getMarketEvent(entry.id).title}</span>
                <span className="tabular shrink-0 text-xs text-soft">{timeFormatter.format(entry.triggeredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reset-heading" className="flex flex-col gap-3">
        <h2 id="reset-heading" className="text-lg font-extrabold">
          Demo data
        </h2>
        {confirmingReset ? (
          <div role="alert" className="flex flex-col gap-2 rounded-control border border-caution p-3">
            <p className="text-sm font-bold text-caution">
              {onChain
                ? "This puts every price back to its starting value on-chain. Player balances stay on-chain and cannot be erased."
                : "This erases every village, price and event stored in this browser. This cannot be undone."}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-caution flex-1" onClick={() => void wipe()}>
                {onChain ? "Reset prices" : "Erase demo data"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-secondary self-start" onClick={() => setConfirmingReset(true)}>
            {onChain ? "Reset prices to base" : "Reset demo data"}
          </button>
        )}
      </section>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { COPY, MARKET_EVENTS } from "@/config";
import { useEventStore } from "@/stores";

type GateStatus = "idle" | "checking";

export function AdminScreen() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [gate, setGate] = useState<GateStatus>("idle");
  const [gateError, setGateError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);
  const trigger = useEventStore((state) => state.trigger);

  const unlock = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGate("checking");
    setGateError(null);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setAuthorized(true);
        setPassword("");
        return;
      }
      setGateError(response.status === 401 ? COPY.errors.unauthorized : COPY.errors.generic);
    } catch {
      setGateError(COPY.errors.generic);
    } finally {
      setGate("idle");
    }
  };

  const fire = async (id: (typeof MARKET_EVENTS)[number]["id"], title: string): Promise<void> => {
    setPendingId(id);
    const result = await trigger(id);
    setPendingId(null);
    if (result.status === "success") {
      toast.success(result.message);
      setLastTriggered(title);
    } else {
      toast.error(result.message);
    }
  };

  if (!authorized) {
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
          <button type="submit" className="btn btn-primary" disabled={password === "" || gate === "checking"}>
            {gate === "checking" ? "Checking..." : "Unlock admin panel"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <p className="text-sm text-soft">
          Trigger a market event. Villages open in this browser update on their next refresh.
        </p>
      </header>

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
              onClick={() => void fire(event.id, event.title)}
            >
              {pendingId === event.id ? "Triggering..." : "Trigger"}
            </button>
          </li>
        ))}
      </ul>

      <p aria-live="polite" className="text-sm text-soft">
        {lastTriggered ? `Last triggered: ${lastTriggered}.` : "No event triggered yet."}
      </p>
    </main>
  );
}

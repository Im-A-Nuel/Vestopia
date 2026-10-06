"use client";

import { useMemo, useState } from "react";
import { COPY, SECTORS, getStock, getStocksBySector } from "@/config";
import { formatCoins, formatShares } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { SectorId, StockId } from "@/types";
import { AmountField, Modal, NpcSpeech, SegmentedControl } from "@/components/pages/(shared)";
import { StockRow } from "./StockRow";

type TradeMode = "buy" | "sell";

type SectorFilter = SectorId | "all";

const TRADE_OPTIONS = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
] as const;

const parseAmount = (value: string): number => (value.trim() === "" ? 0 : Number(value));

export default function ShopPanel() {
  const player = useGameStore((state) => state.player);
  const busy = useGameStore((state) => state.busy);
  const buy = useGameStore((state) => state.buy);
  const sell = useGameStore((state) => state.sell);
  const focus = useUiStore((state) => state.shopFocus);
  const closePanel = useUiStore((state) => state.closePanel);

  const [filter, setFilter] = useState<SectorFilter>(focus.sector ?? "all");
  const [selectedId, setSelectedId] = useState<StockId>(
    focus.stockId ?? getStocksBySector(focus.sector ?? "tech")[0].id,
  );
  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState("");

  const visibleSectors = useMemo(
    () => SECTORS.filter((sector) => filter === "all" || sector.id === filter),
    [filter],
  );

  if (!player) return null;

  const config = getStock(selectedId);
  const view = player.stocks.find((stock) => stock.id === selectedId);
  if (!view) return null;

  const available = mode === "buy" ? player.koin : view.walletShares * view.price;
  const numeric = parseAmount(amount);
  const hasInput = amount.trim() !== "";
  const overLimit = numeric > available + 0.005;
  const error = !hasInput
    ? null
    : !Number.isFinite(numeric) || numeric <= 0
      ? COPY.errors.invalidAmount
      : overLimit
        ? mode === "buy"
          ? COPY.errors.insufficientKoin
          : COPY.errors.insufficientShares
        : null;
  const canSubmit = hasInput && !error && !busy;

  const estimate =
    hasInput && !error
      ? mode === "buy"
        ? `You'll get ≈ ${formatShares(numeric / view.price)} shares`
        : `You'll receive ≈ ${formatCoins(numeric)} Coins`
      : mode === "buy"
        ? `Available: ${formatCoins(player.koin)} Coins`
        : `Available: ${formatCoins(available)} Coins in ${formatShares(view.walletShares)} shares`;

  const submit = async (): Promise<void> => {
    const result =
      mode === "buy"
        ? await buy(selectedId, numeric)
        : await sell(selectedId, Math.abs(numeric - available) < 0.01 ? "max" : numeric);
    if (result.status === "success") closePanel();
  };

  return (
    <Modal title="Village Shop" onClose={closePanel}>
      <div className="flex flex-col gap-4">
        <NpcSpeech npc="merchant" text={COPY.shopGreeting} />

        <div role="group" aria-label="Filter by sector" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={filter === "all"} className={`btn !min-h-9 !px-3 !text-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter("all")}>
            All
          </button>
          {SECTORS.map((sector) => (
            <button
              key={sector.id}
              type="button"
              aria-pressed={filter === sector.id}
              className={`btn !min-h-9 !px-3 !text-sm ${filter === sector.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(sector.id)}
            >
              {sector.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {visibleSectors.map((sector) => (
            <section key={sector.id} className="flex flex-col gap-2">
              <h3 className="label-text">{sector.label}</h3>
              {getStocksBySector(sector.id).map((stock) => {
                const stockView = player.stocks.find((item) => item.id === stock.id);
                return stockView ? (
                  <StockRow
                    key={stock.id}
                    config={stock}
                    view={stockView}
                    selected={stock.id === selectedId}
                    onSelect={() => {
                      setSelectedId(stock.id);
                      setAmount("");
                    }}
                  />
                ) : null;
              })}
            </section>
          ))}
        </div>

        <form
          className="flex flex-col gap-3 border-t border-line pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) void submit();
          }}
        >
          <h3 className="text-base font-extrabold">{config.name}</h3>
          <SegmentedControl
            label="Trade type"
            options={TRADE_OPTIONS}
            value={mode}
            onChange={(next) => {
              setMode(next);
              setAmount("");
            }}
          />
          <AmountField label="Amount in Coins" value={amount} onChange={setAmount} max={available} error={error} hint={estimate} />
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {busy ? "Working..." : `${mode === "buy" ? "Buy" : "Sell"} ${config.name}`}
          </button>
        </form>
      </div>
    </Modal>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ASSETS, COPY, SECTORS, STOCKS, getStock, getStocksBySector } from "@/config";
import { formatCoins, formatShares } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { SectorFilter, ShopSort, StockConfig, StockId, StockView, TradeMode } from "@/types";
import { AmountField, GameImage, Modal, NpcSpeech, SegmentedControl, StockRow } from "@/components/pages/(shared)";

const TRADE_OPTIONS = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
] as const;

const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "district", label: "By district" },
  { value: "price-high", label: "Price: high to low" },
  { value: "price-low", label: "Price: low to high" },
  { value: "dividend", label: "Highest dividend" },
  { value: "change", label: "Biggest move" },
];

const parseAmount = (value: string): number => (value.trim() === "" ? 0 : Number(value));

const changeOf = (view: StockView): number => (view.previousPrice > 0 ? view.price / view.previousPrice - 1 : 0);

const sorters: Record<
  Exclude<ShopSort, "district">,
  (a: [StockConfig, StockView], b: [StockConfig, StockView]) => number
> = {
  "price-high": (a, b) => b[1].price - a[1].price,
  "price-low": (a, b) => a[1].price - b[1].price,
  dividend: (a, b) => b[0].dividendRate - a[0].dividendRate,
  change: (a, b) => Math.abs(changeOf(b[1])) - Math.abs(changeOf(a[1])),
};

export function ShopPanel() {
  const player = useGameStore((state) => state.player);
  const busy = useGameStore((state) => state.busy);
  const buy = useGameStore((state) => state.buy);
  const sell = useGameStore((state) => state.sell);
  const focus = useUiStore((state) => state.shopFocus);
  const closePanel = useUiStore((state) => state.closePanel);
  const openBank = useUiStore((state) => state.openBank);

  const [filter, setFilter] = useState<SectorFilter>(focus.sector ?? "all");
  const [selectedId, setSelectedId] = useState<StockId>(
    focus.stockId ?? getStocksBySector(focus.sector ?? "tech")[0].id,
  );
  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ShopSort>("district");

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return STOCKS.filter(
      (stock) =>
        (filter === "all" || stock.sector === filter) &&
        (term === "" || stock.name.toLowerCase().includes(term) || stock.ticker.toLowerCase().includes(term)),
    );
  }, [filter, query]);

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
          : view.collateralShares > 0
            ? COPY.errors.sharesInCollateral
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
        : `Available: ${formatCoins(available)} Coins in ${formatShares(view.walletShares)} shares${view.collateralShares > 0 ? `, ${formatShares(view.collateralShares)} more in collateral` : ""}`;

  const submit = async (): Promise<void> => {
    const result =
      mode === "buy"
        ? await buy(selectedId, numeric)
        : await sell(selectedId, Math.abs(numeric - available) < 0.01 ? "max" : numeric);
    if (result.status === "success") closePanel();
  };

  const renderRow = (stock: StockConfig) => {
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
  };

  return (
    <Modal
      title="Village Shop"
      onClose={closePanel}
      footer={
        <form
          className="flex flex-col gap-3"
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
          <AmountField
            label="Amount in Coins"
            value={amount}
            onChange={setAmount}
            max={available}
            error={error}
            hint={estimate}
          />
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {busy ? "Working..." : `${mode === "buy" ? "Buy" : "Sell"} ${config.name}`}
          </button>
          {mode === "sell" && view.walletShares <= 0 && view.collateralShares > 0 && (
            <div className="flex flex-col items-start gap-2 rounded-control bg-muted p-3">
              <p className="text-sm text-soft">{COPY.errors.sharesInCollateral}</p>
              <button type="button" className="btn btn-secondary" onClick={() => openBank("collateral")}>
                Open the Village Bank
              </button>
            </div>
          )}
        </form>
      }
    >
      <div className="flex flex-col gap-4">
        <NpcSpeech npc="merchant" text={COPY.shopGreeting} compact />

        <div role="group" aria-label="Filter by sector" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            aria-pressed={filter === "all"}
            className={`btn btn-chip shrink-0 ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {SECTORS.map((sector) => (
            <button
              key={sector.id}
              type="button"
              aria-pressed={filter === sector.id}
              className={`btn btn-chip shrink-0 ${filter === sector.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(sector.id)}
            >
              <GameImage src={ASSETS.sectorIcon(sector.id)} alt="" width={20} />
              {sector.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="flex flex-col gap-1">
            <span className="label-text">Search</span>
            <input
              type="search"
              className="field"
              placeholder="Company or ticker"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label-text">Sort</span>
            <select className="field" value={sort} onChange={(event) => setSort(event.target.value as ShopSort)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {matches.length === 0 ? (
          <p role="status" className="rounded-control bg-muted p-4 text-sm text-soft">
            No company matches &ldquo;{query}&rdquo;. Try a ticker like NVDA or clear the search.
          </p>
        ) : sort === "district" ? (
          <div className="flex flex-col gap-4">
            {SECTORS.map((sector) => {
              const stocks = matches.filter((stock) => stock.sector === sector.id);
              if (stocks.length === 0) return null;
              return (
                <section key={sector.id} className="flex flex-col gap-2">
                  <h3 className="label-text">{sector.label}</h3>
                  {stocks.map((stock) => renderRow(stock))}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches
              .flatMap((stock) => {
                const stockView = player.stocks.find((item) => item.id === stock.id);
                return stockView ? [[stock, stockView] as [StockConfig, StockView]] : [];
              })
              .sort(sorters[sort])
              .map(([stock]) => renderRow(stock))}
          </div>
        )}
      </div>
    </Modal>
  );
}

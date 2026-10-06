"use client";

import { useState } from "react";
import { ASSETS, COPY, MAX_LTV, getStock } from "@/config";
import { formatCoins, formatHealth, formatShares, previewWeather } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { BankTab, StockId, WeatherState } from "@/types";
import { AmountField, GameImage, Modal, NpcSpeech, SegmentedControl, Stat } from "@/components/pages/(shared)";

type CollateralMode = "deposit" | "withdraw";

type LoanMode = "borrow" | "repay";

const TAB_OPTIONS = [
  { value: "collateral", label: "Collateral" },
  { value: "loan", label: "Loan" },
] as const;

const COLLATERAL_OPTIONS = [
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
] as const;

const LOAN_OPTIONS = [
  { value: "borrow", label: "Borrow" },
  { value: "repay", label: "Repay" },
] as const;

const WEATHER_LABELS: Record<WeatherState, string> = { sunny: "Sunny", cloudy: "Cloudy", stormy: "Stormy" };

const WEATHER_TONES: Record<WeatherState, "positive" | "caution" | "negative"> = {
  sunny: "positive",
  cloudy: "caution",
  stormy: "negative",
};

const parseAmount = (value: string): number => (value.trim() === "" ? 0 : Number(value));

export default function BankPanel() {
  const player = useGameStore((state) => state.player);
  const busy = useGameStore((state) => state.busy);
  const { deposit, withdraw, borrow, repay } = useGameStore.getState();
  const initialTab = useUiStore((state) => state.bankTab);
  const closePanel = useUiStore((state) => state.closePanel);
  const openShop = useUiStore((state) => state.openShop);

  const [tab, setTab] = useState<BankTab>(initialTab);
  const [collateralMode, setCollateralMode] = useState<CollateralMode>("deposit");
  const [loanMode, setLoanMode] = useState<LoanMode>("borrow");
  const [stockId, setStockId] = useState<StockId | null>(null);
  const [amount, setAmount] = useState("");

  if (!player) return null;

  const owned = player.stocks.filter((stock) => stock.walletShares + stock.collateralShares > 0);
  const selected = owned.find((stock) => stock.id === stockId) ?? owned[0] ?? null;
  const numeric = parseAmount(amount);
  const hasInput = amount.trim() !== "";
  const invalid = hasInput && (!Number.isFinite(numeric) || numeric <= 0);

  const reset = (): void => setAmount("");

  const stockAvailable = !selected
    ? 0
    : collateralMode === "deposit"
      ? selected.walletShares * selected.price
      : selected.collateralValue;

  const loanAvailable = loanMode === "borrow" ? player.borrowable : Math.min(player.debt, player.koin);
  const available = tab === "collateral" ? stockAvailable : loanAvailable;
  const overLimit = hasInput && !invalid && numeric > available + 0.005;

  const limitMessage =
    tab === "collateral"
      ? collateralMode === "deposit"
        ? COPY.errors.insufficientShares
        : COPY.errors.unsafeWithdraw
      : loanMode === "borrow"
        ? COPY.errors.borrowLimit
        : player.debt < numeric
          ? COPY.errors.invalidAmount
          : COPY.errors.insufficientKoin;

  const error = invalid ? COPY.errors.invalidAmount : overLimit ? limitMessage : null;
  const validAmount = hasInput && !error;

  const projectedCollateral = (): number => {
    if (tab !== "collateral" || !selected || !validAmount) return player.collateralValue;
    return collateralMode === "deposit" ? player.collateralValue + numeric : Math.max(0, player.collateralValue - numeric);
  };

  const projectedDebt = (): number => {
    if (tab !== "loan" || !validAmount) return player.debt;
    return loanMode === "borrow" ? player.debt + numeric : Math.max(0, player.debt - numeric);
  };

  const projectedWeather = previewWeather(projectedCollateral(), projectedDebt());

  const previewText = (): string => {
    if (!validAmount) return `Right now your village is ${WEATHER_LABELS[player.weather]}.`;
    if (tab === "loan" && loanMode === "borrow") {
      return `If you borrow ${formatCoins(numeric)} Coins, your village will turn ${WEATHER_LABELS[projectedWeather]}.`;
    }
    if (tab === "loan") {
      return `If you repay ${formatCoins(numeric)} Coins, your village will be ${WEATHER_LABELS[projectedWeather]}.`;
    }
    return `After this, your village will be ${WEATHER_LABELS[projectedWeather]}.`;
  };

  const submit = async (): Promise<void> => {
    const isMax = Math.abs(numeric - available) < 0.01;
    const value = isMax ? "max" : numeric;
    let status: "success" | "error" = "error";

    if (tab === "collateral" && selected) {
      const result =
        collateralMode === "deposit" ? await deposit(selected.id, value) : await withdraw(selected.id, value);
      status = result.status;
    }
    if (tab === "loan") {
      const result = loanMode === "borrow" ? await borrow(numeric) : await repay(value);
      status = result.status;
    }
    if (status === "success") reset();
  };

  const submitLabel =
    tab === "collateral"
      ? collateralMode === "deposit"
        ? "Deposit collateral"
        : "Withdraw collateral"
      : loanMode === "borrow"
        ? "Borrow Coins"
        : "Repay loan";

  return (
    <Modal title="Village Bank" onClose={closePanel}>
      <div className="flex flex-col gap-4">
        <NpcSpeech npc="banker" text={COPY.bankGreeting} />

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Borrow limit" value={formatCoins(player.borrowLimit)} />
          <Stat label="Debt" value={formatCoins(player.debt)} tone={player.debt > 0 ? "caution" : "default"} />
          <Stat label="Health" value={formatHealth(player.healthFactor)} />
          <Stat label="Weather" value={WEATHER_LABELS[player.weather]} tone={WEATHER_TONES[player.weather]} />
        </dl>

        <SegmentedControl
          label="Bank section"
          options={TAB_OPTIONS}
          value={tab}
          onChange={(next) => {
            setTab(next);
            reset();
          }}
        />

        {tab === "collateral" && owned.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-control bg-muted p-4">
            <p className="text-sm text-soft">You don&apos;t own any shares yet. Buy some at the Village Shop, then come back to use them as collateral.</p>
            <button type="button" className="btn btn-primary" onClick={() => openShop({})}>
              Open the Village Shop
            </button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (validAmount && !busy) void submit();
            }}
          >
            {tab === "collateral" ? (
              <>
                <SegmentedControl
                  label="Collateral action"
                  options={COLLATERAL_OPTIONS}
                  value={collateralMode}
                  onChange={(next) => {
                    setCollateralMode(next);
                    reset();
                  }}
                />
                <div role="group" aria-label="Choose shares" className="flex flex-col gap-2">
                  {owned.map((stock) => (
                    <button
                      key={stock.id}
                      type="button"
                      aria-pressed={selected?.id === stock.id}
                      onClick={() => {
                        setStockId(stock.id);
                        reset();
                      }}
                      className={`flex items-center gap-3 rounded-control border px-3 py-2 text-left ${
                        selected?.id === stock.id ? "border-main bg-muted" : "border-line bg-surface hover:bg-muted"
                      }`}
                    >
                      <GameImage src={ASSETS.stockIcon(stock.id)} alt="" width={28} />
                      <span className="flex-1 font-bold">{getStock(stock.id).name}</span>
                      <span className="tabular text-right text-xs text-soft">
                        In wallet {formatShares(stock.walletShares)}
                        <br />
                        In collateral {formatShares(stock.collateralShares)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <SegmentedControl
                label="Loan action"
                options={LOAN_OPTIONS}
                value={loanMode}
                onChange={(next) => {
                  setLoanMode(next);
                  reset();
                }}
              />
            )}

            <AmountField
              label="Amount in Coins"
              value={amount}
              onChange={setAmount}
              max={available}
              error={error}
              hint={`Available: ${formatCoins(available)} Coins${tab === "loan" && loanMode === "borrow" ? ` (limit is ${MAX_LTV * 100}% of collateral)` : ""}`}
            />

            <p className="flex items-center gap-2 rounded-control bg-muted px-3 py-2 text-sm" aria-live="polite">
              <GameImage src={ASSETS.weatherIcon(projectedWeather)} alt="" width={24} />
              {previewText()}
            </p>

            <button type="submit" className="btn btn-primary" disabled={!validAmount || busy}>
              {busy ? "Working..." : submitLabel}
            </button>
          </form>
        )}

        <p className="text-xs text-soft">{COPY.bankRisk}</p>
      </div>
    </Modal>
  );
}

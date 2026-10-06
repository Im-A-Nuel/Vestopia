"use client";

import { useId } from "react";

interface AmountFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  hint?: string;
  error?: string | null;
  quickFractions?: readonly number[];
}

const DEFAULT_FRACTIONS = [0.25, 0.5, 1] as const;

const toInputValue = (amount: number): string => (amount > 0 ? String(Math.floor(amount * 100) / 100) : "");

export function AmountField({ label, value, onChange, max, hint, error, quickFractions = DEFAULT_FRACTIONS }: AmountFieldProps) {
  const inputId = useId();
  const messageId = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="label-text">
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        placeholder="0"
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
        className="field tabular"
      />
      <div className="flex flex-wrap gap-2">
        {quickFractions.map((fraction) => (
          <button
            key={fraction}
            type="button"
            className="btn btn-secondary !min-h-9 !px-3 !text-sm"
            disabled={max <= 0}
            onClick={() => onChange(toInputValue(max * fraction))}
          >
            {fraction === 1 ? "Max" : `${fraction * 100}%`}
          </button>
        ))}
      </div>
      <p id={messageId} role={error ? "alert" : undefined} className={`min-h-5 text-sm ${error ? "text-negative" : "text-soft"}`}>
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}

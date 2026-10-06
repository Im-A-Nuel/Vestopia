import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  tone?: "default" | "positive" | "negative" | "caution";
}

const TONES: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
  caution: "text-caution",
};

export function Stat({ label, value, tone = "default" }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="label-text">{label}</dt>
      <dd className={`tabular text-base font-extrabold ${TONES[tone]}`}>{value}</dd>
    </div>
  );
}

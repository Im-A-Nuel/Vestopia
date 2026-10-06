import { ASSETS } from "@/config";
import { formatPercent, formatPrice, formatShares } from "@/lib";
import type { StockConfig, StockView } from "@/types";
import { GameImage } from "@/components/pages/(shared)";

interface StockRowProps {
  config: StockConfig;
  view: StockView;
  selected: boolean;
  onSelect: () => void;
}

const priceChange = (view: StockView): number =>
  view.previousPrice > 0 ? (view.price / view.previousPrice - 1) * 100 : 0;

export function StockRow({ config, view, selected, onSelect }: StockRowProps) {
  const change = priceChange(view);
  const moved = Math.abs(change) >= 0.05;
  const tone = !moved ? "text-soft" : change > 0 ? "text-positive" : "text-negative";
  const owned = view.walletShares + view.collateralShares;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-control border px-3 py-2 text-left transition-colors ${
        selected ? "border-main bg-muted" : "border-line bg-surface hover:bg-muted"
      }`}
    >
      <GameImage src={ASSETS.stockIcon(config.id)} alt="" width={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{config.name}</span>
        <span className="block text-xs text-soft">
          {config.ticker} - {owned > 0 ? `${formatShares(owned)} owned` : "Not owned"}
        </span>
      </span>
      <span className="text-right">
        <span className="tabular block font-bold">{formatPrice(view.price)}</span>
        <span className={`tabular block text-xs font-bold ${tone}`}>
          {moved ? (change > 0 ? "▲ " : "▼ ") : ""}
          {formatPercent(moved ? change : 0)}
          <span className="sr-only"> since the last market event</span>
        </span>
        <span className="block text-xs text-soft">Simulated</span>
      </span>
    </button>
  );
}

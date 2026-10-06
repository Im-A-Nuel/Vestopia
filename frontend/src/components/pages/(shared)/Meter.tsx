interface MeterProps {
  value: number;
  max: number;
  label: string;
}

export function Meter({ value, max, label }: MeterProps) {
  return (
    <div className="flex flex-col gap-1">
      <progress className="meter" value={Math.min(value, max)} max={max} aria-label={label} />
      <p className="tabular text-xs text-soft">{label}</p>
    </div>
  );
}

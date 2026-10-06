import type { ReactNode } from "react";

interface HintProps {
  summary: string;
  children: ReactNode;
}

export function Hint({ summary, children }: HintProps) {
  return (
    <details className="group rounded-control border border-line px-3 py-2 text-sm">
      <summary className="cursor-pointer font-bold text-main marker:text-main">{summary}</summary>
      <div className="mt-2 flex flex-col gap-2 text-soft">{children}</div>
    </details>
  );
}

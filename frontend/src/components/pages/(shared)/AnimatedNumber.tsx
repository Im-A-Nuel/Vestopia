"use client";

import { useEffect, useRef, useState } from "react";
import { formatCoins } from "@/lib";
import { useReducedMotion } from "@/hooks";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

export function AnimatedNumber({ value, duration = 700 }: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    if (reduced || Math.abs(displayRef.current - value) < 0.005) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const from = displayRef.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayRef.current = from + (value - from) * eased;
      setDisplay(displayRef.current);
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return <span className="tabular">{formatCoins(display)}</span>;
}

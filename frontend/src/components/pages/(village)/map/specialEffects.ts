import type { StockId } from "@/types";
import { TEXTURE } from "./constants";

export type Pulse = "flicker" | "shake" | "dim" | "bob" | "none";

export interface EffectSpec {
  tint: number[];
  texture: string;
  count: number;
  gravityY: number;
  speed: { min: number; max: number };
  scale: { start: number; end: number };
  pulse: Pulse;
}

interface DirectionalEffects {
  up: EffectSpec;
  down: EffectSpec;
}

const SPARK = { texture: TEXTURE.sparkle, scale: { start: 0.7, end: 0 } } as const;
const PUFF = { texture: TEXTURE.cloud, scale: { start: 0.06, end: 0.18 } } as const;

const spec = (
  base: Pick<EffectSpec, "texture" | "scale">,
  rest: Omit<EffectSpec, "texture" | "scale">,
): EffectSpec => ({
  ...base,
  ...rest,
});

export const SPECIAL_EFFECTS: Record<StockId, DirectionalEffects> = {
  aapl: {
    up: spec(SPARK, {
      tint: [0xc8453b, 0x5a8f45],
      count: 16,
      gravityY: 140,
      speed: { min: 20, max: 70 },
      pulse: "bob",
    }),
    down: spec(SPARK, {
      tint: [0x9c7a4d, 0x5a8f45],
      count: 14,
      gravityY: 220,
      speed: { min: 10, max: 50 },
      pulse: "none",
    }),
  },
  nvda: {
    up: spec(SPARK, {
      tint: [0x4fd18b, 0xffffff],
      count: 18,
      gravityY: 0,
      speed: { min: 40, max: 120 },
      pulse: "flicker",
    }),
    down: spec(SPARK, {
      tint: [0xf2c14e, 0xffffff],
      count: 22,
      gravityY: 0,
      speed: { min: 100, max: 220 },
      pulse: "dim",
    }),
  },
  nem: {
    up: spec(SPARK, {
      tint: [0xf2c14e, 0xfbe39a],
      count: 22,
      gravityY: -20,
      speed: { min: 40, max: 130 },
      pulse: "none",
    }),
    down: spec(SPARK, {
      tint: [0x7a7f8c, 0x9c8b7a],
      count: 14,
      gravityY: 320,
      speed: { min: 10, max: 60 },
      pulse: "shake",
    }),
  },
  xom: {
    up: spec(SPARK, {
      tint: [0x2b2b3a, 0xf2c14e],
      count: 10,
      gravityY: -40,
      speed: { min: 20, max: 70 },
      pulse: "bob",
    }),
    down: spec(SPARK, { tint: [0x7a7f8c], count: 8, gravityY: 120, speed: { min: 10, max: 40 }, pulse: "dim" }),
  },
  ko: {
    up: spec(PUFF, { tint: [0xffffff], count: 8, gravityY: -60, speed: { min: 10, max: 40 }, pulse: "none" }),
    down: spec(PUFF, { tint: [0x7a7f8c], count: 6, gravityY: -20, speed: { min: 5, max: 20 }, pulse: "dim" }),
  },
  pg: {
    up: spec(PUFF, { tint: [0x9cc9e8, 0xffffff], count: 8, gravityY: -60, speed: { min: 10, max: 40 }, pulse: "none" }),
    down: spec(PUFF, { tint: [0x7a7f8c], count: 6, gravityY: -20, speed: { min: 5, max: 20 }, pulse: "dim" }),
  },
  de: {
    up: spec(SPARK, {
      tint: [0xe58aa7, 0xffffff],
      count: 12,
      gravityY: -30,
      speed: { min: 20, max: 60 },
      pulse: "bob",
    }),
    down: spec(SPARK, { tint: [0x9c7a4d], count: 14, gravityY: 200, speed: { min: 10, max: 50 }, pulse: "dim" }),
  },
  adm: {
    up: spec(SPARK, {
      tint: [0xe58aa7, 0xffffff],
      count: 12,
      gravityY: -30,
      speed: { min: 20, max: 60 },
      pulse: "bob",
    }),
    down: spec(SPARK, { tint: [0x9c7a4d], count: 14, gravityY: 200, speed: { min: 10, max: 50 }, pulse: "dim" }),
  },
};

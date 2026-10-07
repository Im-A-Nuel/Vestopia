import { PLAZA } from "@/config";
import type { HarvestKind, SectorId, StockId } from "@/types";

export const GRASS_CSS = "#7BB661";

export const HEX = { grass: 0x7bb661, storm: 0x1d2540, white: 0xffffff } as const;

export const MIN_ZOOM = 0.62;

export const MAX_ZOOM = 1.8;

export const ZOOM_STEP = 1.25;

export const BUILDING_POSITIONS = {
  home: { x: PLAZA.x, y: PLAZA.y - 10 },
  shop: { x: PLAZA.x - 170, y: PLAZA.y - 10 },
  bank: { x: PLAZA.x + 170, y: PLAZA.y - 10 },
} as const;

export const DEPTH = {
  base: 0,
  trees: 0.5,
  ground: 1,
  lot: 10,
  label: 20,
  harvest: 25,
  fog: 30,
  lock: 31,
  fx: 40,
  night: 48,
  nightGlow: 49,
  weather: 50,
  birds: 53,
  flash: 60,
} as const;

export const COLORS = {
  ink: "#2B2B3A",
  white: "#FFFFFF",
  up: "#9BE8A6",
  down: "#FF9C94",
  gold: "#F2C14E",
  neutral: "#E4E9F0",
} as const;

export const TEXTURE = {
  base: "village-base",
  home: "building-home",
  shop: "building-shop",
  bank: "building-bank",
  available: "lot-available",
  decorTwo: "decor-two",
  decorThree: "decor-three",
  fog: "fx-fog",
  padlock: "fx-padlock",
  sparkle: "fx-sparkle",
  coin: "fx-coin",
  lockBadge: "fx-lock-badge",
  cloud: "fx-cloud",
  rain: "fx-rain",
  rainbow: "fx-rainbow",
  glow: "fx-glow",
  firefly: "fx-firefly",
  butterfly: "fx-butterfly",
  shimmer: "fx-shimmer",
  tree: (variant: number): string => `map-tree-${variant}`,
  bird: (frame: number): string => `fx-bird-${frame}`,
  tapHand: "harvest-tap-hand",
  lot: (id: StockId): string => `lot-${id}`,
  ground: (id: SectorId): string => `ground-${id}`,
  harvest: (kind: HarvestKind): string => `harvest-${kind}`,
} as const;

export const HARVEST_STACK_THRESHOLDS = { two: 5, three: 20 } as const;

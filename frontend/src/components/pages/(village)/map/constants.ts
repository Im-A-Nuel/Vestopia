import type { HarvestKind, SectorId, StockId } from "@/types";

export const GRASS_CSS = "#7BB661";

export const HEX = { grass: 0x7bb661, storm: 0x1d2540, white: 0xffffff } as const;

export const LOT_OFFSET_X = 128;

export const MIN_ZOOM = 0.62;

export const LOT_OFFSET_Y = 6;

export const BUILDING_POSITIONS = {
  home: { x: 800, y: 490 },
  shop: { x: 640, y: 490 },
  bank: { x: 960, y: 490 },
} as const;

export const DEPTH = {
  base: 0,
  ground: 1,
  lot: 10,
  label: 20,
  harvest: 25,
  fog: 30,
  lock: 31,
  fx: 40,
  weather: 50,
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
  tapHand: "harvest-tap-hand",
  lot: (id: StockId): string => `lot-${id}`,
  ground: (id: SectorId): string => `ground-${id}`,
  harvest: (kind: HarvestKind): string => `harvest-${kind}`,
} as const;

export const HARVEST_STACK_THRESHOLDS = { two: 5, three: 20 } as const;

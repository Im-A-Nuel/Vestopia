import { LAYOUT } from "./layout";
import { getStock } from "./stocks";
import type { HarvestKind, NpcId, SectorId, StockId, WeatherState } from "@/types";

export const ASSET_EXTENSION = "png";

const assetPath = (folder: string, name: string): string => `/assets/${folder}/${name}.${ASSET_EXTENSION}`;

export const ASSETS = {
  map: { base: assetPath("map", "village-base") },
  buildings: {
    home: assetPath("buildings", "home"),
    shop: assetPath("buildings", "shop"),
    bank: assetPath("buildings", "bank"),
  },
  district: (sector: SectorId): string => assetPath("districts", `${sector}-ground`),
  lot: (stock: StockId): string => `/assets/artwork/${stock}.${getStock(stock).artwork ?? "png"}`,
  lotAvailable: assetPath("lots", "available"),
  decor: { two: assetPath("lots", "decor-lv2"), three: assetPath("lots", "decor-lv3") },
  harvest: (kind: HarvestKind): string => assetPath("harvest", kind),
  tapHand: assetPath("harvest", "tap-hand"),
  stockIcon: (stock: StockId): string => `/assets/artwork/icons/${stock}.${getStock(stock).artwork ?? "png"}`,
  koinIcon: assetPath("icons", "koin"),
  sectorIcon: (sector: SectorId): string => assetPath("icons", `sector-${sector}`),
  weatherIcon: (weather: WeatherState): string => assetPath("ui", `weather-${weather}`),
  themeIcon: { day: assetPath("ui", "weather-sunny"), night: assetPath("ui", "theme-night") },
  npc: (npc: NpcId): string => assetPath("npc", npc),
  fx: {
    fog: assetPath("fx", "fog-locked"),
    padlock: assetPath("fx", "padlock-fence"),
    sparkle: assetPath("fx", "sparkle"),
    coin: assetPath("fx", "coin"),
    lockBadge: assetPath("fx", "lock-badge"),
    cloud: assetPath("fx", "cloud"),
    rain: assetPath("fx", "rain"),
    rainbow: assetPath("fx", "rainbow"),
  },
  title: assetPath("title", "title-bg"),
} as const;

export const LOT_SIZE = 192;

export const WORLD = LAYOUT.world;

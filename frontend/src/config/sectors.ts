import type { SectorConfig, SectorId } from "@/types";
import { districtCenter, districtFrame } from "./layout";

type SectorCopy = Omit<SectorConfig, "center" | "frame" | "lockedHint">;

const COPY: readonly SectorCopy[] = [
  {
    id: "tech",
    district: "Tech Office",
    label: "Technology",
    lore: "Tech companies build the gadgets and chips the world runs on. They can grow fast, but their prices swing a lot.",
  },
  {
    id: "media",
    district: "Media Row",
    label: "Media & Internet",
    lore: "Media and internet companies earn from ads, subscriptions and phone plans. Popular shows and apps can move them fast.",
  },
  {
    id: "retail",
    district: "Main Street",
    label: "Retail & Restaurants",
    lore: "Shops and restaurants earn when people spend. They do well when shoppers feel confident and slow down when they cut back.",
  },
  {
    id: "consumer",
    district: "Factory",
    label: "Consumer Goods",
    lore: "Consumer goods companies sell everyday things people buy in good times and bad. They tend to be steadier.",
  },
  {
    id: "agri",
    district: "Farm",
    label: "Agriculture",
    lore: "Agriculture feeds the world. Weather, harvests, and food demand drive these companies.",
  },
  {
    id: "commodity",
    district: "Mine",
    label: "Commodities & Industry",
    lore: "Commodities like gold and oil are raw materials, and heavy machinery digs them up. Their prices move with supply, demand, and world events.",
  },
];

export const SECTORS: readonly SectorConfig[] = COPY.map((sector) => {
  const frame = districtFrame(sector.id);
  return {
    ...sector,
    lockedHint: `Own at least 100 Coins of ${sector.label} shares to unlock the ${sector.district}.`,
    frame,
    center: districtCenter(frame),
  };
});

export const getSector = (id: SectorId): SectorConfig => {
  const sector = SECTORS.find((item) => item.id === id);
  if (!sector) {
    throw new Error(`Unknown sector: ${id}`);
  }
  return sector;
};

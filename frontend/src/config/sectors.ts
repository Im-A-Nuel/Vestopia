import type { SectorConfig, SectorId } from "@/types";

export const SECTORS: readonly SectorConfig[] = [
  {
    id: "tech",
    district: "Tech Office",
    label: "Technology",
    lockedHint: "Own at least 100 Coins of Technology shares to unlock the Tech Office.",
    lore: "Tech companies build the gadgets and chips the world runs on. They can grow fast, but their prices swing a lot.",
    center: { x: 800, y: 170 },
  },
  {
    id: "commodity",
    district: "Mine",
    label: "Commodities",
    lockedHint: "Own at least 100 Coins of Commodities shares to unlock the Mine.",
    lore: "Commodities like gold and oil are raw materials. Their prices move with supply, demand, and world events.",
    center: { x: 1330, y: 500 },
  },
  {
    id: "consumer",
    district: "Factory",
    label: "Consumer Goods",
    lockedHint: "Own at least 100 Coins of Consumer Goods shares to unlock the Factory.",
    lore: "Consumer goods companies sell everyday things people buy in good times and bad. They tend to be steadier.",
    center: { x: 270, y: 500 },
  },
  {
    id: "agri",
    district: "Farm",
    label: "Agriculture",
    lockedHint: "Own at least 100 Coins of Agriculture shares to unlock the Farm.",
    lore: "Agriculture feeds the world. Weather, harvests, and food demand drive these companies.",
    center: { x: 800, y: 830 },
  },
];

export const getSector = (id: SectorId): SectorConfig => {
  const sector = SECTORS.find((item) => item.id === id);
  if (!sector) {
    throw new Error(`Unknown sector: ${id}`);
  }
  return sector;
};

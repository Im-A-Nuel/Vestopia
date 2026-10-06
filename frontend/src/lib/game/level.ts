import { LEVEL_THRESHOLDS, SECTOR_UNLOCK_VALUE } from "@/config";
import type { LotLevel } from "@/types";

const DUST_VALUE = 0.005;

export const getLotLevel = (value: number): LotLevel => {
  if (value >= LEVEL_THRESHOLDS.three) return 3;
  if (value >= LEVEL_THRESHOLDS.two) return 2;
  if (value > DUST_VALUE) return 1;
  return 0;
};

export const isSectorUnlocked = (sectorValue: number): boolean => sectorValue >= SECTOR_UNLOCK_VALUE;

export const getNextLevelTarget = (level: LotLevel): number | null => {
  if (level === 3) return null;
  if (level === 2) return LEVEL_THRESHOLDS.three;
  return LEVEL_THRESHOLDS.two;
};

import { CLOUDY_HEALTH_FACTOR, LIQUIDATION_THRESHOLD, MAX_LTV, STORMY_HEALTH_FACTOR } from "@/config";
import type { WeatherState } from "@/types";

export const getBorrowLimit = (collateralValue: number): number => collateralValue * MAX_LTV;

export const getHealthFactor = (collateralValue: number, debt: number): number =>
  debt > 0 ? (collateralValue * LIQUIDATION_THRESHOLD) / debt : Number.POSITIVE_INFINITY;

export const getWeather = (healthFactor: number): WeatherState => {
  if (healthFactor >= CLOUDY_HEALTH_FACTOR) return "sunny";
  if (healthFactor >= STORMY_HEALTH_FACTOR) return "cloudy";
  return "stormy";
};

export const getCollateralBuffer = (collateralValue: number, debt: number): number | null => {
  const health = getHealthFactor(collateralValue, debt);
  if (!Number.isFinite(health)) return null;
  return Math.max(0, 1 - CLOUDY_HEALTH_FACTOR / health);
};

export const previewWeather = (collateralValue: number, debt: number): WeatherState =>
  getWeather(getHealthFactor(collateralValue, debt));

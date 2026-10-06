import { describe, expect, it } from "vitest";
import { getBorrowLimit, getCollateralBuffer, getHealthFactor, getWeather, previewWeather } from "@/lib";

describe("loan math", () => {
  it("limits borrowing to 50% of collateral", () => {
    expect(getBorrowLimit(600)).toBe(300);
  });

  it("matches the demo script health factors", () => {
    expect(getHealthFactor(600, 280)).toBeCloseTo(1.714, 3);
    expect(getHealthFactor(360, 280)).toBeCloseTo(1.0286, 3);
    expect(getHealthFactor(360, 160)).toBeCloseTo(1.8, 3);
  });

  it("is infinite without debt", () => {
    expect(getHealthFactor(0, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(getWeather(Number.POSITIVE_INFINITY)).toBe("sunny");
  });

  it.each([
    [1.5, "sunny"],
    [1.4999, "cloudy"],
    [1.1, "cloudy"],
    [1.0999, "stormy"],
    [0.5, "stormy"],
  ])("maps health %s to %s", (health, weather) => {
    expect(getWeather(health)).toBe(weather);
  });

  it("measures how far collateral can fall before the weather leaves Sunny", () => {
    expect(getCollateralBuffer(600, 300)).toBeCloseTo(0.0625, 4);
    expect(getCollateralBuffer(600, 100)).toBeCloseTo(1 - 1.5 / 4.8, 4);
    expect(getCollateralBuffer(600, 0)).toBeNull();
    expect(getCollateralBuffer(360, 280)).toBe(0);
  });

  it("previews weather from collateral and debt", () => {
    expect(previewWeather(600, 280)).toBe("sunny");
    expect(previewWeather(360, 280)).toBe("stormy");
  });
});

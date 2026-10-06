import { describe, expect, it } from "vitest";
import { getLotLevel, getNextLevelTarget, isSectorUnlocked } from "@/lib";

describe("getLotLevel", () => {
  it.each([
    [0, 0],
    [0.001, 0],
    [1, 1],
    [249.99, 1],
    [250, 2],
    [999.99, 2],
    [1000, 3],
  ])("maps a value of %s Coins to level %s", (value, level) => {
    expect(getLotLevel(value)).toBe(level);
  });
});

describe("isSectorUnlocked", () => {
  it("unlocks exactly at 100 Coins", () => {
    expect(isSectorUnlocked(99.99)).toBe(false);
    expect(isSectorUnlocked(100)).toBe(true);
  });
});

describe("getNextLevelTarget", () => {
  it("returns the next threshold or null at the top level", () => {
    expect(getNextLevelTarget(0)).toBe(250);
    expect(getNextLevelTarget(1)).toBe(250);
    expect(getNextLevelTarget(2)).toBe(1000);
    expect(getNextLevelTarget(3)).toBeNull();
  });
});

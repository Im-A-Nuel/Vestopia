import { expect, test } from "@playwright/test";
import { startGame } from "./helpers";

test("fits a phone screen without horizontal scroll and keeps tap targets large", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await startGame(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Village Shop" }).first().tap();
  const chips = page.getByRole("group", { name: "Filter by sector" }).getByRole("button");
  const count = await chips.count();
  for (let index = 0; index < count; index += 1) {
    const box = await chips.nth(index).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  }
});

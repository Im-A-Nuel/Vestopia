import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { startGame } from "./helpers";

const audit = async (page: Page): Promise<void> => {
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("canvas")
    .exclude("nextjs-portal")
    .analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
};

test("landing has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/");
  await audit(page);
});

test("village and panels have no detectable accessibility violations", async ({ page }) => {
  await startGame(page);
  await audit(page);
  for (const name of ["Village Shop", "Village Bank", "Tech Office"]) {
    await page.getByRole("button", { name }).first().click();
    await audit(page);
    await page.keyboard.press("Escape");
  }
});

test("night theme keeps the village and panels accessible", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: "Switch to night" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await audit(page);
  for (const name of ["Village Shop", "Village Bank"]) {
    await page.getByRole("button", { name }).first().click();
    await audit(page);
    await page.keyboard.press("Escape");
  }
  await page.getByRole("button", { name: "Switch to day" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
});

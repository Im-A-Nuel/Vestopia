import { expect, test, type Page } from "@playwright/test";
import { startGame } from "./helpers";

const VIEWPORTS = [
  { name: "small phone", width: 320, height: 568 },
  { name: "phone", width: 390, height: 844 },
  { name: "phone landscape", width: 844, height: 390 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "tablet landscape", width: 1024, height: 768 },
] as const;

const noHorizontalScroll = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("landing fits and the start button is visible without scrolling", async ({ page }) => {
      await page.goto("/");
      expect(await noHorizontalScroll(page)).toBe(true);
      const start = page.getByRole("button", { name: "Start with Passkey" });
      await expect(start).toBeVisible();
      const box = await start.boundingBox();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    });

    test("village keeps the map usable and every control reachable", async ({ page }) => {
      await startGame(page);
      expect(await noHorizontalScroll(page)).toBe(true);

      const map = await page.getByRole("region", { name: /Village map/ }).boundingBox();
      expect(map?.height ?? 0).toBeGreaterThanOrEqual(viewport.height * 0.38);

      const nav = page.getByRole("navigation", { name: "Village locations" });
      const navBox = await nav.boundingBox();
      expect((navBox?.y ?? 0) + (navBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);

      const buttons = nav.getByRole("button");
      const count = await buttons.count();
      expect(count).toBe(8);
      for (let index = 0; index < count; index += 1) {
        const button = buttons.nth(index);
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThan(0);
      }

      for (const label of ["Zoom in", "Zoom out", "Fit the whole village"]) {
        const box = await page.getByRole("button", { name: label }).boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(43.5);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
      }
    });

    test("panels stay inside the screen and keep the action button visible", async ({ page }) => {
      await startGame(page);
      for (const [open, action] of [
        ["Village Shop", "Buy"],
        ["Village Bank", "Close"],
      ] as const) {
        await page.getByRole("button", { name: open }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
        const box = await dialog.boundingBox();
        expect(box?.x ?? 0).toBeGreaterThanOrEqual(-1);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width + 1);
        expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);
        await expect(page.getByRole("button", { name: new RegExp(action) }).first()).toBeInViewport();
        await page.keyboard.press("Escape");
      }
    });
  });
}

test("zoom controls change what the map shows", async ({ page }) => {
  await startGame(page);
  const before = await page.screenshot({ clip: { x: 0, y: 80, width: 300, height: 300 } });
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.waitForTimeout(400);
  const zoomed = await page.screenshot({ clip: { x: 0, y: 80, width: 300, height: 300 } });
  expect(zoomed.equals(before)).toBe(false);
  await page.getByRole("button", { name: "Fit the whole village" }).click();
  await page.waitForTimeout(400);
  const reset = await page.screenshot({ clip: { x: 0, y: 80, width: 300, height: 300 } });
  expect(reset.equals(zoomed)).toBe(false);
});

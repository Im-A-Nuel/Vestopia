import { expect, test } from "@playwright/test";
import { startGame } from "./helpers";

test("opens and closes a panel with the keyboard and restores focus", async ({ page }) => {
  await startGame(page);
  const shopButton = page.getByRole("button", { name: "Village Shop" }).first();
  await shopButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Village Shop" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(shopButton).toBeFocused();
});

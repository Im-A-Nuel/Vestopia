import { expect, test } from "@playwright/test";
import { buyShares, coins, depositAllInBank, startGame, trigger, unlockAdmin } from "./helpers";

test("plays the full demo script", async ({ context, page }) => {
  await startGame(page);
  await expect.poll(() => coins(page)).toBe("1,000");

  await buyShares(page, "Nvidia", 300);
  await buyShares(page, "Newmont", 600);
  await expect.poll(() => coins(page)).toBe("100");
  await expect(page.getByText("New district unlocked: Mine!")).toBeVisible();

  await depositAllInBank(page, "Newmont");
  await page.getByRole("group", { name: "Bank section" }).getByRole("button", { name: "Loan" }).click();
  await page.getByLabel("Amount in Coins").fill("280");
  await page.getByRole("button", { name: "Borrow Coins" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => coins(page)).toBe("380");

  await buyShares(page, "Archer", 250);
  await expect.poll(() => coins(page)).toBe("130");

  const admin = await context.newPage();
  await unlockAdmin(admin);
  await trigger(admin, "Gold crash");

  await page.bringToFront();
  await expect(page.locator("dd", { hasText: "Stormy" }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Storm's coming!")).toBeVisible();

  await page.getByRole("button", { name: "Repay", exact: true }).click();
  await page.getByLabel("Amount in Coins").fill("120");
  await page.getByRole("button", { name: "Repay loan" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("dd", { hasText: "Sunny" }).first()).toBeVisible({ timeout: 10000 });
  await expect.poll(() => coins(page)).toBe("10");

  await trigger(admin, "Harvest Day");
  await page.bringToFront();
  const harvestAll = page.getByRole("button", { name: /Harvest All/ });
  await expect(harvestAll).toBeVisible({ timeout: 10000 });
  await expect(harvestAll).toContainText("28.4");
  await harvestAll.click();
  await expect.poll(() => coins(page)).toBe("38.4");
});

test("asks for confirmation before a borrow that leaves little room for price drops", async ({ page }) => {
  await startGame(page);
  await buyShares(page, "Newmont", 600);
  await depositAllInBank(page);
  await page.getByRole("group", { name: "Bank section" }).getByRole("button", { name: "Loan" }).click();
  await page.getByLabel("Amount in Coins").fill("300");
  await page.getByRole("button", { name: /Review: Borrow Coins/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "A drop of about 6%" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: /Review: Borrow Coins/ })).toBeVisible();
});

test("explains why shares in collateral cannot be sold", async ({ page }) => {
  await startGame(page);
  await buyShares(page, "Newmont", 600);
  await depositAllInBank(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Village Shop" }).first().click();
  await page
    .getByRole("button", { name: /Newmont/ })
    .first()
    .click();
  await page.getByRole("group", { name: "Trade type" }).getByRole("button", { name: "Sell" }).click();
  await expect(page.getByText("Those shares are in collateral.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Open the Village Bank" })).toBeVisible();
});

test("wrong admin password shows an error and the right one unlocks", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Admin password").fill("wrong");
  await page.getByRole("button", { name: "Unlock admin panel" }).click();
  await expect(page.locator("#admin-password-error")).toHaveText("That password is not correct.");
  await unlockAdmin(page);
});

test("resets demo data from the Info panel", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: "Info" }).click();
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Erase demo data" }).click();
  await page.waitForURL("**/");
  await expect(page.getByRole("button", { name: "Start with Passkey" })).toBeVisible();
});

test("keeps the admin session across a reload and lists prices and events", async ({ page }) => {
  await unlockAdmin(page);
  await trigger(page, "Tech boom");
  await page.reload();
  await expect(page.getByText("Tech boom").first()).toBeVisible();
  await expect(page.getByLabel("Admin password")).toHaveCount(0);
  const nvidiaRow = page.getByRole("row", { name: /Nvidia/ });
  await expect(nvidiaRow).toContainText("$175.00");
  await expect(nvidiaRow).toContainText("+25.0%");
  await page.getByRole("button", { name: "Lock admin panel" }).click();
  await expect(page.getByLabel("Admin password")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Admin password")).toBeVisible();
});

test("lore dialogues dismiss themselves while warnings stay", async ({ page }) => {
  await startGame(page);
  await buyShares(page, "Nvidia", 300);
  await expect(page.getByText("Tech companies build the gadgets")).toBeVisible();
  await expect(page.getByText("Tech companies build the gadgets")).toHaveCount(0, { timeout: 15000 });
});

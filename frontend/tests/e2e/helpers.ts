import { expect, type Page } from "@playwright/test";

export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "vestopia-admin";

export const startGame = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start with Passkey" }).click();
  await page.waitForURL("**/village");
  await page.waitForSelector("canvas", { timeout: 30000 });
  await expect(page.getByText("Welcome, traveler!")).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
};

export const coins = async (page: Page): Promise<string> => {
  const text = await page.locator("dt", { hasText: "Coins" }).locator("xpath=following-sibling::dd[1]").innerText();
  return text.trim();
};

export const buyShares = async (page: Page, name: string, amount: number): Promise<void> => {
  await page.getByRole("button", { name: "Village Shop" }).first().click();
  await page
    .getByRole("button", { name: new RegExp(name) })
    .first()
    .click();
  await page.getByLabel("Amount in Coins").fill(String(amount));
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
};

export const unlockAdmin = async (page: Page): Promise<void> => {
  await page.goto("/admin");
  await page.getByLabel("Admin password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Unlock admin panel" }).click();
  await expect(page.getByText("Gold crash")).toBeVisible();
};

export const trigger = async (page: Page, title: string): Promise<void> => {
  await page.locator("li", { hasText: title }).getByRole("button", { name: "Trigger" }).click();
  await expect(page.getByText("Last triggered: " + title + ".")).toBeVisible();
};

export const depositAllInBank = async (page: Page, name?: string): Promise<void> => {
  await page.getByRole("button", { name: "Village Bank" }).first().click();
  if (name) {
    await page
      .getByRole("button", { name: new RegExp(name) })
      .first()
      .click();
  }
  await page.getByRole("button", { name: "Max" }).click();
  await page.getByRole("button", { name: "Deposit collateral" }).click();
  await expect(
    page.locator("dt", { hasText: "Borrow limit" }).locator("xpath=following-sibling::dd[1]"),
  ).not.toHaveText("0");
};

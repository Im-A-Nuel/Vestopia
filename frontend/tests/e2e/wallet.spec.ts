import { expect, test } from "@playwright/test";

test("shows a friendly message when no wallet is installed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();

  await expect(
    page.getByRole("main").getByText("No wallet found. Install MetaMask or Rabby, then reload this page."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect wallet" })).toBeEnabled();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

import { expect, test } from "@playwright/test";

const ME = "0x3C550a7C70d3b8e3F2D5755Fa0cD63Dc1275fD9A";

// Chain mode without a Privy App ID: the page shows only "Connect wallet" and the injected wallet still logs in.
test("browser wallet login still works when Privy is not configured", async ({ page }) => {
  await page.addInitScript((account) => {
    (window as unknown as { ethereum: unknown }).ethereum = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts" || method === "eth_accounts") return [account];
        if (method === "eth_chainId") return "0x279f";
        throw Object.assign(new Error(`unsupported ${method}`), { code: -32601 });
      },
      on: () => undefined,
      removeListener: () => undefined,
    };
  }, ME);

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use browser wallet" })).toHaveCount(0);

  await page.getByRole("button", { name: "Connect wallet" }).click();
  await page.waitForURL("**/village");

  const session = await page.evaluate(() => window.localStorage.getItem("vestopia.session"));
  expect(session).toContain(ME);
  expect(session).toContain('"connectorId":"injected"');
});

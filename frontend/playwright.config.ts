import { defineConfig, devices } from "@playwright/test";

const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "vestopia-admin";
const PORT = process.env.E2E_PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;
const CHAIN_PORT = process.env.E2E_CHAIN_PORT ?? "3101";
const CHAIN_URL = `http://localhost:${CHAIN_PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  webServer: [
    {
      // The main suite always runs against the browser mock.
      command: `pnpm dev --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 120000,
      env: { ADMIN_PASSWORD, NEXT_PUBLIC_GAME_BACKEND: "mock", NEXT_PUBLIC_PRIVY_APP_ID: "" },
    },
    {
      // Chain mode with Privy switched off (empty App ID), used by wallet.spec.ts and browser-wallet.spec.ts.
      command: `pnpm dev --port ${CHAIN_PORT}`,
      url: CHAIN_URL,
      reuseExistingServer: true,
      timeout: 120000,
      env: { ADMIN_PASSWORD, NEXT_PUBLIC_GAME_BACKEND: "chain", NEXT_PUBLIC_PRIVY_APP_ID: "", NEXT_DIST_DIR: ".next-chain" },
    },
  ],
  projects: [
    {
      name: "desktop",
      testIgnore: /(mobile|responsive|wallet|browser-wallet)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } },
    },
    {
      name: "responsive",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "chain",
      testMatch: /(wallet|browser-wallet)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", baseURL: CHAIN_URL },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
});

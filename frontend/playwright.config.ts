import { defineConfig, devices } from "@playwright/test";

const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "vestopia-admin";
const PORT = process.env.E2E_PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
    env: { ADMIN_PASSWORD },
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /(mobile|responsive)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } },
    },
    {
      name: "responsive",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
});

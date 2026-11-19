import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "off",
    screenshot: "off",
    deviceScaleFactor: 2,
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], deviceScaleFactor: 2 } }],
});

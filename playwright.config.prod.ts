import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for testing production Vercel deployments.
 */
export default defineConfig({
  testDir: "./e2e",

  timeout: 60 * 1000,

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,

  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: "https://ridedine-web.vercel.app",

    trace: "on-first-retry",

    screenshot: "only-on-failure",

    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

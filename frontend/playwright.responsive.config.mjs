import { defineConfig, devices } from "@playwright/test";

/**
 * Cross-browser responsive smoke.
 * Chromium ≈ Chrome/Edge (Windows/macOS/Linux)
 * Firefox ≈ Firefox on all OSes
 * WebKit ≈ Safari (macOS/iOS rendering engine)
 */
export default defineConfig({
  testDir: "./",
  testMatch: "{responsive,desktop-crossbrowser}-smoke.spec.mjs",
  timeout: 300_000,
  expect: { timeout: 20_000 },
  retries: 0,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    trace: "off",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
  },
  reporter: [["list"]],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Edge uses Chromium engine; channel tests native Edge when installed.
    {
      name: "edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
  },
});

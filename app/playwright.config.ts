/**
 * Store E2E — prefer running on the host or the official Playwright Docker image.
 * The dev `app` container is Alpine-based; Chromium from `playwright install` may not execute (musl).
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
});

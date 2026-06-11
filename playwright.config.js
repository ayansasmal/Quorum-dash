/**
 * playwright.config.js — Quorum Dashboard E2E configuration.
 *
 * These are the dashboard's own browser (@ui) E2E tests. The gateway is treated
 * as a BLACK BOX: tests never import gateway source — they seed state and read
 * results over HTTP (QUORUM_GATEWAY_URL) and drive the React dashboard
 * (QUORUM_DASHBOARD_URL).
 *
 * Required environment:
 *   QUORUM_GATEWAY_URL    — base URL of a running TEST gateway keyed with the
 *                           committed ES256 test public key (default :3001).
 *   QUORUM_DASHBOARD_URL  — base URL of the dashboard under test (default :3002).
 *                           When this points at localhost the Vite dev server is
 *                           auto-started below; otherwise it is assumed running.
 *
 * Scenario ID convention: every describe title begins with its scenario ID
 * (e.g. 'S-14.1 — …') so the suite stays traceable back to the gateway E2E plan.
 *
 * T0 infrastructure probes run first via globalSetup (helpers/setup.js): it waits
 * for the gateway, uploads the fixture project configs, and round-trips a test JWT.
 */

import { defineConfig, devices } from '@playwright/test'

// Default the dashboard URL to localhost so the Vite webServer auto-start path and
// the per-test skip guards both work without manual env setup.
process.env.QUORUM_DASHBOARD_URL ??= 'http://localhost:3002'

const isDashboardLocal = process.env.QUORUM_DASHBOARD_URL.startsWith('http://localhost')

export default defineConfig({
  testDir:    'tests/e2e/scenarios',
  testMatch:  '**/*.spec.js',
  timeout:    30_000,
  retries:    1,
  workers:    4,
  fullyParallel: true,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  outputDir: 'test-results',

  use: {
    // Gateway base URL — seed helpers (helpers/api.js) read QUORUM_GATEWAY_URL
    // directly; baseURL here is only for any relative page navigations.
    baseURL: process.env.QUORUM_GATEWAY_URL ?? 'http://localhost:3001',
    ...devices['Desktop Chrome'],

    screenshot: { mode: 'on', fullPage: true },
    trace:      'on-first-retry',

    launchOptions: {
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    },
  },

  // Auto-start the dashboard Vite dev server when QUORUM_DASHBOARD_URL is local.
  // When it points at a deployed/containerised dashboard, skip — it is already up.
  ...(isDashboardLocal ? {
    webServer: {
      command: 'npm run dev -- --port 3002 --strictPort',
      url:     'http://localhost:3002',
      reuseExistingServer: true,
      timeout: 60_000,
      stdout:  'ignore',
      stderr:  'pipe',
      env: {
        ...process.env,
        VITE_GATEWAY_URL: process.env.QUORUM_GATEWAY_URL ?? 'http://localhost:3001',
      },
    },
  } : {}),

  // T0 probes + fixture upload against the black-box gateway.
  globalSetup:    './tests/e2e/helpers/setup.js',
  globalTeardown: './tests/e2e/helpers/teardown.js',

  // Single browser project — every spec in this suite is a @ui browser test.
  projects: [
    {
      name: 'ui',
      use: { browserName: 'chromium' },
    },
  ],
})

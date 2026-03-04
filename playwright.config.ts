import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests/dashboard-accessibility',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/dashboard-a11y', open: 'never' }],
    ['json', { outputFile: 'playwright-report/dashboard-a11y/results.json' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

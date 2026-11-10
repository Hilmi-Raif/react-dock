import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, workers: process.env.CI ? 2 : undefined,
  globalTimeout: 300_000, reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10_000 },
  use: { baseURL: 'http://127.0.0.1:5180/react-dock/', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: { command: 'npm run preview:demo -- --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180/react-dock/', reuseExistingServer: false },
});

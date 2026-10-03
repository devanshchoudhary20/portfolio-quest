import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5199', ...devices['Desktop Chrome'] },
  // the dev server exposes window.__pq; production builds do not
  webServer: { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199', reuseExistingServer: true },
});

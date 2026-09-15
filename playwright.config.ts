import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const bddTestDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: 'tests/steps/**/*.steps.ts',
});

export default defineConfig({
  fullyParallel: false,
  // one worker at a time — site-health.feature and a11y.spec.ts each independently crawl the whole site;
  // running them concurrently just duplicates the crawl against the same preview server for no speed benefit on a site this small
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-report.json' }]],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    { name: 'bdd', testDir: bddTestDir, use: { ...devices['Desktop Chrome'] } },
    { name: 'plain', testDir: 'tests', testMatch: '**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
  ],
});

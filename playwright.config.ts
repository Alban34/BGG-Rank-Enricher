import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  retries: 1,
  use: {
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Chrome extensions require a headed Chromium instance;
  // the headless-shell binary (used when headless: true) blocks --load-extension.
  // Each test that needs the extension uses chromium.launchPersistentContext
  // with headless: false explicitly.
  projects: [{ name: 'chromium' }],
  reporter: 'list',
  // workers: 2 is the safe default; the single globalSetup build eliminates
  // the dist/ write-race that previously required serial execution.
  workers: 2,
});

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // Chrome extensions require a headed Chromium instance;
  // the headless-shell binary (used when headless: true) blocks --load-extension.
  // Each test that needs the extension uses chromium.launchPersistentContext
  // with headless: false explicitly.
  projects: [{ name: 'chromium' }],
  reporter: 'list',
  // Run specs serially (workers: 1) to prevent concurrent `npm run build` calls
  // from multiple beforeAll hooks writing to dist/ simultaneously.
  workers: 1,
});

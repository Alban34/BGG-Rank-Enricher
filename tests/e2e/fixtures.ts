import { test as base, expect, chromium } from '@playwright/test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { BrowserContext } from '@playwright/test';
import { BGG_AUTH_FILE } from './global-setup';
import { EXTENSION_DIR } from './constants';

type ExtFixtures = {
  extContext: BrowserContext;
};

export const test = base.extend<ExtFixtures>({
  extContext: async ({}, use) => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
      storageState: BGG_AUTH_FILE,
    });
    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },
});

export { expect };

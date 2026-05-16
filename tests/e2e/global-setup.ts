import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { PROJECT_ROOT, EXTENSION_DIR } from './constants';

export const BGG_AUTH_FILE = resolve(PROJECT_ROOT, 'tests/e2e/.auth/bgg-state.json');

export default async function globalSetup(): Promise<void> {
  const requireCfClearance = process.env.CI === 'true' || process.env.BGG_REQUIRE_CF_CLEARANCE === '1';

  // Step 1: Build the extension exactly once.
  execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });

  // Step 2: Pre-prime Cloudflare cookies for BGG so service-worker fetches
  // are not blocked with 403 during test runs.
  mkdirSync(resolve(PROJECT_ROOT, 'tests/e2e/.auth'), { recursive: true });
  const userDataDir = mkdtempSync(join(tmpdir(), 'pw-prime-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
    ],
  });
  try {
    const page = await context.newPage();
    await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const deadline = Date.now() + 15_000;
    let hasClearance = false;
    while (Date.now() < deadline) {
      const cookies = await context.cookies('https://boardgamegeek.com');
      hasClearance = cookies.some(c => c.name === 'cf_clearance');
      if (hasClearance) {
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!hasClearance) {
      if (requireCfClearance) {
        throw new Error(
          'globalSetup could not obtain the cf_clearance cookie from boardgamegeek.com within 15s. Open boardgamegeek.com in a regular browser session, complete any Cloudflare challenge, then re-run the E2E tests.'
        );
      }
      console.warn(
        'globalSetup warning: cf_clearance cookie was not obtained within 15s. Continuing without Cloudflare clearance because strict mode is disabled (set BGG_REQUIRE_CF_CLEARANCE=1 to require it).'
      );
    }

    await context.storageState({ path: BGG_AUTH_FILE });
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

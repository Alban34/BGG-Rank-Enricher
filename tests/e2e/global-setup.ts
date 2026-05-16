import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { PROJECT_ROOT, EXTENSION_DIR } from './constants';

export const BGG_AUTH_FILE = resolve(PROJECT_ROOT, 'tests/e2e/.auth/bgg-state.json');

export default async function globalSetup(): Promise<void> {
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
  const page = await context.newPage();
  await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const cookies = await context.cookies('https://boardgamegeek.com');
    if (cookies.some(c => c.name === 'cf_clearance')) break;
    await page.waitForTimeout(500);
  }
  await context.storageState({ path: BGG_AUTH_FILE });
  await context.close();
  rmSync(userDataDir, { recursive: true, force: true });
}

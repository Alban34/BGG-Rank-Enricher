import { test, expect, chromium } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const PROJECT_ROOT = resolve(process.cwd());
const EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist');

const CATEGORY_URL = 'https://www.philibertnet.com/fr/50-jeux-de-societe';
const PRODUCT_URL =
  'https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html';

test.describe('Epic 7 — URL-Based Product-Page Guard', () => {
  test.beforeAll(() => {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
  });

  test('does not inject BGG rating span on a Philibertnet category page', async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic7-category-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    const page = await context.newPage();

    await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);

    try {
      await page.goto(CATEGORY_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      await page.waitForTimeout(5_000);

      await expect(page.locator('[data-bgg-rating]')).toHaveCount(0);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('injects BGG rating span on a known product page (regression)', async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic7-product-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    const page = await context.newPage();

    await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);

    try {
      await page.goto(PRODUCT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

      const textContent = await page.locator('[data-bgg-rating]').textContent();
      expect(textContent).toMatch(/^\(\d+\.\d\)$/);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});

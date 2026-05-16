import { existsSync } from 'fs';
import { test, expect } from './fixtures';
import { BGG_AUTH_FILE } from './global-setup';

const PRODUCT_URL =
  'https://cavernedugobelin.fr/products/683941e58a721';

test.describe('Epic 18 — E2E Test Suite Performance Overhaul', () => {
  test('globalSetup wrote tests/e2e/.auth/bgg-state.json', () => {
    expect(existsSync(BGG_AUTH_FILE)).toBe(true);
  });

  test('extContext fixture enriches a product page end-to-end', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Wait for the extension to inject the rating span
    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    // Assert the injected span text is in "(N.N)" format
    const textContent = await page.locator('[data-bgg-rating]').textContent();
    expect(textContent).toMatch(/^\(\d+\.\d\)$/);
  });
});

import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.okkazeo.com/jeux/64619/les-rats-de-wistar';
const NON_PRODUCT_URL = 'https://www.okkazeo.com/jeux/arrivages';

test.describe('Epic 12 — Okkazeo BGG Enrichment Workflow', () => {
  test('enriches an okkazeo.com product page end-to-end', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await expect(page.locator('[data-bgg-rating]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('does not inject BGG rating span on an okkazeo.com category page', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(NON_PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await expect(page.locator('[data-bgg-rating]')).toHaveCount(0, { timeout: 5_000 });
  });
});

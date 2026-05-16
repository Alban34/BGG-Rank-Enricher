import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.ludifolie.com/7232-wingspan.html';
const NON_PRODUCT_URL = 'https://www.ludifolie.com/10-jeux-societe-adulte';

/**
 * Epic 13 — Add BGG Rating Enrichment for ludifolie.com
 *
 * ludifolie.com is a PrestaShop storefront.
 * Product pages follow the pattern /{numeric-id}-{slug}.html;
 * category/listing pages omit the .html extension.
 * The extension detects product pages via the urlPattern and injects a
 * [data-bgg-rating] span adjacent to the h1.product-title heading.
 *
 * This test validates the complete user journey:
 *   1. BGG rating span is injected on a real product page.
 *   2. BGG rating span is absent on a category (non-product) page.
 */
test.describe('Epic 13 — ludifolie.com BGG enrichment workflow', () => {
  test('enriches a ludifolie.com product page end-to-end', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    const spans = page.locator('[data-bgg-rating]');
    expect(await spans.count()).toBeGreaterThan(0);
  });

  test('does not inject BGG rating span on a ludifolie.com category page', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(NON_PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForTimeout(5_000);

    await expect(page.locator('[data-bgg-rating]')).toHaveCount(0);
  });
});

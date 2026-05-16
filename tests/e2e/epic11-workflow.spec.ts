import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.espritjeu.com/wingspan.html';
const NON_PRODUCT_URL = 'https://www.espritjeu.com/jeux-de-strategie.html';

/**
 * Epic 11 — Fix espritjeu.com: Reposition Rating Span
 *
 * The fix added `insertAfterSelector: '.fa_bloc-details > .row:first-child'`
 * to the espritjeu ShopConfig so the rating span is inserted after a
 * block-level container rather than inside the inline `h1.fa_designation`.
 * This test validates the full user journey: the span is injected on product
 * pages, is NOT nested inside the h1 (which caused the left-side rendering),
 * and is correctly absent on non-product pages.
 */
test.describe('Epic 11 — espritjeu.com rating span repositioned below title', () => {
  test('rating span is injected on a product page', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    const spans = page.locator('[data-bgg-rating]');
    expect(await spans.count()).toBeGreaterThan(0);
  });

  test('rating span is NOT a descendant of h1.fa_designation (not inline/left of title)', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    // The bug was: span injected inside h1, causing it to render inline/left.
    // After the fix the span must live outside the h1 element.
    const spanInsideH1 = page.locator('h1.fa_designation [data-bgg-rating]');
    expect(await spanInsideH1.count()).toBe(0);
  });

  test('rating span is absent on a category (non-product) page', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(NON_PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForTimeout(5_000);

    await expect(page.locator('[data-bgg-rating]')).toHaveCount(0);
  });
});

import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.miniaturemarket.com/asmseven07.html';
const NON_PRODUCT_URL = 'https://www.miniaturemarket.com/collections';
const TITLE_SELECTOR = 'h1.product-detail-name';

test.describe('Epic 8 — Miniature Market (8.8)', () => {
  test('underlines detected title on a product page', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForFunction(
      (selector) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) {
          return false;
        }

        return window.getComputedStyle(el).textDecoration.includes('underline');
      },
      TITLE_SELECTOR,
      { timeout: 12_000 }
    );

    const textDecoration = await page.locator(TITLE_SELECTOR).first().evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).textDecoration
    );
    expect(textDecoration).toContain('underline');
  });

  test('does not inject BGG rating span on a non-product page', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(NON_PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForTimeout(5_000);

    await expect(page.locator('[data-bgg-rating]')).toHaveCount(0);
  });
});

import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.boardgamebliss.com/products/7-wonders-dice';
const NON_PRODUCT_URL = 'https://www.boardgamebliss.com/collections/stonemaier-games';
const TITLE_SELECTOR =
  'main [itemprop="name"], main h1.product-title, main h1[class*="product"][class*="title"], main h1, h1.product-title';

test.describe('Epic 8/17 — BoardGameBliss', () => {
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

  test('does not inject BGG rating span on a collection page', async ({ extContext }) => {
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

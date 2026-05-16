import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.zatu.com/en-ie/products/wingspan';
const NON_PRODUCT_URL = 'https://www.zatu.com/collections/board-games';

const RATING_SELECTOR = '[data-bgg-rating]';
const TITLE_SELECTOR =
  'main [itemprop="name"], main h1.product__title, main h1[class*="product"][class*="title"], main h1, h1.product__title';

test.describe('Epic 15 - Zatu (15.1)', () => {
  test('underlines detected title on a product page', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await expect(page).toHaveURL(/\/products\//);

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

    const title = page.locator(TITLE_SELECTOR).first();
    await expect(title).toBeVisible();

    const textDecoration = await title.evaluate(
      (el) => window.getComputedStyle(el).textDecoration,
    );
    expect(textDecoration).toContain('underline');
  });

  test('does not inject BGG rating span on a collection page', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(NON_PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForTimeout(5_000);
    await expect(page.locator(RATING_SELECTOR)).toHaveCount(0);
  });
});

import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://cavernedugobelin.fr/products/683946f208805';
const NON_PRODUCT_URL = 'https://cavernedugobelin.fr/products/categ/68394191c6f7a/tous-nos-jeux-de-societe';
const TITLE_SELECTOR =
  '#main-content h1.product-title, #main-content .product-title, main h1.product-title, main .product-title, h1.product-title, .product-title, main h1, h1';

test.describe('Epic 9 — Caverne du Gobelin (9.4)', () => {
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

  test('does not inject BGG rating span on a category page', async ({ extContext }) => {
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

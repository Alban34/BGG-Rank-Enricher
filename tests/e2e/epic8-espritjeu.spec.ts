import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.espritjeu.com/wingspan.html';
const NON_PRODUCT_URL = 'https://www.espritjeu.com/jeux-de-strategie.html';
const TITLE_SELECTOR = 'h1.fa_designation';

test.describe('Epic 8 — Esprit Jeu (8.4)', () => {
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

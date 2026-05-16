import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.gamenerdz.com/wandering-towers';
const NON_PRODUCT_URL = 'https://www.gamenerdz.com/board-games';

test.describe('Epic 8/16 — Game Nerdz', () => {
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
      'h1.productView-title:not(.productView-title-mobile)',
      { timeout: 12_000 }
    );

    const desktopTitle = page.locator('h1.productView-title:not(.productView-title-mobile)');
    const textDecoration = await desktopTitle.evaluate(
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

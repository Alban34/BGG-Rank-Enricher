import { test, expect } from './fixtures';

const PRODUCT_URL = 'https://www.okkazeo.com/jeux/64619/les-rats-de-wistar';
const NON_PRODUCT_URL = 'https://www.okkazeo.com/jeux/arrivages';
const TITLE_SELECTOR = 'h1.titre_jeu';

test.describe('Epic 9 — Okkazeo (9.2)', () => {
  test('underlines detected title on a product page', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    const title = page.locator(TITLE_SELECTOR).first();
    await expect(title).toBeVisible({ timeout: 12_000 });

    await expect
      .poll(
        async () =>
          title.evaluate((el) => window.getComputedStyle(el as HTMLElement).textDecoration),
        {
          timeout: 12_000,
          message: 'Expected product title to become underlined after content-script enrichment.',
        }
      )
      .toContain('underline');
  });

  test('does not inject BGG rating span on a category page', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(NON_PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await expect(page.locator('[data-bgg-rating]')).toHaveCount(0, { timeout: 5_000 });
  });
});

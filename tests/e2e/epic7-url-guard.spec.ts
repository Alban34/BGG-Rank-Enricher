import { test, expect } from './fixtures';

const CATEGORY_URL = 'https://www.philibertnet.com/fr/50-jeux-de-societe';
const PRODUCT_URL =
  'https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html';

test.describe('Epic 7 — URL-Based Product-Page Guard', () => {
  test('does not inject BGG rating span on a Philibertnet category page', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(CATEGORY_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForTimeout(5_000);

    await expect(page.locator('[data-bgg-rating]')).toHaveCount(0);
  });

  test('injects BGG rating span on a known product page (regression)', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    const textContent = await page.locator('[data-bgg-rating]').textContent();
    expect(textContent).toMatch(/^\(BGG:\s+[\d.]+\.\s+See more\)$/);
    const linkHref = await page.locator('[data-bgg-rating] a').getAttribute('href');
    expect(linkHref).toMatch(/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/);
  });
});

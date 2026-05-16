import { test, expect } from './fixtures';

const PRODUCT_URL =
  'https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html';

test.describe('Epic 10 - Rating label format enhancement workflow', () => {
  test('injects BGG label with See more hyperlink to canonical BGG page', async ({ extContext }) => {
    const page = await extContext.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    const rating = page.locator('[data-bgg-rating]');
    const link = rating.locator('a');

    await expect(rating).toHaveText(/^\(BGG:\s+[\d.]+\.\s+See more\)$/);
    await expect(link).toHaveText('See more');
    await expect(link).toHaveAttribute('href', /^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener\s+noreferrer|noreferrer\s+noopener/);
  });
});

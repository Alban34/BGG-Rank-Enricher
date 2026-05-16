import { test, expect } from './fixtures';

const PRODUCT_URL =
  'https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html';

test.describe('Epic 8 — Multi-Shop Architecture (SHOP_CONFIGS) Workflow', () => {
  test('enriches a Philibert product page end-to-end using SHOP_CONFIGS-based selection', async ({ extContext }) => {
    const context = extContext;

    const page = await context.newPage();

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Wait for the extension to inject the rating span
    await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

    // Assert the injected span text/link follows "(BGG: N.N. See more)"
    const textContent = await page.locator('[data-bgg-rating]').textContent();
    expect(textContent).toMatch(/^\(BGG:\s+[\d.]+\.\s+See more\)$/);
    const linkHref = await page.locator('[data-bgg-rating] a').getAttribute('href');
    expect(linkHref).toMatch(/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/);

    // Assert the product title h1 has been underlined by the content script
    const titleStyle = await page.locator('h1.product-title').evaluate(
      (el: HTMLElement) => el.style.textDecoration,
    );
    expect(titleStyle).toContain('underline');
  });
});

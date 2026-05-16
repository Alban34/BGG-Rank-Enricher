import { test, expect } from './fixtures';

const NEW_SHOPS: Array<{ name: string; url: string }> = [
  { name: 'Okkazeo', url: 'https://www.okkazeo.com/jeux/58002/earthborne-rangers' },
  { name: 'Ludifolie', url: 'https://www.ludifolie.com/7232-wingspan.html' },
  { name: 'Caverne du Gobelin', url: 'https://cavernedugobelin.fr/products/683946f208805' },
];

test.describe('Epic 9 — Shop Roster Update Workflow', () => {
  for (const shop of NEW_SHOPS) {
    test(`enriches a ${shop.name} product page end-to-end (new Epic 9 shop)`, async ({ extContext }) => {
      const context = extContext;

      const page = await context.newPage();

      await page.goto(shop.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // The extension must inject a BGG rating span on a real product page
      await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

      const spans = page.locator('[data-bgg-rating]');
      expect(await spans.count()).toBeGreaterThan(0);
    });
  }
});

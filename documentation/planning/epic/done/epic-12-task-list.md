# Epic 12 — Add BGG Rating Enrichment for okkazeo.com: Task List

## Story 12.1 — Add BGG rating enrichment for okkazeo.com

- [x] 12.1.1 — Recon: Visit at least two product pages (e.g. a game detail page) and one non-product page (e.g. homepage or category listing) on `okkazeo.com`; record the canonical `hostname` (with or without `www`), the `pathname` pattern that distinguishes product pages from non-product pages, and the CSS selector that wraps the game title in the product page `<h1>`; document findings as inline comments above the new `SHOP_CONFIGS` entry
- [x] 12.1.2 — In `src/shared/title-utils.ts`, append a new `ShopConfig` object to the `SHOP_CONFIGS` array with the `hostname`, `urlPattern` (RegExp), and `titleSelector` discovered in 12.1.1
- [x] 12.1.3 — In `manifest.json`, add the canonical match pattern (e.g. `"https://www.okkazeo.com/*"`) to `content_scripts[0].matches`
- [x] 12.1.4 — In `tests/shared/urlGuard.test.ts`, add a new `describe('Okkazeo (12.1)', …)` block containing at least two product-URL `true` cases and one non-product-URL `false` case for `isProductPage()`, using real-path examples discovered during recon
- [x] 12.1.5 — Verify `tests/e2e/epic9-okkazeo.spec.ts` is complete and up to date: it must navigate to a real product page URL on `okkazeo.com` and assert `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })` resolves (at least one span present); a second test navigates to a known non-product page and asserts zero `[data-bgg-rating]` elements are present; do not assert a specific rating value
- [x] 12.1.T — Test: confirm the two new `isProductPage()` true-cases and one false-case in `urlGuard.test.ts` all pass
- [x] 12.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 12.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic9-okkazeo.spec.ts`; confirm both the product-page and non-product-page tests pass; confirm no regressions in other E2E specs

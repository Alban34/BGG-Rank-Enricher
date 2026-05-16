# Epic 13 — Add BGG Rating Enrichment for ludifolie.com: Task List

## Story 13.1 — Add BGG rating enrichment for ludifolie.com

- [x] 13.1.1 — Recon: Visit at least two product pages and one non-product page on `ludifolie.com`; record the canonical `hostname`, the `pathname` pattern that distinguishes product pages from non-product pages, and the CSS selector that wraps the game title in the product page `<h1>`; document findings as inline comments above the new `SHOP_CONFIGS` entry
- [x] 13.1.2 — In `src/shared/title-utils.ts`, append a new `ShopConfig` object to the `SHOP_CONFIGS` array with the `hostname`, `urlPattern` (RegExp), and `titleSelector` discovered in 13.1.1
- [x] 13.1.3 — In `manifest.json`, add the canonical match pattern (e.g. `"https://www.ludifolie.com/*"`) to `content_scripts[0].matches`
- [x] 13.1.4 — In `tests/shared/urlGuard.test.ts`, add a new `describe('Ludifolie (13.1)', …)` block containing at least two product-URL `true` cases and one non-product-URL `false` case for `isProductPage()`, using real-path examples discovered during recon
- [x] 13.1.5 — Verify `tests/e2e/epic9-ludifolie.spec.ts` is complete and up to date: it must navigate to a real product page URL on `ludifolie.com` and assert `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })` resolves (at least one span present); a second test navigates to a known non-product page and asserts zero `[data-bgg-rating]` elements are present; do not assert a specific rating value
- [x] 13.1.T — Test: confirm the two new `isProductPage()` true-cases and one false-case in `urlGuard.test.ts` all pass
- [x] 13.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 13.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic9-ludifolie.spec.ts`; confirm both the product-page and non-product-page tests pass; confirm no regressions in other E2E specs

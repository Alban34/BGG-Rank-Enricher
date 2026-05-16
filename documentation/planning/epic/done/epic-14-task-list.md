# Epic 14 — Add BGG Rating Enrichment for cavernedugobelin.fr: Task List

## Story 14.1 — Add BGG rating enrichment for cavernedugobelin.fr

- [x] 14.1.1 — Recon: Visit at least two product pages and one non-product page on `cavernedugobelin.fr`; record whether `www.cavernedugobelin.fr` and bare `cavernedugobelin.fr` both resolve without redirecting to a single canonical host; record the pathname pattern for product pages and the CSS selector for the game title `<h1>`; document findings as inline comments above the new `SHOP_CONFIGS` entry (or entries)
- [x] 14.1.2 — In `src/shared/title-utils.ts`, append one `ShopConfig` entry for `www.cavernedugobelin.fr`; if recon (14.1.1) confirms the bare domain `cavernedugobelin.fr` also serves product pages without redirecting, add a second `ShopConfig` entry for it with the same `urlPattern` and `titleSelector`
- [x] 14.1.3 — In `manifest.json`, add `"https://www.cavernedugobelin.fr/*"` to `content_scripts[0].matches`; if a bare-domain entry was required in 14.1.2, also add `"https://cavernedugobelin.fr/*"`
- [x] 14.1.4 — In `tests/shared/urlGuard.test.ts`, add a new `describe('Caverne du Gobelin (14.1)', …)` block containing at least two product-URL `true` cases and one non-product-URL `false` case for `isProductPage()`; if both `www` and bare domain are supported, include at least one `true` case for each hostname
- [x] 14.1.5 — Verify `tests/e2e/epic9-cavernedugobelin.spec.ts` is complete and up to date: it must navigate to a real product page URL on `cavernedugobelin.fr` and assert `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })` resolves (at least one span present); a second test navigates to a known non-product page and asserts zero `[data-bgg-rating]` elements are present; do not assert a specific rating value
- [x] 14.1.T — Test: confirm the new `isProductPage()` true-cases and false-case in `urlGuard.test.ts` all pass; if two hostname variants are registered, confirm a true-case passes for each
- [x] 14.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 14.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic9-cavernedugobelin.spec.ts`; confirm both the product-page and non-product-page tests pass; confirm no regressions in other E2E specs

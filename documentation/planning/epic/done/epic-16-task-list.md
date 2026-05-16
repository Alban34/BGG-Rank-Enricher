# Epic 16 — Fix gamenerdz.com: Correct Shop Config for Injection: Task List

## Story 16.1 — Fix gamenerdz.com: correct the shop config for injection

- [x] 16.1.1 — Inspect ≥ 1 `gamenerdz.com` product page: determine whether the root cause is a wrong `titleSelector` (current: `h1.productView-title`), a `urlPattern` mismatch, or dynamic/deferred rendering; record the actual title element selector and a product-URL path pattern
- [x] 16.1.2 — In `src/shared/title-utils.ts`, `SHOP_CONFIGS` array: update the `gamenerdz.com` entry with the corrected `titleSelector` and/or `urlPattern` identified in 16.1.1 so the title underline and `[data-bgg-rating]` span are injected on product pages
- [x] 16.1.3 — In `tests/shared/urlGuard.test.ts`: ensure ≥ 2 named test cases assert `isProductPage()` returns `true` for real `gamenerdz.com` product-page URLs; add them if absent or update existing broken cases
- [x] 16.1.4 — In `tests/e2e/epic8-gamenerdz.spec.ts`: update the navigation URL to a confirmed live product page; add/update assertions for `[data-bgg-rating]` presence and that the title element has a blue underline style (`text-decoration: underline` with a blue color value)
- [x] 16.1.T — Test: Confirm the ≥ 2 gamenerdz `urlGuard.test.ts` cases pass with `vitest run`
- [x] 16.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 16.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic8-gamenerdz.spec.ts`; confirm `[data-bgg-rating]` presence and blue underline assertions pass; confirm no regressions in other E2E specs

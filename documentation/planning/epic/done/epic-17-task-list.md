# Epic 17 — Fix boardgamebliss.com: Correct Shop Config for Injection: Task List

## Story 17.1 — Fix boardgamebliss.com: correct the shop config for injection

- [x] 17.1.1 — Inspect ≥ 1 `boardgamebliss.com` product page: determine whether the root cause is a wrong `titleSelector` (current: `h1.product-title`), a `urlPattern` mismatch, or dynamic/deferred rendering; record the actual title element selector and a product-URL path pattern
- [x] 17.1.2 — In `src/shared/title-utils.ts`, `SHOP_CONFIGS` array: update the `boardgamebliss.com` entry with the corrected `titleSelector` and/or `urlPattern` identified in 17.1.1 so the title underline and `[data-bgg-rating]` span are injected on product pages
- [x] 17.1.3 — In `tests/shared/urlGuard.test.ts`: ensure ≥ 2 named test cases assert `isProductPage()` returns `true` for real `boardgamebliss.com` product-page URLs; add them if absent or update existing broken cases
- [x] 17.1.4 — In `tests/e2e/epic8-boardgamebliss.spec.ts`: update the navigation URL to a confirmed live product page; add/update assertions for `[data-bgg-rating]` presence and that the title element has a blue underline style (`text-decoration: underline` with a blue color value)
- [x] 17.1.T — Test: Confirm the ≥ 2 boardgamebliss `urlGuard.test.ts` cases pass with `vitest run`
- [x] 17.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 17.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic8-boardgamebliss.spec.ts`; confirm `[data-bgg-rating]` presence and blue underline assertions pass; confirm no regressions in other E2E specs

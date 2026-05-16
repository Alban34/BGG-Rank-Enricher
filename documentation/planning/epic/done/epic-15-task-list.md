# Epic 15 — Fix zatu: Update Config to Target zatu.com: Task List

## Story 15.1 — Fix zatu: update the shop config to target zatu.com

- [x] 15.1.1 — In a browser, visit `zatugames.co.uk` and confirm it redirects to `zatu.com`; record the exact canonical hostname (e.g. `www.zatu.com` vs `zatu.com`) from the redirect destination
- [x] 15.1.2 — In `src/shared/title-utils.ts`, `SHOP_CONFIGS` array: remove the `zatugames.co.uk` entry entirely; add (or update in place) a `zatu.com` entry with `hostname: 'zatu.com'` and an appropriate `titleSelector` and `urlPattern` confirmed against a real `zatu.com` product page
- [x] 15.1.3 — In `manifest.json`, `content_scripts[0].matches`: remove `*://*.zatugames.co.uk/*`; add `*://*.zatu.com/*`
- [x] 15.1.4 — In `tests/shared/urlGuard.test.ts`: delete all test cases referencing `zatugames.co.uk`; add ≥ 2 named test cases asserting `isProductPage()` returns `true` for real `zatu.com` product-page URLs; add ≥ 1 named test case asserting `isProductPage()` returns `false` for a `zatu.com` non-product URL (e.g. homepage or category page)
- [x] 15.1.5 — Rename `tests/e2e/epic8-zatugames.spec.ts` → `tests/e2e/epic15-zatu.spec.ts`; update all navigation calls inside to target a real `zatu.com` product-page URL; add/update assertions for `[data-bgg-rating]` presence and that the title element has its underline style (`text-decoration`) applied
- [x] 15.1.T — Test: In `tests/shared/urlGuard.test.ts`, confirm the new `zatu.com` cases (≥ 2 true, ≥ 1 false) are present and pass with `vitest run`
- [x] 15.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 15.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic15-zatu.spec.ts`; confirm `[data-bgg-rating]` is present and the title underline style is applied; confirm `tests/e2e/epic8-zatugames.spec.ts` no longer exists (renamed); confirm no regressions in other E2E specs

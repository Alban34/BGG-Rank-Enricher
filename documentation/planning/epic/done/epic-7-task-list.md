# Epic 7 Task List — URL-Based Product-Page Guard

## Story 7.1 — Implement `isProductPage()` URL predicate

- [x] **Implement** — Add `export function isProductPage(url: string): boolean` to `src/shared/title-utils.ts`. Use a `try/catch` around `new URL(url)`, then test `pathname` against `/\/\d+-[^/]+\.html$/`. Return `false` in the catch block. Do not modify any existing function in `title-utils.ts`.
- [x] **QC (Automated):** Run `npm run lint && npm test` — must pass with zero failures

---

## Story 7.2 — Gate content-script title detection behind `isProductPage()`

- [x] **Implement** — In `src/content/index.ts`, import `isProductPage` from `$shared/title-utils`. Replace the bare `void detectAndMarkTitle()` call at the bottom of the file with a guard block: wrap in `try/catch`; if `isProductPage(window.location.href)` is `true`, call `void detectAndMarkTitle()`; otherwise emit `console.debug('[BGG Enricher] Skipping non-product page:', window.location.href)`. If `isProductPage` throws for any reason, default to skipping (fail-safe: emit the debug log, do not call `detectAndMarkTitle()`). Do not modify the body of `detectAndMarkTitle()` or any other existing function.
- [x] **QC (Automated):** Run `npm run lint && npm test` — must pass with zero failures

---

## Story 7.3 — Unit-test `isProductPage()` for all relevant URL patterns

- [x] **Implement** — Create `tests/shared/urlGuard.test.ts`. Import `isProductPage` from `../../src/shared/title-utils`. Write a `describe('isProductPage', ...)` block with the following named test cases (Vitest, no special environment annotation needed — the function uses no browser APIs): (a) `'product page with numeric SKU + slug + .html returns true'` — Wingspan URL; (b) `'product page (Dune: Imperium) returns true'`; (c) `'product page (Dune: Imperium – Immortality) returns true'`; (d) `'category page (user-reported false-positive) returns false'` — `/fr/50-jeux-de-societe`; (e) `'root URL returns false'` — `/fr/`; (f) `'empty string returns false without throwing'`; (g) `'non-URL string returns false without throwing'`; (h) `'product URL with query string returns true'`; (i) `'product URL with hash fragment returns true'`. Do not modify any existing test file.
- [x] **QC (Automated):** Run `npm run lint && npm test` — all new tests must pass, zero previously passing tests broken

---

## Story 7.4 — E2E test — no rating injected on a category page

- [x] **Implement** — Create `tests/e2e/epic7-url-guard.spec.ts`. Mirror the Playwright setup from `tests/e2e/epic6-title-matching.spec.ts` (persistent context, `--load-extension`, `headless: false`, `test.beforeAll` build step, BGG pre-visit). Add two tests inside a `test.describe('Epic 7 — URL-Based Product-Page Guard', ...)` block: (1) `'does not inject BGG rating span on a Philibertnet category page'` — navigate to `https://www.philibertnet.com/fr/50-jeux-de-societe`, wait for `domcontentloaded` + 5 seconds hard wait, then `expect(page.locator('[data-bgg-rating]')).toHaveCount(0)`; (2) `'injects BGG rating span on a known product page (regression)'` — navigate to `https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html`, wait for `[data-bgg-rating]` selector up to 15 s, assert `textContent` matches `/^\(\d+\.\d\)$/`. Do not modify any existing E2E spec file.

---

## Epic E2E Test

- [x] **Epic E2E Test** — Authored and executed by QC Lead at epic-end: run `npx playwright test epic7` — both the category-page guard test and the product-page regression must pass with zero failures.

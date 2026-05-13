# Epic 7: URL-Based Product-Page Guard

## Objective
Prevent the extension from attempting board-game title detection and BGG lookup on Philibertnet pages that are not individual product pages (e.g. category/listing pages). The heuristic uses the URL pattern: a product page always contains a numeric SKU segment followed by a slug and `.html`, while category pages do not.

## Stories

### Story 7.1: Implement an `isProductPage()` URL predicate
**Objective:** Add a pure, exported `isProductPage(url: string): boolean` function to `src/shared/title-utils.ts` that returns `true` only when the URL matches the pattern of a Philibertnet individual product page.

**Acceptance Criteria:**
- `isProductPage("https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html")` returns `true`.
- `isProductPage("https://www.philibertnet.com/fr/dire-wolf-digital/91444-dune-imperium-810058800008.html")` returns `true`.
- `isProductPage("https://www.philibertnet.com/fr/dire-wolf-digital/118789-dune-imperium-immortality-810058800152.html")` returns `true`.
- `isProductPage("https://www.philibertnet.com/fr/50-jeux-de-societe")` returns `false`.
- `isProductPage("https://www.philibertnet.com/fr/")` returns `false`.
- `isProductPage("")` returns `false` without throwing.
- `isProductPage("not-a-url")` returns `false` without throwing.

**Edge Cases:**
- URLs with query strings or hash fragments on a product path should still return `true`.
- The regex must match the numeric SKU segment anywhere in the path, not just at the root level.
- Malformed or empty strings must not cause an unhandled exception.

**Developer Context:**
- Add the function to `src/shared/title-utils.ts` alongside the existing title utilities.
- The recommended implementation: use a try/catch around `new URL(url)`, then test `pathname` against `/\/\d+-[^/]+\.html$/`.
- Do not modify any existing function signatures in `title-utils.ts`.

---

### Story 7.2: Gate content-script title detection behind `isProductPage()`
**Objective:** Wrap the call-site in the content script that invokes `detectAndMarkTitle()` (or equivalent entry-point) so that detection is skipped entirely on non-product pages.

**Acceptance Criteria:**
- On a product-page URL, the existing title-detection and BGG-lookup flow runs unchanged.
- On a category/listing-page URL, `detectAndMarkTitle()` is never called and no DOM modifications are made.
- A `console.debug` message is emitted when detection is skipped, e.g. `[BGG Enricher] Skipping non-product page: <url>`.
- The body of `detectAndMarkTitle()` (and any other existing function) is not modified.

**Edge Cases:**
- The guard must read the current tab URL from `window.location.href` at the call-site, not from a cached value.
- If `isProductPage()` throws for any reason, the guard must default to skipping (fail-safe).

**Developer Context:**
- The content-script entry point is `src/content/index.ts`.
- Locate the line that calls `detectAndMarkTitle()` (or its equivalent) and wrap it in an `if (isProductPage(window.location.href))` block.
- Import `isProductPage` from `src/shared/title-utils.ts`.

---

### Story 7.3: Unit-test `isProductPage()` for all relevant URL patterns
**Objective:** Author a comprehensive unit-test suite for the `isProductPage()` function covering all acceptance-criteria cases and edge cases from Story 7.1.

**Acceptance Criteria:**
- A new test file exists at `tests/shared/urlGuard.test.ts`.
- All acceptance criteria from Story 7.1 have explicit named test cases.
- The user-reported false-positive URL (`/fr/50-jeux-de-societe`) has a dedicated named test: `"category page (user-reported false-positive) returns false"`.
- Tests use `@vitest/environment node` (or the project's existing test environment).
- All tests pass with `npm test`.

**Edge Cases:**
- Include a test for a product URL with a query string appended.
- Include a test for a product URL with a hash fragment appended.
- Include a test for an empty string input.
- Include a test for a non-URL string input.

**Developer Context:**
- Follow the existing test file patterns in `tests/` (Vitest, no special setup required).
- Do not modify any existing test files.

---

### Story 7.4: E2E test — no rating injected on a category page
**Objective:** Add a Playwright E2E test confirming the extension does not inject a BGG rating span on a Philibertnet category/listing page, and that it still injects correctly on a known product page.

**Acceptance Criteria:**
- A new spec file exists at `tests/e2e/epic7-url-guard.spec.ts`.
- The test navigates to `https://www.philibertnet.com/fr/50-jeux-de-societe`, waits for `domcontentloaded` + 5 seconds, and asserts that zero BGG rating spans are present in the DOM (`toHaveCount(0)`).
- A regression test navigates to `https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html` and asserts that at least one BGG rating span is present.
- Both tests pass in the project's existing Playwright configuration.

**Edge Cases:**
- The category-page test must not be flaky: use a hard 5-second wait after `domcontentloaded` before the assertion, consistent with other E2E specs in the project.
- The regression test must not couple to a specific rating value (the BGG rating may change); assert only that a span is present.

**Developer Context:**
- Follow the patterns established in `tests/e2e/epic6-title-matching.spec.ts` for extension loading and page navigation.
- The BGG rating span selector used by existing E2E tests can be discovered by reading one of the existing E2E spec files.
- Do not modify any existing E2E spec files.

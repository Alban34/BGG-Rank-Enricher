## Epic 14 — Add BGG Rating Enrichment for cavernedugobelin.fr

**Objective**
Add support for cavernedugobelin.fr to the extension's supported shop roster.

**In scope**
- Add a SHOP_CONFIGS entry (or two if both www and bare domain are needed), manifest.json match pattern(s), URL-guard unit tests, and a Playwright E2E spec for cavernedugobelin.fr

**Stories**
1. **Add BGG rating enrichment for cavernedugobelin.fr**

**Acceptance Criteria**
- Story 1: Before writing any code, the developer has visited at least two distinct product pages and one non-product page on `cavernedugobelin.fr`, confirmed whether `www.cavernedugobelin.fr` and bare `cavernedugobelin.fr` both resolve without redirecting to a single canonical host, identified the URL pattern that distinguishes product pages from listing/category pages, and identified the CSS selector for the product title element. If `cavernedugobelin.fr` serves both a `www` subdomain and a bare domain without a redirect, both hostnames must have SHOP_CONFIGS entries and corresponding manifest.json match patterns. `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one listing-page URL; if both hostname variants are registered, at least one `true` case must exist for each. Both cases have named test cases added to `tests/shared/urlGuard.test.ts` and all pass. The Playwright spec `tests/e2e/epic9-cavernedugobelin.spec.ts` navigates to a real product page, uses `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts at least one `[data-bgg-rating]` span is present; a second test asserts zero such spans on a known non-product page. The E2E assertion does not couple to a specific rating value.

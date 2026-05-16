## Epic 12 — Add BGG Rating Enrichment for okkazeo.com

**Objective**
Add support for okkazeo.com to the extension's supported shop roster.

**In scope**
- Add a SHOP_CONFIGS entry, manifest.json match pattern, URL-guard unit tests, and a Playwright E2E spec for okkazeo.com

**Stories**
1. **Add BGG rating enrichment for okkazeo.com**

**Acceptance Criteria**
- Story 1: Before writing any code, the developer has visited at least two distinct product pages and one non-product page on `okkazeo.com`, confirmed the canonical hostname, identified the URL pattern that distinguishes product pages from listing/category pages, and identified the CSS selector for the product title element. A new entry is appended to SHOP_CONFIGS with the discovered `hostname`, `urlPattern`, and `titleSelector`. The production hostname(s) are added to `content_scripts[0].matches` in `manifest.json`. `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one listing-page URL from `okkazeo.com`; both cases have named test cases added to `tests/shared/urlGuard.test.ts` and all pass. The Playwright spec `tests/e2e/epic9-okkazeo.spec.ts` navigates to a real product page, uses `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts at least one `[data-bgg-rating]` span is present; a second test asserts zero such spans on a known non-product page. The E2E assertion does not couple to a specific rating value.

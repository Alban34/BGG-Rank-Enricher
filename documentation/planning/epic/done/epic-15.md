## Epic 15 — Fix zatu: Update Config to Target zatu.com

**Objective**
Repair the zatu shop configuration: the config currently targets the defunct `zatugames.co.uk`; the live domain is `zatu.com` and title detection is also broken.

**In scope**
- Update the zatu SHOP_CONFIGS entry to target `zatu.com`, remove the old `zatugames.co.uk` entry, fix title detection, update manifest.json, URL-guard unit tests, and rename the Playwright E2E spec

**Stories**
1. **Fix zatu: update the shop config to target zatu.com and verify end-to-end enrichment**

**Acceptance Criteria**
- Story 1: The developer visits `zatugames.co.uk` in a browser, confirms it redirects to `zatu.com`, and determines the canonical hostname. The SHOP_CONFIGS entry for zatu is updated so `hostname` matches the confirmed canonical hostname of `zatu.com`; the old `zatugames.co.uk` entry is removed entirely. `manifest.json` `content_scripts[0].matches` is updated with the new `zatu.com` pattern. `isProductPage()` returns `true` for at least two real `zatu.com` product-page URLs and `false` for at least one non-product URL; the test cases referencing `zatugames.co.uk` in `tests/shared/urlGuard.test.ts` are replaced with equivalent `zatu.com` cases and all pass. The spec `tests/e2e/epic8-zatugames.spec.ts` is renamed to `tests/e2e/epic15-zatu.spec.ts` and updated to navigate to a real `zatu.com` product page; it asserts `[data-bgg-rating]` is present and that the title element has its underline style applied.

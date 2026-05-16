# Epic 8: Multi-Shop Architecture and BGG Rating Enrichment

## Objective
Refactor the three Philibert-specific hard-codings into a data-driven shop-config system, then add BGG rating enrichment for 10 additional board game shops across French-speaking and English-speaking markets. Story 8.0 is a blocking prerequisite; stories 8.1–8.10 must be merged sequentially — each branch must be rebased on the previously merged story before opening a PR, because all stories append to the same shared files (`src/shared/title-utils.ts` and `manifest.json`).

## Stories

### Story 8.0: Introduce the shop-config architecture (blocking prerequisite for 8.1–8.10)

**Objective:** Replace the three Philibert-specific hard-codings — the `PRODUCT_PAGE_PATTERN` constant in `src/shared/title-utils.ts`, the `'h1.product-title'` selector string in `src/content/index.ts`, and the implicit single-shop assumption in both files — with a `ShopConfig` data structure and a `SHOP_CONFIGS` array. Philibert becomes the first entry in the config rather than a special case. All existing tests must continue to pass without modification.

**Acceptance Criteria:**
- A `ShopConfig` interface (or type alias) is defined in and exported from `src/shared/title-utils.ts` with the exact shape `{ hostname: string; urlPattern: RegExp; titleSelector: string }`.
- An exported `SHOP_CONFIGS` constant of type `ShopConfig[]` is defined in `src/shared/title-utils.ts` and contains exactly one entry for Philibert: `{ hostname: 'www.philibertnet.com', urlPattern: /\/\d+-[^/]+\.html$/, titleSelector: 'h1.product-title' }`.
- The module-level `PRODUCT_PAGE_PATTERN` constant is removed from `title-utils.ts`.
- `isProductPage(url: string)` calls `new URL(url)` once before `.find()`, destructures `{ hostname, pathname }`, finds the matching config via `SHOP_CONFIGS.find(c => c.hostname === hostname)`, and returns `config.urlPattern.test(pathname)`; if no matching config is found, it returns `false`. The implementation must follow this structure exactly:
  ```ts
  try {
    const { hostname, pathname } = new URL(url);
    const config = SHOP_CONFIGS.find(c => c.hostname === hostname);
    if (!config) return false;
    return config.urlPattern.test(pathname);
  } catch {
    return false;
  }
  ```
- `detectAndMarkTitle()` in `src/content/index.ts` finds the matching config via `SHOP_CONFIGS.find(c => c.hostname === window.location.hostname)`; it passes `config.titleSelector` to `document.querySelector()`; if no matching config is found, it emits `console.warn('[BGG Enricher] No shop config found for hostname: <hostname>')` and returns early without any DOM modification.
- The hardcoded string `'h1.product-title'` is removed from `content/index.ts`; the generic `?? document.querySelector('h1')` fallback is also removed in favour of the config-driven selector exclusively.
- `manifest.json` is not modified in this story.
- All tests in `tests/shared/urlGuard.test.ts` pass without modification.
- All E2E specs in `tests/e2e/` pass without modification.

**Edge Cases:**
- `isProductPage()` called with a URL whose hostname does not appear in `SHOP_CONFIGS` must return `false` without throwing — including unrecognised domains and malformed strings.
- `detectAndMarkTitle()` on an unrecognised hostname must emit the console warning and return cleanly; no DOM mutation may occur.
- The removal of the `?? document.querySelector('h1')` fallback is intentional: carrying it forward would silently apply a generic fallback behaviour to shops whose config defines a more specific selector. Each shop config must declare a precise selector; no silent fallback is permitted.

**Developer Context:**
- Files to modify: `src/shared/title-utils.ts` and `src/content/index.ts` only. Do not touch `manifest.json` in this story.
- Add the `ShopConfig` interface and the `SHOP_CONFIGS` array to `title-utils.ts` immediately before `isProductPage()`. Export both so the content script can consume them.
- `isProductPage()` must call `new URL(url)` once at the top of the try block, destructuring `{ hostname, pathname }`, before passing `hostname` into `.find()`. Do not place `new URL(url)` inside the `.find()` callback — constructing the URL object on every iteration is wasteful and obscures the throw-path for malformed inputs. The outer try/catch is still required to guard against malformed URL strings.
- In `content/index.ts`, import `SHOP_CONFIGS` from `$shared/title-utils` and resolve the config at the top of `detectAndMarkTitle()` using `window.location.hostname`. The content script does not need to import `isProductPage` directly — the URL guard in Story 7.2 already handles that at the call-site.
- No new test files are required; passing all existing tests is the sole verification criterion for this story.

---

### Story 8.1: Add BGG rating enrichment for Agorajeux (agorajeux.fr)

> **Prerequisite:** Story 8.0 must be merged before this story begins. Stories 8.1–8.10 must be merged sequentially; rebase this branch on the previously merged story before opening a PR (all stories write to the same shared files and will conflict if merged out of order).

**Objective:** Inspect `agorajeux.fr` product pages to determine the correct `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two distinct product pages and one category or search-results page on `agorajeux.fr`, identified the distinguishing URL pattern, and identified the CSS selector for the product title element. The discovered `hostname`, RegExp literal, and selector string are documented in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` in `src/shared/title-utils.ts` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The exact hostname(s) used by `agorajeux.fr` in production (with or without `www`, as confirmed by inspection) are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs from `agorajeux.fr` discovered during inspection.
- `isProductPage()` returns `false` for at least one real category or listing-page URL from `agorajeux.fr`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-agorajeux.spec.ts` navigates to a real Agorajeux product page (URL chosen during inspection) with the extension loaded, uses `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })` to wait for injection, and asserts that at least one `[data-bgg-rating]` span is present in the DOM.
- The spec includes a second test asserting that a known Agorajeux non-product page produces zero `[data-bgg-rating]` spans.

**Edge Cases:**
- If `agorajeux.fr` does not redirect between the `www` and bare-domain variants, both hostnames need a `SHOP_CONFIGS` entry (or the `isProductPage` hostname resolution must normalise `www`-prefix matching — document the chosen approach in the PR).
- If the title element is injected by client-side JavaScript after initial page load, the `waitForSelector` timeout of 15 seconds may need increasing; document any adjusted timeout in the PR.
- The E2E assertion must not couple to a specific rating value; assert only the presence of the span.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; do not reorder existing entries.
- The `manifest.json` change is limited to `content_scripts[0].matches`; `host_permissions` does not need to include shop domains because the service worker fetches exclusively from `boardgamegeek.com`.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and page-navigation boilerplate.
- The `[data-bgg-rating]` attribute is set on the injected span by `injectRatingSpan()` in `src/content/index.ts`.

---

### Story 8.2: Add BGG rating enrichment for Ludibay (ludibay.fr)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `ludibay.fr` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `ludibay.fr` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `ludibay.fr` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `ludibay.fr`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-ludibay.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- If `ludibay.fr` redirects between `www` and bare-domain, verify which hostname is canonical and register only that one in `SHOP_CONFIGS` and `manifest.json`.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.3: Add BGG rating enrichment for LudoFacto (ludofacto.be)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `ludofacto.be` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `ludofacto.be` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `ludofacto.be` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `ludofacto.be`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-ludofacto.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- Belgian `.be` TLD sites sometimes serve content on multiple language subdomains (e.g. `fr.ludofacto.be`, `nl.ludofacto.be`); if active language subdomains exist in practice, each must have a `SHOP_CONFIGS` entry (and a corresponding `manifest.json` match pattern), or the hostname resolution must be made subdomain-tolerant — document the chosen approach in the PR.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.4: Add BGG rating enrichment for Esprit Jeu (espritjeu.com)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `espritjeu.com` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `espritjeu.com` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `espritjeu.com` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `espritjeu.com`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-espritjeu.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- If `espritjeu.com` serves both `www.espritjeu.com` and `espritjeu.com` without a redirect between them, both hostnames must be handled in `SHOP_CONFIGS` and `manifest.json`.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.5: Add BGG rating enrichment for Ludum (ludum.fr)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `ludum.fr` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `ludum.fr` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `ludum.fr` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `ludum.fr`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-ludum.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- If `ludum.fr` redirects between `www` and bare-domain, verify the canonical hostname and register only that one.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.6: Add BGG rating enrichment for Zatu Games (zatugames.co.uk)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `zatugames.co.uk` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `zatugames.co.uk` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `zatugames.co.uk` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `zatugames.co.uk`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-zatugames.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- If the shop uses a Shopify `/products/<slug>` URL scheme, the `urlPattern` must be precise enough to exclude `/collections/<name>/products/<slug>` listing views; verify the distinction during inspection.
- If the title element is dynamically rendered (common on Shopify storefronts), document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.7: Add BGG rating enrichment for BoardGameBliss (boardgamebliss.com)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `boardgamebliss.com` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `boardgamebliss.com` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `boardgamebliss.com` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `boardgamebliss.com`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-boardgamebliss.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- If the shop uses a Shopify `/products/<slug>` URL scheme, the `urlPattern` must distinguish individual product pages from collection pages that embed product cards; verify during inspection.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.8: Add BGG rating enrichment for Miniature Market (miniaturemarket.com)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `miniaturemarket.com` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `miniaturemarket.com` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `miniaturemarket.com` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `miniaturemarket.com`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-miniaturemarket.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- Miniature Market carries both board games and miniatures/hobby products; the `urlPattern` must be validated against product pages from both categories to confirm it does not inadvertently exclude board-game product pages. The `titleSelector` must correctly target the game title on board-game pages.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.9: Add BGG rating enrichment for Cool Stuff Inc (coolstuffinc.com)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `coolstuffinc.com` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `coolstuffinc.com` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `coolstuffinc.com` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `coolstuffinc.com`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-coolstuffinc.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- Cool Stuff Inc carries a broad inventory (board games, CCGs, miniatures); verify that the `titleSelector` targets the product title and not an unrelated heading, particularly on non-board-game product pages where the content script will still fire once the domain is added to `manifest.json`.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

---

### Story 8.10: Add BGG rating enrichment for Game Nerdz (gamenerdz.com)

> **Prerequisite:** Story 8.0 must be merged before this story begins.

**Objective:** Inspect `gamenerdz.com` product pages to determine `urlPattern` and `titleSelector`, then add a `SHOP_CONFIGS` entry, update `manifest.json`, extend the unit-test suite, and add a Playwright E2E spec confirming end-to-end rating injection.

**Acceptance Criteria:**
- Before writing any code, the developer has visited at least two product pages and one non-product page on `gamenerdz.com` and documented the discovered `hostname`, RegExp literal, and selector string in the pull-request description.
- A new entry is appended to `SHOP_CONFIGS` with the discovered `hostname`, `urlPattern`, and `titleSelector`.
- The production hostname(s) for `gamenerdz.com` are added to `content_scripts[0].matches` in `manifest.json`.
- `isProductPage()` returns `true` for at least two real product-page URLs and `false` for at least one non-product URL from `gamenerdz.com`.
- Corresponding named test cases are added to `tests/shared/urlGuard.test.ts` and all pass.
- A new Playwright spec `tests/e2e/epic8-gamenerdz.spec.ts` asserts `[data-bgg-rating]` span presence on a real product page using `waitForSelector('[data-bgg-rating]', { timeout: 15_000 })`, and asserts its absence on a non-product page using a short timeout followed by an assertion on zero matching elements (following the pattern established in `tests/e2e/epic6-title-matching.spec.ts`).

**Edge Cases:**
- If `gamenerdz.com` redirects between `www` and bare-domain, verify the canonical hostname and register only that one.
- If the title element is dynamically rendered, document any wait adjustment in the PR.
- The E2E assertion must not couple to a specific rating value.

**Developer Context:**
- Append to `SHOP_CONFIGS` in `src/shared/title-utils.ts`; `manifest.json` change is `content_scripts[0].matches` only.
- Follow `tests/e2e/epic6-title-matching.spec.ts` for extension-loading and navigation boilerplate.

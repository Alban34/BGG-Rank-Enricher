# Error Audit Log

---

## [2026-05-13] Epic 6 — Improved BGG Title Matching for Expansion Titles

**File:** `src/shared/title-utils.ts`

**Finding:** The JSDoc example on line 3 reads `" :" or " : " → ":"`, implying that post-colon whitespace is also removed. In practice the implementation (`\s+:` regex) only removes whitespace *before* the colon, so `" : "` produces `": "` (the trailing space is preserved as a word separator). The second clause of the same comment ("Post-colon whitespace is preserved as a normal word separator") correctly describes the behaviour, but the inline example contradicts it.

**Suggested action:** Correct the JSDoc example from `" : " → ":"` to `" : " → ": "` (retaining the trailing space) so that the example is consistent with the implementation and the second clause of the comment.

**Status:** OBSOLETE — JSDoc example already correct in source as of 2026-05-13.

---

---

## [2026-05-13] Epic 8 — Multi-Shop Architecture and BGG Rating Enrichment

**File:** `README.md`

**Finding (1 of 4):** The opening description reads "A Chrome extension that enriches board game product pages on Philibertnet with BoardGameGeek community ratings, so you can see the BGG average score inline without leaving the shop." Epic 8 added 10 new shops; the extension now supports 11 shops (Philibert, Agorajeux, Ludibay, LudoFacto, Esprit Jeu, Ludum, Zatu Games, BoardGameBliss, Miniature Market, Cool Stuff Inc, Game Nerdz). The description is Philibert-only and no longer reflects the multi-shop scope.

**Suggested action:** Update the opening description to reflect the multi-shop nature of the extension, listing all supported shops or describing the extension as supporting multiple board game shops across French-speaking and English-speaking markets.

---

**File:** `README.md`

**Finding (2 of 4):** The "URL guard" bullet under "How it works" reads: "the content script checks whether the current page URL matches the Philibertnet individual product-page pattern (a path segment of the form `/<numeric-SKU>-<slug>.html`, e.g. `/73168-wingspan-3760146644991.html`)." As of Story 8.0, the URL guard no longer uses a single Philibert-specific regex. It resolves the matching entry in `SHOP_CONFIGS` by hostname and tests against that entry's `urlPattern`. The description of the guard mechanism is now wrong for all shops except Philibert, and the example URL pattern only applies to PrestaShop-based shops.

**Suggested action:** Rewrite the URL guard bullet to describe the `SHOP_CONFIGS` lookup: the content script resolves the current hostname against the `SHOP_CONFIGS` array and tests the pathname against that shop's `urlPattern`; if no config matches the hostname, the content script exits immediately.

---

**File:** `README.md`

**Finding (3 of 4):** The "Title detection" bullet reads: "the content script looks for the board game title first in an `h1.product-title` element, then falls back to any `h1` on the page." Story 8.0 removed both the `h1.product-title` hardcode and the `h1` fallback. The content script now queries using the per-shop `titleSelector` from `SHOP_CONFIGS`; if no config matches, it emits a `console.warn` and returns without touching the DOM. There is no generic `h1` fallback.

**Suggested action:** Rewrite the title detection bullet to say the content script reads `titleSelector` from the matching `SHOP_CONFIGS` entry and queries the DOM with it; if the element is not found, no DOM mutation occurs and a warning is logged.

---

**File:** `README.md`

**Finding (4 of 4):** The "Cloudflare authentication note" section ends with: "reload the Philibertnet product page." With 11 supported shops, the instruction applies to any supported shop, not only Philibert.

**Suggested action:** Replace "reload the Philibertnet product page" with "reload the product page on the relevant shop."

---

**File:** `documentation/my-inputs/shops-candidates.md`

**Finding:** The feature input file `documentation/my-inputs/v1.0.0-features.md` explicitly notes that `shops-candidates.md` "sera supprimé une fois l'implémentation faite" (will be deleted once the implementation is done). Epic 8 is now fully implemented. The file remains in the repository and its "Points d'attention techniques" section contains stale pre-refactor architecture notes (e.g. references to `PRODUCT_PAGE_PATTERN` and a single-entry `content_scripts` block) that contradict the current implementation.

**Suggested action:** Delete `documentation/my-inputs/shops-candidates.md`. This requires a maintainer to run `git rm documentation/my-inputs/shops-candidates.md` (or equivalent) and commit the removal.

---

**File:** `documentation/planning/epic/` (folder organisation)

**Finding:** Epic 8 is fully implemented, but its spec and task-list files remain in `ready-for-dev/` (`epic-8.md`, `epic-8-task-list.md`). All previously completed epics (1–7) have their files in `done/`. Additionally, a copy of `epic-8.md` exists in `approved/` alongside the `.gitkeep` placeholder, which suggests the file was not removed from `approved/` when it was promoted to `ready-for-dev/`.

**Suggested action:** Run `git mv documentation/planning/epic/ready-for-dev/epic-8.md documentation/planning/epic/done/epic-8.md`, `git mv documentation/planning/epic/ready-for-dev/epic-8-task-list.md documentation/planning/epic/done/epic-8-task-list.md`, and `git rm documentation/planning/epic/approved/epic-8.md` to align the folder organisation with the convention established by epics 1–7.

---


---

## [2026-05-15] Epic 8 — Unverified shop config: Agorajeux (Story 8.1)

**File:** `src/shared/title-utils.ts`, `tests/e2e/epic8-agorajeux.spec.ts`

**Finding:** `www.agorajeux.fr` was DNS-unreachable from the build environment during Epic 8 implementation. The `urlPattern` (`/\/\d+-[^/]+\.html$/`) and `titleSelector` (`h1[itemprop="name"]`) were inferred from PrestaShop platform conventions, not confirmed by live site inspection. The E2E spec has never been run against the live site.

**Suggested action:** A developer should visit at least two product pages and one category/listing page on `agorajeux.fr`, verify the URL pattern and CSS selector, update `SHOP_CONFIGS` entry and test URLs in `urlGuard.test.ts` if necessary, and run `tests/e2e/epic8-agorajeux.spec.ts` against the live site.

**Status:** OPEN

---

## [2026-05-15] Epic 8 — Unverified shop config: Ludibay (Story 8.2)

**File:** `src/shared/title-utils.ts`, `tests/e2e/epic8-ludibay.spec.ts`

**Finding:** `ludibay.fr` was DNS-unreachable from the build environment during Epic 8 implementation. The `urlPattern` (`/\/\d+-[^/]+\.html$/`) and `titleSelector` (`h1[itemprop="name"]`) were inferred from PrestaShop platform conventions, not confirmed by live site inspection. The E2E spec has never been run against the live site.

**Suggested action:** A developer should visit at least two product pages and one category/listing page on `ludibay.fr`, verify the URL pattern and CSS selector, update `SHOP_CONFIGS` entry and test URLs in `urlGuard.test.ts` if necessary, and run `tests/e2e/epic8-ludibay.spec.ts` against the live site.

**Status:** OPEN

---

## [2026-05-15] Epic 8 — Unverified shop config: LudoFacto (Story 8.3)

**File:** `src/shared/title-utils.ts`, `tests/e2e/epic8-ludofacto.spec.ts`

**Finding:** `www.ludofacto.be` was DNS-unreachable from the build environment during Epic 8 implementation. The `urlPattern` (`/\/\d+-[^/]+\.html$/`) and `titleSelector` (`h1[itemprop="name"]`) were inferred from PrestaShop platform conventions, not confirmed by live site inspection. The epic spec notes that Belgian `.be` sites sometimes serve content on multiple language subdomains (`fr.ludofacto.be`, `nl.ludofacto.be`); this was not verified. The E2E spec has never been run against the live site.

**Suggested action:** A developer should visit at least two product pages and one category/listing page on `ludofacto.be`, check for active language subdomains, verify the URL pattern and CSS selector, update `SHOP_CONFIGS` entry/entries and test URLs if necessary, and run `tests/e2e/epic8-ludofacto.spec.ts` against the live site.

**Status:** OPEN

---

## [2026-05-15] Epic 8 — Unverified shop config: Zatu Games (Story 8.6)

**File:** `src/shared/title-utils.ts`, `tests/e2e/epic8-zatugames.spec.ts`

**Finding:** `www.zatugames.co.uk` was DNS-unreachable from the build environment during Epic 8 implementation. The `urlPattern` (`/^\/products\/[^/]+$/`) was inferred from Shopify platform conventions; the `titleSelector` (`h1.product-title`) is the common Shopify theme class but was not confirmed against the actual Zatu theme. The E2E spec has never been run against the live site.

**Suggested action:** A developer should visit at least two product pages and one collection/listing page on `zatugames.co.uk`, verify the URL pattern and CSS selector (especially the exact `h1` class used in the Zatu theme), update `SHOP_CONFIGS` entry and test URLs in `urlGuard.test.ts` if necessary, and run `tests/e2e/epic8-zatugames.spec.ts` against the live site.

**Status:** OPEN

## Summary

| Date | Epic | File | Finding | Status |
|---|---|---|---|---|
| 2026-05-13 | Epic 6 — Improved BGG Title Matching | `src/shared/title-utils.ts` | JSDoc example for `normaliseTitle` incorrectly showed trailing space being removed | OBSOLETE |
| 2026-05-13 | Epic 8 — Multi-Shop Architecture | `README.md` | Opening description mentions only Philibertnet; extension now supports 11 shops | OPEN |
| 2026-05-13 | Epic 8 — Multi-Shop Architecture | `README.md` | "URL guard" section describes a single Philibert regex; implementation now uses per-shop `SHOP_CONFIGS` | OPEN |
| 2026-05-13 | Epic 8 — Multi-Shop Architecture | `README.md` | "Title detection" section describes `h1.product-title` + `h1` fallback; both were removed in Story 8.0 | OPEN |
| 2026-05-13 | Epic 8 — Multi-Shop Architecture | `README.md` | Cloudflare note says "reload the Philibertnet product page"; should be shop-agnostic | OPEN |
| 2026-05-13 | Epic 8 — Multi-Shop Architecture | `documentation/my-inputs/shops-candidates.md` | File flagged for deletion in feature spec; still present with stale pre-refactor notes | OPEN |
| 2026-05-13 | Epic 8 — Multi-Shop Architecture | `documentation/planning/epic/` | `epic-8.md` and `epic-8-task-list.md` still in `ready-for-dev/`; duplicate `epic-8.md` exists in `approved/`; should be moved to `done/` | RESOLVED |
| 2026-05-15 | Epic 8 — Multi-Shop Architecture | `src/shared/title-utils.ts` | Agorajeux (`www.agorajeux.fr`) `urlPattern` and `titleSelector` unverified; site was DNS-unreachable during implementation | OPEN |
| 2026-05-15 | Epic 8 — Multi-Shop Architecture | `src/shared/title-utils.ts` | Ludibay (`ludibay.fr`) `urlPattern` and `titleSelector` unverified; site was DNS-unreachable during implementation | OPEN |
| 2026-05-15 | Epic 8 — Multi-Shop Architecture | `src/shared/title-utils.ts` | LudoFacto (`www.ludofacto.be`) `urlPattern`, `titleSelector`, and language-subdomain handling unverified; site was DNS-unreachable during implementation | OPEN |
| 2026-05-15 | Epic 8 — Multi-Shop Architecture | `src/shared/title-utils.ts` | Zatu Games (`www.zatugames.co.uk`) `titleSelector` unverified (Shopify theme class assumed); site was DNS-unreachable during implementation | OPEN |

# Epic 8 — Task List: Multi-Shop Architecture and BGG Rating Enrichment

## Story 8.0: Introduce the shop-config architecture (blocking prerequisite)

- [x] Add `ShopConfig` interface and exported `SHOP_CONFIGS` constant (one Philibert entry) to `src/shared/title-utils.ts`
- [x] Remove `PRODUCT_PAGE_PATTERN` constant and rewrite `isProductPage()` to use `SHOP_CONFIGS`
- [x] Update `detectAndMarkTitle()` in `src/content/index.ts` to import `SHOP_CONFIGS` and use `config.titleSelector`; emit console.warn on unrecognised hostname
- [x] Test: verify all existing tests in `tests/shared/urlGuard.test.ts` pass without modification
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts tests/content/`

## Story 8.1: Add BGG rating enrichment for Agorajeux (agorajeux.fr)

- [x] Research: visit agorajeux.fr product and category pages; document hostname, urlPattern, titleSelector (platform: likely PrestaShop — expected URL format `/fr/<category>/<id>-<slug>.html`)
- [x] Append `SHOP_CONFIGS` entry for agorajeux.fr in `src/shared/title-utils.ts`
- [x] Add hostname(s) to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-agorajeux.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.2: Add BGG rating enrichment for Ludibay (ludibay.fr)

- [x] Research: visit ludibay.fr product and category pages; document hostname, urlPattern, titleSelector
- [x] Append `SHOP_CONFIGS` entry for ludibay.fr in `src/shared/title-utils.ts`
- [x] Add hostname(s) to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-ludibay.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.3: Add BGG rating enrichment for LudoFacto (ludofacto.be)

- [x] Research: visit ludofacto.be product and category pages; document hostname(s) including any language subdomains, urlPattern, titleSelector
- [x] Append `SHOP_CONFIGS` entry/entries for ludofacto.be in `src/shared/title-utils.ts`
- [x] Add hostname(s) to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-ludofacto.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.4: Add BGG rating enrichment for Esprit Jeu (espritjeu.com)

- [x] Research: confirmed hostname `www.espritjeu.com`; product h1 selector `h1.fa_designation`; product URL pattern: `.html` pages at root or under category slug (developer must verify URL distinction from category pages during inspection)
- [x] Append `SHOP_CONFIGS` entry for espritjeu.com in `src/shared/title-utils.ts`
- [x] Add `https://www.espritjeu.com/*` to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-espritjeu.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.5: Add BGG rating enrichment for Ludum (ludum.fr)

- [x] Research: confirmed hostname `www.ludum.fr`; product URLs follow `/<category-slug>/<product-slug>-<4+digit-id>` (e.g. `/jeux-d-ambiance-en-famille/soupcons-12441`); category pages follow `/<numeric-id>-<slug>` (single segment); h1 selector `h1.h1`
- [x] Append `SHOP_CONFIGS` entry for ludum.fr in `src/shared/title-utils.ts`
- [x] Add `https://www.ludum.fr/*` to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-ludum.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.6: Add BGG rating enrichment for Zatu Games (zatugames.co.uk)

- [x] Research: visit zatugames.co.uk product and category pages; document hostname, urlPattern, titleSelector (platform: likely Shopify — expected URL `/products/<slug>`)
- [x] Append `SHOP_CONFIGS` entry for zatugames.co.uk in `src/shared/title-utils.ts`
- [x] Add hostname(s) to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-zatugames.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.7: Add BGG rating enrichment for BoardGameBliss (boardgamebliss.com)

- [x] Research: confirmed hostname `www.boardgamebliss.com` (Shopify); product URLs `/products/<slug>`; h1 selector `h1.product-title`; non-product URLs at `/collections/`, `/pages/`, `/cart`
- [x] Append `SHOP_CONFIGS` entry for boardgamebliss.com in `src/shared/title-utils.ts`
- [x] Add `https://www.boardgamebliss.com/*` to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-boardgamebliss.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.8: Add BGG rating enrichment for Miniature Market (miniaturemarket.com)

- [x] Research: confirmed hostname `www.miniaturemarket.com`; product URLs `/<sku>.html` or `/<slug>-<sku>.html` (e.g. `/stm910.html`); h1 selector `h1.product-detail-name`; non-product pages at `/collections/`, `/customer-support`, `/about-us` (no `.html` extension)
- [x] Append `SHOP_CONFIGS` entry for miniaturemarket.com in `src/shared/title-utils.ts`
- [x] Add `https://www.miniaturemarket.com/*` to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-miniaturemarket.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.9: Add BGG rating enrichment for Cool Stuff Inc (coolstuffinc.com)

- [x] Research: confirmed hostname `www.coolstuffinc.com`; product URLs `/p/<numeric-id>` (e.g. `/p/295039`); h1 selector `h1.product-name`; category pages at `/page/<id>`, search at `/sq/`
- [x] Append `SHOP_CONFIGS` entry for coolstuffinc.com in `src/shared/title-utils.ts`
- [x] Add `https://www.coolstuffinc.com/*` to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-coolstuffinc.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Story 8.10: Add BGG rating enrichment for Game Nerdz (gamenerdz.com)

- [x] Research: confirmed hostname `www.gamenerdz.com` (BigCommerce); product URLs `/<product-slug>` at root (e.g. `/wandering-towers`); h1 selector `h1.productView-title`; category pages at `/board-games`, `/card-games`, etc. (developer must verify reliable URL distinction)
- [x] Append `SHOP_CONFIGS` entry for gamenerdz.com in `src/shared/title-utils.ts`
- [x] Add `https://www.gamenerdz.com/*` to `content_scripts[0].matches` in `manifest.json`
- [x] Add named unit tests to `tests/shared/urlGuard.test.ts` (2 product true, 1 non-product false)
- [x] Create `tests/e2e/epic8-gamenerdz.spec.ts` (presence + absence assertions)
- [x] QC (Automated): `vitest run tests/shared/urlGuard.test.ts`

## Epic E2E Test

- [x] Epic E2E Test: QC Lead authors `tests/e2e/epic8-workflow.spec.ts` covering the full multi-shop enrichment user journey as a smoke check

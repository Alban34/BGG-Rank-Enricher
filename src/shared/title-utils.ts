/**
 * Normalises a raw board game title string before submitting it to the BGG search endpoint.
 *
 * Transformations applied (in order):
 *  1. Remove any whitespace immediately before a colon (e.g. " :" -> ":" or " : " -> ": ").
 *     Post-colon whitespace is preserved as a normal word separator.
 *  2. Collapse runs of multiple spaces into a single space
 *  3. Trim leading and trailing whitespace
 *
 * This function is pure (no side effects, no network calls) and has no dependency on
 * browser or extension runtime APIs.
 */
export function normaliseTitle(title: string): string {
  return title
    .replace(/\s+:/g, ':')
    .replace(/ {2,}/g, ' ')
    .trim();
}

export interface ShopConfig {
  hostname: string;
  urlPattern: RegExp;
  titleSelector: string;
  insertAfterSelector?: string;
}

export const SHOP_CONFIGS: ShopConfig[] = [
  {
    hostname: 'www.philibertnet.com',
    urlPattern: /\/\d+-[^/]+\.html$/,
    titleSelector: 'h1.product-title',
  },
  {
    hostname: 'www.espritjeu.com',
    urlPattern: /\.html$/,
    titleSelector: 'h1.fa_designation',
    insertAfterSelector: '.fa_bloc-details > .row:first-child',
  },
  {
    hostname: 'www.ludum.fr',
    urlPattern: /^\/[a-z][a-z-]+\/[a-z][a-z-]+-\d{4,}$/,
    titleSelector: 'h1.h1',
  },
  {
    hostname: 'zatu.com',
    urlPattern: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[^/]+\/?$/i,
    titleSelector:
      'main [itemprop="name"], main h1.product__title, main h1[class*="product"][class*="title"], main h1, h1.product__title',
  },
  {
    hostname: 'www.zatu.com',
    urlPattern: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[^/]+\/?$/i,
    titleSelector:
      'main [itemprop="name"], main h1.product__title, main h1[class*="product"][class*="title"], main h1, h1.product__title',
  },
  {
    hostname: 'boardgamebliss.com',
    urlPattern: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[^/]+\/?$/i,
    titleSelector:
      'main [itemprop="name"], main h1.product-title, main h1[class*="product"][class*="title"], main h1, h1.product-title',
  },
  {
    hostname: 'www.boardgamebliss.com',
    urlPattern: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[^/]+\/?$/i,
    titleSelector:
      'main [itemprop="name"], main h1.product-title, main h1[class*="product"][class*="title"], main h1, h1.product-title',
  },
  {
    hostname: 'www.miniaturemarket.com',
    urlPattern: /\.html$/,
    titleSelector: 'h1.product-detail-name',
  },
  {
    hostname: 'www.coolstuffinc.com',
    urlPattern: /^\/p\/\d+$/,
    titleSelector: 'h1.product-name',
  },
  {
    hostname: 'www.gamenerdz.com',
    urlPattern:
      /^\/(?!board-games|card-games|miniatures|roleplaying|supplies|collectibles|more-categories|preorders|deals|crowdfunded-editions|on-sale-board-games|ding-dent-board-games|sitemap|subscribe|brands|cart)[^/]+$/,
    titleSelector: 'h1.productView-title:not(.productView-title-mobile)',
  },
  // okkazeo.com - hostname: www.okkazeo.com
  // Product pages: /jeux/{numeric-id}/{slug} (e.g. /jeux/58002/earthborne-rangers)
  // Title selector: h1.titre_jeu
  {
    hostname: 'www.okkazeo.com',
    urlPattern: /^\/jeux\/\d+\/[^/]+$/,
    titleSelector: 'h1.titre_jeu',
  },
  // ludifolie.com (PrestaShop) - hostname: www.ludifolie.com
  // Product pages: /{numeric-id}-{slug}.html (e.g. /7232-wingspan.html)
  // Category pages: /{numeric-id}-{slug} (no .html extension)
  // Title selector: h1.product-title (full classes: h2 text-left product-title mb-1)
  {
    hostname: 'www.ludifolie.com',
    urlPattern: /^\/\d+-[^/]+\.html$/,
    titleSelector: 'h1.product-title',
  },
  // cavernedugobelin.fr - supports bare and www host variants
  // Product pages: /products/{13+-char-hex-id} with optional trailing slash
  // (e.g. /products/683946f208805, /products/683946f208805/)
  // Non-product: /products/banner/..., /products/categ/..., /products/tag/..., etc.
  // Title selector: prefer main content heading, fallback to generic h1
  {
    hostname: 'cavernedugobelin.fr',
    urlPattern: /^\/products\/[0-9a-f]{13,}\/?$/i,
    titleSelector:
      '#main-content h1.product-title, #main-content .product-title, main h1.product-title, main .product-title, h1.product-title, .product-title, main h1, h1',
  },
  {
    hostname: 'www.cavernedugobelin.fr',
    urlPattern: /^\/products\/[0-9a-f]{13,}\/?$/i,
    titleSelector:
      '#main-content h1.product-title, #main-content .product-title, main h1.product-title, main .product-title, h1.product-title, .product-title, main h1, h1',
  },
];

export function isProductPage(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    const config = SHOP_CONFIGS.find(c => c.hostname === hostname);
    if (!config) return false;
    return config.urlPattern.test(pathname);
  } catch {
    return false;
  }
}

/**
 * Normalises a raw board game title string before submitting it to the BGG search endpoint.
 *
 * Transformations applied (in order):
 *  1. Remove any whitespace immediately before a colon (e.g. " :" → ":" or " : " → ": ").
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

const PRODUCT_PAGE_PATTERN = /\/\d+-[^/]+\.html$/;

export function isProductPage(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return PRODUCT_PAGE_PATTERN.test(pathname);
  } catch {
    return false;
  }
}

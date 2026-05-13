import { describe, expect, it } from 'vitest';
import { isProductPage } from '../../src/shared/title-utils';

describe('isProductPage', () => {
  it('product page with numeric SKU + slug + .html returns true (Wingspan)', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html')).toBe(true);
  });

  it('product page (Dune: Imperium) returns true', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/dire-wolf-digital/91444-dune-imperium-810058800008.html')).toBe(true);
  });

  it('product page (Dune: Imperium – Immortality) returns true', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/dire-wolf-digital/118789-dune-imperium-immortality-810058800152.html')).toBe(true);
  });

  it('category page (user-reported false-positive) returns false', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/50-jeux-de-societe')).toBe(false);
  });

  it('root URL returns false', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/')).toBe(false);
  });

  it('empty string returns false without throwing', () => {
    expect(isProductPage('')).toBe(false);
  });

  it('non-URL string returns false without throwing', () => {
    expect(isProductPage('not-a-url')).toBe(false);
  });

  it('product URL with query string returns true', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html?ref=newsletter')).toBe(true);
  });

  it('product URL with hash fragment returns true', () => {
    expect(isProductPage('https://www.philibertnet.com/fr/matagot/73168-wingspan-3760146644991.html#reviews')).toBe(true);
  });
});

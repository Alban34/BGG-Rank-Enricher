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

describe('Esprit Jeu (8.4)', () => {
  it('product page (Wingspan) returns true', () => {
    expect(isProductPage('https://www.espritjeu.com/wingspan.html')).toBe(true);
  });
  it('product page (Maple Valley) returns true', () => {
    expect(isProductPage('https://www.espritjeu.com/jeux-de-strategie/maple-valley.html')).toBe(true);
  });
  it('root URL (no .html) returns false', () => {
    expect(isProductPage('https://www.espritjeu.com/')).toBe(false);
  });
});

describe('Ludum (8.5)', () => {
  it('product page (Soupçons) returns true', () => {
    expect(isProductPage('https://www.ludum.fr/jeux-d-ambiance-en-famille/soupcons-12441')).toBe(true);
  });
  it('product page (All In Predictions) returns true', () => {
    expect(isProductPage('https://www.ludum.fr/jeux-de-strategie-inities/all-in-predictions-12220')).toBe(true);
  });
  it('category page (numeric-prefix segment) returns false', () => {
    expect(isProductPage('https://www.ludum.fr/8598-jeux-de-societe')).toBe(false);
  });
});

describe('Zatu (15.1)', () => {
  it('product page (Wingspan) returns true', () => {
    expect(isProductPage('https://zatu.com/products/wingspan')).toBe(true);
  });
  it('product page (Dune Imperium) returns true', () => {
    expect(isProductPage('https://zatu.com/products/dune-imperium')).toBe(true);
  });
  it('collection/listing page returns false', () => {
    expect(isProductPage('https://zatu.com/collections/board-games')).toBe(false);
  });
});

describe('BoardGameBliss (8.7)', () => {
  it('product page (Wingspan) returns true', () => {
    expect(isProductPage('https://www.boardgamebliss.com/products/wingspan')).toBe(true);
  });
  it('product page (Dune Imperium) returns true', () => {
    expect(isProductPage('https://www.boardgamebliss.com/products/dune-imperium')).toBe(true);
  });
  it('collection/listing page returns false', () => {
    expect(isProductPage('https://www.boardgamebliss.com/collections/stonemaier-games')).toBe(false);
  });
});

describe('Miniature Market (8.8)', () => {
  it('product page (Wingspan) returns true', () => {
    expect(isProductPage('https://www.miniaturemarket.com/stm910.html')).toBe(true);
  });
  it('product page (Everdell Silverfrost) returns true', () => {
    expect(isProductPage('https://www.miniaturemarket.com/everdell-silverfrost-essentials-edition-stg3203en.html')).toBe(true);
  });
  it('collections page (no .html) returns false', () => {
    expect(isProductPage('https://www.miniaturemarket.com/collections')).toBe(false);
  });
});

describe('Cool Stuff Inc (8.9)', () => {
  it('product page /p/295039 returns true', () => {
    expect(isProductPage('https://www.coolstuffinc.com/p/295039')).toBe(true);
  });
  it('product page /p/409092 returns true', () => {
    expect(isProductPage('https://www.coolstuffinc.com/p/409092')).toBe(true);
  });
  it('category/nav page returns false', () => {
    expect(isProductPage('https://www.coolstuffinc.com/page/35')).toBe(false);
  });
});

describe('Game Nerdz (8.10)', () => {
  it('product page (Wandering Towers) returns true', () => {
    expect(isProductPage('https://www.gamenerdz.com/wandering-towers')).toBe(true);
  });
  it('product page (Forest Shuffle) returns true', () => {
    expect(isProductPage('https://www.gamenerdz.com/forest-shuffle')).toBe(true);
  });
  it('category page (board-games) returns false', () => {
    expect(isProductPage('https://www.gamenerdz.com/board-games')).toBe(false);
  });
});

describe('Okkazeo (9.2)', () => {
  it('product page (Earthborne Rangers) returns true', () => {
    expect(isProductPage('https://www.okkazeo.com/jeux/58002/earthborne-rangers')).toBe(true);
  });
  it('product page (Les Rats de Wistar) returns true', () => {
    expect(isProductPage('https://www.okkazeo.com/jeux/64619/les-rats-de-wistar')).toBe(true);
  });
  it('category page (arrivages) returns false', () => {
    expect(isProductPage('https://www.okkazeo.com/jeux/arrivages')).toBe(false);
  });
});

describe('Ludifolie (9.3)', () => {
  it('product page (Wingspan) returns true', () => {
    expect(isProductPage('https://www.ludifolie.com/7232-wingspan.html')).toBe(true);
  });
  it('product page (Catan) returns true', () => {
    expect(isProductPage('https://www.ludifolie.com/43-catan-jeu-de-base.html')).toBe(true);
  });
  it('category page (no .html extension) returns false', () => {
    expect(isProductPage('https://www.ludifolie.com/10-jeux-societe-adulte')).toBe(false);
  });
});

describe('Caverne du Gobelin (9.4)', () => {
  it('product page (Wondrous Creatures) returns true', () => {
    expect(isProductPage('https://cavernedugobelin.fr/products/683946f208805')).toBe(true);
  });
  it('product page (Slay The Spire FR) returns true', () => {
    expect(isProductPage('https://cavernedugobelin.fr/products/68394613af828')).toBe(true);
  });
  it('banner/category page returns false', () => {
    expect(isProductPage('https://cavernedugobelin.fr/products/banner/671e723620170/nouveautes')).toBe(false);
  });
});

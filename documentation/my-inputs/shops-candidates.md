# Shops candidats pour le BGG Rank Enricher

## Sites francophones

| # | Site | URL | Note |
|---|------|-----|-------|
| 1 | **Agorajeux** | `agorajeux.fr` | Très connu en France, large catalogue |
| 2 | **Ludibay** | `ludibay.fr` | Bon rapport qualité/prix, populaire |
| 3 | **LudoFacto** | `ludofacto.be` | Référence en Belgique |
| 4 | **Esprit Jeu** | `espritjeu.com` | Spécialiste jeu de société en France |
| 5 | **Ludum** | `ludum.fr` | Boutique en ligne française, bonne notoriété |

## Sites anglophones

| # | Site | URL | Note |
|---|------|-----|-------|
| 6 | **Zatu Games** | `zatugames.co.uk` | Leader UK, très grande communauté |
| 7 | **BoardGameBliss** | `boardgamebliss.com` | Référence canadienne |
| 8 | **Miniature Market** | `miniaturemarket.com` | Grand acteur US, catalogue énorme |
| 9 | **Cool Stuff Inc** | `coolstuffinc.com` | US, très populaire, bonnes promos |
| 10 | **Game Nerdz** | `gamenerdz.com` | US, connu pour ses prix compétitifs |

## Points d'attention techniques

Avant d'ajouter chaque site, prendre en compte :

- **URL pattern** : le `PRODUCT_PAGE_PATTERN` dans `src/shared/title-utils.ts` est codé en dur pour le format Philibert (`/\d+-slug.html`). Il faudra le rendre configurable par shop.
- **Sélecteur HTML** : le sélecteur `h1.product-title` dans `src/content/index.ts` est spécifique à Philibert — chaque shop a sa propre structure HTML.
- **Manifest** : il faudra ajouter les `host_permissions` et les entrées `content_scripts` correspondantes dans `manifest.json` pour chaque nouveau site.

## Plan d'implémentation

### Tâche 0 — Architecture (prérequis bloquant)

Le code actuel a trois couplages durs à Philibert qui bloquent tout ajout :

1. `src/shared/title-utils.ts` — `PRODUCT_PAGE_PATTERN` est une regex codée en dur pour le format Philibert
2. `src/content/index.ts` — le sélecteur `h1.product-title` est Philibert-specific
3. `manifest.json` — une seule entrée `content_scripts`, pas de `host_permissions` pour les autres domaines

Ajouter les 10 shops sans refactoring préalable reviendrait à dupliquer le content script et à introduire des `if/else` ingérables.

**Action** : introduire un système de shop configs (tableau d'objets `{ hostname, urlPattern, titleSelector }`), rendre `isProductPage` et `detectAndMarkTitle` shop-aware, et mettre à jour les tests `urlGuard.test.ts` et `titleDetection.test.ts`.

### Tâches 1–10 — Ajout des shops (après tâche 0)

Une fois l'architecture en place, chaque shop se réduit à vérifier la vraie structure HTML du site puis ajouter une entrée dans la config + les tests associés.

Les shops peuvent être **groupés par similarité de plateforme** pour réduire le nombre de tâches :

| Groupe | Sites | Raison du regroupement |
|--------|-------|------------------------|
| A | Agorajeux, Ludibay, LudoFacto | Probablement PrestaShop |
| B | Esprit Jeu, Ludum | À vérifier |
| C | Zatu, BoardGameBliss | Probablement Shopify |
| D | Miniature Market, Cool Stuff Inc, Game Nerdz | Plateformes US custom |

> **Recommandation** : si l'un des shops d'un groupe a une structure différente, cela peut bloquer tout le groupe. **1 shop par tâche reste le choix le plus sûr**, soit **11 tâches au total** (tâche 0 + 10 shops).

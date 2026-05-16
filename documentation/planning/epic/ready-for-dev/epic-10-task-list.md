# Epic 10 — Rating Label Format Enhancement: Task List

## Story 10.1 — Extend `BggLookupSuccess` and update the service worker

- [ ] 10.1.1 — In `src/shared/bgg-messages.ts`, add `gameUrl: string` as a required field to the `BggLookupSuccess` interface (leave `BggLookupError` unchanged)
- [ ] 10.1.2 — In `src/background/service-worker.ts`, inside the message handler (not inside `fetchBggRating`), construct `gameUrl` as `` `https://boardgamegeek.com/boardgame/${searchResult.id}` `` at the point where `searchResult.id` is already available, and include `gameUrl` in the `BggLookupSuccess` response object alongside `rating`
- [ ] 10.1.T — Test: verify `tests/background/bggRating.test.ts` still passes without modification (no changes to that file); confirm TypeScript compilation succeeds with the new required field on `BggLookupSuccess`
- [ ] 10.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

## Story 10.2 — Update the rating injector

- [ ] 10.2.1 — In `src/content/index.ts`, update `injectRatingSpan` signature to `injectRatingSpan(element: Element, gameUrl: string)` (add `gameUrl: string` as second parameter)
- [ ] 10.2.2 — In `src/content/index.ts`, rewrite the body of `injectRatingSpan` so the injected `<span data-bgg-rating>` contains: text node `(BGG: <rating>. `, then an `<a>` element with `textContent = 'See more'`, `href = gameUrl`, `target = '_blank'`, `rel = 'noopener noreferrer'`, then text node `)`
- [ ] 10.2.3 — In `src/content/index.ts`, preserve the idempotency guard `if (element.nextElementSibling?.hasAttribute('data-bgg-rating')) return` unchanged
- [ ] 10.2.4 — In `src/content/index.ts`, preserve inherited style assignments (`fontFamily`, `fontSize`, `fontWeight`) on the outer `<span data-bgg-rating>` unchanged
- [ ] 10.2.5 — In `src/content/index.ts`, update the call site inside `detectAndMarkTitle()` to pass `response.gameUrl` as the second argument to `injectRatingSpan`
- [ ] 10.2.T — Test: run `tests/content/bggMessaging.test.ts` (after Story 10.3 updates) to verify the new span structure is rendered correctly; confirm TypeScript compilation with updated call site
- [ ] 10.2.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

## Story 10.3 — Update unit tests and E2E specs

- [ ] 10.3.1 — In `tests/content/bggMessaging.test.ts`, update every `mockResolvedValue({ ok: true, rating: '8.0' })` call to `mockResolvedValue({ ok: true, rating: '8.0', gameUrl: 'https://boardgamegeek.com/boardgame/266192' })`
- [ ] 10.3.2 — In `tests/content/bggMessaging.test.ts`, replace the span text assertion for `(8.0)` with: assert the span's text content contains the prefix `(BGG: 8.0. `, assert the span has an `<a>` child element with `textContent === 'See more'` and `href === 'https://boardgamegeek.com/boardgame/266192'`
- [ ] 10.3.3 — In `tests/e2e/epic4-bgg-rating.spec.ts`, replace every `textContent` assertion matching the old `(<rating>)` pattern with: `textContent` matches `/^\(BGG:\s+[\d.]+\.\s+See more\)$/` and inner `<a>` `href` matches `/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/`
- [ ] 10.3.4 — In `tests/e2e/epic6-title-matching.spec.ts`, replace every `textContent` assertion matching the old `(<rating>)` pattern with: `textContent` matches `/^\(BGG:\s+[\d.]+\.\s+See more\)$/` and inner `<a>` `href` matches `/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/`
- [ ] 10.3.5 — In `tests/e2e/epic7-url-guard.spec.ts`, replace every `textContent` assertion matching the old `(<rating>)` pattern with: `textContent` matches `/^\(BGG:\s+[\d.]+\.\s+See more\)$/` and inner `<a>` `href` matches `/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/`
- [ ] 10.3.6 — In `tests/e2e/epic8-workflow.spec.ts`, replace every `textContent` assertion matching the old `(<rating>)` pattern with: `textContent` matches `/^\(BGG:\s+[\d.]+\.\s+See more\)$/` and inner `<a>` `href` matches `/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/`; leave any assertions that only check `[data-bgg-rating]` presence unchanged
- [ ] 10.3.T — Test: run `vitest run tests/content/bggMessaging.test.ts` and confirm the updated mock and span-structure assertions pass
- [ ] 10.3.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

## Epic E2E Test

- [ ] 10.E2E — QC (Epic-end): Run `playwright test`; confirm `epic4-bgg-rating.spec.ts`, `epic6-title-matching.spec.ts`, `epic7-url-guard.spec.ts`, and `epic8-workflow.spec.ts` all pass with the updated format assertions; confirm no regressions in any other E2E spec

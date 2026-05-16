## Epic 10 — Rating Label Format Enhancement

**Objective**
Replace the plain `(8.0)` rating label injected next to game titles with a richer `(BGG: 8.0. See more)` label where "See more" is a hyperlink opening the BGG game page in a new tab.

**In scope**
- Extend the `BggLookupSuccess` message type to carry the BGG game page URL alongside the rating
- Update the background service worker to populate the new field from the already-resolved BGG game ID
- Update the content-script rating injector to render the new label format with an `<a>` element
- Update all unit tests and E2E specs that assert on the old `(X.X)` label format

**Stories**
1. **Extend `BggLookupSuccess` to include `gameUrl` and update the service worker to populate it**
2. **Update the rating injector to render `(BGG: <rating>. See more)` with a hyperlink to the BGG game page**
3. **Update all unit tests and E2E specs that assert on the previous `(<rating>)` label format**

**Acceptance Criteria**
- Story 1: The `BggLookupSuccess` interface in `src/shared/bgg-messages.ts` gains a new required field `gameUrl: string`, documented as the canonical BGG game page URL (e.g. `"https://boardgamegeek.com/boardgame/266192"`). In `src/background/service-worker.ts`, the message handler constructs `gameUrl` as `` `https://boardgamegeek.com/boardgame/${searchResult.id}` `` and includes it in the success response object alongside `rating`. `BggLookupError` is unchanged. No other source files are modified in this story.
- Story 2: The `injectRatingSpan` function in `src/content/index.ts` is updated to accept `gameUrl: string` as a second parameter. The injected `<span data-bgg-rating>` contains the text `(BGG: <rating>. ` followed by an `<a>` element whose `textContent` is `See more`, `href` is the value of `gameUrl`, `target` is `_blank`, and `rel` is `noopener noreferrer`; followed by a closing `)`. The call site in `detectAndMarkTitle()` passes `response.gameUrl` as the second argument to `injectRatingSpan`. The idempotency guard (`if (element.nextElementSibling?.hasAttribute('data-bgg-rating')) return`) is preserved. The `fontFamily`, `fontSize`, and `fontWeight` inherited styles on the outer span are preserved.
- Story 3: Every assertion that couples to the old `(X.X)` format is updated. In `tests/content/bggMessaging.test.ts`: the `sendMessage` mock is updated to resolve with `{ ok: true, rating: '8.0', gameUrl: 'https://boardgamegeek.com/boardgame/266192' }`; the test asserting span text no longer checks for `(8.0)` — instead it asserts the span contains the text prefix `(BGG: 8.0. ` and an `<a>` child element with `textContent === 'See more'` and `href === 'https://boardgamegeek.com/boardgame/266192'`. In `tests/e2e/epic4-bgg-rating.spec.ts`, `tests/e2e/epic6-title-matching.spec.ts`, `tests/e2e/epic7-url-guard.spec.ts`, and `tests/e2e/epic8-workflow.spec.ts`: `textContent` assertions matching the old `(<rating>)` pattern are replaced with assertions that match the new format (e.g. `textContent` matches `/^\(BGG:\s+[\d.]+\.\s+See more\)$/` and the inner `<a>` element's `href` matches `/^https:\/\/boardgamegeek\.com\/boardgame\/\d+$/`). E2E specs that only assert presence of `[data-bgg-rating]` without asserting `textContent` require no change. All modified tests pass.

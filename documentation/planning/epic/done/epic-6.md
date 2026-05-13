## Epic 6 — Improved BGG Title Matching for Expansion Titles

**Objective**
Make the BGG title lookup robust enough to resolve expansion-style board game titles as displayed on Philibertnet — such as "Dune : Imperium - Immortality" — to their correct BoardGameGeek entries, without breaking the existing behaviour for base-game titles like "Wingspan" and "Dune: Imperium".

**In scope**
- A pure title-normalisation function that collapses Philibertnet-style spaced colons (` : `) and trims extraneous whitespace before the title is sent to BGG
- A progressive truncation fallback strategy inside `searchBgg` that retries the BGG search after stripping the rightmost ` - <Suffix>` segment when the full title returns `NOT_FOUND`
- Unit tests covering the normalisation function and the fallback strategy, plus explicit regression cases for titles that already work
- An E2E test for the Philibertnet expansion product page ("Dune : Imperium - Immortality") confirming the rating is displayed in the expected format

**Stories**

### Story 6.1 — Normalise the raw title string before it is submitted to the BGG search endpoint
Before calling `fetch` in the `searchBgg` helper, apply a deterministic normalisation function to the title string. The function must: collapse any sequence of whitespace-colon-whitespace (` : `, ` :`, `: `) into a single colon with no surrounding spaces (`:`); collapse multiple consecutive space characters into a single space; and trim leading and trailing whitespace. The normalised title is passed to every BGG search fetch call, including truncation retries. The function must be a pure, exported utility with no side effects and no network calls — it must be importable in unit tests without any browser or extension runtime context.

Acceptance condition: `normaliseTitle("Dune : Imperium - Immortality")` returns `"Dune: Imperium - Immortality"`; `normaliseTitle("Wingspan")` returns `"Wingspan"` unchanged; `normaliseTitle("  Arkham Horror : The Card Game  ")` returns `"Arkham Horror: The Card Game"`; the function is exported from a module under `src/` and can be imported in a Vitest unit test without errors.

### Story 6.2 — Implement a progressive title truncation fallback in the BGG search logic
Extend `searchBgg` so that if the search for the full normalised title returns `NOT_FOUND`, it strips the trailing ` - <Suffix>` segment (everything from the last occurrence of ` - ` onwards) and repeats the fetch with the shorter title. The loop continues until either a BGG item ID is found or no ` - ` separator remains in the current title candidate, in which case `{ ok: false, reason: "NOT_FOUND" }` is returned. Any error result other than `NOT_FOUND` (`NETWORK_ERROR`, `API_ERROR`, `CLOUDFLARE_BLOCK`, `PARSE_ERROR`) must short-circuit the loop immediately — no retry is performed, and the error result is returned as-is. A successful match at any truncation level returns `{ ok: true, id: "..." }` in the same shape as the base case.

Acceptance condition: with a mock that returns `NOT_FOUND` for `"Dune: Imperium - Immortality"` and a valid ID for `"Dune: Imperium"`, calling `searchBgg("Dune : Imperium - Immortality")` returns `{ ok: true, id: "<expected_id>" }` and the mock is called exactly twice; with a mock that always returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`, `searchBgg` makes exactly one fetch call and returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }` without retrying; `searchBgg("Wingspan")` resolves on the first attempt and the truncation loop is never entered.

### Story 6.3 — Add unit tests for the normalisation function and the truncation fallback strategy
In `tests/background/bggSearch.test.ts` (extend or create as needed), add test cases that cover: (a) each normalisation transformation rule from Story 6.1 in isolation; (b) `searchBgg` successfully resolving `"Dune : Imperium - Immortality"` after exactly one truncation retry using mocked responses; (c) `searchBgg` returning `NOT_FOUND` when no truncation level produces a result; (d) `searchBgg` not retrying when the first attempt returns `CLOUDFLARE_BLOCK`, `API_ERROR`, or `NETWORK_ERROR`; (e) regression — `searchBgg("Wingspan")` and `searchBgg("Dune: Imperium")` resolve on the first attempt with no truncation. All tests must mock network calls and must not issue real HTTP requests.

Acceptance condition: `npm test` exits with zero failures; the test file contains at minimum one test for each of the five cases above; no previously passing test is broken; the test runner output shows all new test cases as passing.

### Story 6.4 — Extend the E2E test suite to cover the Philibertnet expansion product page
Add `tests/e2e/epic6-title-matching.spec.ts`. Include a test that loads the Philibertnet product page for "Dune : Imperium - Immortality" (`https://www.philibertnet.com/fr/dire-wolf-digital/118789-dune-imperium-immortality-810058800152.html`) with the extension loaded, waits for the `[data-bgg-rating]` span to appear, and asserts that its `textContent` matches the pattern `/^\(\d+\.\d\)$/` (a rating formatted as `(X.X)`). Include a second test that loads the Wingspan product page and asserts that its `[data-bgg-rating]` span is still present and correctly formatted, confirming no regression. Both tests must use the same Playwright browser context setup as the existing E2E specs in the project.

Acceptance condition: `npx playwright test epic6` exits with zero failures; the expansion-page test asserts the presence and correct format of a `[data-bgg-rating]` span on the "Dune : Imperium - Immortality" page; the Wingspan regression test passes; no existing E2E test is broken by the changes introduced in Stories 6.1 and 6.2.

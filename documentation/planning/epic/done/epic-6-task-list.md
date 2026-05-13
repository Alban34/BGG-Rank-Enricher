# Epic 6 Task List — Improved BGG Title Matching for Expansion Titles

## Story 6.1 — Normalise raw title string before BGG search

- [x] **Implement** — Create `src/shared/title-utils.ts` and export a pure `normaliseTitle(title: string): string` function that: (1) collapses any whitespace-colon-whitespace variant (` : `, ` :`, `: `) into a bare colon (`:`); (2) collapses multiple consecutive space characters into a single space; (3) trims leading and trailing whitespace. The module must have no imports from browser APIs, `chrome.*`, or any extension runtime — it must be importable in a Vitest environment without extension context.
- [x] **Test** — In `tests/background/bggSearch.test.ts`, add a `normaliseTitle` describe block with unit tests covering each rule in isolation: (a) ` : ` collapsed to `:`; (b) ` :` collapsed to `:`; (c) `: ` collapsed to `:`; (d) multiple consecutive spaces collapsed to one; (e) leading/trailing whitespace trimmed; (f) titles with no special characters returned unchanged.
- [x] **QC (Automated):** Run `npm run lint && npm test` — must pass with zero failures

---

## Story 6.2 — Progressive truncation fallback in searchBgg

- [x] **Implement (normalisation wire-up)** — In `src/background/service-worker.ts`, import `normaliseTitle` from `src/shared/title-utils.ts`. At the start of the `searchBgg(title: string)` function, apply `normaliseTitle(title)` to produce the first search candidate before any `fetch` call is made.
- [x] **Implement (truncation loop)** — Extend `searchBgg` to loop after a `NOT_FOUND` result: (1) check whether the current title candidate contains ` - `; if not, return `{ ok: false, reason: "NOT_FOUND" }`; (2) strip the rightmost ` - <Suffix>` segment (everything from the last occurrence of ` - ` onwards); (3) retry the BGG search fetch with the shortened title; (4) repeat until a hit is found or no ` - ` remains. Any result other than `NOT_FOUND` (`CLOUDFLARE_BLOCK`, `API_ERROR`, `NETWORK_ERROR`) must short-circuit the loop immediately and be returned as-is. A successful match at any truncation level returns `{ ok: true, id: "..." }` in the same shape as the base case.
- [x] **Test** — In `tests/background/bggSearch.test.ts`, add a `searchBgg truncation` describe block with unit tests covering: (b) mock returns `NOT_FOUND` for `"Dune: Imperium - Immortality"` and a valid ID for `"Dune: Imperium"` → `searchBgg("Dune : Imperium - Immortality")` returns `{ ok: true, id: "..." }` and fetch is called exactly twice; (c) mock always returns `NOT_FOUND` → `searchBgg` returns `{ ok: false, reason: "NOT_FOUND" }` after exhausting all truncation levels; (d) mock returns `CLOUDFLARE_BLOCK` → `searchBgg` makes exactly one call and returns that error; (d) same assertion for `API_ERROR` and `NETWORK_ERROR`; (e) `searchBgg("Wingspan")` and `searchBgg("Dune: Imperium")` resolve on the first attempt with fetch called exactly once each.
- [x] **QC (Automated):** Run `npm run lint && npm test` — must pass with zero failures

---

## Story 6.3 — Unit tests for normalisation and truncation

- [x] **Implement** — In `tests/background/bggSearch.test.ts`, ensure all five required test groups are present and complete: (a) each normalisation rule in isolation (colon spacing variants, multi-space collapse, trim); (b) `searchBgg("Dune : Imperium - Immortality")` resolves after exactly one truncation retry — assert `toHaveBeenCalledTimes(2)` on the mocked fetch; (c) `searchBgg` returns `NOT_FOUND` when no truncation level produces a result — assert `toHaveBeenCalledTimes` equals the number of candidates attempted; (d) `searchBgg` does not retry on `CLOUDFLARE_BLOCK`, `API_ERROR`, or `NETWORK_ERROR` — assert `toHaveBeenCalledTimes(1)` for each error kind in its own test; (e) regression — `searchBgg("Wingspan")` and `searchBgg("Dune: Imperium")` each resolve on the first attempt with `toHaveBeenCalledTimes(1)`. All tests must mock `fetch` — no real HTTP requests.
- [x] **QC (Automated):** Run `npm run lint && npm test` — must pass with zero failures, all new test cases reported as passing, no previously passing test broken

---

## Story 6.4 — E2E test for expansion product page

- [x] **Implement** — Create `tests/e2e/epic6-title-matching.spec.ts`. Use the same Playwright browser context setup as `tests/e2e/epic4-bgg-rating.spec.ts` (persistent context with `--load-extension`, `headless: false`, `test.beforeAll` build step). Add two tests: (1) load `https://www.philibertnet.com/fr/dire-wolf-digital/118789-dune-imperium-immortality-810058800152.html` with the extension active, wait up to 15 s for `[data-bgg-rating]` to appear, assert its `textContent` matches `/^\(\d+\.\d\)$/`; (2) load `https://www.philibertnet.com/en/stonemaier-games/82338-wingspan-2nd-edition-644216627721.html`, assert `[data-bgg-rating]` is present and its `textContent` matches `/^\(\d+\.\d\)$/` (regression check).
- [x] **Epic E2E Test:** Run `npx playwright test epic6` — both the expansion-page test and the Wingspan regression test must pass with zero failures

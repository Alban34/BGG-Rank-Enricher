# Epic 4 Task List

## Story 4.1 — Shared message contract + forward detected title to service worker

> **Prerequisite for Stories 4.4 and 4.5.** Complete this story before starting either of those.

- [x] **Implement (shared contract)** — Create `src/shared/bgg-messages.ts` and export the four types exactly as specified: `BggLookupRequest`, `BggLookupSuccess`, `BggLookupError`, and `BggLookupResponse`.
- [x] **Implement (content script)** — In `src/content/index.ts`, after a valid title has been detected, import `BggLookupRequest` and `BggLookupResponse` from `src/shared/bgg-messages.ts`. Call `chrome.runtime.sendMessage<BggLookupRequest, BggLookupResponse>({ type: "BGG_RATING_LOOKUP", title: detectedTitle })` and `await` the response. Use the `ok` discriminant to branch into the success path (Story 4.4) or the failure path (Story 4.5). The content script must not make any `fetch` calls to external domains.
- [x] **Test** — Create `tests/content/bggMessaging.test.ts` (Vitest + jsdom). Mock `chrome.runtime.sendMessage`. Author unit tests covering: (1) after title detection, `sendMessage` is called exactly once with `{ type: "BGG_RATING_LOOKUP", title: <detectedTitle> }`; (2) no `fetch` is called from the content script; (3) when `sendMessage` resolves with `{ ok: true, rating: "8.0" }`, the success branch is entered; (4) when `sendMessage` resolves with `{ ok: false, reason: "NOT_FOUND" }`, the failure branch is entered.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/content/bggMessaging.test.ts` related to Story 4.1 pass.

---

## Story 4.2 — Resolve a game title to a BGG item ID via the BGG search HTML page

> **Can be implemented in parallel with Story 4.3** — both are independent functions within the service worker; neither depends on the other.

- [x] **Implement** — In `src/background/service-worker.ts`, add a `chrome.runtime.onMessage` listener. Import `BggLookupRequest` and `BggLookupResponse` from `src/shared/bgg-messages.ts`. When a message with `type === "BGG_RATING_LOOKUP"` is received, call a `searchBgg(title: string)` helper function that: (a) `fetch`es `https://boardgamegeek.com/search/boardgame?nosession=1&q=<encodedTitle>&showcount=5` with `{ credentials: 'include' }`; (b) returns `{ ok: false, reason: "NETWORK_ERROR" }` if `fetch` throws; (c) returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }` if HTTP status is 403; (d) returns `{ ok: false, reason: "API_ERROR" }` if HTTP status is outside 200–299 (and not 403); (e) reads the response body as HTML text; (f) applies the regex `/\/boardgame\/(\d+)\//` to the HTML body; (g) returns `{ ok: false, reason: "NOT_FOUND" }` if the regex does not match; (h) returns `{ ok: true, id: match[1] }` (internal type) on a successful match. The listener must return `true` to keep the message channel open for the async response.
- [x] **Test** — Create `tests/background/bggSearch.test.ts` (Vitest). Mock `fetch`. Author unit tests covering: (1) a mocked HTML response body containing `/boardgame/266192/` returns `{ ok: true, id: "266192" }`; (2) a mocked HTML response body with no `/boardgame/<id>/` link returns `{ ok: false, reason: "NOT_FOUND" }`; (3) a mocked fetch that throws returns `{ ok: false, reason: "NETWORK_ERROR" }`; (4) a mocked 403 response returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`; (5) a mocked non-2xx, non-403 response returns `{ ok: false, reason: "API_ERROR" }`.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/background/bggSearch.test.ts` related to Story 4.2 pass.

---

## Story 4.3 — Fetch the average user rating for a resolved BGG item ID

> **Can be implemented in parallel with Story 4.2** — both are independent functions within the service worker; neither depends on the other.

- [x] **Implement** — In `src/background/service-worker.ts`, add a `fetchBggRating(id: string)` helper function that: (a) `fetch`es `https://boardgamegeek.com/boardgame/<id>` with `{ credentials: 'include' }`; (b) returns `{ ok: false, reason: "NETWORK_ERROR" }` if `fetch` throws; (c) returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }` if HTTP status is 403; (d) returns `{ ok: false, reason: "API_ERROR" }` if HTTP status is outside 200–299 (and not 403); (e) reads the response body as HTML text; (f) applies the regex `/"average":\s*"([\d.]+)"/` to the HTML body; (g) returns `{ ok: false, reason: "PARSE_ERROR" }` if the regex does not match or the extracted value is NaN; (h) returns `{ ok: true, rating: (Math.round(num * 10) / 10).toFixed(1) }` on success. Wire this helper into the `onMessage` listener so that after `searchBgg` returns a valid id, `fetchBggRating` is called and its result is sent as the final `BggLookupResponse`.
- [x] **Test** — In `tests/background/bggRating.test.ts`, mock `fetch`. Author unit tests covering: (1) a mocked HTML response body containing `"average":"8.045"` returns `{ ok: true, rating: "8.0" }`; (2) a mocked HTML response body without an `"average":` key returns `{ ok: false, reason: "PARSE_ERROR" }`; (3) a mocked HTML response body where the extracted value is not a valid number returns `{ ok: false, reason: "PARSE_ERROR" }`; (4) a mocked fetch that throws returns `{ ok: false, reason: "NETWORK_ERROR" }`; (5) a mocked 403 response returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`; (6) a mocked non-2xx, non-403 response returns `{ ok: false, reason: "API_ERROR" }`.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all relevant tests in `tests/background/` pass.

---

## Story 4.4 — Inject the BGG rating inline next to the game title on the product page

> **Depends on Story 4.1** (requires `BggLookupResponse` and the messaging flow to be in place).

- [x] **Implement** — In `src/content/index.ts`, in the `ok: true` branch after `sendMessage` resolves, implement `injectRatingSpan(titleElement: Element, rating: string)`: (1) check whether `titleElement.nextElementSibling` is a `<span>` with the attribute `data-bgg-rating`; if so, return early (idempotent); (2) otherwise create a `<span>` element, set the `data-bgg-rating` attribute, set `textContent` to `(${rating})`, apply inline styles `font-family: inherit; font-size: inherit; font-weight: inherit`, and insert it immediately after the title element using `titleElement.insertAdjacentElement("afterend", span)`.
- [x] **Test** — In `tests/content/bggMessaging.test.ts`, add unit tests covering: (1) after `sendMessage` resolves with `{ ok: true, rating: "8.0" }`, a `<span data-bgg-rating>` with `textContent` `(8.0)` exists immediately after the title element; (2) the span has inline styles `font-family: inherit`, `font-size: inherit`, and `font-weight: inherit`; (3) calling the injection logic a second time does not produce a second span (idempotent).
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/content/bggMessaging.test.ts` related to Story 4.4 pass.

---

## Story 4.5 — Handle BGG lookup failures gracefully without disrupting the page

> **Depends on Story 4.1** (requires `BggLookupResponse` and the messaging flow to be in place).

- [x] **Implement (content script)** — In `src/content/index.ts`, in the `ok: false` branch after `sendMessage` resolves, branch on `response.reason`: if `reason === "CLOUDFLARE_BLOCK"`, call `console.warn('[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first')`; for all other reasons, call `console.warn(\`[BGG Enricher] Rating lookup failed: ${response.reason}\`)`. Do not inject any span into the DOM. Do not throw.
- [x] **Implement (service worker)** — Ensure all code paths in the `onMessage` listener and its helper functions (`searchBgg`, `fetchBggRating`) are wrapped in `try/catch` blocks so no unhandled exception can escape. Every caught error must be converted into the appropriate `BggLookupError` before the response is sent.
- [x] **Test** — In `tests/content/bggMessaging.test.ts`, add unit tests covering: (1) when `sendMessage` resolves with `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`, `console.warn` is called with the exact message `'[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first'` and no `<span data-bgg-rating>` is present in the DOM; (2) when `sendMessage` resolves with `{ ok: false, reason: "NOT_FOUND" }`, `console.warn` is called with a message containing `"[BGG Enricher] Rating lookup failed: NOT_FOUND"` and no span is injected; (3) same assertions for `reason: "API_ERROR"`, `"NETWORK_ERROR"`, and `"PARSE_ERROR"`; (4) `console.error` is never called; (5) no exception is thrown.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/content/bggMessaging.test.ts` related to Story 4.5 pass.

---

## Epic E2E Test

- [x] **Epic E2E Test (QC Lead)** — Author a Playwright test that: (1) loads the unpacked extension in a Chromium browser instance; (2) navigates to a live Philibertnet product page for a known board game (e.g. Wingspan); (3) waits for the content script to execute; (4) asserts that a `<span data-bgg-rating>` element exists immediately after the title `h1` element; (5) asserts the span's `textContent` matches the pattern `(\d+\.\d)` (parenthesised rating to one decimal place); (6) inspects the span's computed style and asserts `font-family`, `font-size`, and `font-weight` match those of the title element; (7) navigates to a product page for a title unlikely to be in BGG's database and asserts no `<span data-bgg-rating>` is injected; (8) asserts no uncaught browser exceptions were thrown during either navigation. This test is to be authored and run by the QC Lead at epic-end as part of the full regression pass.

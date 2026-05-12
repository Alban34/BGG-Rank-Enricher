## Epic 4 — BGG Rating Lookup and In-Page Display

**Objective**
After the content script detects the game title on a Philibertnet product page, the extension fetches the corresponding BoardGameGeek average user rating via the BGG XML API v2 and injects it inline next to the title so shoppers can see the community score without leaving the page.

**In scope**
- Messaging between the content script and the background service worker to request and receive a BGG rating for a given title string
- Querying the BGG XML API v2 search endpoint to resolve a game title to a BGG item ID
- Querying the BGG XML API v2 thing endpoint to retrieve the game's average user rating
- Injecting a `<span>` element immediately to the right of the title element that displays the rating in the format `(8.0)`, inheriting the title's font family, size, and weight
- Graceful handling of lookup failures (game not found, API error, network error) without disrupting the page

**Shared Message Contract**

All `chrome.runtime.sendMessage` calls for this epic use the following TypeScript types, which must be defined in a shared module (`src/shared/bgg-messages.ts`) and imported by both the content script and the service worker:

```typescript
export interface BggLookupRequest {
  type: "BGG_RATING_LOOKUP";
  title: string;
}

export interface BggLookupSuccess {
  ok: true;
  rating: string; // formatted to one decimal place, e.g. "8.0"
}

export interface BggLookupError {
  ok: false;
  reason: "NOT_FOUND" | "API_ERROR" | "NETWORK_ERROR" | "PARSE_ERROR";
}

export type BggLookupResponse = BggLookupSuccess | BggLookupError;
```

- `NOT_FOUND` — the BGG search returned zero `<item>` elements.
- `API_ERROR` — the BGG API returned an HTTP status outside 200–299.
- `NETWORK_ERROR` — the `fetch` call itself threw (e.g. offline, DNS failure).
- `PARSE_ERROR` — the XML response was received but could not be parsed or the expected element was absent.

**Stories**

### Story 4.1 — Forward the detected game title from the content script to the service worker via Chrome runtime messaging
When the content script has successfully detected the game title, it sends a `chrome.runtime.sendMessage` call with a `BggLookupRequest` object (`{ type: "BGG_RATING_LOOKUP", title: <detectedTitle> }`) to the background service worker. It awaits a `BggLookupResponse` in return. The content script does not perform any network requests itself; all external fetches are delegated to the service worker.

### Story 4.2 — Resolve a game title to a BGG item ID using the BGG search endpoint
The background service worker, upon receiving a `BggLookupRequest`, queries `https://boardgamegeek.com/xmlapi2/search?query=<title>&type=boardgame`, parses the XML response, and extracts the `id` attribute of the first returned `<item>` element. If the response contains no `<item>` elements, the service worker returns `{ ok: false, reason: "NOT_FOUND" }`. If the HTTP status is outside 200–299, it returns `{ ok: false, reason: "API_ERROR" }`. If the fetch throws, it returns `{ ok: false, reason: "NETWORK_ERROR" }`. If XML parsing fails or the `id` attribute is absent, it returns `{ ok: false, reason: "PARSE_ERROR" }`.

### Story 4.3 — Fetch the average user rating for a resolved BGG item ID
Given a valid BGG item ID, the service worker queries `https://boardgamegeek.com/xmlapi2/thing?id=<id>&stats=1`, parses the XML response, extracts the `value` attribute of the `<average>` element inside `<statistics><ratings>`, rounds it to one decimal place, and returns `{ ok: true, rating: "<value>" }` where `<value>` is a string formatted to exactly one decimal place (e.g. `"8.0"`). If the fetch throws, it returns `{ ok: false, reason: "NETWORK_ERROR" }`; if the HTTP status is outside 200–299, `{ ok: false, reason: "API_ERROR" }`; if the XML is unparseable or the `<average>` element or its `value` attribute is absent, `{ ok: false, reason: "PARSE_ERROR" }`.

### Story 4.4 — Inject the BGG rating inline next to the game title on the product page
After receiving a `BggLookupSuccess` response, the content script checks whether a `<span data-bgg-rating>` element already exists as the immediate next sibling of the title element. If one already exists, injection is skipped (idempotent). If not, the content script creates a `<span>` with the attribute `data-bgg-rating`, sets its `textContent` to `(<rating>)` (e.g. `(8.0)`), appends it immediately after the title element in the DOM, and applies the inline styles `font-family: inherit; font-size: inherit; font-weight: inherit` so the rating visually matches the title text.

### Story 4.5 — Handle BGG lookup failures gracefully without disrupting the page
When the service worker returns a `BggLookupError`, the content script calls `console.warn` (not `console.error`) with a descriptive message that includes the `reason` field (e.g. `[BGG Enricher] Rating lookup failed: NOT_FOUND`). The content script does not inject any span element into the DOM. The page remains fully functional and unmodified. The service worker must never throw an unhandled exception; all error paths must be caught and converted into a `BggLookupError` before the message response is sent.

**Acceptance Criteria**
- Story 4.1: On a Philibertnet product page, after title detection, exactly one `chrome.runtime.sendMessage` call is made from the content script, with a payload matching `{ type: "BGG_RATING_LOOKUP", title: <string> }`; no `fetch` calls to external domains originate from the content script; the content script uses the `BggLookupResponse` discriminant (`ok: true / false`) to branch its logic.
- Story 4.2: Given the title `"Wingspan"`, the service worker returns the BGG item ID `266192` (or the correct first-result ID from the live API); given a nonsense title that returns zero results, the service worker returns `{ ok: false, reason: "NOT_FOUND" }` rather than throwing.
- Story 4.3: Given the BGG item ID for Wingspan, the service worker returns `{ ok: true, rating: "8.0" }` (one decimal place, matching the live BGG average at time of test); a malformed or empty XML body causes the service worker to return `{ ok: false, reason: "PARSE_ERROR" }`.
- Story 4.4: On a successful lookup, a `<span data-bgg-rating>` element containing `(8.0)` (or the actual rounded rating) appears immediately after the title element in the DOM; inspecting the span's computed style confirms `font-family`, `font-size`, and `font-weight` match the title element; running the injection logic a second time on the same page does not produce a second span.
- Story 4.5: When the BGG API is unreachable or returns no results, `console.warn` has been called with a message containing the reason code, and no span element with `data-bgg-rating` has been added to the DOM.

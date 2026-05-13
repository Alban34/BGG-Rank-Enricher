## Epic 4 — BGG Rating Lookup and In-Page Display

**Objective**
After the content script detects the game title on a Philibertnet product page, the extension fetches the corresponding BoardGameGeek average user rating by scraping BGG HTML pages (using the user's existing browser session cookies to bypass Cloudflare) and injects it inline next to the title so shoppers can see the community score without leaving the page.

**In scope**
- Messaging between the content script and the background service worker to request and receive a BGG rating for a given title string
- Querying the BGG search HTML page to resolve a game title to a BGG item ID, using browser session cookies to bypass Cloudflare
- Fetching the BGG board game HTML page to extract the average user rating from embedded JSON
- Injecting a `<span>` element immediately to the right of the title element that displays the rating in the format `(8.0)`, inheriting the title's font family, size, and weight
- Graceful handling of lookup failures (game not found, API error, network error, Cloudflare block) without disrupting the page

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
  reason: "NOT_FOUND" | "API_ERROR" | "NETWORK_ERROR" | "PARSE_ERROR" | "CLOUDFLARE_BLOCK";
}

export type BggLookupResponse = BggLookupSuccess | BggLookupError;
```

- `NOT_FOUND` — the BGG search HTML page contained no `/boardgame/<id>/` link matching the regex.
- `API_ERROR` — the BGG server returned an HTTP status outside 200–299 (other than 403).
- `NETWORK_ERROR` — the `fetch` call itself threw (e.g. offline, DNS failure).
- `PARSE_ERROR` — the HTML response was received but the expected data could not be extracted (regex did not match or the extracted value was NaN).
- `CLOUDFLARE_BLOCK` — BGG's Cloudflare returned HTTP 403; the user must visit boardgamegeek.com in their browser first to establish a session so the extension can pass valid session cookies.

**Stories**

### Story 4.1 — Forward the detected game title from the content script to the service worker via Chrome runtime messaging
When the content script has successfully detected the game title, it sends a `chrome.runtime.sendMessage` call with a `BggLookupRequest` object (`{ type: "BGG_RATING_LOOKUP", title: <detectedTitle> }`) to the background service worker. It awaits a `BggLookupResponse` in return. The content script does not perform any network requests itself; all external fetches are delegated to the service worker.

### Story 4.2 — Resolve a game title to a BGG item ID using the BGG search HTML page
The background service worker, upon receiving a `BggLookupRequest`, calls a `searchBgg(title: string)` helper that fetches `https://boardgamegeek.com/search/boardgame?nosession=1&q=<encodedTitle>&showcount=5` with `{ credentials: 'include' }`. If the fetch throws, the helper returns `{ ok: false, reason: "NETWORK_ERROR" }`. If the HTTP status is 403, it returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`. If the HTTP status is outside 200–299 (and not 403), it returns `{ ok: false, reason: "API_ERROR" }`. Otherwise, the helper reads the response as text and applies the regex `/\/boardgame\/(\d+)\//` to the HTML body to extract the first game ID. If the regex does not match, it returns `{ ok: false, reason: "NOT_FOUND" }`. On a successful match it returns `{ ok: true, id: match[1] }` (internal type).

### Story 4.3 — Fetch the average user rating for a resolved BGG item ID
Given a valid BGG item ID, the service worker calls a `fetchBggRating(id: string)` helper that fetches `https://boardgamegeek.com/boardgame/<id>` with `{ credentials: 'include' }`. If the fetch throws, the helper returns `{ ok: false, reason: "NETWORK_ERROR" }`. If the HTTP status is 403, it returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`. If the HTTP status is outside 200–299 (and not 403), it returns `{ ok: false, reason: "API_ERROR" }`. Otherwise, the helper reads the response as text and applies the regex `/"average":\s*"([\d.]+)"/` to the HTML body to extract the rating value. If the regex does not match or the extracted value is NaN, it returns `{ ok: false, reason: "PARSE_ERROR" }`. On success it returns `{ ok: true, rating: (Math.round(num * 10) / 10).toFixed(1) }` where the rating is formatted to exactly one decimal place (e.g. `"8.0"`).

### Story 4.4 — Inject the BGG rating inline next to the game title on the product page
After receiving a `BggLookupSuccess` response, the content script checks whether a `<span data-bgg-rating>` element already exists as the immediate next sibling of the title element. If one already exists, injection is skipped (idempotent). If not, the content script creates a `<span>` with the attribute `data-bgg-rating`, sets its `textContent` to `(<rating>)` (e.g. `(8.0)`), appends it immediately after the title element in the DOM, and applies the inline styles `font-family: inherit; font-size: inherit; font-weight: inherit` so the rating visually matches the title text.

### Story 4.5 — Handle BGG lookup failures gracefully without disrupting the page
When the service worker returns a `BggLookupError`, the content script branches on the `reason` field. If `reason === "CLOUDFLARE_BLOCK"`, it calls `console.warn('[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first')`. For all other reasons, it calls `console.warn(\`[BGG Enricher] Rating lookup failed: ${response.reason}\`)`. In both branches the content script does not inject any span element into the DOM. The page remains fully functional and unmodified. The service worker must never throw an unhandled exception; all error paths must be caught and converted into a `BggLookupError` before the message response is sent.

**Acceptance Criteria**
- Story 4.1: On a Philibertnet product page, after title detection, exactly one `chrome.runtime.sendMessage` call is made from the content script, with a payload matching `{ type: "BGG_RATING_LOOKUP", title: <string> }`; no `fetch` calls to external domains originate from the content script; the content script uses the `BggLookupResponse` discriminant (`ok: true / false`) to branch its logic.
- Story 4.2: The `searchBgg` helper fetches the BGG search HTML page (`/search/boardgame?nosession=1&q=…&showcount=5`) with `credentials: 'include'`; given a title whose search result page contains a `/boardgame/266192/` link, the helper returns `{ ok: true, id: "266192" }`; given a title whose result page contains no `/boardgame/<id>/` link, it returns `{ ok: false, reason: "NOT_FOUND" }`; a 403 response returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }` rather than throwing.
- Story 4.3: The `fetchBggRating` helper fetches `https://boardgamegeek.com/boardgame/<id>` with `credentials: 'include'`; given an HTML body containing `"average":"8.045"`, the helper returns `{ ok: true, rating: "8.0" }`; an HTML body without a matching `"average":` key returns `{ ok: false, reason: "PARSE_ERROR" }`; a 403 response returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`.
- Story 4.4: On a successful lookup, a `<span data-bgg-rating>` element containing `(8.0)` (or the actual rounded rating) appears immediately after the title element in the DOM; inspecting the span's computed style confirms `font-family`, `font-size`, and `font-weight` match the title element; running the injection logic a second time on the same page does not produce a second span.
- Story 4.5: When the service worker returns `{ ok: false, reason: "CLOUDFLARE_BLOCK" }`, `console.warn` is called with the message `'[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first'` and no `<span data-bgg-rating>` is added to the DOM; for all other error reasons, `console.warn` is called with a message containing the reason code (e.g. `[BGG Enricher] Rating lookup failed: NOT_FOUND`), and no span is injected.

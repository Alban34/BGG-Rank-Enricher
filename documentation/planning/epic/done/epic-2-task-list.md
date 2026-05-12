# Epic 2 — Game Title Detection & Visual Confirmation

## Story 2.1 — Identify and extract the board game title from a Philibertnet product page

- [x] **Implement** — Create `src/content/index.ts`. Query the DOM for `h1.product-title`; if absent, fall back to `document.querySelector('h1')`. Trim the matched element's `textContent`. If the trimmed string is non-empty, store it in a local variable and call `console.log` with the value. If the trimmed string is empty or whitespace-only, treat the element as absent and delegate to the Story 2.3 error-handling path.
- [x] **Test** — Create `tests/content/titleDetection.test.ts` (Vitest + jsdom). Author unit tests covering: (1) page with `h1.product-title` — assert the trimmed title is logged via `console.log`; (2) page without `h1.product-title` but with a plain `h1` — assert the fallback element's trimmed text is logged; (3) page where `h1.product-title` exists but its `textContent` is whitespace-only — assert the error-handling path is taken instead of logging.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/content/titleDetection.test.ts` related to Story 2.1 pass.

---

## Story 2.2 — Apply a blue underline style to the detected title element in the DOM

- [x] **Implement** — Immediately after a valid title is extracted in `src/content/index.ts`, apply `element.style.textDecoration = "underline"` and `element.style.textDecorationColor = "blue"` to the detected `h1` element. No other inline style property on that element may be added, removed, or altered.
- [x] **Test** — In `tests/content/titleDetection.test.ts`, add unit tests covering: (1) after script execution on a page with `h1.product-title`, the element's `style.textDecoration` equals `"underline"` and `style.textDecorationColor` equals `"blue"`; (2) no other inline style properties are set on the element; (3) the style is also applied when the fallback `h1` is used.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/content/titleDetection.test.ts` related to Story 2.2 pass.

---

## Story 2.3 — Handle gracefully the case where no title element is found on the page

- [x] **Implement** — In `src/content/index.ts`, when neither `h1.product-title` nor any fallback `h1` is found, or when the found element's trimmed `textContent` is empty/whitespace, call `console.warn` with a message that contains both `"BGG Rank Enricher"` and a human-readable description such as `"product title element not found"`. Return early — do not modify the DOM, do not throw, do not create an unhandled rejection.
- [x] **Test** — In `tests/content/titleDetection.test.ts`, add unit tests covering: (1) page with no `h1` at all — assert `console.warn` is called with a message containing `"BGG Rank Enricher"` and a descriptive phrase, and that no DOM node is modified; (2) page where the only `h1` has empty `textContent` — same assertions; (3) page where the only `h1` has whitespace-only `textContent` — same assertions; (4) assert `console.error` is never called and no exception is thrown in any of these scenarios.
- [x] **QC (Automated)** — Run `eslint src` (zero errors required), then run `vitest run` and confirm all tests in `tests/content/titleDetection.test.ts` related to Story 2.3 pass.

---

## Epic E2E Test

- [x] **Epic E2E Test (QC Lead)** — Author a Playwright smoke test that: loads the unpacked extension in a Chrome browser instance; navigates to a live Philibertnet product page; waits for the content script to execute; queries the page's `h1` element and asserts that its computed or inline style includes `text-decoration: underline` and `text-decoration-color: blue`; also asserts no browser console errors or uncaught exceptions were emitted during the page load. This test should be run by the QC Lead at epic-end as part of the full regression pass.

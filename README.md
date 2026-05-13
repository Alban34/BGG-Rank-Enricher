# BGG-Rank-Enricher

A Chrome extension that enriches board game product pages on Philibertnet with BoardGameGeek community ratings, so you can see the BGG average score inline without leaving the shop.

## Installation

1. Clone or download this repository.
2. Install dependencies and build the extension:
   ```bash
   npm install
   npm run build
   ```
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the `dist/` folder produced by the build.

## How it works

- **Title detection** — When you open a Philibertnet product page, the content script looks for the board game title first in an `h1.product-title` element, then falls back to any `h1` on the page. As a visual debug marker, the detected title element is given a blue underline.
- **Chrome messaging** — The content script forwards the detected title to the background service worker via `chrome.runtime.sendMessage`; no network requests are made from the content script itself.
- **HTML scraping with session cookies** — The service worker fetches BGG's search HTML page to resolve the title to a BGG game ID, then fetches the BGG board game HTML page to extract the average user rating from the embedded JSON. Both requests use `credentials: 'include'` so the user's existing BGG browser session cookies are forwarded, allowing the requests to pass Cloudflare.
- **Inline rating injection** — On a successful lookup the content script injects a `<span data-bgg-rating>` element immediately after the title, displaying the rating in the format `(8.0)` with styling inherited from the title element.

## Cloudflare authentication note

BGG's pages are protected by Cloudflare. The extension relies on the user's existing BGG browser session to pass Cloudflare checks — it does not manage authentication itself. If the extension logs a `CLOUDFLARE_BLOCK` warning (`[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first`), open [boardgamegeek.com](https://boardgamegeek.com) in your browser, wait for the page to fully load (completing any Cloudflare challenge), then reload the Philibertnet product page.

## Development

```bash
# Install dependencies
npm install

# Build once
npm run build

# Build in watch mode (for active development)
npm run dev

# Lint source files
npm run lint

# Type-check (TypeScript + Svelte)
npm run typecheck

# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

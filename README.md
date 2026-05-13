# BGG-Rank-Enricher

[![CI](https://github.com/YOUR_GITHUB_USERNAME/BGG-Rank-Enricher/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/BGG-Rank-Enricher/actions/workflows/ci.yml)

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

- **URL guard** — Before attempting any title detection, the content script checks whether the current page URL matches the Philibertnet individual product-page pattern (a path segment of the form `/<numeric-SKU>-<slug>.html`, e.g. `/73168-wingspan-3760146644991.html`). On category or listing pages whose URLs do not match this pattern, the content script emits a `console.debug` message and exits immediately without modifying the DOM or making any network requests. If the URL check itself throws for any reason, the content script defaults to skipping (fail-safe).
- **Title detection** — When you open a Philibertnet product page, the content script looks for the board game title first in an `h1.product-title` element, then falls back to any `h1` on the page. As a visual debug marker, the detected title element is given a blue underline.
- **Chrome messaging** — The content script forwards the detected title to the background service worker via `chrome.runtime.sendMessage`; no network requests are made from the content script itself.
- **Title normalisation** — Before submitting a title to BGG, the service worker normalises it: Philibertnet-style spaced colons (` : `) are collapsed to a bare colon (`:`), runs of multiple spaces are reduced to one, and leading/trailing whitespace is trimmed. This is handled by the `normaliseTitle` utility in `src/shared/title-utils.ts`.
- **Progressive title truncation** — If a BGG search for the full normalised title returns no results, the service worker strips the rightmost ` - <Suffix>` segment and retries. If no ` - ` separator remains and the title ends with an ordinal edition suffix (e.g. "2nd Edition", "3rd Edition"), that suffix is stripped and the search is retried once more. The loop continues until a match is found or all fallback strategies are exhausted. This allows expansion titles such as "Dune : Imperium - Immortality" to be resolved via the base-game entry "Dune: Imperium", and edition-suffixed titles to be resolved via the base title.
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

## CI & code quality

Every push and pull request targeting `main` runs the [`ci` workflow](.github/workflows/ci.yml), which executes the following steps in order:

1. Install dependencies (`npm ci`)
2. Lint source files (`npm run lint`)
3. Run unit and integration tests with coverage (`npm test -- --coverage`) — the LCOV report is written to `coverage/lcov.info`
4. Build the extension (`npm run build`)
5. Upload static analysis results to SonarCloud (non-blocking; `continue-on-error: true` is set so a SonarCloud outage cannot fail the build)

### Maintainer setup

Before the CI pipeline is fully operational, a repository maintainer must complete the following one-time steps:

1. **Update the CI badge URL** in this README — replace `YOUR_GITHUB_USERNAME` in the badge at the top with the actual GitHub account or organisation name that hosts this repository.
2. **Create a SonarCloud project** and note the project key and organisation slug from the SonarCloud dashboard.
3. **Update `sonar-project.properties`** at the repository root — replace the two placeholder values:
   - `sonar.projectKey=YOUR_SONARCLOUD_PROJECT_KEY` → your actual SonarCloud project key
   - `sonar.organization=YOUR_SONARCLOUD_ORG` → your SonarCloud organisation slug
4. **Add the `SONAR_TOKEN` secret** to the GitHub repository (Settings → Secrets and variables → Actions → New repository secret, name: `SONAR_TOKEN`). Obtain the token from your SonarCloud account under My Account → Security → Generate Token.

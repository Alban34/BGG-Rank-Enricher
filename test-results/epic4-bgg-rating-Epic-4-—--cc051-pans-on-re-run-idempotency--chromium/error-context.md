# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: epic4-bgg-rating.spec.ts >> Epic 4 — BGG Rating Lookup and In-Page Display >> does not inject duplicate spans on re-run (idempotency)
- Location: tests/e2e/epic4-bgg-rating.spec.ts:201:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[data-bgg-rating]') to be visible

```

# Test source

```ts
  126 |       // 4. No extension-originated errors or uncaught exceptions
  127 |       const extensionErrors = consoleErrors.filter(
  128 |         (msg) =>
  129 |           msg.includes('BGG') ||
  130 |           msg.includes('bgg-rank') ||
  131 |           msg.toLowerCase().includes('uncaught'),
  132 |       );
  133 |       expect(
  134 |         extensionErrors,
  135 |         'Extension must not emit console.error or throw uncaught exceptions',
  136 |       ).toHaveLength(0);
  137 |     } finally {
  138 |       await context.close();
  139 |       rmSync(userDataDir, { recursive: true, force: true });
  140 |     }
  141 |   });
  142 | 
  143 |   test('does not inject a rating span when the page h1 is not a board game title', async () => {
  144 |     const consoleWarnings: string[] = [];
  145 | 
  146 |     const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-nospan-'));
  147 |     const context = await chromium.launchPersistentContext(userDataDir, {
  148 |       headless: false,
  149 |       args: [
  150 |         `--disable-extensions-except=${EXTENSION_DIR}`,
  151 |         `--load-extension=${EXTENSION_DIR}`,
  152 |       ],
  153 |     });
  154 | 
  155 |     const page = await context.newPage();
  156 | 
  157 |       // Visit BGG first so Cloudflare sets its bot-detection cookies in this
  158 |       // browser profile — without these, service worker fetches return 403.
  159 |       await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  160 |       await page.waitForTimeout(2_000);
  161 | 
  162 | 
  163 |     // Content-script console.warn calls appear in the page's DevTools console
  164 |     // and are therefore captured by the Playwright console listener.
  165 |     page.on('console', (msg) => {
  166 |       if (msg.type() === 'warning') {
  167 |         consoleWarnings.push(msg.text());
  168 |       }
  169 |     });
  170 | 
  171 |     try {
  172 |       // Contact page — h1 is "Send us a message" which will not match any BGG title.
  173 |       // The service worker will return { ok: false, reason: "NOT_FOUND" } and the
  174 |       // content script will console.warn without injecting any span.
  175 |       await page.goto(NON_PRODUCT_URL, {
  176 |         waitUntil: 'domcontentloaded',
  177 |         timeout: 30_000,
  178 |       });
  179 | 
  180 |       // Allow 8 s: enough for the content script to run and for the BGG API
  181 |       // round-trip to complete (or fail fast with NOT_FOUND).
  182 |       await page.waitForTimeout(8_000);
  183 | 
  184 |       const spanCount = await page.locator('[data-bgg-rating]').count();
  185 |       expect(
  186 |         spanCount,
  187 |         'No rating span should be injected when h1 is not a board game title',
  188 |       ).toBe(0);
  189 | 
  190 |       const hasFailureWarning = consoleWarnings.some((msg) => /Rating lookup failed/.test(msg));
  191 |       expect(
  192 |         hasFailureWarning,
  193 |         'console.warn should report "Rating lookup failed" when the title is not in BGG',
  194 |       ).toBe(true);
  195 |     } finally {
  196 |       await context.close();
  197 |       rmSync(userDataDir, { recursive: true, force: true });
  198 |     }
  199 |   });
  200 | 
  201 |   test('does not inject duplicate spans on re-run (idempotency)', async () => {
  202 |     const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-idem-'));
  203 |     const context = await chromium.launchPersistentContext(userDataDir, {
  204 |       headless: false,
  205 |       args: [
  206 |         `--disable-extensions-except=${EXTENSION_DIR}`,
  207 |         `--load-extension=${EXTENSION_DIR}`,
  208 |       ],
  209 |     });
  210 | 
  211 |     const page = await context.newPage();
  212 | 
  213 |       // Visit BGG first so Cloudflare sets its bot-detection cookies in this
  214 |       // browser profile — without these, service worker fetches return 403.
  215 |       await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  216 |       await page.waitForTimeout(2_000);
  217 | 
  218 | 
  219 |     try {
  220 |       await page.goto(PRODUCT_URL, {
  221 |         waitUntil: 'domcontentloaded',
  222 |         timeout: 30_000,
  223 |       });
  224 | 
  225 |       // Wait for the initial rating injection to complete
> 226 |       await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });
      |                  ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  227 | 
  228 |       // The content script ran exactly once at document_idle. Verify it did not
  229 |       // insert multiple spans. The injectRatingSpan() guard (nextElementSibling
  230 |       // check) ensures idempotency within a single page session.
  231 |       const spanCount = await page.locator('[data-bgg-rating]').count();
  232 |       expect(
  233 |         spanCount,
  234 |         'Exactly one rating span should exist — the idempotency guard must prevent duplicates',
  235 |       ).toBe(1);
  236 |     } finally {
  237 |       await context.close();
  238 |       rmSync(userDataDir, { recursive: true, force: true });
  239 |     }
  240 |   });
  241 | });
  242 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: epic4-bgg-rating.spec.ts >> Epic 4 — BGG Rating Lookup and In-Page Display >> injects BGG rating span next to the game title on a Philibertnet product page
- Location: tests/e2e/epic4-bgg-rating.spec.ts:54:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[data-bgg-rating]') to be visible

```

# Test source

```ts
  1   | /**
  2   |  * Epic 4 — BGG Rating Lookup and In-Page Display
  3   |  * Workflow E2E test (Playwright / Chromium with extension loaded)
  4   |  *
  5   |  * Journey:
  6   |  *  1. Build the extension to dist/
  7   |  *  2. Launch Chromium with the unpacked extension loaded
  8   |  *  3. Navigate to a live Philibertnet product page for Wingspan 2nd Edition
  9   |  *  4. Wait for the content script to inject a [data-bgg-rating] span
  10  |  *     (allows up to 15 s for the service worker to call the BGG API)
  11  |  *  5. Assert the span's textContent matches /^\(\d+\.\d\)$/
  12  |  *  6. Assert the span is the nextElementSibling of h1.product-title
  13  |  *  7. Assert the span has inline styles font-family/font-size/font-weight: inherit
  14  |  *  8. Assert no extension-related console.error or uncaught exceptions
  15  |  *  9. Navigate to a non-product page (contact page) whose h1 is not a board game
  16  |  * 10. Wait 8 s then assert no [data-bgg-rating] span was injected
  17  |  * 11. Assert console.warn was called containing "Rating lookup failed"
  18  |  * 12. Navigate to the product page and assert exactly one span exists (idempotency)
  19  |  *
  20  |  * Note: headless: false is required — Chrome extensions cannot be loaded in
  21  |  * Playwright's headless-shell binary; only the full Chromium binary supports
  22  |  * --load-extension.
  23  |  *
  24  |  * Note: page.evaluate() runs in the web page's main world, not in the content
  25  |  * script's isolated world. Content script functions are not callable from
  26  |  * page.evaluate(); however, DOM changes (including injected elements and their
  27  |  * inline styles) are visible because content scripts and the page share the DOM.
  28  |  */
  29  | 
  30  | import { test, expect, chromium } from '@playwright/test';
  31  | import { execSync } from 'child_process';
  32  | import { mkdtempSync, rmSync } from 'fs';
  33  | import { join, resolve } from 'path';
  34  | import { tmpdir } from 'os';
  35  | 
  36  | const PROJECT_ROOT = resolve(process.cwd());
  37  | const EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist');
  38  | 
  39  | // Wingspan 2nd Edition — guaranteed to be in the BGG database with a rating
  40  | const PRODUCT_URL =
  41  |   'https://www.philibertnet.com/en/stonemaier-games/82338-wingspan-2nd-edition-644216627721.html';
  42  | 
  43  | // Contact page — h1 is "Send us a message", which will not match any BGG game title
  44  | const NON_PRODUCT_URL = 'https://www.philibertnet.com/en/contact-us';
  45  | 
  46  | test.describe('Epic 4 — BGG Rating Lookup and In-Page Display', () => {
  47  |   test.beforeAll(() => {
  48  |     execSync('npm run build', {
  49  |       cwd: PROJECT_ROOT,
  50  |       stdio: 'inherit',
  51  |     });
  52  |   });
  53  | 
  54  |   test('injects BGG rating span next to the game title on a Philibertnet product page', async () => {
  55  |     const consoleErrors: string[] = [];
  56  | 
  57  |     const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-rating-'));
  58  |     const context = await chromium.launchPersistentContext(userDataDir, {
  59  |       headless: false,
  60  |       args: [
  61  |         `--disable-extensions-except=${EXTENSION_DIR}`,
  62  |         `--load-extension=${EXTENSION_DIR}`,
  63  |       ],
  64  |     });
  65  | 
  66  |     const page = await context.newPage();
  67  | 
  68  |       // Visit BGG first so Cloudflare sets its bot-detection cookies in this
  69  |       // browser profile — without these, service worker fetches return 403.
  70  |       await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  71  |       await page.waitForTimeout(2_000);
  72  | 
  73  | 
  74  |     page.on('console', (msg) => {
  75  |       if (msg.type() === 'error') {
  76  |         consoleErrors.push(msg.text());
  77  |       }
  78  |     });
  79  | 
  80  |     page.on('pageerror', (err) => {
  81  |       consoleErrors.push(`[pageerror] ${err.message}`);
  82  |     });
  83  | 
  84  |     try {
  85  |       await page.goto(PRODUCT_URL, {
  86  |         waitUntil: 'domcontentloaded',
  87  |         timeout: 30_000,
  88  |       });
  89  | 
  90  |       // Allow up to 15 s for the service worker to query the BGG API and
  91  |       // for the content script to inject the rating span into the DOM.
> 92  |       await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });
      |                  ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  93  | 
  94  |       // 1. Assert textContent matches "(X.X)" — parenthesised rating to one decimal place
  95  |       const textContent = await page.locator('[data-bgg-rating]').textContent();
  96  |       expect(textContent).toMatch(/^\(\d+\.\d\)$/);
  97  | 
  98  |       // 2. Assert the span is the nextElementSibling of the h1
  99  |       const isNextSibling = await page.evaluate(() => {
  100 |         const h1El =
  101 |           document.querySelector<HTMLElement>('h1.product-title') ??
  102 |           document.querySelector<HTMLElement>('h1');
  103 |         const sibling = h1El?.nextElementSibling;
  104 |         return sibling?.hasAttribute('data-bgg-rating') ?? false;
  105 |       });
  106 |       expect(isNextSibling, 'rating span should be the nextElementSibling of the h1').toBe(true);
  107 | 
  108 |       // 3. Assert the span carries inline styles that mirror the title element
  109 |       //    (font-family/font-size/font-weight all set to "inherit").
  110 |       //    Inline style attributes are part of the shared DOM and are accessible
  111 |       //    from the main world despite content-script isolation.
  112 |       const spanInlineStyle = await page.evaluate(() => {
  113 |         const span = document.querySelector<HTMLElement>('[data-bgg-rating]');
  114 |         if (!span) return null;
  115 |         return {
  116 |           fontFamily: span.style.fontFamily,
  117 |           fontSize: span.style.fontSize,
  118 |           fontWeight: span.style.fontWeight,
  119 |         };
  120 |       });
  121 |       expect(spanInlineStyle, 'span should have inline styles set').not.toBeNull();
  122 |       expect(spanInlineStyle?.fontFamily).toBe('inherit');
  123 |       expect(spanInlineStyle?.fontSize).toBe('inherit');
  124 |       expect(spanInlineStyle?.fontWeight).toBe('inherit');
  125 | 
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
```
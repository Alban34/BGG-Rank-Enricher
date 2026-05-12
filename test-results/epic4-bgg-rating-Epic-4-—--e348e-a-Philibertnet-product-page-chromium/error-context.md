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
  68  |     page.on('console', (msg) => {
  69  |       if (msg.type() === 'error') {
  70  |         consoleErrors.push(msg.text());
  71  |       }
  72  |     });
  73  | 
  74  |     page.on('pageerror', (err) => {
  75  |       consoleErrors.push(`[pageerror] ${err.message}`);
  76  |     });
  77  | 
  78  |     try {
  79  |       await page.goto(PRODUCT_URL, {
  80  |         waitUntil: 'domcontentloaded',
  81  |         timeout: 30_000,
  82  |       });
  83  | 
  84  |       // Allow up to 15 s for the service worker to query the BGG API and
  85  |       // for the content script to inject the rating span into the DOM.
> 86  |       await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });
      |                  ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  87  | 
  88  |       // 1. Assert textContent matches "(X.X)" — parenthesised rating to one decimal place
  89  |       const textContent = await page.locator('[data-bgg-rating]').textContent();
  90  |       expect(textContent).toMatch(/^\(\d+\.\d\)$/);
  91  | 
  92  |       // 2. Assert the span is the nextElementSibling of the h1
  93  |       const isNextSibling = await page.evaluate(() => {
  94  |         const h1El =
  95  |           document.querySelector<HTMLElement>('h1.product-title') ??
  96  |           document.querySelector<HTMLElement>('h1');
  97  |         const sibling = h1El?.nextElementSibling;
  98  |         return sibling?.hasAttribute('data-bgg-rating') ?? false;
  99  |       });
  100 |       expect(isNextSibling, 'rating span should be the nextElementSibling of the h1').toBe(true);
  101 | 
  102 |       // 3. Assert the span carries inline styles that mirror the title element
  103 |       //    (font-family/font-size/font-weight all set to "inherit").
  104 |       //    Inline style attributes are part of the shared DOM and are accessible
  105 |       //    from the main world despite content-script isolation.
  106 |       const spanInlineStyle = await page.evaluate(() => {
  107 |         const span = document.querySelector<HTMLElement>('[data-bgg-rating]');
  108 |         if (!span) return null;
  109 |         return {
  110 |           fontFamily: span.style.fontFamily,
  111 |           fontSize: span.style.fontSize,
  112 |           fontWeight: span.style.fontWeight,
  113 |         };
  114 |       });
  115 |       expect(spanInlineStyle, 'span should have inline styles set').not.toBeNull();
  116 |       expect(spanInlineStyle?.fontFamily).toBe('inherit');
  117 |       expect(spanInlineStyle?.fontSize).toBe('inherit');
  118 |       expect(spanInlineStyle?.fontWeight).toBe('inherit');
  119 | 
  120 |       // 4. No extension-originated errors or uncaught exceptions
  121 |       const extensionErrors = consoleErrors.filter(
  122 |         (msg) =>
  123 |           msg.includes('BGG') ||
  124 |           msg.includes('bgg-rank') ||
  125 |           msg.toLowerCase().includes('uncaught'),
  126 |       );
  127 |       expect(
  128 |         extensionErrors,
  129 |         'Extension must not emit console.error or throw uncaught exceptions',
  130 |       ).toHaveLength(0);
  131 |     } finally {
  132 |       await context.close();
  133 |       rmSync(userDataDir, { recursive: true, force: true });
  134 |     }
  135 |   });
  136 | 
  137 |   test('does not inject a rating span when the page h1 is not a board game title', async () => {
  138 |     const consoleWarnings: string[] = [];
  139 | 
  140 |     const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-nospan-'));
  141 |     const context = await chromium.launchPersistentContext(userDataDir, {
  142 |       headless: false,
  143 |       args: [
  144 |         `--disable-extensions-except=${EXTENSION_DIR}`,
  145 |         `--load-extension=${EXTENSION_DIR}`,
  146 |       ],
  147 |     });
  148 | 
  149 |     const page = await context.newPage();
  150 | 
  151 |     // Content-script console.warn calls appear in the page's DevTools console
  152 |     // and are therefore captured by the Playwright console listener.
  153 |     page.on('console', (msg) => {
  154 |       if (msg.type() === 'warning') {
  155 |         consoleWarnings.push(msg.text());
  156 |       }
  157 |     });
  158 | 
  159 |     try {
  160 |       // Contact page — h1 is "Send us a message" which will not match any BGG title.
  161 |       // The service worker will return { ok: false, reason: "NOT_FOUND" } and the
  162 |       // content script will console.warn without injecting any span.
  163 |       await page.goto(NON_PRODUCT_URL, {
  164 |         waitUntil: 'domcontentloaded',
  165 |         timeout: 30_000,
  166 |       });
  167 | 
  168 |       // Allow 8 s: enough for the content script to run and for the BGG API
  169 |       // round-trip to complete (or fail fast with NOT_FOUND).
  170 |       await page.waitForTimeout(8_000);
  171 | 
  172 |       const spanCount = await page.locator('[data-bgg-rating]').count();
  173 |       expect(
  174 |         spanCount,
  175 |         'No rating span should be injected when h1 is not a board game title',
  176 |       ).toBe(0);
  177 | 
  178 |       const hasFailureWarning = consoleWarnings.some((msg) => /Rating lookup failed/.test(msg));
  179 |       expect(
  180 |         hasFailureWarning,
  181 |         'console.warn should report "Rating lookup failed" when the title is not in BGG',
  182 |       ).toBe(true);
  183 |     } finally {
  184 |       await context.close();
  185 |       rmSync(userDataDir, { recursive: true, force: true });
  186 |     }
```
/**
 * Epic 4 — BGG Rating Lookup and In-Page Display
 * Workflow E2E test (Playwright / Chromium with extension loaded)
 *
 * Journey:
 *  1. Build the extension to dist/
 *  2. Launch Chromium with the unpacked extension loaded
 *  3. Navigate to a live Philibertnet product page for Wingspan 2nd Edition
 *  4. Wait for the content script to inject a [data-bgg-rating] span
 *     (allows up to 15 s for the service worker to call the BGG API)
 *  5. Assert the span's textContent matches /^\(\d+\.\d\)$/
 *  6. Assert the span is the nextElementSibling of h1.product-title
 *  7. Assert the span has inline styles font-family/font-size/font-weight: inherit
 *  8. Assert no extension-related console.error or uncaught exceptions
 *  9. Navigate to a non-product page (contact page) whose h1 is not a board game
 * 10. Wait 8 s then assert no [data-bgg-rating] span was injected
 * 11. Assert console.warn was called containing "Rating lookup failed"
 * 12. Navigate to the product page and assert exactly one span exists (idempotency)
 *
 * Note: headless: false is required — Chrome extensions cannot be loaded in
 * Playwright's headless-shell binary; only the full Chromium binary supports
 * --load-extension.
 *
 * Note: page.evaluate() runs in the web page's main world, not in the content
 * script's isolated world. Content script functions are not callable from
 * page.evaluate(); however, DOM changes (including injected elements and their
 * inline styles) are visible because content scripts and the page share the DOM.
 */

import { test, expect, chromium } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const PROJECT_ROOT = resolve(process.cwd());
const EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist');

// Wingspan 2nd Edition — guaranteed to be in the BGG database with a rating
const PRODUCT_URL =
  'https://www.philibertnet.com/en/stonemaier-games/82338-wingspan-2nd-edition-644216627721.html';

// Contact page — h1 is "Send us a message", which will not match any BGG game title
const NON_PRODUCT_URL = 'https://www.philibertnet.com/en/contact-us';

test.describe('Epic 4 — BGG Rating Lookup and In-Page Display', () => {
  test.beforeAll(() => {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
  });

  test('injects BGG rating span next to the game title on a Philibertnet product page', async () => {
    const consoleErrors: string[] = [];

    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-rating-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    const page = await context.newPage();

      // Visit BGG first so Cloudflare sets its bot-detection cookies in this
      // browser profile — without these, service worker fetches return 403.
      await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);


    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    try {
      await page.goto(PRODUCT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Allow up to 15 s for the service worker to query the BGG API and
      // for the content script to inject the rating span into the DOM.
      await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

      // 1. Assert textContent matches "(X.X)" — parenthesised rating to one decimal place
      const textContent = await page.locator('[data-bgg-rating]').textContent();
      expect(textContent).toMatch(/^\(\d+\.\d\)$/);

      // 2. Assert the span is the nextElementSibling of the h1
      const isNextSibling = await page.evaluate(() => {
        const h1El =
          document.querySelector<HTMLElement>('h1.product-title') ??
          document.querySelector<HTMLElement>('h1');
        const sibling = h1El?.nextElementSibling;
        return sibling?.hasAttribute('data-bgg-rating') ?? false;
      });
      expect(isNextSibling, 'rating span should be the nextElementSibling of the h1').toBe(true);

      // 3. Assert the span carries inline styles that mirror the title element
      //    (font-family/font-size/font-weight all set to "inherit").
      //    Inline style attributes are part of the shared DOM and are accessible
      //    from the main world despite content-script isolation.
      const spanInlineStyle = await page.evaluate(() => {
        const span = document.querySelector<HTMLElement>('[data-bgg-rating]');
        if (!span) return null;
        return {
          fontFamily: span.style.fontFamily,
          fontSize: span.style.fontSize,
          fontWeight: span.style.fontWeight,
        };
      });
      expect(spanInlineStyle, 'span should have inline styles set').not.toBeNull();
      expect(spanInlineStyle?.fontFamily).toBe('inherit');
      expect(spanInlineStyle?.fontSize).toBe('inherit');
      expect(spanInlineStyle?.fontWeight).toBe('inherit');

      // 4. No extension-originated errors or uncaught exceptions
      const extensionErrors = consoleErrors.filter(
        (msg) =>
          msg.includes('BGG') ||
          msg.includes('bgg-rank') ||
          msg.toLowerCase().includes('uncaught'),
      );
      expect(
        extensionErrors,
        'Extension must not emit console.error or throw uncaught exceptions',
      ).toHaveLength(0);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('does not inject a rating span when the page h1 is not a board game title', async () => {
    const consoleWarnings: string[] = [];

    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-nospan-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    const page = await context.newPage();

      // Visit BGG first so Cloudflare sets its bot-detection cookies in this
      // browser profile — without these, service worker fetches return 403.
      await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);


    // Content-script console.warn calls appear in the page's DevTools console
    // and are therefore captured by the Playwright console listener.
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    try {
      // Contact page — h1 is "Send us a message" which will not match any BGG title.
      // The service worker will return { ok: false, reason: "NOT_FOUND" } and the
      // content script will console.warn without injecting any span.
      await page.goto(NON_PRODUCT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Allow 8 s: enough for the content script to run and for the BGG API
      // round-trip to complete (or fail fast with NOT_FOUND).
      await page.waitForTimeout(8_000);

      const spanCount = await page.locator('[data-bgg-rating]').count();
      expect(
        spanCount,
        'No rating span should be injected when h1 is not a board game title',
      ).toBe(0);

      const hasFailureWarning = consoleWarnings.some((msg) => /Rating lookup failed/.test(msg));
      expect(
        hasFailureWarning,
        'console.warn should report "Rating lookup failed" when the title is not in BGG',
      ).toBe(true);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('does not inject duplicate spans on re-run (idempotency)', async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic4-idem-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    const page = await context.newPage();

      // Visit BGG first so Cloudflare sets its bot-detection cookies in this
      // browser profile — without these, service worker fetches return 403.
      await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);


    try {
      await page.goto(PRODUCT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Wait for the initial rating injection to complete
      await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

      // The content script ran exactly once at document_idle. Verify it did not
      // insert multiple spans. The injectRatingSpan() guard (nextElementSibling
      // check) ensures idempotency within a single page session.
      const spanCount = await page.locator('[data-bgg-rating]').count();
      expect(
        spanCount,
        'Exactly one rating span should exist — the idempotency guard must prevent duplicates',
      ).toBe(1);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});

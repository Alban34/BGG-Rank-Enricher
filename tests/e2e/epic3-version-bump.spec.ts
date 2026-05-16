/**
 * Epic 3 — Release Version 1.0.0 Preparation
 * Workflow E2E test (Playwright / Chromium with extension loaded)
 *
 * Journey:
 *  1. Build the extension to dist/
 *  2. Read dist/manifest.json and assert version === "1.0.0"
 *  3. Launch Chromium with the unpacked extension loaded
 *  4. Navigate to a live Philibertnet page
 *  5. Assert no extension-related console.error or uncaught exceptions
 *
 * Note: headless: false is required — Chrome extensions cannot be loaded in
 * Playwright's headless-shell binary; only the full Chromium binary supports
 * --load-extension.
 *
 * Note on chrome.runtime.getManifest() in-browser check:
 *  page.evaluate() runs in the web page's JavaScript context, not in the
 *  content script's isolated world. Content script APIs (including
 *  chrome.runtime) are not accessible from page.evaluate(), so verifying
 *  the version via chrome.runtime.getManifest().version from the page context
 *  is not practical with Playwright. The dist/manifest.json file assertion is
 *  the authoritative check.
 */

import { test, expect } from './fixtures';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EXTENSION_DIR } from './constants';

const PRODUCT_URL = 'https://www.philibertnet.com/en/';

test.describe('Epic 3 — Release Version 1.0.0 Preparation', () => {
  test('dist/manifest.json reports version 1.0.0', () => {
    const raw = readFileSync(join(EXTENSION_DIR, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(raw) as { version: string };
    expect(manifest.version).toBe('1.0.0');
  });

  test('extension loads in Chromium without errors on Philibertnet', async ({ extContext }) => {
    const consoleErrors: string[] = [];

    const context = extContext;
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    await page.goto(PRODUCT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Allow document_idle scripts to settle
    await page.waitForTimeout(2_000);

    // Filter to errors that originate from the extension
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
  });
});

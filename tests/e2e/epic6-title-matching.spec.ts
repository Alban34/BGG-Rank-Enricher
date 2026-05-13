/**
 * Epic 6 — Improved BGG Title Matching for Expansion Titles
 * Workflow E2E test (Playwright / Chromium with extension loaded)
 *
 * Journey:
 *  1. Build the extension to dist/
 *  2. Launch Chromium with the unpacked extension loaded
 *  3. Navigate to a live Philibertnet product page for Dune: Imperium – Immortality
 *     (an expansion title whose raw h1 contains " : " and " - " separators)
 *  4. Wait for the content script to inject a [data-bgg-rating] span
 *     (allows up to 15 s for the service worker to resolve the title via truncation)
 *  5. Assert the span's textContent matches /^\(\d+\.\d\)$/
 *  6. Regression: repeat the same assertion for a base-game page (Wingspan 2nd Edition)
 *     to confirm the truncation loop does not break existing behaviour
 *
 * Note: headless: false is required — Chrome extensions cannot be loaded in
 * Playwright's headless-shell binary; only the full Chromium binary supports
 * --load-extension.
 */

import { test, expect, chromium } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const PROJECT_ROOT = resolve(process.cwd());
const EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist');

// Dune: Imperium – Immortality expansion page (French Philibertnet)
const EXPANSION_URL =
  'https://www.philibertnet.com/fr/dire-wolf-digital/118789-dune-imperium-immortality-810058800152.html';

// Dune : Imperium (base game) — regression check that a base-game title (no expansion suffix)
const BASE_GAME_URL =
  'https://www.philibertnet.com/fr/dire-wolf-digital/91444-dune-imperium-810058800008.html';
  // Title on page: "Dune : Imperium" → normalised to "Dune: Imperium" → single BGG fetch, no truncation

test.describe('Epic 6 — Improved BGG Title Matching', () => {
  test.beforeAll(() => {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
  });

  test('injects BGG rating span for an expansion product page (Dune: Imperium – Immortality)', async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic6-expansion-'));
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
      await page.goto(EXPANSION_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Allow up to 15 s for the service worker to resolve the expansion title
      // (potentially via the truncation fallback) and for the content script to
      // inject the rating span into the DOM.
      await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

      const textContent = await page.locator('[data-bgg-rating]').textContent();
      expect(textContent).toMatch(/^\(\d+\.\d\)$/);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('regression: injects BGG rating span for a base-game product page (Dune: Imperium)', async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic6-dune-base-'));
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
      await page.goto(BASE_GAME_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Allow up to 15 s for the service worker to query the BGG API and
      // for the content script to inject the rating span into the DOM.
      await page.waitForSelector('[data-bgg-rating]', { timeout: 15_000 });

      const textContent = await page.locator('[data-bgg-rating]').textContent();
      expect(textContent).toMatch(/^\(\d+\.\d\)$/);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});

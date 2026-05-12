/**
 * Epic 2 — Game Title Detection & Visual Confirmation
 * Workflow E2E test (Playwright / Chromium with extension loaded)
 *
 * Journey:
 *  1. Build the extension to dist/
 *  2. Launch Chromium with the unpacked extension loaded
 *  3. Navigate to a live Philibertnet page
 *  4. Wait for the content script to run at document_idle
 *  5. Assert the h1 has inline style textDecoration=underline, textDecorationColor=blue
 *  6. Assert no console.error or uncaught exceptions from the extension
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
const PRODUCT_URL = 'https://www.philibertnet.com/en/';

test.describe('Epic 2 — Game Title Detection & Visual Confirmation', () => {
  test.beforeAll(() => {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
  });

  test('h1 on Philibertnet page receives blue underline from the content script', async () => {
    const consoleErrors: string[] = [];

    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    const page = await context.newPage();

    // Collect errors emitted by any script running in the page context
    // (includes the injected content script)
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

      // document_idle fires after DOMContentLoaded + deferred scripts settle;
      // an explicit wait ensures the content script has executed.
      await page.waitForTimeout(2_000);

      const h1 = page.locator('h1').first();
      await h1.waitFor({ state: 'attached', timeout: 10_000 });

      // Assert inline styles written by detectAndMarkTitle()
      const textDecorationLine = await h1.evaluate(
        (el: HTMLElement) => el.style.textDecorationLine,
      );
      const textDecorationColor = await h1.evaluate(
        (el: HTMLElement) => el.style.textDecorationColor,
      );

      expect(textDecorationLine).toBe('underline');
      expect(textDecorationColor).toBe('blue');

      // Only flag errors that originate from the extension content script
      // (the live site may emit unrelated third-party errors)
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
});

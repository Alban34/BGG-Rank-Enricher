# Epic 18 — E2E Test Suite Performance Overhaul: Task List

> Implementation order is strict: 18.1 → 18.2 → 18.3 → 18.4 → 18.5.
> Each story's QC pass must complete before the next story begins.

---

## Story 18.1 — Centralise build in `globalSetup`

- [x] Task: Create `tests/e2e/global-setup.ts` with a default-exported async function `globalSetup(): Promise<void>` that calls `execSync('npm run build', { cwd: resolve(process.cwd()), stdio: 'inherit' })`. Imports needed: `execSync` from `'child_process'`, `resolve` from `'path'`.
- [x] Task: Add `globalSetup: './tests/e2e/global-setup.ts'` to `playwright.config.ts`.
- [x] Task: Remove the `test.beforeAll(() => { execSync('npm run build', ...) })` block from all 17 spec files: `epic2-title-detection.spec.ts`, `epic3-version-bump.spec.ts`, `epic4-bgg-rating.spec.ts`, `epic6-title-matching.spec.ts`, `epic7-url-guard.spec.ts`, `epic8-boardgamebliss.spec.ts`, `epic8-coolstuffinc.spec.ts`, `epic8-espritjeu.spec.ts`, `epic8-gamenerdz.spec.ts`, `epic8-ludum.spec.ts`, `epic8-miniaturemarket.spec.ts`, `epic8-workflow.spec.ts`, `epic8-zatugames.spec.ts`, `epic9-cavernedugobelin.spec.ts`, `epic9-ludifolie.spec.ts`, `epic9-okkazeo.spec.ts`, `epic9-workflow.spec.ts`.
- [x] Task: Remove `import { execSync } from 'child_process'` from every spec file where it is now unused after the `beforeAll` removal.
- [x] QC (Automated): Run lint + unit/integration tests, verify all pass.

---

## Story 18.2 — Extract shared Playwright fixture

- [x] Task: Create `tests/e2e/fixtures.ts` exporting a `test` object extended with an `extContext: BrowserContext` fixture. The fixture must: call `mkdtempSync(join(tmpdir(), 'pw-ext-'))`, call `chromium.launchPersistentContext(userDataDir, { headless: false, args: ['--disable-extensions-except=<EXTENSION_DIR>', '--load-extension=<EXTENSION_DIR>'] })`, yield the context via `use(context)`, then `await context.close()` and `rmSync(userDataDir, { recursive: true, force: true })` on teardown. Also re-export `expect` from `'@playwright/test'`.
- [x] Task: Migrate all 17 spec files (same list as Story 18.1): replace `import { test, expect, chromium } from '@playwright/test'` with `import { test, expect } from './fixtures'`, and remove the inline `userDataDir` declaration, `launchPersistentContext` call, `context.close()` call, and `rmSync` cleanup block from each file.
- [x] Task: In `epic3-version-bump.spec.ts`, ensure only the second test (`'extension loads in Chromium without errors on Philibertnet'`) receives the `extContext` fixture parameter. The first test (reads `dist/manifest.json` without a browser) must remain a plain `test(...)` call with no fixture parameter.
- [x] Task: Remove now-unused imports from migrated spec files: `chromium` from `'@playwright/test'`, `mkdtempSync`, `rmSync` from `'fs'`, `join` from `'path'`, `tmpdir` from `'os'` — only where these imports were used solely for the removed boilerplate.
- [x] QC (Automated): Run lint + unit/integration tests, verify all pass.

---

## Story 18.3 — Pre-prime Cloudflare cookies in `globalSetup`

- [x] Task: Extend `tests/e2e/global-setup.ts` to add cookie priming after the build step: call `mkdirSync(resolve(process.cwd(), 'tests/e2e/.auth'), { recursive: true })`, create a temp dir with `mkdtempSync(join(tmpdir(), 'pw-prime-'))`, launch `chromium.launchPersistentContext(userDataDir, { headless: false, args: ['--disable-extensions-except=<EXTENSION_DIR>', '--load-extension=<EXTENSION_DIR>'] })`, open a new page and `goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 })`, `waitForTimeout(2_000)`, save `context.storageState({ path: BGG_AUTH_FILE })`, then `context.close()` and `rmSync(userDataDir, ...)`. Add all required imports: `chromium` from `'@playwright/test'`, `mkdirSync`, `mkdtempSync`, `rmSync` from `'fs'`, `join` from `'path'`, `tmpdir` from `'os'`.
- [x] Task: Export `BGG_AUTH_FILE` as a named constant from `tests/e2e/global-setup.ts`: `export const BGG_AUTH_FILE = resolve(process.cwd(), 'tests/e2e/.auth/bgg-state.json')`.
- [x] Task: Update `tests/e2e/fixtures.ts` to import `BGG_AUTH_FILE` from `'./global-setup'` and pass `storageState: BGG_AUTH_FILE` as an option to the `launchPersistentContext` call inside the `extContext` fixture.
- [x] Task: Remove all inline BGG cookie-priming blocks from every spec file that contains them — specifically the `await page.goto('https://boardgamegeek.com/', { ... })` line and the immediately following `await page.waitForTimeout(2_000)` line (approximately 27 occurrences across the 17 spec files).
- [x] Task: Add the line `tests/e2e/.auth/` to `.gitignore`.
- [x] QC (Automated): Run lint + unit/integration tests, verify all pass.

---

## Story 18.4 — Remove `workers: 1` constraint

- [x] Task: In `playwright.config.ts`, change `workers: 1` to `workers: 2`.
- [x] Task: In `playwright.config.ts`, remove or rewrite the comment that explains the serial-execution requirement (the comment referencing concurrent `npm run build` calls writing to `dist/` simultaneously).
- [x] QC (Automated): Run lint + unit/integration tests, verify all pass.

---

## Story 18.5 — Extract shared constants

- [x] Task: Create `tests/e2e/constants.ts` exporting `PROJECT_ROOT = resolve(process.cwd())` and `EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist')`. Import `resolve` from `'path'`.
- [x] Task: In all 17 spec files, remove the inline `const PROJECT_ROOT = ...` and `const EXTENSION_DIR = ...` declarations and replace them with `import { PROJECT_ROOT, EXTENSION_DIR } from './constants'`.
- [x] Task: In `tests/e2e/fixtures.ts`, remove the inline `EXTENSION_DIR` declaration and replace it with `import { EXTENSION_DIR } from './constants'`.
- [x] Task: In `tests/e2e/global-setup.ts`, remove the inline `EXTENSION_DIR` declaration (and `PROJECT_ROOT` if present) and replace with `import { PROJECT_ROOT, EXTENSION_DIR } from './constants'`. Update the `BGG_AUTH_FILE` definition to use the imported `PROJECT_ROOT`.
- [x] Task: In any file updated above, remove the `resolve` import from `'path'` if it is now unused after the constant declarations are deleted.
- [x] QC (Automated): Run lint + unit/integration tests, verify all pass.

---

## Epic E2E Test

- [x] Epic E2E Test: Author one workflow E2E test covering the full Epic 18 user journey (complete E2E run completes faster than before; all assertions pass).

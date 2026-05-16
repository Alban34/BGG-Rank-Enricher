# Epic 18 — E2E Test Suite Performance Overhaul

## Objective

Eliminate 16 of 17 redundant Vite builds, centralise extension fixture boilerplate, pre-prime
Cloudflare cookies once globally, enable parallel spec execution, and extract shared constants —
without changing any test assertion logic.

## Background

Every one of the 17 spec files in `tests/e2e/` calls `execSync('npm run build')` inside a
`test.beforeAll` hook. With `workers: 1` enforced to prevent concurrent writes to `dist/`, the
run is fully serial and produces ~17 redundant builds, ~27 BGG cookie-priming navigations, and
~10 lines of duplicated boilerplate per file. The full implementation plan is documented in
`documentation/e2e-test-performance.md`. Implementation order follows that document: Rec 1 → Rec 3
→ Rec 4 → Rec 2 → Rec 5 (story order: 18.1 → 18.2 → 18.3 → 18.4 → 18.5).

## In-Scope

Source roots affected: `tests/e2e/`, `playwright.config.ts`, `.gitignore`.
Production source under `src/` is untouched.

---

### Story 18.1 — Centralise build in `globalSetup`

**Goal:** Run `npm run build` exactly once before any spec loads, instead of once per spec.

**Tasks to implement:**
1. Create `tests/e2e/global-setup.ts` that calls `execSync('npm run build', { cwd: resolve(process.cwd()), stdio: 'inherit' })`.
2. Register `globalSetup: './tests/e2e/global-setup.ts'` in `playwright.config.ts`.
3. Remove the `test.beforeAll(() => { execSync('npm run build', ...) })` block from all 17 spec files.
4. Remove any `import { execSync }` that becomes unused after the removal.

**Developer context:**
- The exported function signature must be `export default async function globalSetup(): Promise<void>` — Playwright only recognises a default-exported async function as a valid `globalSetup` entry point.
- `resolve(process.cwd())` in the `cwd` argument is equivalent to `process.cwd()` here; using `resolve` is consistent with the rest of the codebase.

**Acceptance criteria:**
- `tests/e2e/global-setup.ts` exists and exports a default async function that calls `execSync('npm run build', ...)`.
- `playwright.config.ts` declares `globalSetup`.
- No spec file imports `execSync` or calls it in a `beforeAll`.
- All existing E2E assertions still pass after this change alone.

---

### Story 18.2 — Extract shared Playwright fixture

**Goal:** Remove ~10 lines of copy-pasted context-launch boilerplate from every spec.

**Tasks to implement:**
1. Create `tests/e2e/fixtures.ts` exporting a `test` object extended with an `extContext` fixture.
   - The fixture calls `mkdtempSync`, `chromium.launchPersistentContext` (headless: false, extension args), exposes the context, then calls `context.close()` and `rmSync` on teardown.
2. Migrate all 17 spec files: replace `import { test, expect, chromium } from '@playwright/test'` with `import { test, expect } from './fixtures'` and remove the inline `userDataDir` / `launchPersistentContext` / cleanup boilerplate.
3. The only legitimate reason to leave a test on the explicit approach is if it requires non-standard `launchPersistentContext` options beyond `headless: false` + the two extension `args`. Custom `userDataDir` prefix names alone are NOT a reason to skip migration.
4. `epic3-version-bump.spec.ts` contains one test that reads `dist/manifest.json` without launching a browser at all. That test must not receive an `extContext` parameter; only the second test in that file (`'extension loads in Chromium without errors on Philibertnet'`) should use the fixture.

**Acceptance criteria:**
- `tests/e2e/fixtures.ts` exists, exports `test` and `expect`.
- `extContext` fixture creates and tears down a temp profile automatically.
- Migrated spec files no longer declare inline `userDataDir`, `launchPersistentContext`, or cleanup blocks.
- The non-browser test in `epic3-version-bump.spec.ts` continues to pass without an `extContext` parameter.
- All existing E2E assertions still pass.

---

### Story 18.3 — Pre-prime Cloudflare cookies in `globalSetup`

**Goal:** Remove ~27 `goto(boardgamegeek.com)` + `waitForTimeout(2_000)` blocks from individual test bodies.

**Tasks to implement:**
1. Extend `tests/e2e/global-setup.ts` to:
   - Create `tests/e2e/.auth/` directory (`mkdirSync` with `recursive: true`).
   - Launch a one-off `chromium.launchPersistentContext` with `headless: false` and the extension loaded (same args as the fixture: `--disable-extensions-except` + `--load-extension`).
   - Navigate to `https://boardgamegeek.com/` using `{ waitUntil: 'domcontentloaded', timeout: 30_000 }`, then `waitForTimeout(2_000)`.
   - Save `storageState` to `tests/e2e/.auth/bgg-state.json`.
   - Close the context and clean up the temp directory.
2. Export `BGG_AUTH_FILE` constant from `global-setup.ts`.
3. Update `tests/e2e/fixtures.ts` to pass `storageState: BGG_AUTH_FILE` to `launchPersistentContext`.
4. Remove all inline BGG cookie-priming blocks from spec files (the `goto('https://boardgamegeek.com/')` + `waitForTimeout(2_000)` pair).
5. Add `tests/e2e/.auth/` to `.gitignore`.

**Developer context:**
- `headless: false` is required on the priming context. Chrome extensions cannot be loaded in Playwright's headless-shell binary; a headless context would launch without the extension, defeating the purpose of priming with it loaded.
- `waitUntil: 'domcontentloaded'` (not the default `'load'`) is intentional: BGG loads many third-party scripts that can stall a `'load'` wait; `'domcontentloaded'` is sufficient for Cloudflare to set its cookies.
- `BGG_AUTH_FILE` is deliberately kept in `global-setup.ts` rather than `constants.ts` because it is an artifact of the global setup process, not a static project constant. `fixtures.ts` imports it directly from `./global-setup`.

**Acceptance criteria:**
- `global-setup.ts` writes `tests/e2e/.auth/bgg-state.json` before any spec runs.
- The priming `launchPersistentContext` call in `global-setup.ts` uses `headless: false`.
- The priming `goto` call uses `{ waitUntil: 'domcontentloaded', timeout: 30_000 }`.
- `fixtures.ts` injects `storageState` from that file into every context.
- No spec file contains a BGG priming navigation.
- `tests/e2e/.auth/` is in `.gitignore`.
- All existing E2E assertions still pass.

---

### Story 18.4 — Remove `workers: 1` constraint

**Goal:** Allow Playwright to run specs in parallel now that the dist/ race condition is gone.

**Tasks to implement:**
1. Change `playwright.config.ts`: replace `workers: 1` with `workers: 2`.
2. Remove (or update) the comment explaining the serial-execution requirement.

**Developer context:**
- `workers: 2` is the recommended safe starting value. BGG and some shop sites may rate-limit or return stale responses when many requests arrive simultaneously. Do not set `workers` higher than `2` without running the full suite multiple times and confirming zero flakiness.

**Acceptance criteria:**
- `playwright.config.ts` does not contain `workers: 1`.
- The outdated serial-execution comment is removed or rewritten to reflect the new state.

---

### Story 18.5 — Extract shared constants

**Goal:** Stop re-declaring `PROJECT_ROOT` and `EXTENSION_DIR` in every spec file.

**Tasks to implement:**
1. Create `tests/e2e/constants.ts` exporting `PROJECT_ROOT = resolve(process.cwd())` and `EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist')`.
2. Remove the inline declarations of both constants from every spec file, `fixtures.ts`, and `global-setup.ts`, replacing them with `import { PROJECT_ROOT, EXTENSION_DIR } from './constants'`.

**Acceptance criteria:**
- `tests/e2e/constants.ts` exists and exports both `PROJECT_ROOT` and `EXTENSION_DIR`.
- No spec file, `fixtures.ts`, or `global-setup.ts` declares `PROJECT_ROOT` or `EXTENSION_DIR` inline.
- All existing E2E assertions still pass.

---

## Implementation Order

**All five stories must be implemented and verified serially. No two stories may run in parallel.**

| Step | Story | Depends on | Reason |
|------|-------|------------|--------|
| 1 | 18.1 | — | Foundation: `global-setup.ts` and `playwright.config.ts` registration must exist first. |
| 2 | 18.2 | 18.1 | `fixtures.ts` must be stable before 18.3 extends it. |
| 3 | 18.3 | 18.1 + 18.2 | Extends both `global-setup.ts` and `fixtures.ts`; must land as one atomic change. |
| 4 | 18.4 | 18.3 | Removing `workers: 1` is only safe once the build race (18.1) and per-context cookie isolation (18.3) are both in place. |
| 5 | 18.5 | 18.2 | `fixtures.ts` must exist before it can be updated to import from `constants.ts`. |

Each story must have its E2E suite passing before work on the next story begins.

## Out of Scope

- Changing assertion logic or adding new test cases.
- Adding new shops or new test scenarios.
- Touching production source under `src/`.

# E2E Test Performance — Diagnosis and Recommendations

> **Status: Epic 18 fully implemented — 2026-05-15.**  
> All five recommendations below have been shipped. The "Historical State" section describes the pre-Epic-18 baseline; see "Current State" for the post-implementation architecture.

---

## Historical State (Before Epic 18)

Every one of the **17 spec files** in `tests/e2e/` called `execSync('npm run build')` inside a `test.beforeAll` hook. Because `playwright.config.ts` enforced `workers: 1` specifically to prevent concurrent writes to `dist/`, the test run was entirely serial. The result was:

| Overhead source | Count | Notes |
|---|---|---|
| Full Vite builds | 17 | One per spec file, ~5-15 s each |
| Browser context launches | ~35 | One per individual test case |
| BGG cookie-priming navigations | ~27 | `goto(boardgamegeek.com)` + `waitForTimeout(2000)` per context |
| Boilerplate lines duplicated | ~10 per file | `mkdtempSync`, `launchPersistentContext`, `rmSync`, args |

---

## Current State (After Epic 18)

All five recommendations have been implemented. The new baseline is:

| Overhead source | Count | Notes |
|---|---|---|
| Full Vite builds | 1 | Single build in `tests/e2e/global-setup.ts` |
| BGG cookie-priming navigations | 1 | One-time priming in `global-setup.ts`; state saved to `tests/e2e/.auth/bgg-state.json` |
| Browser context boilerplate | 0 per spec | `extContext` fixture in `tests/e2e/fixtures.ts` handles setup and teardown |
| Inline constant declarations | 0 per spec | `PROJECT_ROOT` and `EXTENSION_DIR` centralised in `tests/e2e/constants.ts` |
| Parallel workers | 2 | `workers: 2` in `playwright.config.ts`; serial constraint removed |

---

## Recommendation 1 — Build once in `globalSetup` (biggest win) — **Implemented (Story 18.1)**

**Impact: eliminates 16 of 17 builds.**

Playwright's `globalSetup` hook runs exactly once before any spec file is loaded. Move the build there and remove every `beforeAll` / `execSync` block from every spec.

### Step 1 — Create `tests/e2e/global-setup.ts`

```ts
import { execSync } from 'child_process';
import { resolve } from 'path';

export default async function globalSetup(): Promise<void> {
  execSync('npm run build', { cwd: resolve(process.cwd()), stdio: 'inherit' });
}
```

### Step 2 — Register it in `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  projects: [{ name: 'chromium' }],
  reporter: 'list',
  // workers: 1 constraint can now be removed — see Recommendation 2
});
```

### Step 3 — Remove from every spec

Delete these lines from all 17 spec files:

```ts
import { execSync } from 'child_process';   // remove if no longer used
// and inside test.describe:
test.beforeAll(() => {
  execSync('npm run build', {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
});
```

---

## Recommendation 2 — Remove the `workers: 1` constraint — **Implemented (Story 18.4)**

**Impact: enables parallel spec execution once builds are centralised.**

The comment in `playwright.config.ts` is explicit:

> *Run specs serially (workers: 1) to prevent concurrent `npm run build` calls from multiple beforeAll hooks writing to dist/ simultaneously.*

Once the build is moved to `globalSetup` (Rec 1), `dist/` is read-only during test execution. The race condition no longer exists.

Remove the `workers: 1` line. Playwright will default to using a fraction of available CPU cores.

**Caveat:** external-URL rate limiting is a real risk. BGG and some shop sites may throttle if many requests arrive simultaneously. Start conservatively with `workers: 2` and increase if no flakiness appears.

---

## Recommendation 3 — Extract a shared Playwright fixture — **Implemented (Story 18.2)**

**Impact: removes ~10 lines of copy-pasted boilerplate from every test and makes future changes a one-file edit.**

Create `tests/e2e/fixtures.ts`:

```ts
import { test as base, chromium } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import { mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const EXTENSION_DIR = resolve(process.cwd(), 'dist');

type ExtensionFixtures = {
  extContext: BrowserContext;
};

export const test = base.extend<ExtensionFixtures>({
  extContext: async ({}, use) => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });
    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },
});

export { expect } from '@playwright/test';
```

Each spec then replaces:

```ts
import { test, expect, chromium } from '@playwright/test';
import { mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
// ...
const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-epic7-category-'));
const context = await chromium.launchPersistentContext(userDataDir, { ... });
// ...
await context.close();
rmSync(userDataDir, { recursive: true, force: true });
```

with:

```ts
import { test, expect } from './fixtures';
// test body receives extContext directly as a fixture parameter
```

Tests that need a custom `userDataDir` prefix for diagnostics can keep the explicit approach — the fixture is a sensible default, not a mandate.

---

## Recommendation 4 — Pre-prime Cloudflare cookies in `globalSetup` — **Implemented (Story 18.3)**

**Impact: removes a `goto(boardgamegeek.com)` + `waitForTimeout(2000)` call from ~27 test contexts (~54–108 s total).**

The priming step exists because each test starts with a fresh, empty browser profile that has no Cloudflare bot-detection cookies. The BGG API then returns 403 before the cookies are set.

The fix is to perform the priming once in `globalSetup`, save the browser's `storageState` to a JSON file, and inject it into every persistent context at launch time.

### In `global-setup.ts` (extend the file from Rec 1)

```ts
import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const EXTENSION_DIR = resolve(process.cwd(), 'dist');
export const BGG_AUTH_FILE = resolve(process.cwd(), 'tests/e2e/.auth/bgg-state.json');

export default async function globalSetup(): Promise<void> {
  execSync('npm run build', { cwd: resolve(process.cwd()), stdio: 'inherit' });

  // Prime Cloudflare cookies once and save to disk
  mkdirSync(resolve(process.cwd(), 'tests/e2e/.auth'), { recursive: true });
  const userDataDir = mkdtempSync(join(tmpdir(), 'pw-prime-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
    ],
  });
  const page = await context.newPage();
  await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await context.storageState({ path: BGG_AUTH_FILE });
  await context.close();
  rmSync(userDataDir, { recursive: true, force: true });
}
```

### In `fixtures.ts`

```ts
import { BGG_AUTH_FILE } from './global-setup';

export const test = base.extend<ExtensionFixtures>({
  extContext: async ({}, use) => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      storageState: BGG_AUTH_FILE,        // inject pre-primed cookies
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });
    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },
});
```

Then remove all inline BGG priming blocks from spec files:

```ts
// DELETE these lines from each test body:
await page.goto('https://boardgamegeek.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(2_000);
```

Add `tests/e2e/.auth/` to `.gitignore` so the saved state file is never committed.

---

## Recommendation 5 — Add `PROJECT_ROOT` and `EXTENSION_DIR` to a shared constants file — **Implemented (Story 18.5)**

**Minor DRY improvement.** Both constants are re-declared in every spec:

```ts
const PROJECT_ROOT = resolve(process.cwd());
const EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist');
```

Move them to `tests/e2e/constants.ts` and import from there.

---

## Implementation Order (Completed)

All five steps were applied in the sequence below as part of Epic 18:

1. **Rec 1** — `globalSetup` + remove all `beforeAll` builds. *(Story 18.1)*
2. **Rec 3** — Extract the `fixtures.ts` helper. *(Story 18.2)*
3. **Rec 4** — Cookie pre-priming in `globalSetup`. *(Story 18.3)*
4. **Rec 2** — Remove `workers: 1`, set `workers: 2`. *(Story 18.4)*
5. **Rec 5** — Extract `constants.ts`. *(Story 18.5)*

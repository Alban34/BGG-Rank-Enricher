# Epic 1 — Extension Bootstrap & Site Activation: Task List

## Story 1.1 — Remove the browser action icon and popup entry from the extension manifest

- [x] **Implement** — Edit `manifest.json`: remove `default_icon` and `default_title` from the `action` block, leaving the `action` key either absent entirely or set to `{}`.
- [ ] **Test (Manual)** — Load the unpacked extension in Chrome (`chrome://extensions` → "Load unpacked"). Confirm no toolbar icon or button appears in the Chrome toolbar after installation. Inspect the loaded manifest in the Extensions detail view to verify the `action` block contains neither `default_icon`, `default_popup`, nor `default_title`.
- [ ] **QC (Automated)** — N/A — `manifest.json` is outside the `eslint src` lint scope and is not unit-testable. Structural correctness is validated by Chrome's own extension loader during the manual test step above.

---

## Story 1.2 — Restrict the content script URL matching to www.philibertnet.com pages only

- [x] **Implement** — Edit `manifest.json`: replace the four existing `content_scripts[0].matches` entries (`"https://www.amazon.com/*"`, `"https://www.amazon.fr/*"`, `"https://www.philibert.fr/*"`, `"https://www.esprit-jeu.com/*"`) with the single entry `"https://www.philibertnet.com/*"`. No other keys or files are changed.
- [ ] **Test (Manual)** — Load (or reload) the unpacked extension in Chrome. Navigate to `https://www.philibertnet.com/` and open DevTools → Console to confirm the content script loads without errors. Then navigate to a previously matched domain (e.g. `https://www.amazon.com/`) and confirm the content script does **not** execute (no console output from the extension). Inspect the loaded manifest in the Extensions detail view to verify `content_scripts[0].matches` contains exactly `"https://www.philibertnet.com/*"`.
- [ ] **QC (Automated)** — N/A — `manifest.json` is outside the `eslint src` lint scope and is not unit-testable. Structural correctness is validated by Chrome's own extension loader during the manual test step above.

---

## Epic E2E Test

- [ ] **Epic E2E Test (QC Lead)** — Author a Playwright (or equivalent) smoke test that:
  1. Loads the unpacked extension into a Chromium browser instance.
  2. Asserts that no extension toolbar icon is present in the Chrome toolbar (i.e., the action produces no visible button).
  3. Navigates to `https://www.philibertnet.com/` and verifies the content script injects correctly (e.g., a known DOM marker or console message produced by the script is detectable).
  4. Navigates to at least one previously matched domain (e.g., `https://www.amazon.com/`) and verifies the content script does **not** inject.

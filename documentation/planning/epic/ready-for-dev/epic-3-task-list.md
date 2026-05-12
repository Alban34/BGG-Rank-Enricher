# Epic 3 Task List

## Story 3.1 — Bump the declared version to 1.0.0 in both package.json and manifest.json

- [x] In `package.json`, change the `"version"` field value from `"0.1.0"` to `"1.0.0"`.
- [x] In `manifest.json`, change the `"version"` field value from `"0.1.0"` to `"1.0.0"`.
- [x] **Test**: Verify that no other version strings in `package.json` or `manifest.json` remain at `"0.1.0"`, and that both files are valid JSON after the change.
- [x] **QC (Automated)**: Confirm `package.json` contains `"version": "1.0.0"` and `manifest.json` contains `"version": "1.0.0"` via a diff or grep check. Note: lint does not apply here — the lint target is `src/` only and neither file is under `src/`; no unit/integration test run is required. The QC pass is a config file diff check only.

---

## Epic E2E Test

- [ ] **Epic E2E Test**: Author and run an E2E smoke test (Playwright) that loads a Philibertnet product page in the browser with the extension installed from the built artifact, and confirms the extension version reported in `chrome.runtime.getManifest().version` matches `"1.0.0"`.

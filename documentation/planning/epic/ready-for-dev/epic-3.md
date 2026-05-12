## Epic 3 — Release Version 1.0.0 Preparation

**Objective**
Advance the project's declared version from `0.1.0` to `1.0.0` in every file that carries a version string, so that the packaged extension and its npm metadata consistently identify the first public release.

**In scope**
- Updating the `version` field in `package.json` from `0.1.0` to `1.0.0`
- Updating the `version` field in `manifest.json` from `0.1.0` to `1.0.0`

**Stories**

### Story 3.1 — Bump the declared version to 1.0.0 in both package.json and manifest.json
Both `package.json` and `manifest.json` at the repository root have their `version` field set to `"1.0.0"`. No other files are modified. The built extension package therefore reports version `1.0.0` to the Chrome browser.

**Acceptance Criteria**
- Story 3.1: `package.json` contains `"version": "1.0.0"` and `manifest.json` contains `"version": "1.0.0"`; no other version strings in those files remain at `0.1.0`.

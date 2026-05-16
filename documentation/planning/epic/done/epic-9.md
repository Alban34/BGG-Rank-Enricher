## Epic 9 — Remove Decommissioned Shops

**Objective**
Remove three shops that are no longer reachable (agorajeux.fr, ludibay.fr, ludofacto.be) from the extension's supported roster.

**In scope**
- Delete SHOP_CONFIGS entries, manifest.json match patterns, URL-guard unit tests, and Playwright E2E specs for the three decommissioned shops

**Stories**
1. **Remove agorajeux.fr, ludibay.fr, and ludofacto.be from all project files**

**Acceptance Criteria**
- Story 1: The SHOP_CONFIGS array contains no entry whose hostname belongs to `agorajeux.fr`, `ludibay.fr`, or `ludofacto.be`. The `content_scripts[0].matches` array in `manifest.json` contains no pattern for those three domains. All test cases in `tests/shared/urlGuard.test.ts` that reference those domains are deleted. The Playwright spec files `tests/e2e/epic8-agorajeux.spec.ts`, `tests/e2e/epic8-ludibay.spec.ts`, and `tests/e2e/epic8-ludofacto.spec.ts` are deleted. All remaining tests pass.

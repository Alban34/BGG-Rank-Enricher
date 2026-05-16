# Epic 9 — Remove Decommissioned Shops: Task List

## Story 9.1 — Remove agorajeux.fr, ludibay.fr, and ludofacto.be from all project files

- [x] 9.1.1 — In `src/shared/title-utils.ts`, delete the three `ShopConfig` object literals from the `SHOP_CONFIGS` array whose `hostname` values are `'www.agorajeux.fr'`, `'www.ludibay.fr'`, and `'www.ludofacto.be'` (lines ~31–46)
- [x] 9.1.2 — In `manifest.json`, remove the three strings `"https://www.agorajeux.fr/*"`, `"https://www.ludibay.fr/*"`, and `"https://www.ludofacto.be/*"` from `content_scripts[0].matches`
- [x] 9.1.3 — In `tests/shared/urlGuard.test.ts`, delete the complete `describe('Agorajeux (8.1)', …)`, `describe('Ludibay (8.2)', …)`, and `describe('LudoFacto (8.3)', …)` blocks (all `it(…)` cases inside each block included)
- [x] 9.1.4 — Delete `tests/e2e/epic8-agorajeux.spec.ts`, `tests/e2e/epic8-ludibay.spec.ts`, and `tests/e2e/epic8-ludofacto.spec.ts`
- [x] 9.1.T — Test: confirm `tests/shared/urlGuard.test.ts` contains no remaining references to `agorajeux`, `ludibay`, or `ludofacto`; confirm all surviving `describe` blocks in `urlGuard.test.ts` still pass
- [x] 9.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 9.E2E — QC (Epic-end): Run `playwright test`; confirm the three decommissioned spec files are gone and no regressions appear in the remaining E2E specs

# Epic 11 — Fix espritjeu.com: Reposition Rating Span: Task List

## Story 11.1 — Fix espritjeu.com: reposition rating span below the title

- [x] 11.1.1 — Inspect live `espritjeu.com` product-page DOM: identify the element hierarchy around the current `titleSelector` target (`h1.fa_designation`) and record why the injected `[data-bgg-rating]` span renders inline/left of the title instead of below it
- [x] 11.1.2 — In `src/shared/title-utils.ts`, `SHOP_CONFIGS` array: update the `espritjeu.com` entry's `titleSelector` to a block-level ancestor of `h1.fa_designation` (or apply the minimal targeted fix identified in 11.1.1) so the rating span is inserted below the title text, not beside it
- [x] 11.1.T — Test: No new unit tests required for a selector-only change; verify that the existing `urlGuard.test.ts` espritjeu cases (if any) still pass with `vitest run`; confirm `isProductPage()` still returns `true` for espritjeu product URLs
- [x] 11.1.Q — QC (Automated): Run `eslint src` then `vitest run`; confirm all passing

---

## Epic E2E Test

- [x] 11.E2E — QC (Epic-end): Run `playwright test tests/e2e/epic8-espritjeu.spec.ts`; confirm `[data-bgg-rating]` span is present and no regressions in other E2E specs

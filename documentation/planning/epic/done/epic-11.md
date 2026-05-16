## Epic 11 — Fix espritjeu.com: Reposition Rating Span

**Objective**
Repair the espritjeu.com shop configuration which injects the rating to the left of the title instead of below it.

**In scope**
- espritjeu.com: rating rendered to the left of the title instead of below it

**Stories**
1. **Fix espritjeu.com: reposition the injected rating span so it renders below the title**

**Acceptance Criteria**
- Story 1: The developer inspects the live `espritjeu.com` product-page DOM to identify why the rating span appears to the left of the title. The shop config for espritjeu is updated — either by correcting `titleSelector` to a block-level ancestor element or by any other targeted change — so that the rating span is visually positioned below the title text and not beside it. The Playwright spec `tests/e2e/epic8-espritjeu.spec.ts` still passes (`[data-bgg-rating]` span is present after the fix). The PR description documents the root cause, the element hierarchy inspected, and the change made.

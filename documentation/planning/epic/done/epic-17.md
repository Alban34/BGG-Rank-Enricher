## Epic 17 — Fix boardgamebliss.com: Correct Shop Config for Injection

**Objective**
Repair the boardgamebliss.com shop configuration which fails to inject the title underline and rating span at all.

**In scope**
- boardgamebliss.com: title underline and rating span not injected; investigate and correct the shop config

**Stories**
1. **Fix boardgamebliss.com: correct the shop config so the title underline and rating span are injected**

**Acceptance Criteria**
- Story 1: The developer inspects at least one `boardgamebliss.com` product page to determine the root cause of the missing underline and rating span (incorrect `titleSelector`, dynamic rendering, or `urlPattern` mismatch). The shop config is corrected. After the fix, `isProductPage()` returns `true` for at least two real `boardgamebliss.com` product-page URLs; these are added as named test cases in `tests/shared/urlGuard.test.ts` and pass. The Playwright spec `tests/e2e/epic8-boardgamebliss.spec.ts` is updated to assert both `[data-bgg-rating]` presence and that the title element has a blue underline style on a real product page. The root cause is documented in the PR description.

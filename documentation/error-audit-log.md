# Error Audit Log

---

## [2026-05-13] Epic 6 — Improved BGG Title Matching for Expansion Titles

**File:** `src/shared/title-utils.ts`

**Finding:** The JSDoc example on line 3 reads `" :" or " : " → ":"`, implying that post-colon whitespace is also removed. In practice the implementation (`\s+:` regex) only removes whitespace *before* the colon, so `" : "` produces `": "` (the trailing space is preserved as a word separator). The second clause of the same comment ("Post-colon whitespace is preserved as a normal word separator") correctly describes the behaviour, but the inline example contradicts it.

**Suggested action:** Correct the JSDoc example from `" : " → ":"` to `" : " → ": "` (retaining the trailing space) so that the example is consistent with the implementation and the second clause of the comment.

**Status:** OBSOLETE — JSDoc example already correct in source as of 2026-05-13.

---

## Summary

| Date | Epic | File | Finding | Status |
|---|---|---|---|---|
| 2026-05-13 | Epic 6 — Improved BGG Title Matching | `src/shared/title-utils.ts` | JSDoc example for `normaliseTitle` incorrectly showed trailing space being removed | OBSOLETE |

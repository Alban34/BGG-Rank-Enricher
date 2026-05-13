# Epic 5 Task List — GitHub CI & SonarCloud Analysis

## Story 5.1 — Create GitHub Actions CI workflow
- [x] Install `@vitest/coverage-v8` as a dev dependency (`npm install --save-dev @vitest/coverage-v8`)
- [x] Extend `vite.config.ts` with a `coverage` block: `provider: 'v8'`, `reporter: ['lcov']`, `reportsDirectory: 'coverage'`
- [x] Create `.github/workflows/` directory at repository root
- [x] Create `.github/workflows/ci.yml` with the following:
  - Trigger on `push` and `pull_request` targeting `main`
  - Job steps: `actions/checkout` → `actions/setup-node` (Node 20 LTS) → `npm ci` → `npm run lint` → `npm test -- --coverage` → `npm run build`
  - Optional `actions/cache` step keyed on `${{ hashFiles('**/package-lock.json') }}` caching `~/.npm`
- [x] Verify `coverage/lcov.info` is emitted when `npm test -- --coverage` is run locally
- [x] Test: Push a branch to GitHub (or open a PR targeting `main`) and confirm the `ci` workflow run completes all steps successfully; inspect the Actions log to confirm `coverage/lcov.info` is generated
- [x] QC (Automated): N/A — no project source files changed

## Story 5.2 — Add sonar-project.properties
- [x] Create `sonar-project.properties` at repository root with the following content:
  - `sonar.projectKey=YOUR_SONARCLOUD_PROJECT_KEY` (placeholder — must be replaced with the actual SonarCloud project key)
  - `sonar.organization=YOUR_SONARCLOUD_ORG` (placeholder — must be replaced with the actual SonarCloud organisation slug)
  - `sonar.sources=src`
  - `sonar.tests=tests`
  - `sonar.javascript.lcov.reportPaths=coverage/lcov.info`
  - `sonar.exclusions=dist/**,node_modules/**,coverage/**`
- [x] Test: Open the file and confirm all required keys are present and placeholder values are clearly commented for the user to replace
- [x] QC (Automated): N/A — no project source files changed

## Story 5.3 — Integrate SonarCloud analysis step
- [x] Append a SonarCloud step to the `ci.yml` job, placed after `npm run build`, with:
  - `if: always()` so it executes even when a prior step fails
  - `continue-on-error: true`
  - `uses: SonarSource/sonarcloud-github-action@v3` (pinned version)
  - `env` block containing `SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}` and `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`
- [x] Add `SONAR_TOKEN` as an encrypted secret in the GitHub repository settings (manual setup step — outside CI config files)
- [x] Test: Trigger a CI run on a branch; confirm the SonarCloud step appears in the Actions log and either passes (token configured) or skips gracefully (`continue-on-error: true`) without blocking the overall workflow result
- [x] QC (Automated): N/A — no project source files changed

## Epic E2E Test
- [x] Epic E2E Test: N/A — Epic 5 modifies only CI configuration files (`ci.yml`, `sonar-project.properties`) and dev tooling config (`vite.config.ts` coverage block); no runtime source code changes are introduced, so no browser-level E2E verification is required

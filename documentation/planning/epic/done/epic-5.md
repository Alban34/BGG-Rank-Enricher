## Epic 5 — GitHub CI & SonarCloud Analysis

**Objective**
Establish an automated CI pipeline on GitHub Actions that validates every push and pull request to the `main` branch by running lint, unit/integration tests, and a production build, and then uploads static-analysis results to SonarCloud so that code quality regressions are caught before merging.

**In scope**
- A GitHub Actions workflow file at `.github/workflows/ci.yml` triggered on `push` and `pull_request` events targeting `main`
- Workflow steps: repository checkout, Node.js setup, `npm ci`, lint (`npm run lint`), unit/integration tests (`npm test`), and production build (`npm run build`)
- A `sonar-project.properties` file at the repository root configuring the SonarCloud project key, organisation, source root (`src/`), test paths (`tests/`), and coverage report location
- A SonarCloud analysis step using the `SonarSource/sonarcloud-github-action` action, authenticated via the `SONAR_TOKEN` repository secret and the built-in `GITHUB_TOKEN`
- Coverage generation in the test step so SonarCloud can consume the LCOV report

**Stories**

### Story 5.1 — Create a GitHub Actions CI workflow that installs dependencies, runs lint, runs unit/integration tests, and builds the extension
Create `.github/workflows/ci.yml`. The workflow must trigger on `push` and `pull_request` events whose target branch is `main`. It must check out the repository, set up Node.js (use the `actions/setup-node` action; pin to the LTS version appropriate for the project's devDependencies), run `npm ci`, run `npm run lint`, run `npm test` with coverage enabled (pass `--coverage` or configure vitest to emit an LCOV report to `coverage/lcov.info`), and run `npm run build`. Each step must run sequentially; a failure in any step must abort subsequent steps and mark the workflow run as failed. The workflow must not cache `node_modules` in a way that could serve stale packages across dependency changes — use `actions/cache` keyed on the `package-lock.json` hash if caching is added.

Acceptance condition: a push to `main` triggers the workflow; the run shows passing steps for install, lint, test, and build in that order; introducing a deliberate lint error in a source file causes the run to fail at the lint step without proceeding to the test or build steps; the test step emits a coverage report at `coverage/lcov.info` (or the path configured in the vitest coverage settings).

### Story 5.2 — Add a sonar-project.properties configuration file to the repository root
Create `sonar-project.properties` at the repository root. The file must declare at minimum: `sonar.projectKey` (matching the SonarCloud project), `sonar.organization` (matching the SonarCloud organisation), `sonar.sources=src`, `sonar.tests=tests`, `sonar.javascript.lcov.reportPaths=coverage/lcov.info`, and `sonar.exclusions` to omit the `dist/` build output and `node_modules/`. The coverage path must match the output location produced by the test step in Story 5.1.

Acceptance condition: `sonar-project.properties` exists at the repository root; it contains non-empty values for `sonar.projectKey`, `sonar.organization`, `sonar.sources`, `sonar.tests`, and `sonar.javascript.lcov.reportPaths`; all referenced source and test paths exist in the repository; `dist/` and `node_modules/` appear in `sonar.exclusions`.

### Story 5.3 — Integrate the SonarCloud analysis step into the CI workflow
Append a SonarCloud analysis step to the workflow defined in Story 5.1, positioned after the test step so that the LCOV coverage report is already on disk. The step must use `SonarSource/sonarcloud-github-action@master` (or a pinned stable version). It must pass `SONAR_TOKEN` from repository secrets and expose `GITHUB_TOKEN` from `secrets.GITHUB_TOKEN` in the `env` block as required by the action. The step must have `continue-on-error: true` so that a temporary SonarCloud service outage does not block the rest of the pipeline (lint, tests, build must not be gated on SonarCloud availability).

Acceptance condition: the CI workflow contains a step that invokes `SonarSource/sonarcloud-github-action`; the step's `env` block references both `SONAR_TOKEN` and `GITHUB_TOKEN`; `continue-on-error: true` is present on the SonarCloud step; after a successful run the SonarCloud project dashboard reflects the latest analysis; a simulated SonarCloud failure (e.g. invalid token) does not cause the overall workflow run to be marked as failed.

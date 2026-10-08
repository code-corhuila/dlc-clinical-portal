# Clinical Portal Testing Strategy

## Governance authority

Project-wide testing and TDD policy is defined by `dlc-docs`. The authoritative documents are:

- [dlc-docs/11-quality/testing-strategy.md](https://github.com/code-corhuila/dlc-docs/blob/main/11-quality/testing-strategy.md)
- [dlc-docs/11-quality/tdd-guide.md](https://github.com/code-corhuila/dlc-docs/blob/main/11-quality/tdd-guide.md)

This Clinical Portal document does **NOT** replace or supersede those documents. It only maps project-wide policy to the commands, tooling, validation flow and evidence practices used by `dlc-clinical-portal`. It is repository-specific operational guidance, not a competing project-wide policy.

## Purpose

This document defines how changes in `dlc-clinical-portal` are validated and how evidence is preserved. It is a living registry of the quality workflow, not a replacement for executable tests or CI.

## Quality controls

These commands are used to validate changes. Not all are tests; they are classified accurately below:

- `npm ci` — Reproducible dependency installation
- `npm run typecheck` — TypeScript static/type validation
- `npm run lint` — ESLint static analysis
- `npm run format:check` — Prettier formatting verification
- `npm test` — Vitest automated regression tests
- `npm run test:coverage` — Vitest tests with V8 coverage reporting
- `npm run build` — Production build validation
- `npm run quality` — Aggregate repository quality command
- `git diff --check` — Whitespace/diff hygiene
- `node scripts/pr-gates.mjs <lines|branch|commits|pr|arch>` — Pull Request gates, executed by `ci.yml`

## PR gates

`scripts/pr-gates.mjs` reuses the controls the norm already defines; it does not create a new validation framework. `ci.yml` executes every gate on each Pull Request.

| Gate | Control reused | Kind |
| --- | --- | --- |
| `lines` | norm 9.2 — 400 computable lines; tests and generated files excluded | deterministic |
| `branch` | norm 6.3.1 / 6.3.3 — child prefix against its parent branch | deterministic |
| `commits` | norm 8.1 / 15.2 — Conventional Commits subject | deterministic |
| `pr` | norm 9.1 — required PR sections plus task, HU or Issue reference | deterministic |
| `arch` | Anexo H — HTTP client, token storage, cross-context imports | errors deterministic, warnings heuristic |

Deterministic findings block the Pull Request. `arch` warnings are heuristics that require human review; no static analysis replaces a review of DDD, SDD, SOLID or Clean Code. The `pr` gate proves only that the required text is present, never that a functional requirement was fulfilled.

`branch` reports `qa` against `qa/*` as an unresolved conflict: it creates no exception and asserts no compliance until a human decision is recorded.

## TDD for functional changes

- `RED` → `GREEN` → `REFACTOR` → `REGRESSION`
- Functional Clinical HUs require chronological test-first evidence
- Tests are written before the minimal implementation where applicable
- Never fabricate historical `RED`
- Never add meaningless tests only to increase coverage

## Tooling/configuration changes

Tooling/configuration changes use a reproducible check-first equivalent. If a historical `RED` did not actually occur, classify the baseline transparently as:

**RETROSPECTIVE BASELINE / NON-TDD SUPPORTING EVIDENCE**

This classification:

- does **NOT** satisfy chronological TDD and does **NOT** replace a real `RED`;
- cannot be used to claim that a functional HU followed TDD;
- exists only to preserve truthful supporting evidence for historical non-functional tooling/configuration/quality/docs work where chronological `RED` did not actually occur;
- must never be used for domain, application, UI behavior, API behavior, or other functional changes;
- is review governance, not a substitute for TDD.

Future functional Clinical HUs MUST use actual chronological `RED` → `GREEN` → `REFACTOR` → `REGRESSION`.

Objective eligibility criteria — a change may use this supporting-evidence classification only when **ALL** are true:

1. no business/domain behavior is introduced or changed;
2. no functional user-facing behavior is introduced or changed;
3. the change is limited to tooling/configuration/quality/docs or equivalent non-functional infrastructure;
4. the evidence explicitly states that historical `RED` did not occur;
5. the PR reviewer accepts the classification.

Never describe it as historical `RED`.

## Promotions

Promotions contain no new implementation. They reuse source development/TDD evidence and add fresh regression validation on the exact promotion SHA. Do not claim a new `RED`/`GREEN` development cycle for promotions.

## Evidence requirements

Every evidence record should include when applicable:

- Evidence ID
- Change/HU
- Repository
- Environment
- Branch
- Exact tested SHA
- Related PR
- Objective
- Validation type
- Preconditions
- Command/check
- Expected result
- Actual result
- PASS / FAIL / N/A
- Coverage when applicable
- Performance KPI when applicable
- Known limitations
- Conclusion

## Coverage

Coverage currently measures structural Clinical frontend source. It is **NOT** complete Clinical functional/domain coverage. Do not state that 100% structural coverage means complete business coverage. Future functional HUs must extend tests and establish meaningful behavior coverage.

## Evidence storage

`docs/quality/validation-evidence.md` is the persistent evidence registry. GitHub PRs and GitHub Actions remain supporting/verifiable execution evidence. The markdown registry does **NOT** replace executable tests or CI.

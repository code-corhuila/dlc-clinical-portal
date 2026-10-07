# Clinical Portal Validation Evidence

This registry follows an **append-oriented review convention**, not a technically immutable log:

- old PASS/FAIL records should not be rewritten merely because later executions produce different results;
- factual mistakes MAY be corrected;
- factual corrections must clearly identify the affected evidence record and the reason for the correction;
- a newer validation MAY supersede an earlier one;
- when superseding, the new record must reference the previous Evidence ID;
- Git history, PRs and GitHub Actions remain the supporting execution trace.

This convention is enforced through review and governance. There is currently **no dedicated CI mechanism** that makes old Markdown evidence technically immutable.

## QA-CLIN-PORTAL-QUALITY-001

- **Environment:** QA promotion
- **Change:** Frontend Quality gates
- **Source PR:** #11
- **Promotion PR:** #13
- **Base QA:** 4d20dd90425cd4c0b8fb4c212d0099b7c8f5d23d
- **Promotion branch used:** promotion/clinical-portal-quality
- **Exact tested promotion SHA:** 267f03583dadc08793fdc09da0a01fc6708c69c5
- **QA merge commit:** b197e865295e6306f15264c4466f08dcfcf20d0a

### Verifiable references

- Source Quality PR #11: https://github.com/code-corhuila/dlc-clinical-portal/pull/11
- QA promotion PR #13: https://github.com/code-corhuila/dlc-clinical-portal/pull/13
- Exact tested promotion commit: https://github.com/code-corhuila/dlc-clinical-portal/commit/267f03583dadc08793fdc09da0a01fc6708c69c5
- QA merge commit: https://github.com/code-corhuila/dlc-clinical-portal/commit/b197e865295e6306f15264c4466f08dcfcf20d0a
- GitHub Actions CI run #10: https://github.com/code-corhuila/dlc-clinical-portal/actions/runs/37579428186

**Validation classification:** FRESH QA REGRESSION / PROMOTION VALIDATION

**TDD classification:** No new RED/GREEN cycle claimed.

Source Quality evidence already existed.

**Results:**

- `npm ci`: PASS
- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run format:check`: PASS
- `npm test`: PASS — 1 test passed
- `npm run test:coverage`: PASS

  Recorded structural coverage:
  - 100% statements
  - 100% lines
  - 100% functions
  - branches reported 100% with no applicable branch paths

**Explicit limitation:** This is structural Clinical coverage only, not Clinical business/domain coverage.

- `npm run build`: PASS
- `npm run quality`: PASS
- `git diff --check`: PASS

**GitHub Actions:** CI run #10 — SUCCESS

**Performance KPI:** N/A

**Reason:** Tooling/quality-only change with no functional Clinical/API flow.

**Security note:** The known source-map-js finding remains separate in issue #10 and was not remediated as part of this evidence.

**Conclusion:** PASS

## Historical source Quality validation — PR #11

No new evidence ID was assigned at the time of PR #11. This section records the known facts only.

PR #11 recorded:

- `npm ci` PASS
- `npm run typecheck` PASS
- `npm run lint` PASS
- `npm run format:check` PASS
- `npm test` PASS
- `npm run test:coverage` PASS
- `npm run build` PASS
- `npm run quality` PASS
- `git diff --check` PASS

**Test-first classification:** RETROSPECTIVE BASELINE / RED-EQUIVALENT

This is **NOT** a claim of chronological historical `RED`. "RED-EQUIVALENT" here does **not** mean a functional test historically failed before implementation. It means the pre-Quality baseline lacked the Quality capabilities/checks that this change was introducing, and that missing capability was reproduced retrospectively.

Reproduced pre-Quality baseline:

- Quality commands introduced later did **not yet exist / were unavailable** on the detached pre-Quality baseline: `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run quality`;
- existing commands remained green: `npm run typecheck`, `npm test`, `npm run build`.

Verifiable reference: https://github.com/code-corhuila/dlc-clinical-portal/pull/11

**Known formatting-gate probe evidence:**

- a temporary deliberately misformatted source probe was used;
- the old `format:check` did not cover source;
- a direct Prettier check detected the probe;
- after extending the source formatting gate, `format:check` detected the same probe;
- the probe was removed and never committed;
- the affected real source was formatted;
- final verification passed.

No terminal logs or timestamps are invented for this historical note.
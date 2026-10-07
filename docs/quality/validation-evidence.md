# Clinical Portal Validation Evidence

Records are append-only historical evidence unless a factual correction is required. Do not rewrite old PASS/FAIL history because later executions change.

## QA-CLIN-PORTAL-QUALITY-001

- **Environment:** QA promotion
- **Change:** Frontend Quality gates
- **Source PR:** #11
- **Promotion PR:** #13
- **Base QA:** 4d20dd90425cd4c0b8fb4c212d0099b7c8f5d23d
- **Promotion branch used:** promotion/clinical-portal-quality
- **Exact tested promotion SHA:** 267f03583dadc08793fdc09da0a01fc6708c69c5
- **QA merge commit:** b197e865295e6306f15264c4466f08dcfcf20d0a

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

Explanation: the baseline was reproduced after the original local Quality implementation. Therefore it is supporting evidence of the pre-Quality state, but it is NOT claimed as chronological historical `RED`.

**Known formatting-gate probe evidence:**

- a temporary deliberately misformatted source probe was used;
- the old `format:check` did not cover source;
- a direct Prettier check detected the probe;
- after extending the source formatting gate, `format:check` detected the same probe;
- the probe was removed and never committed;
- the affected real source was formatted;
- final verification passed.

No terminal logs or timestamps are invented for this historical note.
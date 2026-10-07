# Clinical Portal Validation Evidence

This registry follows an **append-oriented review convention**, not a technically immutable log:

- evidence records are governed through PR review and Git history;
- old PASS/FAIL records must not be rewritten merely because later executions produce different results;
- silent rewriting of historical PASS/FAIL evidence is prohibited by repository governance;
- factual mistakes MAY be corrected, and factual corrections must be explicit: they clearly identify the affected evidence record and the reason for the correction;
- a newer validation MAY supersede an earlier one;
- when superseding, the new record must reference the previous Evidence ID;
- Git history, PRs and GitHub Actions remain the supporting execution trace.

**Limitation — DEFERRED CONTROL:** there is currently **no dedicated mechanical/CI append-only enforcement**. Evidence immutability is review-enforced (PR review and Git history), not technically enforced. This limitation is explicitly classified as a **DEFERRED CONTROL**: it is NOT solved by this document, and no scripts, hooks or workflows are added here to address it.

## Runtime validation baseline — Node 22

- The repository-supported runtime is **Node 22 / npm 10** (`package.json` engines: `node >=22 <23`, `npm >=10 <11`).
- GitHub Actions executes CI with **Node 22** (`node-version: 22` in `.github/workflows/ci.yml`), and Node 22 has been the CI runtime since that workflow was introduced.
- The **authoritative** runtime validation is the GitHub Actions CI run for the pull request — it is the reproducible Node 22 validation. The recorded successful CI evidence in this registry (CI run #10) executed under this same Node 22 workflow.
- Local validation performed on Node 24 / npm 11 is **supplementary only**; it does not replace, downgrade or re-define the Node 22 baseline.

## QA-CLIN-PORTAL-QUALITY-001

- **Environment:** QA promotion
- **Change:** Frontend Quality gates
- **Source PR:** #11
- **Promotion PR:** #13
- **Base QA:** 4d20dd90425cd4c0b8fb4c212d0099b7c8f5d23d
- **Promotion branch used:** promotion/clinical-portal-quality
- **Exact tested promotion SHA:** 267f03583dadc08793fdc09da0a01fc6708c69c5
- **QA PR merge commit:** b197e865295e6306f15264c4466f08dcfcf20d0a

**QA PR merge commit clarification:** `b197e865295e6306f15264c4466f08dcfcf20d0a` is the PR #13 merge of `promotion/clinical-portal-quality` into `qa`. It is **NOT** a permanent-branch merge of `develop` into `qa`. It represents the resulting QA integration point; traceability back to the source commits is established by the seven `git cherry-pick -x` trailers, not by this merge commit.

**Governance note: controlled QA feeder naming exception**

- The historical feeder branch was `promotion/clinical-portal-quality`.
- This differs from the literal `qa/*` prefix stated in the repository standard; this evidence record does **NOT** claim literal branch-prefix compliance.
- The permanent branch `qa` occupies `refs/heads/qa`, which conflicts at the Git ref namespace level with creating `refs/heads/qa/*` (the same ref name cannot exist as both a file and a directory).
- The project therefore used `promotion/*` as a controlled feeder-branch exception.
- Promotion mechanics were unchanged: branch from `qa` → re-apply reviewed commits with `git cherry-pick -x` → validate → PR the feeder branch back into `qa`.
- No permanent `develop → qa` merge occurred.

### Promotion traceability

| # | Source develop-side SHA | QA feeder promotion SHA |
| --- | --- | --- |
| 1 | ff6e23eb7b0059104e6a86b1f8bc40442019ce4d | 45409e3b82dfbe0094cd9e71ac574890edb44401 |
| 2 | b235b51d8e81120742f01a2d517f3eba971fb66e | 9ed1ff5f865790cc7f30d00bd85c53bce9d3c1a8 |
| 3 | 8b6d1e753d63b3d8e18096db618a5fab2f5db410 | b7a93d63aa5a82433f42ad3e61448f374edf1db1 |
| 4 | ea218efeeef4b3050549a8c645228783ddc004ae | 6f8aa6e9d60d29fa5dd0eb3548418b666429870b |
| 5 | 3c7d105cf34ab66dee13ffd5a2adc80f11b195f5 | b853423296df5b4c85648ba9f46897e1e85e5b8c |
| 6 | 4666f9bc28c30daf9eea6c07ac5149d3292685f1 | 64fe3e17e338e33dbaa0fd3ad6f186def412935a |
| 7 | fabf4ac3e08b99e848cbca8edb5409914a74b815 | 267f03583dadc08793fdc09da0a01fc6708c69c5 |

- All **7/7** promotion commits contain the required `(cherry picked from commit <source-sha>)` trailer, each pointing to the exact source SHA listed in its row.
- The exact tested promotion HEAD was `267f03583dadc08793fdc09da0a01fc6708c69c5` (mapping #7).
- These `-x` trailers are the actual source→QA traceability evidence; the later QA PR merge commit is **NOT** the source→QA traceability mechanism.

### Verifiable references

- Source Quality PR #11: https://github.com/code-corhuila/dlc-clinical-portal/pull/11
- QA promotion PR #13: https://github.com/code-corhuila/dlc-clinical-portal/pull/13
- Exact tested promotion commit: https://github.com/code-corhuila/dlc-clinical-portal/commit/267f03583dadc08793fdc09da0a01fc6708c69c5
- QA PR merge commit: https://github.com/code-corhuila/dlc-clinical-portal/commit/b197e865295e6306f15264c4466f08dcfcf20d0a
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

**Test-first classification:** RETROSPECTIVE BASELINE / NON-TDD SUPPORTING EVIDENCE

This is **NOT** a claim of chronological historical `RED`, and it is **NOT** TDD evidence: the classification does not satisfy chronological TDD, does not replace a real `RED`, and cannot be used to claim that a functional HU followed TDD. It exists only to preserve truthful supporting evidence for historical non-functional tooling/configuration work where chronological `RED` did not actually occur. Concretely, the pre-Quality baseline lacked the Quality capabilities/checks that this change was introducing, and that missing capability was reproduced retrospectively. Objective eligibility criteria are defined in `docs/quality/testing-strategy.md`.

**Terminology correction (PR #11 evidence):** the previous label `RETROSPECTIVE BASELINE / RED-EQUIVALENT` is deprecated because it could imply equivalence to a real TDD `RED`. The evidence is now classified as `RETROSPECTIVE BASELINE / NON-TDD SUPPORTING EVIDENCE`. This changes terminology only; it does not create or claim historical `RED` evidence. All original factual results above are preserved unchanged.

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

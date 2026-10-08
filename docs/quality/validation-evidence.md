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

## DEV-CLIN-PORTAL-SECURITY-001

- **Issue:** #10 — chore(security): assess high-severity source-map-js vulnerability
- **Environment:** Dev
- **Branch:** chore/security-source-map-js
- **Baseline SHA (source develop):** 22b9d0e73eeff5a2cd44012eb393dd437e6f1e8a
- **Baseline classification:** SECURITY CHECK-FIRST BASELINE — REPRODUCED (not a functional TDD RED)
- **Vulnerability:** GHSA-68fv-2mgg-jv7q — severity HIGH; affected range `>=1.0.0 <1.2.2`
- **Vulnerable version:** `source-map-js@1.2.1`
- **Fixed version:** `source-map-js@1.2.2`
- **Direct dependency:** NO
- **Transitive dependency:** YES (all immediate parents request `^1.2.1`, so `1.2.2` was already allowed)
- **Dependency paths:**
  - PROD-declared / build-time: `vite@7.3.6` → `postcss@8.5.28` → `source-map-js`
  - DEV / test: `jsdom@30.1.1` → `css-tree@3.2.1` → `source-map-js`
  - DEV / coverage: `@vitest/coverage-v8@5.0.3` → `magicast@0.5.5` → `source-map-js`
- **Runtime impact:** build/dev/test exposure only — the final deployed image is Nginx static assets with no `node_modules` and no Node runtime, and `source-map-js` is absent from the browser bundle. `npm audit --omit=dev` reported the finding only because `vite` is currently declared in `dependencies`.
- **Implementation:** minimal lockfile-only remediation via `npm audit fix --package-lock-only`
- **package.json:** unchanged
- **package-lock.json:** changed — only the `node_modules/source-map-js` resolution moved `1.2.1` → `1.2.2` (version, resolved, integrity)
- **No forced upgrade:** `npm audit fix --force` was NOT used; no unrelated dependency versions changed
- **Before audit result:** full audit FAIL (exit 1, 1 HIGH); `--omit=dev` audit FAIL (exit 1, 1 HIGH)
- **After audit result:** full audit PASS (exit 0, 0 vulnerabilities); `--omit=dev` audit PASS (exit 0, 0 vulnerabilities)
- **Full regression:** `npm ci` PASS; `npm run typecheck` PASS; `npm run lint` PASS; `npm run format:check` PASS; `npm test` PASS — 1 test file / 1 test; `npm run test:coverage` PASS (structural only — 100% of 3 files, NOT functional/domain coverage); `npm run build` PASS; `npm run quality` PASS; `git diff --check` PASS
- **Known local runtime mismatch:** local Node v24.19.0 / npm 11.17.0 versus engines `node >=22 <23`, `npm >=10 <11` — local results are supplementary only; repository-supported runtime is Node 22 / npm 10
- **Authoritative CI:** GitHub Actions Node 22 — pending until the PR CI run records it
- **Exact implementation commit:** 5d74603b4253535bd89a9e5c75588a0d64e6109d (`chore(security): remediate source-map-js advisory`)
- **Evidence classification:** SECURITY REMEDIATION VALIDATION — PASS (not a TDD RED/GREEN cycle)

## DEV-CLIN-PORTAL-PRGATES-001

- **Change / task:** TAREA 01 — missing Pull Request quality gates. No functional HU; HU-CLN-001 is out of scope.
- **Issue:** PENDING — no issue or Pull Request was opened; commit, push and PR are not authorized in this task.
- **Repository:** dlc-clinical-portal · **Environment:** Dev
- **Branch:** `chore/clinical-pr-gates`, created from `origin/develop` at `c2cb6a41ee2b49b766bac98cedab5c1ebd8ed3fb`
- **Exact tested SHA:** PENDING — no commit exists yet; this increment is validated on the working tree only.
- **Objective:** detect PRs over 400 computable lines, wrong branches, non-conforming commits, missing traceability and portal architecture violations, reusing the controls that already exist.
- **Validation type:** TOOLING/QUALITY — CHECK-FIRST / NON-TDD SUPPORTING EVIDENCE.
- **Preconditions:** clean tree on `develop`, `git fetch origin`, local Node v24.19.0 / npm 11.17.0. CI runtime stays Node 22.
- **TDD note:** implementation and tests were written in the same change; the first execution reported 1 failing assertion (RED) corrected to GREEN. Because the implementation preceded the test run, chronological RED-first TDD is **not** claimed here.

**Commands, expected result, actual result:**

| Command | Expected | Actual | Result |
| --- | --- | --- | --- |
| `npm run typecheck` | exit 0 | exit 0 | PASS |
| `npm run lint` | exit 0 | exit 0 | PASS |
| `npm run format:check` | exit 0 | all matched files use Prettier style | PASS |
| `npm test` | suite passes | 2 files, 29 tests passed | PASS |
| `npm run test:coverage` | exit 0 | 100% statements/lines/functions, structural only (3 files) | PASS |
| `npm run build` | exit 0 | exit 0, `dist/` produced | PASS |
| `npm run quality` | exit 0 | exit 0 | PASS |
| `git diff --check` | no output | no output | PASS |
| `pr-gates lines --base origin/develop --head WORKTREE` | total ≤ 400 | 386/400 computable, 269 test lines excluded, run after `git add -N .` | PASS |
| `pr-gates lines --limit 386` | accept the exact total | `386/386 computable … lines: PASS`, exit 0 | PASS |
| `pr-gates lines --limit 385` | reject when the total exceeds the limit | `386/385 computable … lines: FAIL`, exit 1 | PASS |
| `pr-gates branch --base develop --head chore/clinical-pr-gates` | no findings | 0 findings | PASS |
| `pr-gates branch --base qa --head feat/cln-001` | wrong target detected | `BRANCH_WRONG_TARGET — feat/ → develop`, FAIL | PASS |
| `pr-gates branch --base qa --head qa/hu-001` | conflict reported, no compliance claimed | `QA_NOMENCLATURE_UNRESOLVED`, FAIL | PASS |
| `pr-gates commits --base origin/develop~6 --head origin/develop` | non-conforming subjects detected | 6 `COMMIT_SUBJECT` findings | PASS |
| `pr-gates commits --base origin/develop --head chore/clinical-pr-gates` | no commits yet | 0 findings (empty range) | PASS |
| `pr-gates pr --body <filled body>` | 0 findings | `pr: PASS` | PASS |
| `pr-gates pr --body .github/pull_request_template.md` | unfilled traceability detected | 3 findings, FAIL | PASS |
| `pr-gates arch` | no violation under `src/` | 0 findings | PASS |

**Measured size of this increment (norm 9.2):** 386 computable lines (insertions + deletions across 7 files); `scripts/pr-gates.test.mjs` adds 269 test lines that norm 9.2 excludes. Limit 400, PASS. Measured with `git add -N .` so untracked files appear in `git diff origin/develop`; the index was restored with `git reset` (no commit).

**Final audit finding D1 (fixed, non-blocking):** `refs()` only stripped `remotes/origin/`, never `origin/`, so remote refs kept their prefix. In CI only the PR head branch exists locally, which made `QA_REF_NAMESPACE_COLLISION` unreachable. Fixed by normalizing `^(remotes\/)?origin\/` in `parseRefList`; three regression tests added (tests 15–17 of `scripts/pr-gates.test.mjs`). No behaviour changed for the other gates; total grew 377 → 386 computable lines (5 from the fix, 4 from the audit paragraphs above). The protection `QA_NOMENCLATURE_UNRESOLVED` never depended on this path and still fails as specified.

**Validation on Node 22.13.1:** the only Node 22 binary available locally is `C:\Users\bonil\AppData\Local\ms-playwright-go\1.50.1\node.exe` (read-only use, nothing installed). `npm run quality` and all five gates were executed with it: exit 0, 29 tests passed, `386/400 lines: PASS`. npm stays 11.17.0 — npm 10 is not available locally and was not installed, so the npm half of `engines` remains validated only by the pending GitHub Actions run.

**Known limitations:**

- Local results use Node 24.19.0 / npm 11.17.0 against engines `node >=22 <23`, `npm >=10 <11`: supplementary only. The authoritative Node 22 GitHub Actions run is PENDING. The `lines` and `commits` gates resolve `origin/<head>`, so a Pull Request from a fork would need `refs/pull/*/head` fetched first.
- The `pr` gate proves that the required text is present; it never proves that a functional requirement was fulfilled.
- `arch` warnings are heuristic and never replace human review of DDD, SDD, SOLID or Clean Code. Binary files count as 0 lines; `package-lock.json`, `coverage/` and `dist/` are excluded as generated.
- Norm audit 15.2 over the whole `origin/develop` history returns 6 `Merge pull request` subjects; the gate audits only the Pull Request range, so that historical finding stays open.
- The `qa` vs `qa/*` ref namespace conflict is unresolved: the gate reports it, creates no exception and asserts no compliance. A `promotion/*` feeder fails `BRANCH_UNKNOWN_PREFIX` (norm 6.3.3) and needs a human decision.
- No commit, push, Pull Request, merge or cherry-pick was performed, and no file outside `dlc-clinical-portal` was modified.

**Conclusion:** PASS for local tooling validation. GitHub Actions, commit SHA traceability and the Pull Request itself remain PENDING until authorization is granted.

## DEV-CLIN-PORTAL-RECORD-001

- **HU / Issue:** HU-CLN-001, increment 01 (Clinical record: UI states and read-only entries) · `code-corhuila/dlc-clinical-portal#3` — this increment contributes to the issue and does not complete the HU.
- **Repository / Branch / Base:** dlc-clinical-portal · Dev · `feat/hu-cln-001-record-states` created from `origin/develop` at `a1d457fd14d024f560ee4db6b33c9fc7ba4c0b17` (verified after `git fetch origin`; no permanent branch touched).
- **Exact tested SHA:** PENDING — no commit, push or PR was authorized; every result below was produced on the working tree.
- **Objective:** read-only presentation slice rendering loading, empty, data, forbidden and retryable-error states for CONSULTATION and EVOLUTION entries with author/time, plus a display-only clinical access gate.
- **Validation type / Preconditions:** FUNCTIONAL UI — test-first attempt plus behavioral retry regression · clean tree · local Node v24.19.0 / npm 11.17.0 against engines `node >=22 <23`, `npm >=10 <11` (CI on Node 22 remains authoritative).

**TDD chronology (actual, never reconstructed):**

| Step | Execution and actual result |
| --- | --- |
| TEST-FIRST BLOCKED | Wrote `ClinicalRecordEntries.test.tsx` (12 tests) and `ClinicalPortalPage.test.tsx` (2) before implementation; `npm test` ran zero new tests because `fixtures/clinicalFixtures` imports could not resolve while 29 existing tests passed; this is not behavioral RED. Raw output: `%TEMP%\opencode\hu-cln-001-red-01.txt`. |
| BEHAVIORAL RED | Retry regression test then failed: an error without `onRetry` rendered `Reintentar` (1 failed, 12 passed). |
| GREEN | Added `model/`, `fixtures/`, component, styles and page wiring. Run 1: 6 failures because React Testing Library never auto-cleans (vitest has no globals) → `src/test/setup.ts` now calls `cleanup()`; run 2: 1 failure (`screen.container` removed in RTL 16) → used the render result; run 3: 42/42 passed. |
| REFACTOR | `npm run format`, compact styles and signatures without behavior change; renamed `clinicalAuthorization` → `clinicalReadAuthorized` after `arch` read it as `Authorization:`; a real regression was caught by the suite — the two-argument `resolveClinicalAccess` kept an object call site so every state resolved to *denied* (8 failures) → call site fixed → 43/43. |
| REGRESSION | Complete `npm run quality` re-run plus every applicable gate (table below): retry fixed; 46 tests passed with 100% structural coverage. |

**Commands, expected result, actual result:**

| Command | Expected | Actual | Result |
| --- | --- | --- | --- |
| `npm run typecheck` | exit 0 | exit 0 | PASS |
| `npm run lint` | exit 0 | exit 0 | PASS |
| `npm run format:check` | exit 0 | all matched files Prettier-clean | PASS |
| `npm test` | suite passes | 4 files, 46 tests passed | PASS |
| `npm run test:coverage` | exit 0 | 100% stmts/branches/funcs/lines (structural, `src/clinical/**`) | PASS |
| `npm run build` and `npm run quality` | exit 0 | exit 0, `dist/` produced | PASS |
| `npm run gates -- --help` | usage text | `unknown command: --help`, exit 1 (no help subcommand) | REPORTED |
| `pr-gates lines --base origin/develop --head WORKTREE` | ≤ 400 | 353/400 before this entry, tests excluded | PASS |
| `pr-gates arch`, `branch --base develop --head feat/hu-cln-001-record-states`, `commits` | 0 findings | 0, 0, 0 (empty commit range) | PASS |
| `git diff --check` | no output | exit 0, no output | PASS |

**Size and files (norm 9.2):** 353 computable lines before this entry (measured with `git add -N .`, index restored with `git reset`); 219 excluded test lines (179 + 33 + 7). Counted: `.env.example`, `src/vite-env.d.ts`, `src/test/setup.ts`, `src/clinical/model/{clinicalEntry,clinicalAccess,clinicalRecordView}.ts`, `src/clinical/fixtures/clinicalFixtures.ts`, `src/clinical/adapter/in/ui/components/{ClinicalRecordEntries.tsx,clinical-record.css}`, `src/clinical/adapter/in/ui/pages/ClinicalPortalPage.tsx`; new tests are excluded and the original `ClinicalPortal.test.tsx` smoke test stays unchanged (root heading).

**Local demo:** `cd clinical-workspace/dlc-clinical-portal` → `$env:VITE_CLINICAL_DEMO='true'; npm run dev` → http://localhost:4173/ (`VITE_PORT`, `strictPort`). A headless Edge screenshot verified the Data state: white card, teal `Consulta`/`Evolución` badges, labels `Autor`, `Fecha y hora`, `Texto`, the real `authorId`, `createdAt` only on the entry that has it. Flag off (default) keeps the federation placeholder; a fresh `dist/` contains no fixture string and no `VITE_CLINICAL_DEMO`, so the demo stays disabled in production builds.

**Visual comparison:** Figma node `88:659` could not be read (no Figma access in this environment); the approved wireframes and design-system tokens were used instead. Mockup visual validation is PENDING and is not claimed.

**Known limitations:** no HTTP, session, IAM, amendments or writes; `shell/apiClient` is still an empty contract; the display gate never replaces server authorization; the demo simulates an authorized Dentist and is labeled as a demonstration; dates render as raw ISO (locale formatting pending UX); only CONSULTATION and EVOLUTION get Spanish labels while other contract kinds keep their verbatim value; issue #3's authoring, amendment and integration outcomes remain open.

**Integration dependencies:** `dlc-front` (session, role and explicit clinical authorization, `shell/apiClient`), owner API `GET /api/v1/clinical-records/{id}/entries`, Figma visual validation, and the CI run on Node 22 / npm 10.

**Conclusion:** PASS for local functional validation. Commit SHA, GitHub Actions, the `pr` gate over a real PR body and the Pull Request itself remain PENDING until authorized.

## DEV-CLIN-PORTAL-ENTRY-002

- **HU / Issue / Base:** HU-CLN-001 · #3 · `99570f15f0cffc57f2ae230b515a4aeb37e64441`; branch `feat/hu-cln-001-entry-composer`.
- **Objective:** frontend-only, authorized composer for CONSULTATION and EVOLUTION requests; no HTTP, persistence, author/time, or success simulation.
- **Contract:** request body is exactly `{ kind, text }`; validation rejects blank/whitespace-only text and text over 10000 characters without changing valid content.

**TDD chronology:** Minimal importable scaffold rendered `null`; `ClinicalEntryComposer.test.tsx` then produced a genuine behavioral RED (13/13 failures, missing controls and authorization states). GREEN implemented the validator, write gate, form and injectable async port; 14/14 composer tests passed. REFACTOR ran Prettier only.

**Validation:** typecheck, lint, format, composer test (14/14), source suite (4 files/32 tests), build, `git diff --check`, and arch/branch/commit gates PASS. Source coverage is 98.3% statements, 98.41% branches, 100% functions/lines. Complete diff is 202/400 computable lines. Full `npm test` / `npm run quality` are BLOCKED by unchanged base file `scripts/pr-gates.test.mjs`: Vitest/Vite on Windows throws `SyntaxError: Invalid or unexpected token` with zero gate tests executed on Node 24 and available Node 22.13.1; the exact `--environment node` invocation also fails, so jsdom alone does not explain it. `node --check` and direct Node import pass; a lockfile-faithful `npm ci` did not change the result. This is not a composer failure.

- Limitations: Host must supply a real authorized submission port and record writability; server remains authoritative for patient/assignment/encounter checks and assigns author/time. Demo wiring and Figma comparison are PENDING; no production fixture fallback exists.

## DEV-CLIN-PORTAL-UI-003

- **HU / Issue / Base:** HU-CLN-001 · #3 · `a1441226734700161b5d64f3f0c6c800e1ef3525`; branch `chore/hu-cln-001-clinical-ui`.
- **Source mockup pages:** Attached images (Páginas 12, 29, 44).
- **Components actually modified:** `clinical-record.css`, `clinical-entry-composer.css`, and `ClinicalRecordEntries.tsx`.
- **Changes implemented:**
  - Adjusted `ClinicalRecordEntries` to use a timeline layout with teal circle markers (`::before` equivalent via `div.cr-entry__timeline-marker`).
  - Added a visually hidden `.cr-label` utility in CSS to ensure React tests and screen readers find "Fecha y hora", "Autor" y "Texto" without displaying them textually, matching the clean mockup look.
  - Aligned entry header with absolute teal dates and author badge (`#F3F4F6`).
  - Adjusted `ClinicalEntryComposer` buttons with `#0F766E`, hover `#115E59`, and error states with `#B42318`.
- **Visual verification:** Verified against the directly attached image mockups (Páginas 12, 29, 44). Confirmed that the design implements the timeline display without interfering with the global shell.
- **Accessibility checks:** Verified standard WCAG AA contrast for text and controls (#0F766E against #FFFFFF, #B42318 for errors). Form elements have accessible labels, visually hidden labels remain accessible for DOM queries.
- **Real browser test results:** NOT VERIFIED (Browser subagent initialization failed due to Playwright dependencies). Verification relies purely on direct image mockup inspection.
- **Test results:** Component tests (4 files, 32 tests) passed successfully (`npm test`). `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass clean. The `scripts/pr-gates.test.mjs` suite fails due to the known Windows Vitest `SyntaxError` issue.
- **TDD chronology:** Adapted DOM structure required modifying how tests interact with the component (visully hiding labels rather than removing them), preserving semantic checks. Added specific TDD presentation assertions for explicit UTC date formatting. Tests are GREEN.
- **Full diff count:** Total Git changes: 263 insertions, 72 deletions (335 lines total). Computable lines per `pr-gates lines`: 318/400 (excluding 17 lines in `.test.tsx`). PASS.
- **Figma comparison availability:** No direct Figma access used; relied on the provided image attachments.
- **Remaining integration limitations:** Integration with a real backend for entry submission remains pending.

## DEV-CLIN-PORTAL-WORKFLOW-004

- **HU / Issue / Base:** Clinical longitudinal record under HU-CLN-002; existing Clinical work remains tracked by issue #3. Branch `feat/clinical-record-workflow-04` from `origin/develop` `7ab2fe29a9a3b4b1827fa3f1cbd93c192ac30bea`.
- **Scope:** typed, UI-independent read orchestration only. It resolves the record ID from host patient context before requesting entries, maps forbidden and retryable error states, and prevents stale asynchronous completions from overwriting newer data.
- **Official contract:** `GET /api/v1/clinical-records?patientId=…` resolves ownership and `GET /api/v1/clinical-records/{id}/entries` reads entries. The composer request remains exactly `{ kind, text }`; no write integration was added.
- **Shared-client availability:** BLOCKED. `src/shell.d.ts` publishes only `__contractPending`; inspection found no real `dlc-front` client or session contract. There is no HTTP, URL, token, or fake persistence implementation.
- **Mockup references:** PDF pages 12, 29 and 44 reviewed; page 29 is the primary Clinical reference. Existing timeline/cards/composer were preserved. Page 29 also shows out-of-scope treatment, diagnosis and Billing regions, which this increment did not recreate.
- **Legacy references inspected:** `medical-record-list` and `medical-record-form` TypeScript/HTML only; their patient selection and refresh intent informed the orchestration but Angular services, auth, monetary fields and legacy APIs were not reused.
- **TDD chronology:** The original missing-module import failure ran before implementation but executed zero tests, so it is **NOT behavioral RED**. Genuine RED: the stale patient lookup test failed because `readEntries('record-a')` ran after patient B completed; the null-rejection test failed because `failure.code` threw `TypeError: Cannot read properties of null`. GREEN: added a post-lookup generation guard and safe unknown-error narrowing; focused suite passed 6/6. REFACTOR: extracted only the `isPortFailure` type guard and formatted. REGRESSION: added previously-loaded-to-forbidden, stale-rejection-after-newer-success, and empty-page cases. The first stale-rejection test setup caused an unhandled rejection before its read had started, so it was corrected with a microtask yield; focused suite passed 9/9 and the Clinical source suite passed 41/41. Final normalization RED: an object message `{ unexpected: true }` became `status.message` rather than the fallback. GREEN: `normalizePortFailure` now accepts `code` and `message` only when strings; focused suite passed 10/10 and source suite 42/42.
- **Validation:** `typecheck`, `lint`, `format:check`, `build`, `git diff --check`: PASS. Full `npm test`: BLOCKED by known Windows `scripts/pr-gates.test.mjs` `SyntaxError: Invalid or unexpected token`; 5 Clinical files / 42 tests passed separately. No quality-gate test was disabled.
- **Visual verification:** mockup PDF page 29 rendered and inspected. Existing responsive UI was not browser-captured in this increment; viewport screenshots are NOT VERIFIED. No global shell was added.
- **Limitations / next increment:** host must publish explicit patient context, session/authorization and Clinical client operations before UI wiring or writes. Next: inject this port from the published shell client and bind it to the route context, then implement confirmed-write/read-back only if the contract supports it.

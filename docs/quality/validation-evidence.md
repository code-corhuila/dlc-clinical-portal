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

## DEV-CLIN-PORTAL-PROMOTION-BRANCH-GATE-037

- **Decision (2026-10-09, project owner, option A):** keep `promotion/*` as the controlled exception for QA promotions. Norm 6.3.3 and dlc-docs `00-governance/git-conventions.md` name `qa/*`, but Git cannot create `refs/heads/qa/*` while the permanent `qa` branch exists (verified: "'refs/heads/qa' exists; cannot create 'refs/heads/qa/x'"). Previous promotions #7, #8, #12, #13, #15 and #17 already used `promotion/*`.
- **Branch:** `chore/clinical-promotion-branch-gate` from `origin/develop` `84becf5`.
- **Change:** the branch gate admits `promotion/` only into `qa`; the `qa/*` nomenclature conflict finding is kept unchanged.
- **Promotion audit (before this change):** all 32 code commits on `qa` carry `(cherry picked from commit …)` trailers whose sources exist in `develop`; the 6 merges on `qa` come from `promotion/*` PRs branched from `qa` (no develop→qa merge); `main` holds only the two seed commits. 43 develop commits remain to promote.
- **TDD:** genuine RED: `promotion/clinical-front-only` → `qa` was rejected with `BRANCH_UNKNOWN_PREFIX` (1 test); a target other than `qa` still fails.
- **Validation (Windows):** `npm test` 273 tests PASS; typecheck, lint, format, build, `git diff --check` and size gate PASS.

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

## DEV-CLIN-PORTAL-UI-BINDING-005

- **Branch / base:** `feat/clinical-record-ui-binding-05` from `2f35ad321914b5a85aaab8a0278cdfb28eacbc75`.
- **Scope:** React binding in `ClinicalPortalPage` for explicit `patientId`, role, authorization and `ClinicalRecordEntriesPort`; uses the existing Increment 04 workflow and passes its status to `ClinicalRecordEntries`.
- **Contract and integration:** uses the approved record-resolution and entries read operations through the injected typed port only. The shell client remains unpublished; no HTTP client, synthetic production data, or write port was added.
- **TDD:** genuine RED rendered the existing federation placeholder and failed to find the authorized injected entry. GREEN added the effect binding, render-time access gate, current-context status gate and retry counter; page test passed. REFACTOR used `useMemo` for the port-bound workflow after lint rejected render-time ref mutation. Final lifecycle RED: port replacement and authorization restoration both kept visible cached narrative; both assertions failed. GREEN binds cached views to a memoized context identity and effect cleanup suppresses late updates; page suite passed 5/5 and Clinical source suite 45/45. Security RED: switching an authorized Dentist to an authorized Administrator exposed the Dentist cache; context identity now includes role and explicit authorization. Page suite passed 7/7 and Clinical source suite 47/47. Additional direct patient-switch, revocation, unmount and retry tests passed unchanged as regression coverage (11/11 page tests).
- **Validation:** `typecheck`, `lint`, formatting, build and `git diff --check` PASS; size gate pending final measurement. Visual/browser verification and the known Windows full-suite failure remain pending/reportable. The in-memory interactive demo is deferred to Increment 06 to preserve the coherent lifecycle/security increment and size limit.

## DEV-CLIN-PORTAL-INTERACTIVE-DEMO-006

- **Branch / base:** `feat/clinical-interactive-demo-06` from `origin/develop` `c8d20d8f5e3fdc8150d1c9b5c17eb89ff759a4a6`.
- **Functional slice:** the dev-flagged demo provides isolated Patient A and B histories, Patient C denial, Consultation/Evolution submission, timeline refresh, role selection, and independent clinical read and write authorization controls. Normal mode renders only the federation placeholder; no HTTP client, API contract, database, or production persistence was added.
- **Hexagonal correction:** `application/recordClinicalEntry.ts` defines the typed `ClinicalEntryWritePort` and the UI-independent `RecordClinicalEntry` use case (write authorization, kind/narrative validation, record resolution, port call). The mutable in-memory adapter moved from `fixtures/` to `adapter/out/demo/demoClinicalAdapter.ts`; fixtures remain deterministic seed data only. `composition/ClinicalPortalComposition.tsx` constructs the adapter and use case; `ClinicalDemoPage` and `ClinicalPortalPage` receive them by props and import no concrete adapter. Write access no longer derives from read access, and Patient C is denied by the record boundary instead of a JSX identifier check. Author display names are injected instead of hard-coded in the reusable timeline component. An unknown record rejects with `NOT_FOUND` and a safe message, rendered through the existing error state.
- **TDD chronology:** genuine RED: use-case and adapter suites failed to resolve their modules; composition failed to find independent read/write controls (3 tests); the timeline hid `authorId` behind a hard-coded mapping and lacked injection (3 tests). Patient C, Secretary Assistant, demo switching/submission and placeholder tests passed before the change and are recorded as regression coverage. GREEN implemented the use case, adapter move, composition wiring, page props and author injection. REFACTOR split the demo composition into its own component after the production bundle still contained demo labels; afterwards `dist/` contains no synthetic strings.
- **Coverage and isolation:** use-case tests cover Dentist and Administrator writes, denial for missing write authorization, Secretary Assistant and missing role, invalid narrative, unsupported kind, and Patient C boundary denial without port writes. Adapter tests cover record isolation, append-only entries, instance isolation, Patient C read/write denial and unknown records. Composition tests cover read-without-write, read withdrawal, Patient C, Secretary Assistant, and Administrator without write. Existing lifecycle, retry and composer tests are preserved.
- **Validation:** focused Clinical suite: 8 files / 77 tests PASS. Typecheck, lint, format check, build, and `git diff --check` PASS. Full `npm test` and coverage retain the known Windows failure in `scripts/pr-gates.test.mjs` (`SyntaxError: Invalid or unexpected token`): 1 failed suite / 8 passed files / 77 passed tests; no gate or test was disabled. Final `pr-gates lines --base origin/develop --head WORKTREE` (untracked files included via `git add -N`, index restored): **380/400 computable lines**, with 5 excluded test files.
- **Visual evidence:** mockup pages 12, 29 and 44 (same screen) were rendered and compared with the dev demo in the in-app browser at 375, 1280 and 1440 px: no horizontal scroll, cards use the available width. Tablet (768 px) was not inspected. Page-29 fidelity is **NOT MET** and deferred: two-column layout, patient header (Patients-owned data), Evolución card with author badge and quick note, diagnoses, treatment plan/procedures and the read-only Billing estimate. Sidebar and top bar belong to `dlc-front` and are intentionally absent.

## DEV-CLIN-PORTAL-LAYOUT-007

- **Branch / base:** `feat/clinical-record-layout-07` from `origin/develop` `822d10e` (Increment 06 merged in #24).
- **Functional slice:** mockup page-29 workspace inside the Clinical portal: patient header, two-column record/composer grid collapsing to one column at 900 px, and a "Nueva entrada" action that focuses the narrative. The header shows only the Patients-owned `PatientForCare` projection (name, phone, id, status; no birth date or age) read through the application `ReadPatientForCare` query and a typed `PatientForCarePort`; the demo adapter implements it with synthetic data. Sidebar, top bar, breadcrumb and search belong to `dlc-front`. "Editar perfil" is omitted: profile editing is Patients-owned and no navigation contract is published.
- **Roles:** identity requires clinical read access (Dentist/Administrator with explicit authorization); Secretary Assistant and the unassigned Patient C see no identity and no authoring action; "Nueva entrada" requires write access, a writer and a ready record. Stale identity is hidden on patient or context change.
- **TDD chronology:** genuine RED: query module missing; page suite unresolved import; demo header and minimized-projection adapter tests failed. Patient C identity/action assertions passed before the change (regression). GREEN added model, query, adapter projection, `PatientHeader`, page wiring and composition. A label collision (`aria-label="Paciente"`) failed three composition tests and was renamed. Also fixes an Increment 06 regression: demo controls had lost their styles after the composition move.
- **Validation:** focused Clinical suite 9 files / 88 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError (88 tests pass). Browser check at 375, 768 (Secretary view), 1280 px: no horizontal scroll.
- **Not yet met:** Evolución card styling (author badge, quick note), diagnoses, treatment plan/procedures and the read-only Billing estimate.

## DEV-CLIN-PORTAL-DIAGNOSIS-008

- **Branch / base:** `feat/clinical-diagnosis-08` from `origin/develop` `777ffa0` (Increment 07 merged in #25).
- **Functional slice:** Dentist/authorized Administrator can record a DIAGNOSIS linked to an explicitly selected consultation of the current record (CLN-008, `clinical-service.yaml` request `oneOf`). The composer offers no default consultation; model and use case reject a diagnosis without `consultationId`; the demo adapter rejects a consultation from another record with `CONFLICT` and stores the identifier. The timeline labels the entry "Diagnóstico" and shows the linked consultation date. ANTECEDENT/ALLERGY remain unsupported. No "Diagnósticos activos" card: the contract defines no active/resolved diagnosis state.
- **TDD chronology:** genuine RED: use-case diagnosis append, adapter same-record link, composer explicit selection (2 tests), demo diagnosis flow, and timeline link rendering failed first. "Diagnosis without consultation" passed before the change (all DIAGNOSIS was unsupported) and is regression coverage; the unsupported-kind test now uses ALLERGY. GREEN extended the request model, use case, adapter, composer, page consultation options and timeline.
- **Validation:** focused Clinical suite 9 files / 95 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError (95 tests pass). Browser check at 1280 px: diagnosis linked to the Patient A consultation and rendered in the timeline.
- **Limitations:** the narrative field keeps its text after a successful submission (pre-existing composer behavior). Real owner API, closed-encounter rejection and `DiagnosisRecorded` emission are backend responsibilities not exercised here.

## DEV-CLIN-PORTAL-EVOLUTION-009

- **Branch / base:** `feat/clinical-evolution-card-09` from `origin/develop` `6177d2e` (Increment 08 merged in #26).
- **Functional slice:** mockup page-29 side column: the timeline card is titled "Evolución" and sits beside the main column; its footer carries a quick note ("Añadir nota rápida…" + "Enviar nota") that records an EVOLUTION entry through the same `RecordClinicalEntry` use case, rendered only with write access, a writer and a ready (or empty) record. The full composer stays in the main column and now clears its narrative after a successful submission (kept on failure). Mobile order: header, Evolución, composer. The mockup filter icon and attachment chip are omitted: no supporting behavior or contract.
- **TDD chronology:** genuine RED: demo quick-note flow and composer clearing failed first. "Keeps narrative on failure" and "hides quick note without write authorization" passed before the change (regression). One existing assertion was narrowed to the kind badge because the card title now also reads "Evolución".
- **Validation:** focused Clinical suite 9 files / 99 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError (99 tests pass). Browser (1280 px, DOM-measured because pane screenshots timed out): header full width, composer 795 px main column, Evolución 397 px side column; quick note appended and cleared. 375 px: single column, no horizontal scroll.

## DEV-CLIN-PORTAL-TREATMENT-PLAN-010A

- **Branch / base:** `feat/clinical-treatment-plan-10` from `origin/develop` `e55e1f8` (Increment 09 merged in #27).
- **Scope split:** the full treatment slice (read + plan) measured **516/400** computable lines, so it was split into two coherent PRs without touching the gate: 10a (this, read-only plan) and 10b (planning a treatment).
- **Functional slice:** "Plan de Tratamiento y Procedimientos" card in the page-29 main column above the composer, listing each procedure with its contract status (`PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) and the clinical reason or linked diagnosis. Types mirror the `Treatment` schema; read through the application `TreatmentPlan.list` query and a typed `TreatmentPort`. Procedure names come from a synthetic catalog of Billing codes injected by the demo composition: codes and names only, **no price, cost or total** (Billing-owned). The card is keyed by patient/role/permissions so a previous context's plan is never shown.
- **Roles:** clinical read access is required (Dentist/authorized Administrator); Secretary Assistant and the unassigned Patient C get no plan; without write permission the plan stays readable.
- **TDD chronology:** genuine RED: the application suite failed to resolve `treatmentPlan`; adapter listing and demo plan-card tests failed. Patient-switch and Secretary tests were added after the card existed and passed (regression). A browser DOM measurement found the plan and Evolución side by side below 900 px (responsive reset lost on specificity); fixed in CSS and re-measured.
- **Validation:** focused Clinical suite 10 files / 109 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser DOM measurement: 1280 px plan 795 px main column with Evolución beside; 768 and 375 px single column, no horizontal scroll.

## DEV-CLIN-PORTAL-PLAN-TREATMENT-010B

- **Branch / base:** `feat/clinical-plan-treatment-10b` from `origin/develop` `0c1420c` (Increment 10a merged in #28).
- **Functional slice:** the treatment plan card gains a planning form following `POST /treatments`: optional linked diagnosis (from the record's DIAGNOSIS entries) or a clinical reason (≤1000), and at least one procedure chosen from injected Billing catalog codes, each tied to the patient's EN_ATENCION appointment supplied by the host context (synthetic in the demo). `validateTreatmentDraft` (model) and `TreatmentPlan.plan` (application, write authorization) reject missing reason/diagnosis, no procedures, empty codes or a missing appointment before the port is called. The demo adapter stores the treatment as `PLANNED` with `PLANNED` procedures. No monetary input, field or output exists.
- **Roles:** the form requires clinical write access; Secretary Assistant and an Administrator without write permission are denied by the use case; without write permission the plan stays read-only (10a).
- **TDD chronology:** genuine RED: the planning tests were added first against the merged 10a code and 11 failed (missing `planTreatment`, form and validation). GREEN restored the planning implementation prepared before the 10a/10b split, keeping 10a's responsive and overflow fixes.
- **Validation:** focused Clinical suite 10 files / 120 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (1280 px): planned "Resina simple" for Patient A appeared as `Planificado` with its reason, the form reset, and no price text is rendered.

## DEV-CLIN-PORTAL-START-TREATMENT-011

- **Branch / base:** `feat/clinical-start-treatment-11` from `origin/develop` `15a217d` (Increment 10b merged in #29).
- **Traceability decision:** `POST /treatments/{id}/starts` declares `x-requirements: HU-CLN-001`; `POST /procedures/{id}/completions` declares `HU-CLN-002, HU-XCT-001` and carries materials/extras and a `CareClosure` 202 flow. Only starting a treatment is delivered here; procedure completion is deferred to those stories.
- **Functional slice:** an "Iniciar tratamiento" action on each `PLANNED` treatment, rendered only with clinical write access. `TreatmentPlan.start` (application) checks write authorization and the `PLANNED` state, then calls `TreatmentPort.startTreatment(id, expectedVersion)`. The demo adapter applies `PLANNED → IN_PROGRESS` once, increments the version and rejects stale versions or repeated starts with `CONFLICT` and unknown treatments with `NOT_FOUND`; the card shows the conflict message and reloads. The table now shows the treatment status and reason once per treatment (row span) with its procedures beneath.
- **TDD chronology:** genuine RED: 6 tests failed first (use case start, its two denials and the PLANNED guard; adapter start/stale/repeat/unknown; demo start flow). The read-only "no start button without write" assertion passed before the change (regression).
- **Validation:** focused Clinical suite 10 files / 126 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError (126 tests pass). Browser (1280 px, DOM): "Planificado" → "En curso" and the action disappears.

## DEV-CLIN-PORTAL-AMENDMENTS-012

- **Branch / base:** `feat/clinical-amendments-12` from `origin/develop` `0e66e8a` (Increment 11 merged in #30).
- **Functional slice:** "Corregir entrada" on each timeline entry (write access only) opens a correction form (`Texto corregido`, mandatory `Motivo de la corrección`). `AmendClinicalEntry` (application) checks write authorization and text/reason limits, then calls the typed `ClinicalEntryAmendPort.amendEntry(id, { text, reason, expectedVersion })` per `POST /clinical-entries/{id}/amendments`. The demo adapter appends a linked entry (`amendsEntryId`, `amendmentReason`, server-like author/time) and never changes the original; stale versions return `CONFLICT`. The timeline marks the original "Corregida" and shows the correction reason.
- **Closed encounter:** synthetic Patient D has a clinically closed encounter (closure itself belongs to HU-XCT-001); the demo adapter rejects new entries and amendments with `CONFLICT`, and the UI shows the reason. Forms now show only typed port-failure messages through `portFailureMessage`; technical errors keep the generic text (no internal details exposed).
- **TDD chronology:** genuine RED: the amendment use-case suite failed to resolve; adapter amendment and closed-encounter tests failed; demo amendment and closed-encounter flows failed. "No corrections without write authorization" passed before the change (regression). The existing composer test "shows submission failure without claiming success" caught that raw `Error` messages would leak, leading to `portFailureMessage` and its unit tests.
- **Validation:** focused Clinical suite 12 files / 142 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError (142 tests pass). Browser (1280 px, DOM): original preserved and marked, correction with reason appended; Patient D shows the closed-encounter message.

## DEV-CLIN-PORTAL-PROCEDURE-EXTRAS-013

- **Story:** HU-CLN-002 (code-corhuila/dlc-clinical-portal#4; global HU-16 code-corhuila/dlc-docs#61). Branch `feat/clinical-procedure-extras-13` from `origin/develop` `c0db3d2`.
- **Functional slice:** "Completar procedimiento" on non-completed procedures of an `IN_PROGRESS` treatment (write access only) opens a form to record materials used and additional clinical needs: category, contract type (`ADDITIONAL_MATERIAL`, `ADDITIONAL_PROCEDURE`, `COMPLEXITY_ADJUSTMENT`, `OTHER_AUTHORIZED_CHARGE`), optional code, exact positive decimal quantity (contract pattern, ≤4 decimals), description and mandatory clinical justification (CLN-008). `CompleteProcedure` (application) checks write authorization, validates every extra (`validateExtraItem`), assigns a unique `sourceRecordId` per extra through a composition-injected generator, and calls the typed `ProcedureCompletionPort` with `expectedVersion`, `materialsUsed` and `additionalRequirements` per `POST /procedures/{id}/completions`. **No price, amount or currency exists in the request, model or UI** (CLN-006): prices are entered through Billing. The demo adapter marks the procedure `COMPLETED`, bumps the treatment version, rejects non-started, stale or repeated completions with `CONFLICT`, and returns a `CLOSURE_PENDING` `CareClosure` (appointment and billing outcomes `PENDING`); the card states that Appointments and Billing must confirm.
- **TDD chronology:** genuine RED: the use-case suite failed to resolve; adapter completion and two demo flows (complete with justified extra; reject extra without justification) failed. GREEN added model, use case, adapter, form and wiring. REFACTOR replaced four repeated label/input blocks with a field list after the size gate measured 414/400; an unused closure registry and two cosmetic CSS rules were removed. No behavior was dropped.
- **Validation:** focused Clinical suite 13 files / 154 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError (154 tests pass). Browser (1280 px, DOM): procedure "Completado", closure-pending notice, no money text.

## DEV-CLIN-PORTAL-BILLING-HANDOFF-014

- **Story:** HU-CLN-002 (code-corhuila/dlc-clinical-portal#4). Branch `feat/clinical-billing-handoff-14` from `origin/develop` `207729f` (Increment 13 merged in #32).
- **Contract findings:** `GET /care-closures/{id}` and its retries declare `x-requirements: HU-XCT-001`, so closure follow-up belongs to that story. `navigation-map.md` documents no route for manual-charge entry, and no navigation contract carries an extra's context into Billing. By owner decision, Clinical shows a pending-pricing list instead of a navigation button (no decorative control, no invented route).
- **Functional slice:** `CompleteProcedure` now returns the recorded extras with their `sourceRecordId` alongside the `CareClosure`. After completion, the plan card shows "Extras pendientes de precio en Facturación": description, type, quantity, procedure, appointment and reference per extra, stating that prices are entered in Billing and Clinical stores no amounts (CLN-006, BIL-008).
- **TDD chronology:** genuine RED: the use-case result shape and the demo pending-list flow failed first. "No list without extras" passed before the change (regression).
- **Validation:** focused Clinical suite 13 files / 156 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (375 px, DOM): list rendered with the generated reference, no horizontal scroll.
- **Limitation:** the actual price entry happens in Billing's authorized UI once a route/handoff contract is specified and integrated.

## DEV-CLIN-PORTAL-CARE-COMPLETION-015

- **Story:** HU-XCT-001 (code-corhuila/dlc-clinical-portal#6). Branch `feat/clinical-care-completion-15` from `origin/develop` `87b366c` (HU-CLN-002 Increment 14 merged in #33).
- **Functional slice:** "Cierre de la atención clínica" card in the main column. Per `POST /clinical-records/{id}/care-completions` (`x-roles: DENTIST` only), only the assigned Dentist with clinical write access can declare; Administrator and Secretary Assistant see "Solo el odontólogo asignado declara el cierre clínico." The Dentist must explicitly choose the encounter consultation (no inference). `DeclareCareCompletion` (application) checks role and write authorization, requires `consultationId` and the host-supplied `appointmentId`, resolves the record and its current version (`readRecordVersion`, mirroring `ClinicalRecord.version`) and calls the typed `CareCompletionPort` with `expectedVersion`. The card then states the declaration time and procedure count and that **administrative finalization remains pending in Appointments** (authorized staff); Clinical writes no appointment state or money.
- **Late-write rejection:** the demo adapter now keeps the closed-encounter set and record versions per instance; every write bumps the version; a declaration closes the encounter, after which entries and amendments are rejected (Increment 12 path) and a second declaration conflicts. Consultation options now show date and a short excerpt instead of the whole narrative.
- **TDD chronology:** genuine RED: the use-case suite failed to resolve; adapter declaration/versioning (2) and demo flows (declare then reject late entry; require consultation; administrator cannot declare) failed. GREEN added model, use case, adapter, card and wiring; 17 existing demo tests then failed because the consultation narrative also appeared as a select option, fixed by the shorter option label.
- **Validation:** focused Clinical suite 14 files / 167 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (1280 px, DOM): administrator note, Dentist declaration with pending administrative finalization.
- **Limitations:** there is no read contract for an existing declaration, so the declared state is shown for the current session only; cross-owner serialization (care-completion.md) is a backend gate.

## DEV-CLIN-PORTAL-CARE-CLOSURE-016

- **Story:** HU-XCT-001 (code-corhuila/dlc-clinical-portal#6). Branch `feat/clinical-care-closure-16` from `origin/develop` `7a0541c` (Increment 15 merged in #34).
- **Functional slice:** "Seguimiento del cierre" panel on the treatment plan card lists the `CareClosure` of each procedure completed in the session with its status (pending / completed / failed), the Appointments and Billing outcomes and the failure reason. "Actualizar estado" reads `GET /care-closures/{id}`; on `CLOSURE_FAILED`, users with clinical write access can enter a mandatory reason and "Reintentar cierre" (`POST /care-closures/{id}/retries`, `reason` + `expectedVersion`). `CareClosureTracking` (application) checks clinical read access for reads and write access for retries, rejects retries of completed closures or without reason, and uses the typed `CareClosurePort`. Completion is never shown before both outcomes complete.
- **Deterministic demo convergence:** a procedure without additional needs converges to `CLOSURE_COMPLETED` (both outcomes completed); one with unpriced additional needs fails with "Facturación requiere el precio manual de los extras." until a justified retry, which returns it to pending and then completed. Stale retries conflict; unknown closures are `NOT_FOUND`.
- **TDD chronology:** genuine RED: the tracking use-case suite failed to resolve; adapter convergence/failure+retry (2) and demo follow/retry flows (2) failed. An Increment 14 assertion became ambiguous ("Cierre pendiente" now appears in the notice and the panel) and was narrowed to the notice text.
- **Validation:** focused Clinical suite 15 files / 177 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (1280 px, DOM): pending → failed with reason → pending after retry → completed.
- **Limitation:** closures are tracked for procedures completed in the current session; listing closures of earlier sessions needs a query contract not yet published.

## DEV-CLIN-PORTAL-MOCKUP-FIDELITY-017

- **Stories:** HU-CLN-001 (code-corhuila/dlc-clinical-portal#3) presentation; branch `feat/clinical-mockup-fidelity-17` from `origin/develop` `753a2f6` (Increment 16 merged in #35).
- **Visual review basis:** real 1280 px screenshots compared with mockup page 29 identified: missing diagnoses card, an always-open planning form cluttering the plan, non-uniform card titles, and an overlong main column.
- **Changes:** "Diagnósticos" card in the side column lists recorded DIAGNOSIS entries with their linked consultation date (no invented active/resolved state; hidden without clinical read access). The planning form opens with "Planificar nuevo tratamiento" and closes on success or "Cancelar". The workspace now uses real columns: main (plan, new entry) and aside (diagnoses, Evolución, closure), replacing grid-row placement rules. Card titles share one size and weight.
- **TDD chronology:** genuine RED: 5 tests failed first (two planning flows that now open the form, the closed-form test, diagnoses card listing and Secretary hiding). Title and column CSS is visual-only and has no RED.
- **Validation:** focused Clinical suite 15 files / 180 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser: screenshot at 1280 px; DOM measurement shows the aside aligned with the header (right edge 1233 px) and no horizontal scroll at 768 and 375 px.
- **Size note:** most of the page diff is re-indentation from wrapping existing blocks in the new columns.
- **Remaining intentional deviations from page 29:** no cost column/total (Billing), no age (not in `PatientForCare`), no "Editar perfil" (Patients route undocumented), no filter icon/attachment chip (no behavior or contract), no "Imprimir plan" (not requested), sidebar/top bar owned by `dlc-front`.

## DEV-CLIN-PORTAL-BILLING-ESTIMATE-018

- **Stories:** HU-CLN-001 presentation of the plan (code-corhuila/dlc-clinical-portal#3). Branch `feat/clinical-billing-estimate-18` from `origin/develop` `89ff726` (Increment 17 merged in #36).
- **Basis:** wireframe page 29 documents a "Read-only Billing estimate"; Billing exposes `GET /procedure-prices` (`x-roles` includes DENTIST) returning `name`, `basePrice` (`Money`: exact COP decimal string, NUMERIC(14,2)) and `currency: COP`. No `dlc-docs` change was needed.
- **Functional slice:** the treatment plan shows a "Costo (COP)" column and "Total estimado" formatted for `es-CO`, labelled "Valores de solo lectura de Facturación". `BillingEstimate` (application) requires clinical read access and returns active catalog prices through the typed `ProcedurePricePort`; the demo adapter supplies synthetic COP prices. `copMoney` validates the `Money` pattern and sums in integer cents; formatting appends the cents as text, so no floating-point arithmetic touches money. Clinical stores, edits and sends no amount (CLN-006): there is no money input, field in any request, or persisted price.
- **TDD chronology:** genuine RED: money and estimate suites failed to resolve; the demo estimate test failed. Three earlier assertions that encoded "no amount is ever shown" were replaced by the still-valid rule "Clinical has no money input" (decision change documented here, grounded on the wireframe).
- **Validation:** focused Clinical suite 17 files / 187 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings or prices. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (1280 px, DOM): `$ 180.000,00` per procedure and total, no money inputs.

## DEV-CLIN-PORTAL-DASHBOARD-019A

- **Story:** HU-CLN-003 (code-corhuila/dlc-clinical-portal#5). Branch `feat/clinical-dashboard-19` from `origin/develop` `e2e3c8f` (Increment 18 merged in #37).
- **Product decision (recorded):** `dlc-docs` is not modified. HU-CLN-003 indicators remain "Pending decision" there; the project owner decided to deliver the dashboard of Figma `88:1998` with synthetic data, prepared for integration. Grounding: ADR-006 (Clinical owns the Analytics dashboard; minimized Appointments/Billing facts), `navigation-map.md` access matrix, wireframe ("confidential revenue is hidden unless permission allows it"; textual chart alternative).
- **Functional slice:** `ClinicalDashboardPage` ("Panel") shows KPI cards (Citas de hoy with change vs yesterday, Pacientes pendientes, Ingresos del mes in COP), weekly activity as a text list (the chart's textual alternative) and Próximas citas, with loading, safe error and stale-data states and the `asOf` time. `ReadDashboard` (application) maps roles to scopes — Administrator CLINIC (with revenue), Dentist PROFESSIONAL (own scope), Secretary Assistant ADMINISTRATIVE — removes revenue for non-administrators, denies a missing role, and flags data older than 15 minutes as stale with an injected clock. `DashboardSnapshotPort` is the integration seam; the demo adapter returns synthetic snapshots (COP `Money` strings). Results are keyed by role/staff so a previous role's revenue is never shown during reload.
- **Scope split:** the full slice measured 461/400 (mostly demo-page re-indentation); 19b adds the demo "Vista" selector, composition wiring, the bar chart and the federated `./ClinicalDashboard` expose.
- **TDD chronology:** genuine RED: the use-case suite failed to resolve; the adapter snapshot test and three demo dashboard flows failed. GREEN added model, use case, adapter and page; a lint error (synchronous setState in an effect) was fixed by keying results to the viewer context. The demo flows move to 19b; page-level tests cover the same behavior here.
- **Validation:** focused Clinical suite 19 files / 199 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser screenshot (1280 px, administrator) taken before the split.

## DEV-CLIN-PORTAL-DASHBOARD-019B

- **Story:** HU-CLN-003 (code-corhuila/dlc-clinical-portal#5). Branch `feat/clinical-dashboard-demo-19b` from `origin/develop` `f212881` (Increment 19a merged in #38). Same recorded product decision as 019A (no `dlc-docs` change).
- **Functional slice:** the demo bar gains a "Vista" selector (Historia clínica / Dashboard); the dashboard follows the selected role with synthetic signed-in staff (the dlc-front session supplies them in production). "Actividad semanal" now draws a bar chart (`role="img"` with a full textual label) and keeps the day list as the wireframe's textual alternative. A new federated entry `./ClinicalDashboard` (`vite.config.ts` expose) lets `dlc-front` mount the dashboard at `/app/dashboard`; outside the dev demo it renders only a "requires the shared session supplied by dlc-front" placeholder and no synthetic data.
- **TDD chronology:** genuine RED: the federated entry suite failed to resolve; the chart test and the three demo dashboard flows (restored from the 19a split) failed. GREEN restored the demo wiring from the 19a backup, added the chart, the entry and the expose.
- **Validation:** focused Clinical suite 20 files / 205 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; the build emits `remoteEntry.js` with a `ClinicalDashboard` chunk and contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser screenshot (1280 px, administrator): KPI cards, bar chart with text alternative, upcoming appointments, full width, no horizontal scroll. The long-running dev server needed a restart with `--force` after the `vite.config.ts` change (stale dependency cache, not a code defect).

## DEV-CLIN-PORTAL-RECORD-DIALOGS-020A

- **Story:** HU-CLN-001 presentation (code-corhuila/dlc-clinical-portal#3), mockup page 29. Branch `feat/clinical-record-dialogs-20` from `origin/develop` `48e30f7` (dashboard 19b merged in #39).
- **Functional slice:** the header "Nueva entrada" opens the full composer in an accessible modal (`role="dialog"`, `aria-modal`, named "Nueva entrada clínica", "Cerrar" and Escape close it, focus moves to the narrative) and closes after a successful save; the main column now shows only the plan, as in the mockup. The plan footer holds "Planificar nuevo tratamiento", "Imprimir plan" (browser print with a print stylesheet hiding demo controls, side column and actions) and, for a write-authorized Dentist only, "Declarar atención completada", which opens the care-completion card in a dialog. Writing is now denied by the absence of the "Nueva entrada" action rather than an "Acceso no autorizado" card; Administrator still cannot declare (no footer action).
- **TDD chronology:** genuine RED: 5 tests failed first (dialog open/close-after-save, close without saving, print, and two declaration flows opened from the footer). Existing tests were adapted without changing intent: an `openComposer()` helper opens the dialog; "Acceso no autorizado" assertions became "no Nueva entrada action"; text lookups target `.cr-entry__text` because React mirrors textarea values into `textContent` and the diagnosis text now also appears in the diagnoses card.
- **Validation:** focused Clinical suite 20 files / 208 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (1280 px): screenshot of the plan-only main column with footer actions; dialog opens with narrative focus and closes on Escape.

## DEV-CLIN-PORTAL-PLAN-CHECKBOX-FILTER-020B

- **Story:** HU-CLN-001 presentation (code-corhuila/dlc-clinical-portal#3), mockup page 29. Branch `feat/clinical-plan-checkbox-filter-20b` from `origin/develop` `9841c38` (20a merged in #40).
- **Functional slice:** the plan table gains the mockup's first checkbox column, replacing the "Completar procedimiento" button: checked and disabled when the procedure is completed; enabled only on an `IN_PROGRESS` treatment with write access, where checking it opens the completion form; disabled otherwise. The Evolución card header gains "Filtrar evolución" (Todas, Consulta, Diagnóstico, Evolución), a client-side filter needing no contract; diagnosis-to-consultation links still resolve against the full timeline.
- **TDD chronology:** genuine RED: 7 tests failed first (six completion flows now driven by the checkbox, and the filter). Lookups were narrowed where the UI added same-named elements: the kind badge (`.cr-entry__kind`) versus filter options, and `/^Limpieza profunda/` versus the checkbox cell named "Completar Limpieza profunda".
- **Validation:** focused Clinical suite 20 files / 209 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError. Browser (1280 px, DOM + screenshot): checkbox disabled before start, enabled in progress, opens the form, checked and disabled after completion; filter present.
- **Observation:** the closure notice and follow-up panel render above the table; ordering them below is a pending cosmetic adjustment.

## DEV-CLIN-PORTAL-PLAN-NOTICE-ORDER-021

- **Story:** HU-CLN-001 presentation (code-corhuila/dlc-clinical-portal#3). Branch `fix/clinical-plan-notice-order` from `origin/develop` `cc01175` (20b merged in #41).
- **Change:** the closure notice, the closure follow-up panel and the extras pending pricing now render below the plan table and total, matching mockup page 29's reading order. No behavior change.
- **TDD:** genuine RED: a DOM-order test (`compareDocumentPosition`) failed while those blocks rendered above the table; GREEN moved the block.
- **Validation:** focused Clinical suite 20 files / 210 tests PASS; typecheck, lint, format, build and `git diff --check` PASS. Windows `npm test` keeps the known `scripts/pr-gates.test.mjs` SyntaxError.

## DEV-CLIN-PORTAL-README-STATUS-022

- **Branch / base:** `chore/clinical-readme-status` from `origin/develop` `6d3d3ec`.
- **Change (documentation only, DoD "Service README updated when the public interface or behavior changes"):** replaces the outdated "Foundation status" and coverage text with the current status (four HUs implemented on synthetic data, not integrated, none Done), the federated exposes (`./ClinicalPortal`, `./ClinicalDashboard`), demo usage and synthetic patients, the hexagonal ports to implement at integration with their owner contracts, enforced rules and known limitations.
- **Verification of facts stated:** coverage ~95% of statements measured locally on `src/clinical`; sibling repositories checked read-only on GitHub: `dlc-front` `develop` contains only empty scaffolding (no shared client, session or mount), `dlc-clinical-api` `develop` contains no source. No code changed, so no TDD cycle applies.

## DEV-CLIN-PORTAL-WINDOWS-GATE-EOL-023

- **Branch / base:** `fix/windows-gate-line-endings` from `origin/develop` `6d3d3ec`.
- **Root cause (reproduced):** with `core.autocrlf=true`, Windows checks out `scripts/pr-gates.mjs` with CRLF; its first line is a shebang, and `#!/usr/bin/env node\r` makes the Vitest transform fail with `SyntaxError: Invalid or unexpected token`. Probes on LF copies: converting only `pr-gates.mjs` to LF makes all 28 gate tests pass.
- **Fix:** `.gitattributes` with `*.mjs text eol=lf`, so every checkout keeps LF for Node ESM scripts. The validator logic and its tests are unchanged (no content diff in `scripts/`; the repository already stored them as LF).
- **TDD:** RED was the existing failing `npm test`/coverage on Windows (`scripts/pr-gates.test.mjs` SyntaxError). GREEN after the attribute and working-copy normalization.
- **Validation (Windows):** `npm test` 21 files / 238 tests PASS (210 Clinical + 28 gate); `npm run test:coverage` PASS, ~95% statements on `src/clinical`; typecheck, lint, format and build PASS. The "known Windows failure" noted in earlier evidence records is resolved from this revision on.

## DEV-CLIN-PORTAL-IDEMPOTENCY-ENTRIES-024

- **Story:** HU-CLN-001 (code-corhuila/dlc-clinical-portal#3); integration readiness (technical debt 1). Branch `feat/clinical-idempotency-pagination` from `origin/develop` `8dac081`.
- **Basis:** every Clinical write in `clinical-service.yaml` declares the `IdempotencyKey` parameter; Annex H requires "`Idempotency-Key` por intención, reutilizada al reintentar".
- **Change (part A1: entries):** `RecordClinicalEntry` and `AmendClinicalEntry` require an idempotency key in their context and pass it to `ClinicalEntryWritePort.appendEntry` / `ClinicalEntryAmendPort.amendEntry`, where a real adapter maps it to the header. `useIntentKey` keeps one key per user intent in the composer, quick note and amendment form, reuses it when the same submission is retried after a failure and renews it only after success. The demo adapter applies a repeated key once. Remaining writes (treatments, completion, declaration, closure retry) follow in A2; pagination in B.
- **TDD chronology:** genuine RED: 13 tests failed first (use-case key propagation and missing-key rejection, adapter replay, composer retry-reuse/renew, page propagation). Existing expectations gained the key argument; adapter tests now pass a key on every call because the port requires it.
- **Validation (Windows):** `npm test` 21 files / 242 tests PASS; typecheck, lint, format, build and `git diff --check` PASS; production bundle contains no synthetic strings. Browser: a quick note is stored once.

## DEV-CLIN-PORTAL-FEDERATED-DEMO-BUILD-025

- **Decision (2026-10-09, project owner):** the delivery is front-only — `dlc-front` with the micro-frontends integrated and working on test data, without API, database or infrastructure. Synthetic data is enabled by an explicit demo build; the demo selector stays visible to show role views.
- **Branch / base:** `feat/clinical-federated-demo-build` from `origin/develop` `6f00bdf`.
- **Changes:** (1) `isClinicalDemo()` enables synthetic adapters only when `VITE_CLINICAL_DEMO=true` and either local development or `MODE === 'demo'`; `npm run build:demo` (`--mode demo`, `.env.demo`) builds the delivery remote, while `npm run build` stays free of synthetic data. (2) Portal styles moved from `src/styles.css` to `src/clinical/clinical-portal.css` (git rename), imported by the composition so they ship with both exposed modules; the global `:root`/`body` rules moved to an inline `<style>` in the standalone `index.html` so they never reach the shell. (3) `vite.config.ts` uses a relative `base` and `bundleAllCSS: true`. (4) README documents how `dlc-front` consumes the remote.
- **Mount verification (probe host outside the repository):** a minimal Module Federation host on port 4180 consumed the `build:demo` remote served on 4174, like `dlc-front` will. Findings fixed during the probe: without `bundleAllCSS` no portal CSS reached the host; with absolute asset URLs the CSS was requested from the host origin (SPA fallback returned HTML). After the fixes, CSS and chunks load from the remote origin; the clinical record (plan with COP estimate, diagnoses, Evolución, filter, dialogs) and the dashboard (KPIs, 7-bar chart) render styled and work; the host's own font stays intact.
- **TDD:** genuine RED: demo-build tests for the portal and dashboard failed while the gate required `DEV`; "normal production build stays free of synthetic data" passed before and after (regression). Styling/federation configuration was verified through builds and the probe host (no unit RED).
- **Validation (Windows):** focused Clinical suite 217 tests PASS; `npm test` PASS; typecheck, lint, format, `npm run build` (no synthetic strings) and `npm run build:demo` PASS.

## DEV-CLIN-PORTAL-MOCKUP-POLISH-026

- **Story:** HU-CLN-001 presentation (code-corhuila/dlc-clinical-portal#3), mockup page 29, front-only delivery. Branch `feat/clinical-mockup-polish-26` from `origin/develop` `c1fdab1`.
- **Changes (no invented data):** decorative inline SVG icons (`aria-hidden`) in the plan, diagnoses and Evolución titles and in the patient header (phone, ID, "Nueva entrada"); the plan header shows "Estado: …" for the treatment in progress, else the next planned one; diagnoses show an alert icon and "Detectado: <recorded date>" with the linked consultation; the new-entry button uses the mockup's light style; a timeline connector joins Evolución entries.
- **Still different by contract/domain:** patient age, photo and readable ID (Patients), per-procedure notes, diagnosis active/monitoring state, attachments and "Guardar registro".
- **TDD:** genuine RED for the plan status header and the detection date (2 tests); icons and CSS are visual-only.
- **Validation (Windows):** focused Clinical suite 219 tests PASS; `npm test` PASS; typecheck, lint, format and `npm run build` (no synthetic strings) PASS. Browser screenshot at 1400 px compared with mockup page 29.

## DEV-CLIN-PORTAL-SHELL-MOUNT-PROPS-027

- **Stories:** HU-CLN-001 and HU-CLN-003 (code-corhuila/dlc-clinical-portal#3, #5); front-only integration with `dlc-front`. Branch `feat/clinical-mount-props-27` from `origin/develop` `4ef827c`.
- **Change:** both federated entries accept `ClinicalShellContext` (`patientId`, `role`, `staffId`, `staffName`), the remote's public mount interface. In the demo build the context sets the initial patient/role (clinical record) and the viewer (dashboard); a change of `patientId` or `role` from the shell remounts the demo so no data from the previous context remains. The README documents the props, their source in the shell and the demo patient ids.
- **TDD:** genuine RED: the clinical record ignored the shell patient/role and the dashboard ignored the shell role/staff name (2 tests).
- **Mount verification:** the probe Module Federation host passed `patientId="patient-b"`, `role="ADMINISTRATOR"` to `./ClinicalPortal` and `role="DENTIST"`, `staffName="Dra. Valentina Ruiz"` to `./ClinicalDashboard` against the `build:demo` remote: patient B as Administrator, and a Dentist dashboard (own 5 appointments, no revenue, personal greeting), styled.
- **Validation (Windows):** focused Clinical suite 221 tests PASS; `npm test` PASS; typecheck, lint, format and `npm run build` (no synthetic strings) PASS.

## DEV-CLIN-PORTAL-DASHBOARD-FIDELITY-028

- **Story:** HU-CLN-003 presentation (code-corhuila/dlc-clinical-portal#5), Figma 88:1998. Branch `feat/clinical-dashboard-fidelity-28` from `origin/develop` `9a5fa27`.
- **Changes (no invented data):** KPI cards with uppercase labels, an icon box and a teal trend line; monthly revenue shown compactly in COP (`$14,5 M`, `formatCopCompact`, display only) with the exact amount kept for screen readers; gray weekly bars with the busiest day highlighted and its count above, the textual alternative visually hidden but accessible; upcoming rows with borders, toned initials avatars, the next time in teal and "Urgente" in red with an alert icon.
- **Not included (no contract):** the mockup's "This Week" range selector and "View All Appointments" link.
- **TDD:** genuine RED for the compact COP format, the compact revenue card with the accessible exact amount, and the peak-day marker (3 tests).
- **Validation (Windows):** `npm test` 252 tests PASS; typecheck, lint, format and `npm run build` (no synthetic strings) PASS; size gate PASS. Browser screenshot at 1280 px compared with the mockup.

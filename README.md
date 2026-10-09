# dlc-clinical-portal

> Clinical bounded context: remote web UI.

This repository contains the **Di Lucca Clinical** frontend. It gives authorized clinical users a
safe interface for clinical histories, consultations, diagnoses, treatments, procedures and their
evolution through the Clinical API.

## Scope

The portal is a presentation client. It does not own user identity, tokens, sessions, patient
administrative records, appointment scheduling, billing/money or Clinical persistence. The
shared HTTP client, token and session handling belong to `dlc-front`; Clinical consumes that
platform capability instead of duplicating it.

## Technical baseline

- React 19 with the established workspace tooling.
- Node.js 22 for local development and CI.
- API use follows the versioned Clinical OpenAPI contract.
- UI state is display state only; clinical writes remain idempotent at the API boundary.

## Local setup

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

The standalone development server publishes this remote at `http://localhost:4173`.
It is useful for compilation and UI work only. Production-like integration requires the
`dlc-front` container to load `remoteEntry.js`, provide `shell/apiClient`, and own the
Gateway URL, authentication session, token lifecycle, correlation header, timeout and
error mapping. This repository must not recreate those capabilities.

```powershell
npm run typecheck
npm run build
docker compose -f deploy/compose.yml up --build
```

`remoteEntry.js` is deliberately sent with `Cache-Control: no-store` because it selects
the version of the remote that the browser loads.

## Quality workflow

Node.js 22 is the supported runtime for local development and CI. Vitest together with React
Testing Library provides the current test harness.

| Command | Validates |
| --- | --- |
| `npm run typecheck` | TypeScript project references and types. |
| `npm run lint` | TypeScript/React static checks through ESLint. |
| `npm run format:check` | Prettier formatting for Clinical portal source files and supported project configuration files. |
| `npm test` | The Vitest regression suite. |
| `npm run test:coverage` | The Vitest regression suite with V8 coverage reporting. |
| `npm run build` | Type checking followed by the Vite production build. |
| `npm run quality` | Typecheck, lint, formatting, tests, coverage and build in that order. |

Coverage measures all of `src/clinical` (model, application use cases, UI and demo adapters)
and excludes test harness files; at `develop` `6d3d3ec` it reports about 95% of statements. No
threshold is configured yet: the figure comes from synthetic-demo behavior, and the baseline
should be fixed once real owner integration exists.

The format check covers `src/**/*.{ts,tsx,css}`, root `*.{js,ts,json,html}` project files,
`.prettierrc.json` and `.github/workflows/*.{yml,yaml}`. `package-lock.json` remains excluded
because it is generated dependency metadata. This is a controlled Quality scope, not a claim
that every repository file is governed by Prettier.

Functional user stories must follow real chronological test-first development:

```
RED → GREEN → REFACTOR → REGRESSION
```

Do not add fictitious tests solely to increase coverage. The first Clinical behaviors will
establish their own test-first evidence and coverage baseline.

## Current status

The frontend of HU-CLN-001, HU-CLN-002, HU-XCT-001 and HU-CLN-003 is implemented against
**synthetic in-memory data** (issues #3–#6 hold the DoD evidence matrices). It is **not integrated**
with the Clinical API, Patients, Billing or `dlc-front`, and **no user story is Done**: each still
needs the real owner contracts, removal of the mock from the integrated path and a reviewed DoD.

The `shell/apiClient` operations and the session/role contract remain unpublished by `dlc-front`;
its TypeScript type stays an intentionally empty boundary that this repository must not extend.
Do not call databases or bypass `dlc-api-gateway` and the authorization boundary from the browser.

### Federated modules (public interface)

| Expose | Intended mount in `dlc-front` | Outside the dev demo |
|---|---|---|
| `./ClinicalPortal` | Patient clinical record (`/app/patients/:patientId`) | Placeholder until the shell supplies client and session |
| `./ClinicalDashboard` | `/app/dashboard` (Clinical Analytics, ADR-006) | Placeholder: "requires the shared session supplied by dlc-front" |

### Synthetic demo

Development only; it is never part of a production build.

```powershell
$env:VITE_CLINICAL_DEMO = 'true'; npm run dev
```

In CMD: `set "VITE_CLINICAL_DEMO=true" && npm run dev`. The demo bar selects the view (clinical
record or dashboard), patient, role and independent read/write clinical authorization:

| Synthetic patient | Purpose |
|---|---|
| A, B | Independent histories with treatment plan and evolution |
| C | Unassigned: every clinical read and write is denied |
| D | Clinically closed encounter: new entries and amendments are rejected |

### Architecture

Hexagonal: `adapter/in/ui` (React) → `application` use cases → typed ports in `application`,
implemented by `adapter/out/demo`; `model` holds pure rules; `composition` wires concrete adapters.
Integration replaces the demo adapter with real adapters for these ports, through the shell client:

| Port | Owner contract |
|---|---|
| `ClinicalRecordEntriesPort`, `ClinicalEntryWritePort`, `ClinicalEntryAmendPort` | Clinical: `/clinical-records`, `/entries`, `/clinical-entries/{id}/amendments` |
| `TreatmentPort`, `ProcedureCompletionPort` | Clinical: `/treatments`, `/treatments/{id}/starts`, `/procedures/{id}/completions` |
| `CareCompletionPort`, `CareClosurePort` | Clinical: `/clinical-records/{id}/care-completions`, `/care-closures/{id}` (+ `/retries`) |
| `PatientForCarePort` | Patients: `GET /patients/{id}` (`PatientForCare` projection) |
| `ProcedurePricePort` | Billing: `GET /procedure-prices` (read-only COP estimate) |
| `DashboardSnapshotPort` | Clinical analytics read contract (pending in `dlc-docs`) |

Rules enforced in the application layer: clinical read and write authorization are independent;
the Secretary Assistant gets no clinical data; only the Dentist declares care completion; Clinical
never stores, edits or sends money (CLN-006) — COP amounts are exact decimal strings shown read-only.

### Known limitations

- Documentation gaps: no Billing manual-charge route/handoff contract, no query contract for earlier
  care-completion declarations or closures, and HU-CLN-003 indicators pending refinement.

## Documentation

The authoritative specifications and governance live in
[`dlc-docs`](https://github.com/code-corhuila/dlc-docs). Read the Clinical scope, frontend and
integration rules, and repository/PR regulations before implementing a flow.

## Quality and validation documentation

- `docs/quality/testing-strategy.md` — testing and validation strategy.
- `docs/quality/validation-evidence.md` — persistent validation evidence registry.

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/... hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` approval is enforced through the repository's `CODEOWNERS`. Review rules for `develop`
and `qa` are defined by the team according to the course regulation.

Every Pull Request declares the affected user story (or why it is not applicable), stays within
the permitted diff size and targets the correct permanent branch.

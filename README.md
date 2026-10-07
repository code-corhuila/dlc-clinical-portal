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

Coverage is currently restricted to `src/clinical` and excludes test harness files. It measures
three structural Clinical source files — `ClinicalPortal.tsx`, `ClinicalPortalComposition.tsx`
and `ClinicalPortalPage.tsx` — rather than complete functional or domain coverage. No arbitrary
coverage threshold is configured yet because there is no Clinical domain or application behavior
from which to establish a meaningful business baseline.

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

## Foundation status

This branch establishes the portal foundation only: runtime, build, remote exposure, the
documented `shell/apiClient` boundary, and containerized static delivery. It does not implement
a Clinical user story, authentication, session handling, HTTP calls, Clinical forms, Analytics,
or API integration. The exact `shell/apiClient` operations and any session/role contract remain
a documentation gap until `dlc-front` publishes them. Its TypeScript type is an intentionally
empty, compile-time boundary; this repository must not infer or implement the missing client
contract or expand it unilaterally.

Do not call databases or bypass `dlc-api-gateway` and the authorization boundary from the browser.

## Documentation

The authoritative specifications and governance live in
[`dlc-docs`](https://github.com/code-corhuila/dlc-docs). Read the Clinical scope, frontend and
integration rules, and repository/PR regulations before implementing a flow.

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

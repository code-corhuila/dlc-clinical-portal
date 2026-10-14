# Changelog

All notable changes of `dlc-clinical-portal` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/). Work enters `develop` from `feat/`, `fix/` and `chore/` branches, reaches `qa` through
`promotion/*` branches re-applied with `git cherry-pick -x`, and reaches `main` through a `release/<version>` branch cut from `main`
and filled with the commits of `qa`, also with `git cherry-pick -x` (`00-governance/branching-policy.md`). Nothing is merged between
permanent branches. A release is tagged `v<version>` once it is merged.

## [Unreleased]

## [2.0.1] - 2026-10-14

Documentation release for MVP 2.

### Added

- This changelog, covering release 2.0.0 (tag `v2.0.0`).

## [2.0.0] - 2026-10-13

MVP 2, front-only delivery: the Clinical portal runs inside `dlc-front` on synthetic data, with no API, database or infrastructure
yet. Stories HU-CLN-001 ([#3](https://github.com/code-corhuila/dlc-clinical-portal/issues/3)), HU-CLN-002
([#4](https://github.com/code-corhuila/dlc-clinical-portal/issues/4)), HU-CLN-003
([#5](https://github.com/code-corhuila/dlc-clinical-portal/issues/5)) and HU-XCT-001
([#6](https://github.com/code-corhuila/dlc-clinical-portal/issues/6)). Released through
[#107](https://github.com/code-corhuila/dlc-clinical-portal/pull/107) (84 commits re-applied from `qa`, approved by the teacher, tagged `v2.0.0`).

### Added

- Clinical record (HU-CLN-001): loading, empty, error-with-retry and data states; new entries (consultation, diagnosis, evolution,
  antecedent, allergy) in a dialog; diagnoses linked to a consultation; amendments that keep the original entry, author and reason;
  Evolución timeline with a type filter and a quick note. ([#19](https://github.com/code-corhuila/dlc-clinical-portal/pull/19)–[#27](https://github.com/code-corhuila/dlc-clinical-portal/pull/27), [#31](https://github.com/code-corhuila/dlc-clinical-portal/pull/31))
- Clinical home at `/app/clinical`: one card per patient in care with "Ver historia clínica", an accent-insensitive search by name or
  id and the `?q=` route parameter; "Volver a Historia clínica" from the record.
  ([#97](https://github.com/code-corhuila/dlc-clinical-portal/pull/97), [#101](https://github.com/code-corhuila/dlc-clinical-portal/pull/101))
- Treatment plan (HU-CLN-002): planning from the procedure catalog, start with a version guard, procedure completion with justified
  materials and needs, extras pending a price in Billing, and a read-only COP estimate from the Billing price list (CLN-006).
  ([#28](https://github.com/code-corhuila/dlc-clinical-portal/pull/28)–[#33](https://github.com/code-corhuila/dlc-clinical-portal/pull/33), [#37](https://github.com/code-corhuila/dlc-clinical-portal/pull/37))
- Clinical Analytics dashboard (HU-CLN-003) by role: today's appointments, pending patients, monthly revenue for the Administrator
  only (compact COP with the exact amount for screen readers), weekly activity with a textual alternative, upcoming appointments and
  data freshness. ([#38](https://github.com/code-corhuila/dlc-clinical-portal/pull/38), [#39](https://github.com/code-corhuila/dlc-clinical-portal/pull/39), [#50](https://github.com/code-corhuila/dlc-clinical-portal/pull/50), [#89](https://github.com/code-corhuila/dlc-clinical-portal/pull/89))
- Care completion (HU-XCT-001): the Dentist declares the clinical care complete and the closure with Appointments and Billing is
  tracked, with a justified retry. ([#34](https://github.com/code-corhuila/dlc-clinical-portal/pull/34), [#35](https://github.com/code-corhuila/dlc-clinical-portal/pull/35))
- One `Idempotency-Key` per user intent on every write, reused on retries.
  ([#46](https://github.com/code-corhuila/dlc-clinical-portal/pull/46), [#51](https://github.com/code-corhuila/dlc-clinical-portal/pull/51), [#91](https://github.com/code-corhuila/dlc-clinical-portal/pull/91))
- Composition contract v1 (ADR-011): `/portals/clinical/<release>/entry.js` exports `portalId`, `contractVersion` and `mount`;
  routes `/{patientId}`, `/analytics` and `/` are read from the compositor, the role comes from the shell session, navigation goes
  through `context.navigation`, styles stay inside the host, and render failures are reported as `PORTAL_RENDER_FAILED`.
  ([#57](https://github.com/code-corhuila/dlc-clinical-portal/pull/57)–[#59](https://github.com/code-corhuila/dlc-clinical-portal/pull/59), [#87](https://github.com/code-corhuila/dlc-clinical-portal/pull/87))
- HTTP adapter over the compositor capability (`context.http`, C06) for the real build: reads and writes with the OpenAPI field
  names, typed failures with "Referencia: traceId", 403 kept as a forbidden state, cancelled reads ignored and no automatic retries.
  ([#93](https://github.com/code-corhuila/dlc-clinical-portal/pull/93), [#95](https://github.com/code-corhuila/dlc-clinical-portal/pull/95))
- Two containers from one image recipe: `clinical-portal-dlc-front` (real, port 4173) and `clinical-portal-demo` (synthetic,
  port 4175); `remoteEntry.js` and `/portals/` served without cache.
  ([#55](https://github.com/code-corhuila/dlc-clinical-portal/pull/55), [#56](https://github.com/code-corhuila/dlc-clinical-portal/pull/56))
- Synthetic demo dataset of nine invented patients covering every portal state.
  ([#54](https://github.com/code-corhuila/dlc-clinical-portal/pull/54), [#99](https://github.com/code-corhuila/dlc-clinical-portal/pull/99))
- Quality gates in CI: typecheck, lint, format, tests, coverage, build, the 400-line limit, branch, commit, PR-body and architecture
  checks; build tests in their own step; 326 tests, 96 % of statements.
  ([#18](https://github.com/code-corhuila/dlc-clinical-portal/pull/18), [#103](https://github.com/code-corhuila/dlc-clinical-portal/pull/103))

### Changed

- The plan table shows Procedimiento, Costo (COP, read-only) and Motivo, with the status in the header, matching the mockup within
  the Clinical contract. ([#54](https://github.com/code-corhuila/dlc-clinical-portal/pull/54))
- Plan printing was removed because dlc-docs does not define it. ([#89](https://github.com/code-corhuila/dlc-clinical-portal/pull/89))
- `promotion/*` branches are admitted into `qa`, since Git cannot create `qa/*` while `qa` exists, and the 400-line limit is waived
  for `release/<x.y.z>` into `main` when every commit is a traced cherry-pick (owner decisions).
  ([#60](https://github.com/code-corhuila/dlc-clinical-portal/pull/60), [#105](https://github.com/code-corhuila/dlc-clinical-portal/pull/105))

### Fixed

- Every weekday tied for the busiest of the week is highlighted. ([#53](https://github.com/code-corhuila/dlc-clinical-portal/pull/53))
- Node ESM scripts keep LF line endings, so the gate tests load on Windows. ([#45](https://github.com/code-corhuila/dlc-clinical-portal/pull/45))
- The real build no longer contains synthetic data, and an automated test now blocks any future leak.
  ([#99](https://github.com/code-corhuila/dlc-clinical-portal/pull/99))
- Technical exception text is no longer shown to the user; the safe message is shown instead (C06).
  ([#93](https://github.com/code-corhuila/dlc-clinical-portal/pull/93))

### Security

- `source-map-js` raised to 1.2.2 (GHSA-68fv-2mgg-jv7q). ([#16](https://github.com/code-corhuila/dlc-clinical-portal/pull/16))

### Known limits

- There is no Clinical API yet: the real build is wired to `context.http` but was verified only against a simulated capability.
- No analytics operation exists in the Gateway (HU-CLN-003 indicators await refinement): the real build reports the dashboard as
  unavailable.
- Declaring the care completion in the real build needs the appointment in care, which no contract supplies yet.
- The synthetic dataset lives in the demo build only and uses `patient-*` ids until a shared dataset is registered in dlc-docs.
- The Module Federation remote (`remoteEntry.js`) is still published and will be retired once `dlc-front` mounts by contract v1.
- The HU issues stay open until the real API integration and the peer Definition of Done review.

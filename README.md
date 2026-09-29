# dlc-clinical-portal

> Clinical bounded context: remote web UI.

This repository contains the **Di Lucca Clinical** frontend. It gives authorized clinical users a
safe interface for clinical histories, consultations, diagnoses, treatments, procedures and their
evolution through the Clinical API.

## Scope

The portal is a presentation client. It does not own user identity, tokens, sessions, patient
administrative records, appointment scheduling, billing/money or Clinical persistence. Those
responsibilities remain at their owning bounded context or the platform boundary.

## Technical baseline

- React 19 with the established workspace tooling.
- Node.js 24 for local development.
- API use follows the versioned Clinical OpenAPI contract.
- UI state is display state only; clinical writes remain idempotent at the API boundary.

Do not call databases or bypass the API gateway/authorization boundary from the browser.

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

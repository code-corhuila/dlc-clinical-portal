## User story

Link the applicable issue in `dlc-docs`, or explain why no story applies.

## What changed and why

## How it was tested

Include local results and the `ci.yml` result.

## Promotion trail

Required only for PRs to `qa` or `main`. List each `cherry-pick -x` source commit.

## Checklist

- [ ] No secrets or `.env` files are included.
- [ ] The portal does not implement an HTTP client, token, or session.
- [ ] The Clinical OpenAPI contract is respected.
- [ ] Each affected screen covers loading, retryable error, empty, and data states.

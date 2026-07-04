# Contributing

## Branching
- One branch prefix per subteam: `orchestrator/*`, `character/*`, `suggestion/*`, `memory/*`,
  `crew/*`, `venue/*`, `contracts/*`.
- PRs touch exactly one `services/*` folder (or `packages/contracts` for a contract change).

## Contract changes (the only cross-team change)
A change to `packages/contracts` affects everyone. To make one:
1. Open a `contracts/*` PR.
2. Update the type, the matching mock in `packages/mocks`, and the contract tests.
3. Tag every consuming subteam (see §7 of the architecture doc).
4. Version the contract; keep it backward-compatible where possible.

## Done means
Unit tests pass, and the contract tests for what your service produces pass against your code.

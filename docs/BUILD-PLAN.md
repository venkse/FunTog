# Build plan — parallel, contracts-first

## Phase 0 — platform (do this BEFORE parallel work; ~1 short effort)
Owned by a platform/contracts lead. Nothing else starts until this is green.
- Freeze `packages/contracts` (types + `services.ts` interfaces).
- Ship `packages/mocks` (a fake of every subsystem).
- Ship `packages/test-harness` (contract-test utilities).
- CI builds and tests all workspaces.
**Exit criteria:** every subteam can `npm install`, import contracts + mocks, and run a green test.

## Phase 1 — parallel subsystem build (all at once, against mocks)
One subteam per folder. Each builds to its interface, tests against mocked dependencies.

Dependency note (everyone unblocked by mocks, but freeze these contracts first because they are
most depended-on): `PersonaState`, `LedgerSnapshot`, `NightRecord` (Memory), and the session
contracts (Orchestrator).

| Subteam | Folder | Depends on (mock these) |
|---|---|---|
| Memory + Ledger | services/memory-ledger | — (foundational) |
| Crew + Identity | services/crew-identity | — |
| Venue / Knowledge | services/venue-knowledge | external places (stub) |
| Suggestion Engine | services/suggestion-engine | Venue |
| Character Engine | services/character-engine | Memory |
| Convergence Orchestrator | services/convergence-orchestrator | Suggestion, Character, Memory |

## Phase 2 — integration
Swap mocks for reals along the dependency edges, lowest-dependency first (Memory, Crew, Venue →
Suggestion, Character → Orchestrator). The contract tests are the safety net.

## Phase 3 — thin client + first real night
Wire `apps/client` to the Orchestrator; run one real crew night end-to-end.

# FunTog — build status

_Phase 1 (parallel subsystem build) complete: all six subsystems implemented to green against the frozen contracts._

## Subsystems — all green

| Subsystem | Defining decision (the sacred call it was built around) | Tests |
|---|---|---|
| **Memory + Ledger** | Event store + rebuildable CQRS projections (replay rebuilds identical state) | contract + 4 |
| **Convergence Orchestrator** | Session state machine *is* the contract; deterministic core isolated from the generation tier via circuit breaker | contract + 10 |
| **Character Engine** | Persona precedence `override > learned > base`; hot render path decoupled from cold evolution | contract + 7 |
| **Suggestion Engine** | Never ask the model for facts — model emits typed slots; Venue binds; capped feasibility/repair; switchable grounding mode | contract + 8 |
| **Venue / Knowledge** | Contain the external-data swamp behind `resolveVenues`; cache hard; singleflight; fast-fail coverage gaps | contract + 7 |
| **Crew + Identity** | Join by link — no install, no account to vote; signed stateless tokens (O(1) verify); idempotent joins | contract + 8 |

`packages/test-harness` self-test (6 mocks satisfy 6 contracts) + the above = **51 passing, 0 failing**.

Run it: `npm test` (per subsystem: `npm test -w services/<name>`). Perf: `npm run bench -w services/<name>`.

## Verified across a real edge
Suggestion's `grounded` mode was run against the **real** Venue (not the mock) and produced a fully
bound plan honoring crew constraints, degrading to shapes for uncovered areas with no invented venues.
This is the contracts-first bet paying off: two independently built services composed with zero glue.

## Phase 2 — integration (next)
Everything below is deliberately still behind a seam; the interfaces are ready for the swap:
- **Swap mocks for reals along every edge** (Orchestrator → Suggestion/Character/Memory; Suggestion → Venue; Orchestrator/Character → Crew tokens).
- **Inject real models**: the `StructureModel` (Suggestion) and `VoiceModel` (Character) are template stand-ins; plug in the LLM-backed implementations.
- **Real provider**: the Venue `PlacesProvider` stub → the real Places/Maps SDK (lives only in that one folder).
- **Real persistence**: Memory's in-memory event store → durable, crew-partitioned storage.
- **Frontend**: wire the mascot mood animations (`services/character-engine/assets/funtog-mascot.html`) into the React prototype; build the join-by-link flow.
- **Push to GitHub** and stand up CI on the real matrix.

## Hardening pass (post-Phase-1 revalidation)
Revalidated from clean install, then executed in order:
1. **Golden-night e2e** — all six REAL services through two full nights (tie→wheel, decisive→ledger+evolution).
   Caught a live seam bug on first run: the orchestrator's join token didn't round-trip through
   Crew/Identity. Token minting now belongs to Crew via `OrchestratorDeps.mintJoinToken`.
2. **Event schema versioning** (memory-ledger): every persisted event stamped `v:1`; readers tolerate
   legacy (no `v` ⇒ v1) and fail loudly on future versions.
3. **Key rotation** (crew-identity): `kid.payload.sig` tokens + keyring; rotate without killing live links.
4. **Bounded venue cache**: LRU (default 10k keys); stale-on-error degrade preserved.
5. **SessionStore port** (contracts 0.3.0): checkpoint-on-change + rehydrate-on-miss. Crash handoff
   proven by test (fresh process finishes a mid-vote night; LWW survives replay). Honest scope:
   durability + handoff, NOT concurrency control — single-writer stays a routing invariant.

Suite: 51 → 69 tests, all green.

## Character exploration → integrated
Six alternative characters (Momo, Pip, Lumi, Boo, Dizzy, Koko) are now first-class
personas in the Character Engine registry — full 8-mood sprite maps, dials, and flair.
`setPersona(crewId, id)` chooses one and persists via Memory (override precedence).
Client side: `assets/funtog-characters.html` is the choosable gallery — 7 rigs × 8 moods
on a shared animation grammar; the caption displays the live persona→mood→sprite contract.
Exploration lineup preserved at `assets/character-exploration.html`.

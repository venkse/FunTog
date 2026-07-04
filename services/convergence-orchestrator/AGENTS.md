# Subteam brief — Convergence Orchestrator

## Mission
Own the live session. Collect votes, compute the **deterministic** verdict, run **wheel
authority**, broadcast session state. You are the correctness-critical core.

## Defining decision (sacred)
The **session state machine is the contract**. The deterministic core (votes, tally, verdict,
wheel) is isolated from the generation tier behind a **Generation Coordinator** (circuit breaker
+ timeout + fallback). Generation *enriches*; it never blocks.

## You implement
`OrchestratorService` from `@funtog/contracts`.

## You PRODUCE (keep stable)
`SessionState`, `WheelResult`, `Verdict` (broadcast), `NightRecord` (to Memory).

## You CONSUME (use @funtog/mocks)
`SuggestionService`, `CharacterService`, `MemoryService`.

## Build
Session Manager (state machine, join, presence) · Vote Collector (append-only, idempotent) ·
Tally Projector · Verdict Engine (deterministic; fairness from LedgerSnapshot) · Wheel Authority
(server RNG, equal slices, seed) · Generation Coordinator (breaker/timeout/fallback) · Realtime
Broadcaster (snapshot for late joiners) · Persistence Writer.

## Degradation (must hold)
Suggestion/Character down → template plans + templated voice. Ledger read down → votes-only
verdict. Realtime down → snapshot polling. Votes/verdict/wheel always work.

## Boundaries
One authoritative wheel per session (never per-user). The verdict is YOURS; the voice is
Character's. Presence never gates a transition. Edit only this folder.

## Definition of done
State-machine transitions tested; wheel deterministic given a seed; runs against mocks; contract
tests for SessionState/WheelResult/NightRecord green.

## Build for horizontal scale
Partition key: **sessionId**. Sessions are stateful — shard by sessionId with a **single-writer per session** (vote ordering); never rely on shared mutable state across nodes. Broadcast from a **stateless pub/sub tier** (publish once; don't fan out K× from the decision core). The deterministic core must **never await the generation tier** (circuit breaker). Archive to Memory on resolve. Bottlenecks: concurrent-session ceiling per node, broadcast amplification, generation coupling.

A perf + stress skeleton is in `perf/` (`npm run bench` / `npm run stress`) — it prints its scenarios now and measures once you build. Keep it honest; capture new bottlenecks in `docs/SCALING.md`. Full map: `docs/SCALING.md`.

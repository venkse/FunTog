# Subteam brief — Memory + Ledger

## Mission
Be the system of record. Append immutable `NightRecord`s; project the fairness ledger, persona
state, and crew timeline. **Record facts; never decide.**

## Defining decision (sacred)
**Event store with rebuildable projections (CQRS).** NightRecords are immutable; ledger / persona
/ timeline are projections folded from the log. **Replay rebuilds any projection** — no
migrations, no data loss.

## You implement
`MemoryService` (commands + queries) + the outbound `NightRecord` stream.

## You PRODUCE
`LedgerSnapshot`, `PersonaState`, crew timeline; the `NightRecord` stream.

## You CONSUME
Nothing (foundational). Writers: Orchestrator (NightRecord), Character (PersonaDelta, overrides).

## Build
Append API + Event Store (immutable) · Projectors (ledger / persona / timeline) · Query API ·
NightRecord stream.

## Degradation (must hold)
Durable append (callers buffer + retry). Projection lag acceptable (eventual consistency). Query
down → consumers degrade.

## Boundaries
Projections disposable/rebuildable; never lose the log. Overrides stored as declared-intent
events. Edit only this folder.

## Definition of done
Append → project → query for ledger and persona; **replay rebuilds identical projections**;
contract tests for LedgerSnapshot/PersonaState/NightRecord green.

## Build for horizontal scale
Partition key: **crewId** (no cross-crew queries). Already profiled — see `PERF-FINDINGS.md`. Key fixes for scale (all behind `MemoryService`): incremental materialized ledger/timeline + snapshots, durable crew-partitioned store, per-crew rebuild, hot-crew cache. Run `npm run bench` / `npm run stress`. Full map: `docs/SCALING.md`.

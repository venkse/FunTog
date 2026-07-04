# Memory + Ledger
System of record: append-only NightRecords; projected ledger, persona state, timeline.
See `AGENTS.md` and `docs/funtog-memory-ledger.md`.

## Status: pilot — implemented
`MemoryService` is implemented (event store + rebuildable CQRS projections). Contract test +
unit tests green (`npm test -w services/memory-ledger`). See `CONTRACT-NOTES.md` for one contract
gap this pilot surfaced (no override-write path).

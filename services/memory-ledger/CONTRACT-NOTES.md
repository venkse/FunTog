# Contract notes from the Memory + Ledger pilot

## RESOLVED in contracts 0.1.0 — override-write path added
`MemoryService.declareOverride(crewId, overrides, reason?)` now persists declared-intent overrides
as immutable `override_declared` events; `foldPersona` folds them into `PersonaState.overrides`
(precedence override > learned > base). Mock + contract test updated. Character must wire
`setOverrides` → `declareOverride` (see `services/character-engine/AGENTS.md`).

---

### Original finding (kept for history)
The Character Engine's `setOverrides` had nowhere to persist declared intent — `MemoryService`
exposed only `appendNightRecord` and `writePersonaDelta`, so `getPersonaState().overrides` was
always `{}`. Surfaced by the pilot before fan-out and closed via the contract-change process.

# @funtog/contracts — changelog

## 0.2.0
- **Added** an optional `mood` to `VoicePacket` and `PlanVoice`, plus a `Mood` vocabulary
  (`idle | plotting | tada | wink | thinking | mischief | smug | cheer`). The Character Engine emits
  a mood per beat; clients map it to a sprite animation. Additive / backward-compatible.

## 0.1.0
- **Added** `MemoryService.declareOverride(crewId, overrides, reason?)` — a write path for
  declared-intent persona overrides (event-sourced; folded into `PersonaState.overrides`).
  Surfaced by the Memory + Ledger pilot: Character's `setOverrides` had no way to persist, so the
  `override > learned > base` precedence could never take effect.
  - Implementers updated in the same change: `@funtog/mocks`, `services/memory-ledger`.
  - Consumer to wire: `services/character-engine` (`setOverrides` → `declareOverride`).
  - Backward-compatible for callers; additive to the surface.

## 0.0.0
- Initial contract surface (types + service interfaces) frozen for parallel build.

## 0.3.0
- Add `PersistedSession` + `SessionStore`: the durability port for live sessions
  (checkpoint on change, rehydrate on miss). Crash-recovery and process handoff;
  explicitly NOT concurrency control — single-writer per session stays a routing invariant.

import type { NightRecord, PersonaDelta, LedgerSnapshot, PersonaState } from "@funtog/contracts";
import { eventVersion, type MemoryEvent } from "./events";
import { foldLedger } from "./projectors/ledger";
import { foldPersona } from "./projectors/persona";
import { foldTimeline, type CrewTimeline } from "./projectors/timeline";

/**
 * Read side. Holds per-crew event groupings and folds them into projections on query. Because
 * every projection is a pure function of the log, `rebuildFrom(log)` always reproduces identical
 * read models — no migrations, no drift. (Production swap: precomputed materialized views kept by
 * an async projector; the rebuild guarantee is the invariant that swap must preserve.)
 */
export class ProjectionStore {
  private nights = new Map<string, NightRecord[]>();
  private deltas = new Map<string, PersonaDelta[]>();
  private overrides = new Map<string, Record<string, unknown>[]>();

  apply(e: MemoryEvent): void {
    eventVersion(e); // tolerate legacy (no v ⇒ v1); FAIL LOUDLY on future versions — never misread
    if (e.type === "night_recorded") this.push(this.nights, e.crewId, e.payload);
    else if (e.type === "persona_delta") this.push(this.deltas, e.crewId, e.payload);
    else if (e.type === "override_declared") this.push(this.overrides, e.crewId, e.payload.overrides);
  }

  rebuildFrom(events: readonly MemoryEvent[]): void {
    this.nights.clear();
    this.deltas.clear();
    this.overrides.clear();
    for (const e of events) this.apply(e);
  }

  ledger(crewId: string): LedgerSnapshot { return foldLedger(crewId, this.nights.get(crewId) ?? []); }
  persona(crewId: string): PersonaState {
    return foldPersona(crewId, this.nights.get(crewId) ?? [], this.deltas.get(crewId) ?? [], this.overrides.get(crewId) ?? []);
  }
  timeline(crewId: string): CrewTimeline { return foldTimeline(crewId, this.nights.get(crewId) ?? []); }

  private push<T>(map: Map<string, T[]>, key: string, value: T): void {
    const arr = map.get(key) ?? [];
    arr.push(value);
    map.set(key, arr);
  }
}

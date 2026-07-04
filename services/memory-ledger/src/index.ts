import type { MemoryService, NightRecord, PersonaDelta } from "@funtog/contracts";
import { InMemoryEventStore, type MemoryEvent } from "./events";
import { ProjectionStore } from "./projections";

export interface MemoryOptions {
  /** Optional consumer of the outbound NightRecord stream (e.g. Character's evolution path). */
  onNightRecord?: (r: NightRecord) => void;
}

/**
 * Memory + Ledger — the system of record. Append immutable events; serve rebuildable projections.
 * Records facts; never decides. Degradation: append is the durable path callers depend on;
 * projection reads are eventually consistent and may lag.
 */
export function createMemory(opts: MemoryOptions = {}): MemoryService {
  const log = new InMemoryEventStore();
  const projections = new ProjectionStore();

  log.subscribe((e: MemoryEvent) => {
    projections.apply(e);
    if (e.type === "night_recorded") opts.onNightRecord?.(e.payload);
  });

  return {
    async appendNightRecord(r) {
      log.append({ type: "night_recorded", crewId: r.crewId, timestamp: r.timestamp, payload: r });
    },
    async writePersonaDelta(d) {
      log.append({ type: "persona_delta", crewId: d.crewId, timestamp: new Date().toISOString(), payload: d });
    },
    async declareOverride(crewId, overrides, reason) {
      log.append({ type: "override_declared", crewId, timestamp: new Date().toISOString(), payload: { overrides, reason } });
    },
    async getLedgerSnapshot(crewId) { return projections.ledger(crewId); },
    async getPersonaState(crewId) { return projections.persona(crewId); },
    async getCrewTimeline(crewId) { return projections.timeline(crewId); },
  };
}

// Re-export internals for unit tests and integration wiring.
export { InMemoryEventStore, EVENT_SCHEMA_VERSION, eventVersion } from "./events";
export { ProjectionStore } from "./projections";
export { foldLedger } from "./projectors/ledger";
export { foldPersona } from "./projectors/persona";
export { foldTimeline } from "./projectors/timeline";

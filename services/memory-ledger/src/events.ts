import type { NightRecord, PersonaDelta } from "@funtog/contracts";

/**
 * Every persisted event carries a schema version. Events live FOREVER (the log is the source of
 * truth), so the moment a payload shape changes we bump the version and teach readers to upcast.
 * Readers must be tolerant: an event with a missing `v` is v1 (pre-versioning history), and an
 * event with a NEWER version than we know must fail loudly, never be silently misread.
 */
export const EVENT_SCHEMA_VERSION = 1 as const;

type Base = { seq: number; v?: number; crewId: string; timestamp: string };
export type MemoryEvent =
  | (Base & { type: "night_recorded"; payload: NightRecord })
  | (Base & { type: "persona_delta"; payload: PersonaDelta })
  | (Base & { type: "override_declared";
      payload: { overrides: Record<string, unknown>; reason?: string } });

/** Reader-side tolerance: missing v ⇒ v1; future v ⇒ explicit failure (never guess). */
export function eventVersion(e: MemoryEvent): number {
  const v = e.v ?? 1;
  if (v > EVENT_SCHEMA_VERSION) {
    throw new Error(`memory event seq=${e.seq} has schema v${v}; this reader only knows v${EVENT_SCHEMA_VERSION} — upgrade before replaying`);
  }
  return v;
}

export type Subscriber = (e: MemoryEvent) => void;

/**
 * Append-only event store. The log is the ONLY thing we must never lose; every projection is
 * rebuildable from it. In-memory for the pilot — swap for a durable log (Postgres / event store)
 * behind this same interface without touching the projectors or the service surface.
 */
export interface EventStore {
  append(e: Omit<MemoryEvent, "seq">): MemoryEvent;
  all(): readonly MemoryEvent[];
  subscribe(fn: Subscriber): () => void;
}

export class InMemoryEventStore implements EventStore {
  private events: MemoryEvent[] = [];
  private subs = new Set<Subscriber>();

  append(e: Omit<MemoryEvent, "seq">): MemoryEvent {
    const ev = { v: EVENT_SCHEMA_VERSION, ...e, seq: this.events.length + 1 } as MemoryEvent;
    this.events.push(ev);
    for (const fn of this.subs) fn(ev);
    return ev;
  }
  all(): readonly MemoryEvent[] { return this.events; }
  subscribe(fn: Subscriber): () => void { this.subs.add(fn); return () => this.subs.delete(fn); }
}

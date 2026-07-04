import { test } from "node:test";
import assert from "node:assert/strict";
import { InMemoryEventStore, EVENT_SCHEMA_VERSION, eventVersion, type MemoryEvent } from "../src/events";
import { ProjectionStore } from "../src/projections";
import type { NightRecord } from "@funtog/contracts";

const night = (crewId: string): NightRecord => ({
  nightId: "n1", crewId, timestamp: "t", sparkInput: {}, candidatePlans: [],
  votes: [{ memberId: "m1", planId: "A" }], verdict: { type: "winner", planId: "A" } as never,
});

test("appended events are stamped with the current schema version", () => {
  const store = new InMemoryEventStore();
  const ev = store.append({ type: "night_recorded", crewId: "c", timestamp: "t", payload: night("c") });
  assert.equal(ev.v, EVENT_SCHEMA_VERSION);
});

test("legacy events without v replay as v1 (tolerant reader)", () => {
  const legacy = { seq: 1, type: "night_recorded", crewId: "c", timestamp: "t", payload: night("c") } as MemoryEvent;
  assert.equal(eventVersion(legacy), 1);
  const proj = new ProjectionStore();
  proj.rebuildFrom([legacy]);                       // must not throw
  assert.equal(proj.ledger("c").members.length, 1); // and must fold
});

test("events from a FUTURE schema fail loudly instead of being misread", () => {
  const future = { seq: 9, v: EVENT_SCHEMA_VERSION + 1, type: "night_recorded", crewId: "c", timestamp: "t", payload: night("c") } as MemoryEvent;
  const proj = new ProjectionStore();
  assert.throws(() => proj.rebuildFrom([future]), /schema v2.*only knows v1/);
});

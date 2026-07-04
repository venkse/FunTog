import { test } from "node:test";
import assert from "node:assert/strict";
import type { NightRecord } from "@funtog/contracts";
import { createMemory, InMemoryEventStore, ProjectionStore, foldLedger } from "../src/index";

const night = (id: string, winner: string, votes: [string, string][]): NightRecord => ({
  nightId: id, crewId: "c1", timestamp: new Date(2026, 0, Number(id.slice(1))).toISOString(),
  sparkInput: {}, candidatePlans: [],
  votes: votes.map(([memberId, planId]) => ({ memberId, planId })),
  verdict: { type: "winner", planId: winner },
});

test("ledger fold computes got / overruled / streak", () => {
  const led = foldLedger("c1", [
    night("n1", "p1", [["riya", "p1"], ["sam", "p2"], ["maya", "p2"]]),
    night("n2", "p1", [["riya", "p1"], ["sam", "p2"], ["maya", "p1"]]),
  ]);
  const by = Object.fromEntries(led.members.map((m) => [m.memberId, m]));
  assert.deepEqual(by.riya, { memberId: "riya", got: 2, overruled: 0, streak: 0 });
  assert.deepEqual(by.sam,  { memberId: "sam",  got: 0, overruled: 2, streak: 2 }); // owed two
  assert.deepEqual(by.maya, { memberId: "maya", got: 1, overruled: 1, streak: 0 });
});

test("DEFINING DECISION: replay rebuilds identical projections (incl. overrides)", () => {
  const log = new InMemoryEventStore();
  const live = new ProjectionStore();
  log.subscribe((e) => live.apply(e));

  log.append({ type: "night_recorded", crewId: "c1", timestamp: "t", payload: night("n1", "p2", [["sam", "p2"], ["riya", "p1"]]) });
  log.append({ type: "override_declared", crewId: "c1", timestamp: "t", payload: { overrides: { tone: "chaotic" }, reason: "user" } });

  const livePersona = live.persona("c1");
  assert.equal((livePersona.overrides as Record<string, unknown>).tone, "chaotic", "override surfaces in persona");

  const rebuilt = new ProjectionStore();
  rebuilt.rebuildFrom(log.all());
  assert.deepEqual(rebuilt.persona("c1"), livePersona, "persona (with overrides) identical after replay");
  assert.deepEqual(rebuilt.ledger("c1"), live.ledger("c1"), "ledger identical after replay");
});

test("append -> project -> query through the service surface, + NightRecord stream", async () => {
  const seen: string[] = [];
  const mem = createMemory({ onNightRecord: (r) => seen.push(r.nightId) });
  await mem.appendNightRecord(night("n1", "p1", [["sam", "p2"], ["riya", "p1"]]));
  await mem.declareOverride("c1", { tone: "extra-chaotic" });
  const led = await mem.getLedgerSnapshot("c1");
  assert.equal(led.members.find((m) => m.memberId === "sam")?.overruled, 1);
  const ps = await mem.getPersonaState("c1");
  assert.equal((ps.learnedDeltas as Record<string, unknown>).level, 1);
  assert.equal((ps.overrides as Record<string, unknown>).tone, "extra-chaotic");
  assert.deepEqual(seen, ["n1"], "NightRecord stream emitted to subscriber");
});

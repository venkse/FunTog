import assert from "node:assert/strict";
import type { MemoryService, NightRecord } from "@funtog/contracts";

const night: NightRecord = {
  nightId: "n1", crewId: "c1", timestamp: new Date().toISOString(),
  sparkInput: {}, candidatePlans: [], votes: [{ memberId: "sam", planId: "p1" }],
  verdict: { type: "winner", planId: "p1" },
};

export async function runMemoryContract(impl: MemoryService): Promise<void> {
  await impl.appendNightRecord(night);
  const led = await impl.getLedgerSnapshot("c1");
  assert.equal(led.crewId, "c1", "ledger snapshot carries crewId");
  assert.ok(Array.isArray(led.members), "ledger has members");
  for (const m of led.members) {
    for (const f of ["got", "overruled", "streak"] as const) {
      assert.equal(typeof m[f], "number", `ledger member has numeric ${f}`);
    }
  }
  const ps = await impl.getPersonaState("c1");
  assert.ok(ps.basePersonaId, "persona has a base");
  assert.equal(typeof ps.learnedDeltas, "object", "persona has learnedDeltas");
  assert.equal(typeof ps.overrides, "object", "persona has overrides (precedence substrate)");

  // contracts 0.1.0: declared-intent overrides are recorded and surface in PersonaState
  await impl.declareOverride("c1", { tone: "extra-chaotic" }, "user asked for it");
  const ps2 = await impl.getPersonaState("c1");
  assert.equal((ps2.overrides as Record<string, unknown>).tone, "extra-chaotic",
    "declareOverride surfaces in PersonaState.overrides");

  await impl.getLedgerSnapshot("c1"); // reads are repeatable
}

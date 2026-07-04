import assert from "node:assert/strict";
import type { SessionStore, PersistedSession } from "@funtog/contracts";

const rec = (sessionId: string): PersistedSession => ({
  sessionId, crewId: "c1", sparkInput: { vibe: "x" },
  snapshot: { sessionId, crewId: "c1", phase: "gathering", candidates: [], tally: { p1: 1 } },
  votes: [{ sessionId, memberId: "m1", planId: "p1", clientSeq: 1, at: 111 }],
});

export async function runSessionStoreContract(impl: SessionStore): Promise<void> {
  assert.equal(await impl.load("nope"), null, "load miss returns null");
  const p = rec("s1");
  await impl.save(p);
  const back = await impl.load("s1");
  assert.ok(back, "load hit returns the record");
  assert.deepEqual(back, p, "round-trip is lossless");
  // upsert: later checkpoint replaces earlier
  const p2 = { ...structuredClone(p), snapshot: { ...p.snapshot, phase: "resolved" as const } };
  await impl.save(p2);
  assert.equal((await impl.load("s1"))!.snapshot.phase, "resolved", "save is an upsert");
  // isolation: mutating a loaded record must not corrupt the store
  const got = (await impl.load("s1"))!;
  got.snapshot.tally.p1 = 999;
  assert.equal((await impl.load("s1"))!.snapshot.tally.p1, 1, "loads are isolated copies");
}

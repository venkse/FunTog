import { test } from "node:test";
import assert from "node:assert/strict";
import { createOrchestrator, InMemorySessionStore } from "../src/index";
import { mockSuggestion, mockCharacter, mockMemory } from "@funtog/mocks";
import type { Vote } from "@funtog/contracts";

const wire = (store: InMemorySessionStore) => createOrchestrator({
  suggestion: mockSuggestion, character: mockCharacter, memory: mockMemory,
  seedFn: () => "rehydrate-seed", store,
});
const v = (sessionId: string, memberId: string, planId: string): Vote =>
  ({ sessionId, memberId, planId, clientSeq: 1 });

test("crash handoff: a fresh process rehydrates the session and finishes the night", async () => {
  const store = new InMemorySessionStore();
  const orch1 = wire(store);
  const { sessionId } = await orch1.openSession("crew1", { vibe: "big night" });
  const s = await orch1.getState(sessionId);
  const [A, B] = s.candidates;
  await orch1.castVote(v(sessionId, "m1", A.id));
  await orch1.castVote(v(sessionId, "m2", A.id));

  // ---- process 1 dies; process 2 owns the session via the store ----
  const orch2 = wire(store);
  const mid = await orch2.getState(sessionId);           // rehydrates on miss
  assert.equal(mid.phase, "gathering");
  assert.equal(mid.tally[A.id], 2, "votes survive the crash");

  await orch2.castVote(v(sessionId, "m3", B.id));
  await orch2.castVote(v(sessionId, "m4", B.id));
  await orch2.converge(sessionId);
  const done = await orch2.getState(sessionId);
  assert.equal(done.phase, "resolved");
  assert.equal(done.verdict?.type, "wheel", "2-2 tie still spins after handoff");
});

test("LWW survives rehydration: stale clientSeq replays are still ignored", async () => {
  const store = new InMemorySessionStore();
  const orch1 = wire(store);
  const { sessionId } = await orch1.openSession("crew2", {});
  const s = await orch1.getState(sessionId);
  const [A, B] = s.candidates;
  await orch1.castVote({ sessionId, memberId: "m1", planId: A.id, clientSeq: 5 });

  const orch2 = wire(store);
  await orch2.castVote({ sessionId, memberId: "m1", planId: B.id, clientSeq: 3 }); // stale after crash
  const st = await orch2.getState(sessionId);
  assert.equal(st.tally[A.id], 1, "clientSeq 5 vote still wins over the stale 3");
  assert.equal(st.tally[B.id] ?? 0, 0);
});

test("resolved sessions rehydrate read-only: reads work, mutations no-op", async () => {
  const store = new InMemorySessionStore();
  const orch1 = wire(store);
  const { sessionId } = await orch1.openSession("crew3", {});
  const s = await orch1.getState(sessionId);
  await orch1.castVote(v(sessionId, "m1", s.candidates[0].id));
  await orch1.converge(sessionId);

  const orch2 = wire(store);
  const done = await orch2.getState(sessionId);
  assert.equal(done.phase, "resolved");
  await orch2.castVote(v(sessionId, "m9", s.candidates[1].id)); // must not throw, must not count
  const after = await orch2.getState(sessionId);
  assert.equal(after.tally[s.candidates[1].id] ?? 0, 0);
});

test("availability first: a store outage never blocks voting", async () => {
  const broken = {
    async save(): Promise<void> { throw new Error("store down"); },
    async load(): Promise<null> { return null; },
  };
  const orch = createOrchestrator({
    suggestion: mockSuggestion, character: mockCharacter, memory: mockMemory, store: broken,
  });
  const { sessionId } = await orch.openSession("crew4", {});
  const s = await orch.getState(sessionId);
  await orch.castVote(v(sessionId, "m1", s.candidates[0].id));  // must not throw
  assert.equal((await orch.getState(sessionId)).tally[s.candidates[0].id], 1);
});

test("checkpoint content: the store holds the resolved snapshot after converge", async () => {
  const store = new InMemorySessionStore();
  const orch = wire(store);
  const { sessionId } = await orch.openSession("crew5", {});
  const s = await orch.getState(sessionId);
  await orch.castVote(v(sessionId, "m1", s.candidates[0].id));
  await orch.converge(sessionId);
  const p = await store.load(sessionId);
  assert.ok(p);
  assert.equal(p!.snapshot.phase, "resolved");
  assert.equal(p!.votes.length, 1);
  assert.equal(p!.crewId, "crew5");
});

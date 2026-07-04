import { test } from "node:test";
import assert from "node:assert/strict";
import type { MemoryService, SuggestionService, LedgerSnapshot } from "@funtog/contracts";
import { mockSuggestion, mockCharacter, mockMemory } from "@funtog/mocks";
import {
  createOrchestrator, decideVerdict, mostOwed, spin, VoteLog, canTransition,
} from "../src/index";

// ---- pure: Verdict Engine ----
test("verdict: clear top → winner", () => {
  const v = decideVerdict({ p1: 2, p2: 1 });
  assert.deepEqual(v, { type: "winner", planId: "p1" });
});

test("verdict: tie with no fairness signal → wheel", () => {
  const v = decideVerdict({ p1: 1, p2: 1 }, { crewId: "c", members: [] }, [
    { memberId: "a", planId: "p1" }, { memberId: "b", planId: "p2" },
  ]);
  assert.equal(v.type, "wheel");
  assert.deepEqual([...(v as { contenders: string[] }).contenders].sort(), ["p1", "p2"]);
});

test("verdict: tie → fairness leans to the most-owed member's pick (upstream of the wheel)", () => {
  const ledger: LedgerSnapshot = { crewId: "c", members: [
    { memberId: "sam", got: 0, overruled: 3, streak: 3 },
    { memberId: "riya", got: 2, overruled: 0, streak: 0 },
  ]};
  const v = decideVerdict({ p1: 1, p2: 1 }, ledger, [
    { memberId: "sam", planId: "p2" }, { memberId: "riya", planId: "p1" },
  ]);
  assert.deepEqual(v, { type: "winner", planId: "p2", fairnessFor: "sam" });
  assert.equal(mostOwed(ledger), "sam");
});

// ---- pure: Wheel Authority ----
test("wheel: deterministic given a seed, returns a contender, echoes the seed", () => {
  const a = spin(["p1", "p2", "p3"], "deadbeef");
  const b = spin(["p1", "p2", "p3"], "deadbeef");
  assert.deepEqual(a, b);
  assert.equal(a.seed, "deadbeef");
  assert.ok(["p1", "p2", "p3"].includes(a.planId));
});

// ---- pure: Vote Log (idempotent, last-write-wins) ----
test("vote log: last-write-wins per member; stale clientSeq ignored", () => {
  const log = new VoteLog();
  assert.equal(log.append({ sessionId: "s", memberId: "sam", planId: "p1", clientSeq: 1 }, 0), true);
  assert.equal(log.append({ sessionId: "s", memberId: "sam", planId: "p2", clientSeq: 2 }, 0), true); // changed vote
  assert.equal(log.append({ sessionId: "s", memberId: "sam", planId: "p1", clientSeq: 1 }, 0), false); // stale
  assert.deepEqual(log.tally(), { p2: 1 });
});

// ---- state machine guards ----
test("state machine: legal vs illegal transitions", () => {
  assert.equal(canTransition("gathering", "converging"), true);
  assert.equal(canTransition("converging", "spinning"), true);
  assert.equal(canTransition("gathering", "resolved"), false); // can't skip converging
});

// ---- integration through the service surface ----
test("session: open → vote → converge resolves to a winner + archives a NightRecord", async () => {
  let archived: string | undefined;
  const memory: MemoryService = { ...mockMemory, async appendNightRecord(r) { archived = r.nightId; } };
  const orch = createOrchestrator({ suggestion: mockSuggestion, character: mockCharacter, memory });
  const { sessionId } = await orch.openSession("c1", { vibe: "big night" });
  await orch.castVote({ sessionId, memberId: "sam", planId: "p1", clientSeq: 1 });
  await orch.converge(sessionId);
  const st = await orch.getState(sessionId);
  assert.equal(st.phase, "resolved");
  assert.equal(st.verdict?.type, "winner");
  assert.equal(archived, sessionId, "night archived to Memory on resolve");
});

test("wheel path through the orchestrator carries a verifiable seed", async () => {
  const flat: MemoryService = { ...mockMemory, async getLedgerSnapshot(crewId): Promise<LedgerSnapshot> { return { crewId, members: [] }; } };
  const orch = createOrchestrator({ suggestion: mockSuggestion, character: mockCharacter, memory: flat, seedFn: () => "deadbeef" });
  const { sessionId } = await orch.openSession("c1", {});
  await orch.castVote({ sessionId, memberId: "a", planId: "p1", clientSeq: 1 });
  await orch.castVote({ sessionId, memberId: "b", planId: "p2", clientSeq: 1 });
  await orch.converge(sessionId);
  const st = await orch.getState(sessionId);
  assert.equal(st.phase, "resolved");
  assert.equal(st.verdict?.type, "wheel");
  assert.equal(st.wheelResult?.seed, "deadbeef");
  assert.ok(["p1", "p2"].includes(st.wheelResult!.planId));
});

test("DEGRADATION: generation tier down → session still opens on template plans", async () => {
  const down: SuggestionService = { async generatePlans() { throw new Error("suggestion down"); }, async refinePlan(p) { return p; } };
  const orch = createOrchestrator({ suggestion: down, character: mockCharacter, memory: mockMemory });
  const { sessionId } = await orch.openSession("c1", {});
  const st = await orch.getState(sessionId);
  assert.equal(st.phase, "gathering");
  assert.equal(st.candidates.length, 3, "template fallback plans present — core never blocked on generation");
});

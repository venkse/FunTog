import assert from "node:assert/strict";
import type { OrchestratorService } from "@funtog/contracts";

const PHASES = new Set(["draft","gathering","converging","spinning","resolved","archived","cancelled"]);

export async function runOrchestratorContract(impl: OrchestratorService): Promise<void> {
  const opened = await impl.openSession("c1", { vibe: "big night" });
  assert.ok(opened.sessionId && opened.joinToken, "openSession returns id + join token");
  const s0 = await impl.getState(opened.sessionId);
  assert.ok(PHASES.has(s0.phase), "session phase is valid");
  assert.ok(Array.isArray(s0.candidates), "session exposes candidates");
  await impl.castVote({ sessionId: opened.sessionId, memberId: "sam", planId: "p1", clientSeq: 1 });
  await impl.converge(opened.sessionId);
  const s1 = await impl.getState(opened.sessionId);
  assert.ok(["resolved","spinning","converging"].includes(s1.phase), "converge advances the session");
  if (s1.verdict?.type === "wheel" && s1.wheelResult) {
    assert.ok(s1.wheelResult.seed, "wheel result carries a verifiable seed");
  }
}

import { section, latency, throughput } from "@funtog/perf";
import { mockSuggestion, mockCharacter, mockMemory } from "@funtog/mocks";
import { createOrchestrator } from "../src/index";

async function main() {
  section("Convergence Orchestrator · PERFORMANCE");
  const svc = createOrchestrator({ suggestion: mockSuggestion, character: mockCharacter, memory: mockMemory });
  await latency("openSession", 300, async () => { await svc.openSession("c1", { vibe: "big night" }); });
  await throughput("session/sec (open+vote+converge)", 1000, async () => {
    const s = await svc.openSession("c1", {});
    await svc.castVote({ sessionId: s.sessionId, memberId: "sam", planId: "p1", clientSeq: 1 });
    await svc.converge(s.sessionId);
  });
  console.log("  NOTE: sessions accumulate in the in-memory registry → evict/archive on resolve at scale;");
  console.log("        shard by sessionId (single-writer per session); broadcast from a stateless pub/sub tier.");
}
main();

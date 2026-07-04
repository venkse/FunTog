import { section, latency } from "@funtog/perf";
import { mockSuggestion, mockCharacter, mockMemory } from "@funtog/mocks";
import { createOrchestrator } from "../src/index";

async function main() {
  section("Convergence Orchestrator · STRESS");
  const svc = createOrchestrator({ suggestion: mockSuggestion, character: mockCharacter, memory: mockMemory });
  // thundering herd: many simultaneous opens
  await latency("openSession under herd", 2000, async () => { await svc.openSession("c1", {}); });
  console.log("  => find the per-node session ceiling; above it, shard sessions across the fleet.");
  console.log("     The registry growing unbounded here is the in-memory analog of needing eviction/archival.");
}
main();

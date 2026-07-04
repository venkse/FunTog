import { test } from "node:test";
import { runOrchestratorContract } from "@funtog/test-harness";
import { mockSuggestion, mockCharacter, mockMemory } from "@funtog/mocks";
import { createOrchestrator } from "../src/index";

test("convergence-orchestrator satisfies its contract", async () => {
  await runOrchestratorContract(createOrchestrator({
    suggestion: mockSuggestion, character: mockCharacter, memory: mockMemory,
  }));
});

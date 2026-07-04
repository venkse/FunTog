import { test } from "node:test";
import { runMemoryContract } from "@funtog/test-harness";
import { createMemory } from "../src/index";

// RED until implemented. Green = your service satisfies its contract.
test("memory-ledger satisfies its contract", async () => {
  await runMemoryContract(createMemory());
});

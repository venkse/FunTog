import { test } from "node:test";
import { runCrewContract } from "@funtog/test-harness";
import { createCrew } from "../src/index";

// RED until implemented. Green = your service satisfies its contract.
test("crew-identity satisfies its contract", async () => {
  await runCrewContract(createCrew());
});

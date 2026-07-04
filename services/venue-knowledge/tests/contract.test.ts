import { test } from "node:test";
import { runVenueContract } from "@funtog/test-harness";
import { createVenue } from "../src/index";

// RED until implemented. Green = your service satisfies its contract.
test("venue-knowledge satisfies its contract", async () => {
  await runVenueContract(createVenue());
});

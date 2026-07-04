import { test } from "node:test";
import { runSuggestionContract } from "@funtog/test-harness";
import { mockVenue } from "@funtog/mocks";
import { createSuggestion } from "../src/index";

test("suggestion-engine satisfies its contract", async () => {
  await runSuggestionContract(createSuggestion({ venue: mockVenue }));
});

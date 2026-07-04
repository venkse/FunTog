import { test } from "node:test";
import { runCharacterContract } from "@funtog/test-harness";
import { mockMemory } from "@funtog/mocks";
import { createCharacter } from "../src/index";

test("character-engine satisfies its contract", async () => {
  await runCharacterContract(createCharacter({ memory: mockMemory }));
});

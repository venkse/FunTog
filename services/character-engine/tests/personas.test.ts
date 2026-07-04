import { test } from "node:test";
import assert from "node:assert/strict";
import { REGISTRY, getPack } from "../src/persona-registry";
import { createCharacter } from "../src/index";
import { mockMemory } from "@funtog/mocks";
import type { Mood } from "@funtog/contracts";

const MOODS: Mood[] = ["idle","plotting","tada","wink","thinking","mischief","smug","cheer"];
const NEW = ["momo","pip","lumi","boo","dizzy","koko"] as const;

test("all lineup personas are registered with a complete 8-mood sprite map", () => {
  for (const id of NEW) {
    const pack = REGISTRY[id];
    assert.ok(pack, `${id} registered`);
    assert.equal(pack.id, id);
    for (const m of MOODS) assert.ok(pack.sprites[m]?.length, `${id} has a sprite for ${m}`);
    assert.ok(pack.flair.length >= 3, `${id} has plan-name flair`);
    for (const d of Object.values(pack.dials)) assert.ok(d >= 0 && d <= 1, `${id} dials in range`);
  }
});

test("every persona can be chosen and drives rendering (choice persists via Memory)", async () => {
  for (const id of NEW) {
    const character = createCharacter({ memory: mockMemory });
    const crewId = `crew_${id}`;
    await character.setPersona(crewId, id);
    const state = await mockMemory.getPersonaState(crewId);
    assert.equal((state.overrides as { persona?: string }).persona, id, `${id} persisted as override`);
    const voice = await character.render(crewId, [{ id: "p1", arc: "small plates -> lively bar", stops: [] }]);
    assert.ok((voice.plans?.length ?? 0) > 0 && voice.plans![0].pitch.length > 0, `${id} renders voice`);
    assert.ok(MOODS.includes(voice.mood!), `${id} emits a known mood`);
  }
});

test("unknown persona ids fall back to the default pack instead of crashing", () => {
  assert.equal(getPack("does-not-exist").id, "troublemaker");
  assert.equal(getPack(undefined).id, "troublemaker");
});

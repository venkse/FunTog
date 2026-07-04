import { test } from "node:test";
import assert from "node:assert/strict";
import type { MemoryService, PersonaState, PersonaDelta, NightRecord, LedgerSnapshot, PlanCandidate } from "@funtog/contracts";
import { mockMemory } from "@funtog/mocks";
import { createCharacter, resolvePersona, guardVoicePacket, makeEvolutionConsumer } from "../src/index";

const plans: PlanCandidate[] = [
  { id: "p1", arc: "small plates -> wine bar", stops: [] },
  { id: "p2", arc: "straight to the main event", stops: [] },
  { id: "p3", arc: "wildcard", stops: [] },
];

// ---- DEFINING DECISION: precedence override > learned > base ----
test("resolver: learned beats base, override beats learned", () => {
  const state: PersonaState = {
    crewId: "c", basePersonaId: "troublemaker", basePersonaVersion: "1.0.0",
    learnedDeltas: { dials: { chaos: 0.4 }, level: 5 },
    overrides: { dials: { chaos: 0.1 } },
  };
  const eff = resolvePersona(state);
  assert.equal(eff.dials.chaos, 0.1, "override wins");
  assert.equal(eff.level, 5);
});
test("resolver: overrides.persona outranks basePersonaId", () => {
  const eff = resolvePersona({ crewId: "c", basePersonaId: "troublemaker", basePersonaVersion: "1.0.0",
    learnedDeltas: {}, overrides: { persona: "planner" } });
  assert.equal(eff.pack.id, "planner");
});

// ---- render emits valid voiced plans + moods ----
test("render: voices every input plan with a mood, guarded", async () => {
  const ch = createCharacter({ memory: mockMemory });
  const vp = await ch.render("c1", plans);
  assert.equal(vp.plans?.length, 3);
  assert.ok(vp.mood, "packet carries an overall mood");
  for (const pv of vp.plans!) { assert.ok(pv.name && pv.tagline && pv.pitch && pv.mood); }
});

// ---- safety guard drops out-of-set plans + fills gaps + normalises mood ----
test("safety guard: filters unknown planIds, fills empties, normalises mood", () => {
  const out = guardVoicePacket(
    { mood: "banana" as never, plans: [
      { planId: "p1", name: "", tagline: "ok", pitch: "ok", mood: "nope" as never },
      { planId: "ghost", name: "x", tagline: "y", pitch: "z" },
    ]},
    new Set(["p1"]),
  );
  assert.equal(out.plans?.length, 1, "unknown planId dropped");
  assert.equal(out.plans![0].planId, "p1");
  assert.ok(out.plans![0].name.length > 0, "empty name filled");
  assert.equal(out.plans![0].mood, "mischief", "bad mood normalised");
  assert.equal(out.mood, "plotting", "bad packet mood normalised");
});

// ---- setOverrides / setPersona persist via Memory.declareOverride (contracts 0.1.0 wiring) ----
test("setOverrides + setPersona persist as declared overrides in Memory", async () => {
  const declared: Record<string, unknown>[] = [];
  const mem: MemoryService = { ...mockMemory, async declareOverride(_c, ov) { declared.push(ov); } };
  const ch = createCharacter({ memory: mem });
  await ch.setPersona("c1", "planner");
  await ch.setOverrides("c1", { dials: { chaos: 0.2 } });
  assert.deepEqual(declared[0], { persona: "planner" });
  assert.deepEqual(declared[1], { dials: { chaos: 0.2 } });
});

// ---- evolution writes a BOUNDED delta and never exceeds the cap ----
test("evolution: chaotic pick nudges chaos up, clamped to the cap", async () => {
  let written: PersonaDelta | undefined;
  const mem: MemoryService = {
    ...mockMemory,
    async getPersonaState(crewId): Promise<PersonaState> {
      return { crewId, basePersonaId: "troublemaker", basePersonaVersion: "1.0.0", learnedDeltas: { dials: { chaos: 0.89 } }, overrides: {} };
    },
    async writePersonaDelta(d) { written = d; },
  };
  const onNight = makeEvolutionConsumer(mem);
  const rec: NightRecord = {
    nightId: "n1", crewId: "c1", timestamp: "t", sparkInput: {},
    candidatePlans: plans, votes: [], verdict: { type: "winner", planId: "p3" }, // p3 = wildcard (last)
  };
  await onNight(rec);
  const chaos = (written!.delta.dials as Record<string, number>).chaos;
  assert.ok(chaos <= 0.9 && chaos > 0.89, "bounded nudge up, capped at 0.9");
});

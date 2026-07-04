import { test } from "node:test";
import assert from "node:assert/strict";
import type { VenueService, PlanRequest, SlotSpec } from "@funtog/contracts";
import { mockVenue } from "@funtog/mocks";
import { createSuggestion, templateStructureModel, refinePlan } from "../src/index";
import type { StructureModel } from "../src/structure-model";

const req = (mode: "shapes" | "grounded", veg = false): PlanRequest =>
  ({ crewId: "c1", vibe: "big night", crewConstraints: veg ? { veg: true } : {}, groundingMode: mode });

// ---- DEFINING DECISION: the model produces SLOTS, never facts ----
test("structure model emits slots (venue shapes), never names or venues", () => {
  const skeletons = templateStructureModel.generate({ vibe: "big night", constraints: { veg: true }, groundingMode: "shapes" });
  assert.ok(skeletons.length >= 1);
  for (const sk of skeletons) for (const s of sk.stops) {
    assert.ok(s.slot.venueType, "stop carries a typed slot");
    assert.ok(!("venue" in s), "no real venue at structure phase");
    assert.ok(!("name" in s.slot), "slots are shapes, not names");
  }
});

// ---- shapes mode: neutral plans with slots ----
test("shapes mode: neutral plans, slots not venues", async () => {
  const s = createSuggestion({ venue: mockVenue });
  const plans = await s.generatePlans(req("shapes"));
  assert.ok(plans.length >= 1);
  for (const p of plans) {
    assert.deepEqual(Object.keys(p).sort(), ["arc", "id", "stops"], "PlanCandidate is neutral");
    assert.ok(p.stops.every((st) => st.slot && !st.venue), "shapes carry slots, not venues");
  }
});

// ---- grounded mode: slots bound to real venues from the Venue service ----
test("grounded mode: stops bound to resolver venues", async () => {
  const s = createSuggestion({ venue: mockVenue });
  const plans = await s.generatePlans(req("grounded"));
  assert.ok(plans.some((p) => p.stops.every((st) => !!st.venue?.venueId)), "stops grounded to venues");
});

// ---- semantic cache: identical request served from cache ----
test("cache: identical request hits the cache (model called once)", async () => {
  let calls = 0;
  const model: StructureModel = { generate(ctx) { calls++; return templateStructureModel.generate(ctx); } };
  const s = createSuggestion({ venue: mockVenue, model });
  const a = await s.generatePlans(req("shapes"));
  const b = await s.generatePlans(req("shapes"));
  assert.equal(calls, 1, "second identical request served from cache");
  assert.deepEqual(a, b);
});

// ---- feasibility/repair: relax mustHave and retry, capped ----
test("repair: infeasible-with-constraint relaxes and grounds", async () => {
  const picky: VenueService = {
    async resolveVenues(slots: SlotSpec[]) {
      if (slots.some((s) => s.mustHave?.length)) return []; // infeasible while constrained
      return slots.map((s, i) => ({ venueId: `v${i}`, name: `A ${s.venueType}` }));
    },
  };
  const s = createSuggestion({ venue: picky });
  const plans = await s.generatePlans(req("grounded", true)); // veg → mustHave set
  assert.ok(plans[0].stops.every((st) => !!st.venue), "repair relaxed mustHave and bound venues");
});

// ---- degradation: Venue down → fall back to shapes ----
test("degradation: Venue down → grounded request falls back to shapes", async () => {
  const down: VenueService = { async resolveVenues() { throw new Error("venue down"); } };
  const s = createSuggestion({ venue: down });
  const plans = await s.generatePlans(req("grounded"));
  assert.ok(plans[0].stops.every((st) => !!st.slot), "fell back to shapes, core still produced plans");
});

// ---- refinement (stateless, neutral) ----
test("refinePlan: fewer drops a stop; cheaper sets band; quieter softens the venueType", () => {
  const base = { id: "p1", arc: "x", stops: [
    { time: "20:00", slot: { venueType: "lively bar", priceBand: "$$" } },
    { time: "21:30", slot: { venueType: "late spot" } },
  ]};
  assert.equal(refinePlan(base, "fewer stops").stops.length, 1);
  assert.equal(refinePlan(base, "make it cheaper").stops[0].slot!.priceBand, "$");
  assert.match(refinePlan(base, "quieter please").stops[0].slot!.venueType, /low-key/);
});

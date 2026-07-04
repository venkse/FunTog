import assert from "node:assert/strict";
import type { SuggestionService, PlanRequest } from "@funtog/contracts";

const req: PlanRequest = { crewId: "c1", vibe: "big night", crewConstraints: { veg: true }, groundingMode: "shapes" };

export async function runSuggestionContract(impl: SuggestionService): Promise<void> {
  const plans = await impl.generatePlans(req);
  assert.ok(Array.isArray(plans) && plans.length >= 1, "generatePlans returns >= 1 plan");
  for (const p of plans) {
    assert.ok(p.id, "plan has id");
    assert.equal(typeof p.arc, "string", "plan has an arc");
    assert.ok(Array.isArray(p.stops) && p.stops.length >= 1, "plan has stops");
    const keys = Object.keys(p as Record<string, unknown>);
    for (const banned of ["name", "tagline", "pitch"]) {
      assert.ok(!keys.includes(banned), `PlanCandidate must be NEUTRAL (no "${banned}" — that's Character's job)`);
    }
  }
  const refined = await impl.refinePlan(plans[0], "make it quieter");
  assert.ok(refined && refined.id, "refinePlan returns a plan");
}

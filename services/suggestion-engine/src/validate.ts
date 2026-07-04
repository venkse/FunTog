import type { PlanCandidate, PlanStop } from "@funtog/contracts";
import type { PlanSkeleton } from "./structure-model";
import type { GroundedPlan } from "./grounding";

/** NEUTRAL output only: { id, arc, stops }. No name/tagline/pitch ever — that's Character's job. */
export function shapesToCandidate(id: string, sk: PlanSkeleton): PlanCandidate {
  return { id, arc: sk.arc, stops: sk.stops.map((s): PlanStop => ({ time: s.time, slot: s.slot })) };
}

export function groundedToCandidate(id: string, gp: GroundedPlan, resolvedIds: Set<string>): PlanCandidate {
  // belt-and-suspenders: only venues that came from the resolver survive
  const stops = gp.stops
    .filter((s) => resolvedIds.has(s.venue.venueId))
    .map((s): PlanStop => ({ time: s.time, venue: s.venue, satisfiedConstraints: s.satisfiedConstraints }));
  return { id, arc: gp.arc, stops };
}

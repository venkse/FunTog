import type { VenueService, VenueRef, PlanRequest } from "@funtog/contracts";
import type { PlanSkeleton } from "./structure-model";

export interface GroundedStop { time: string; venue: VenueRef; satisfiedConstraints?: string[]; }
export interface GroundedPlan { arc: string; stops: GroundedStop[]; }

const MAX_REPAIR = 2; // cap: a runaway repair loop is a tail-latency risk

/**
 * Phase 2. Bind each slot to a real venue via the Venue service, then run a CAPPED feasibility +
 * repair loop. If a slot can't be bound, relax `mustHave` and retry (bounded). If still infeasible
 * after the cap, return null so the caller keeps the plan as shapes (graceful degrade).
 * No-invented-venues: venues come ONLY from `resolveVenues` output — never from the model.
 */
export async function groundSkeleton(sk: PlanSkeleton, req: PlanRequest, venue: VenueService): Promise<GroundedPlan | null> {
  let stops = sk.stops;
  for (let attempt = 0; attempt <= MAX_REPAIR; attempt++) {
    const venues = await venue.resolveVenues(stops.map((s) => s.slot), req.area ?? "", req.crewConstraints ?? {});
    const feasible = venues.length >= stops.length && stops.every((_, i) => !!venues[i]?.venueId);
    if (feasible) {
      return { arc: sk.arc, stops: stops.map((s, i) => ({ time: s.time, venue: venues[i], satisfiedConstraints: s.slot.mustHave })) };
    }
    stops = stops.map((s) => ({ ...s, slot: { ...s.slot, mustHave: undefined } })); // repair: relax + retry
  }
  return null;
}

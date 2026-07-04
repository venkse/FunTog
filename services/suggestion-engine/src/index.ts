import type { SuggestionService, PlanRequest, PlanCandidate, VenueService } from "@funtog/contracts";
import { assembleContext, cacheKey } from "./context";
import { InMemoryPlanCache, type PlanCache } from "./cache";
import { templateStructureModel, type StructureModel } from "./structure-model";
import { groundSkeleton } from "./grounding";
import { shapesToCandidate, groundedToCandidate } from "./validate";
import { refinePlan as refine } from "./refine";

export interface SuggestionDeps {
  venue: VenueService;
  model?: StructureModel;   // default: deterministic template (also the LLM-down fallback)
  cache?: PlanCache;        // default: in-memory
}

/**
 * Suggestion Engine. Two-phase, STATELESS given the PlanRequest: structure (model) → grounding
 * (Venue) → feasibility/repair → neutral PlanCandidates. Emits NEUTRAL plans only; Character voices.
 */
export function createSuggestion(deps: SuggestionDeps): SuggestionService {
  const model = deps.model ?? templateStructureModel;
  const cache = deps.cache ?? new InMemoryPlanCache();

  return {
    async generatePlans(req: PlanRequest): Promise<PlanCandidate[]> {
      const ctx = assembleContext(req);
      const key = cacheKey(ctx);
      const hit = cache.get(key);
      if (hit) return hit.map(clone);

      let skeletons;
      try { skeletons = await model.generate(ctx); if (!skeletons?.length) throw new Error("empty"); }
      catch { skeletons = templateStructureModel.generate(ctx); } // LLM down → template shapes

      const plans: PlanCandidate[] = [];
      for (let i = 0; i < skeletons.length; i++) {
        const id = `p${i + 1}`;
        if (req.groundingMode === "grounded") {
          let grounded = null;
          try { grounded = await groundSkeleton(skeletons[i], req, deps.venue); }
          catch { grounded = null; } // Venue down → shapes mode
          if (grounded) {
            const resolvedIds = new Set(grounded.stops.map((s) => s.venue.venueId));
            plans.push(groundedToCandidate(id, grounded, resolvedIds));
            continue;
          }
        }
        plans.push(shapesToCandidate(id, skeletons[i]));
      }

      cache.set(key, plans);
      return plans.map(clone);
    },

    async refinePlan(plan, feedback) { return refine(plan, feedback); },
  };
}

const clone = <T,>(x: T): T => structuredClone(x);

export { templateStructureModel } from "./structure-model";
export { groundSkeleton } from "./grounding";
export { shapesToCandidate, groundedToCandidate } from "./validate";
export { refinePlan } from "./refine";
export { assembleContext, cacheKey } from "./context";
export { InMemoryPlanCache } from "./cache";

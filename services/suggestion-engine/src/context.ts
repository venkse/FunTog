import type { PlanRequest } from "@funtog/contracts";

export interface GenContext {
  vibe: string;
  area?: string;
  budget?: string;
  constraints: PlanRequest["crewConstraints"];
  personaHints?: Record<string, unknown>;
  groundingMode: PlanRequest["groundingMode"];
}

export function assembleContext(req: PlanRequest): GenContext {
  return {
    vibe: req.vibe, area: req.area, budget: req.budget,
    constraints: req.crewConstraints ?? {}, personaHints: req.personaHints,
    groundingMode: req.groundingMode,
  };
}

/** Semantic cache key: same request shape → same plans. The cache is the scaling lever. */
export function cacheKey(ctx: GenContext): string {
  return JSON.stringify([ctx.vibe, ctx.area ?? "", ctx.budget ?? "", ctx.constraints, ctx.groundingMode, ctx.personaHints ?? {}]);
}

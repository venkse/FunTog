import type { PlanCandidate } from "@funtog/contracts";
export function assertNeutralPlanCandidate(p: PlanCandidate): void {
  if (!p.id || !p.arc || !Array.isArray(p.stops)) throw new Error("PlanCandidate shape invalid");
  if ("name" in (p as Record<string, unknown>)) throw new Error("PlanCandidate must be neutral");
}

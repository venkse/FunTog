import type { PlanCandidate } from "@funtog/contracts";

export interface PlanCache {
  get(key: string): PlanCandidate[] | undefined;
  set(key: string, value: PlanCandidate[]): void;
}

/** In-memory for the pilot. Swap for a shared cache (Redis-like) — same interface, fleet-wide hit-ratio. */
export class InMemoryPlanCache implements PlanCache {
  private m = new Map<string, PlanCandidate[]>();
  get(key: string) { return this.m.get(key); }
  set(key: string, value: PlanCandidate[]) { this.m.set(key, value); }
}

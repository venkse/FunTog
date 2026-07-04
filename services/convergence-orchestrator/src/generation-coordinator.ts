import type {
  SuggestionService, CharacterService, PlanRequest, PlanCandidate, VoicePacket,
} from "@funtog/contracts";

export interface GenCoordOptions { timeoutMs?: number; failureThreshold?: number; }

/**
 * The circuit breaker that ISOLATES the deterministic core from the probabilistic generation tier.
 * Plans: returns real candidates, or a template fallback on timeout/failure/open-circuit — so a
 * session can ALWAYS open and proceed. Voice: pure enrichment; on any failure it returns undefined
 * and the core carries on. Generation enriches; it never blocks votes/verdict/wheel.
 */
export class GenerationCoordinator {
  private suggestionFails = 0;
  private characterFails = 0;
  private readonly timeoutMs: number;
  private readonly threshold: number;

  constructor(
    private suggestion: SuggestionService,
    private character: CharacterService,
    opts: GenCoordOptions = {},
  ) {
    this.timeoutMs = opts.timeoutMs ?? 1500;
    this.threshold = opts.failureThreshold ?? 3;
  }

  async plans(req: PlanRequest): Promise<{ plans: PlanCandidate[]; degraded: boolean }> {
    if (this.suggestionFails >= this.threshold) return { plans: templatePlans(), degraded: true };
    try {
      const plans = await withTimeout(this.suggestion.generatePlans(req), this.timeoutMs);
      if (!plans || plans.length === 0) throw new Error("empty plan set");
      this.suggestionFails = 0;
      return { plans, degraded: false };
    } catch {
      this.suggestionFails++;
      return { plans: templatePlans(), degraded: true };
    }
  }

  async voice(crewId: string, plans: PlanCandidate[]): Promise<VoicePacket | undefined> {
    if (this.characterFails >= this.threshold) return undefined;
    try {
      const vp = await withTimeout(this.character.render(crewId, plans), this.timeoutMs);
      this.characterFails = 0;
      return vp;
    } catch {
      this.characterFails++;
      return undefined; // enrichment only
    }
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("generation timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/** deterministic, on-shape neutral plans so the core never stalls when generation is down. */
export function templatePlans(): PlanCandidate[] {
  const mk = (id: string, arc: string): PlanCandidate => ({
    id, arc, stops: [
      { time: "20:00", slot: { venueType: "easy first stop" } },
      { time: "21:30", slot: { venueType: "the main event", walkableFromPrev: true } },
    ],
  });
  return [mk("t1", "low-key start → main event"), mk("t2", "straight to the main event"), mk("t3", "wildcard")];
}

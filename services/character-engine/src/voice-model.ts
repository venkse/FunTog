import type { PlanCandidate, PlanVoice, Tally, LedgerSnapshot } from "@funtog/contracts";
import type { EffectivePersona } from "./persona-resolver";
import { planMood } from "./persona-resolver";

/**
 * The generation seam. The hot path calls a VoiceModel; in production this is LLM-backed. The
 * default is a deterministic TEMPLATE model — it makes render testable, and it is also the
 * degradation fallback when an injected model times out or fails (LLM down → on-brand template).
 */
export interface VoiceModel {
  renderPlans(p: EffectivePersona, plans: PlanCandidate[]): Promise<PlanVoice[]> | PlanVoice[];
  mediate(p: EffectivePersona, tally: Tally, ledger: LedgerSnapshot): Promise<{ read: string }> | { read: string };
}

export const templateVoiceModel: VoiceModel = {
  renderPlans(p, plans) {
    return plans.map((plan, i) => {
      const flair = p.pack.flair[i % p.pack.flair.length];
      return {
        planId: plan.id,
        name: `The ${flair}`,
        tagline: p.dials.chaos > 0.5 ? "starts mellow, ends mischievous" : "easy, warm, just right",
        pitch: pitchFor(plan, p),
        mood: planMood(i),
      };
    });
  },
  mediate(p, tally) {
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    const lead = top ? `${top[0]} is out front` : "nobody's committed yet";
    return { read: p.dials.brevity > 0.5 ? `${lead}. Let's settle it.` : `Reading the room — ${lead}, but it's close.` };
  },
};

function pitchFor(plan: PlanCandidate, p: EffectivePersona): string {
  const arc = plan.arc || "a proper night";
  return p.dials.chaos > 0.5 ? `trust me: ${arc}. you'll thank me later.` : `${arc}. comfortable, but not boring.`;
}

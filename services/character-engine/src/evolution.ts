import type { MemoryService, NightRecord } from "@funtog/contracts";

const CHAOS_CAP = 0.9, CHAOS_FLOOR = 0.3;
const UP = 0.05, DOWN = 0.02;

/**
 * Cold path (async, decoupled from render). Consumes the NightRecord stream, extracts a bounded
 * signal, and writes a PersonaDelta to Memory. Deltas are BOUNDED + REVERSIBLE: they only nudge
 * dials within a pack's range; they never change identity (the pack). Wire this to Memory's
 * NightRecord stream; it shares only the PersonaState store with the hot path.
 */
export function makeEvolutionConsumer(memory: MemoryService) {
  return async function onNightRecord(rec: NightRecord): Promise<void> {
    if (rec.verdict.type !== "winner") return; // only learn from decisive nights (wheel = chance)
    const state = await memory.getPersonaState(rec.crewId);
    const dials = ((state.learnedDeltas?.dials as Record<string, number>) ?? {});
    const cur = typeof dials.chaos === "number" ? dials.chaos : 0.62;

    const idx = rec.candidatePlans.findIndex((p) => p.id === (rec.verdict as { planId: string }).planId);
    const choseWildcard = idx >= 0 && idx === rec.candidatePlans.length - 1;
    const next = clamp(choseWildcard ? cur + UP : cur - DOWN, CHAOS_FLOOR, CHAOS_CAP);
    if (next === cur) return;

    await memory.writePersonaDelta({
      crewId: rec.crewId,
      delta: { dials: { ...dials, chaos: next } },
      reason: choseWildcard ? "crew leaned chaotic" : "crew leaned steady",
    });
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

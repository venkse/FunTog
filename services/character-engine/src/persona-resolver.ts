import type { PersonaState, Mood } from "@funtog/contracts";
import { getPack, type PersonaPack, type Dials } from "./persona-registry";

export interface EffectivePersona {
  pack: PersonaPack;
  dials: Dials;
  level: number;
}

/**
 * THE defining decision: precedence override > learned > base.
 * - base pack comes from state.basePersonaId, but an explicit `overrides.persona` outranks it
 * - dials start at the pack's base, then learned deltas, then overrides (override wins per key)
 */
export function resolvePersona(state: PersonaState): EffectivePersona {
  const overrides = (state.overrides ?? {}) as Record<string, unknown>;
  const learned = (state.learnedDeltas ?? {}) as Record<string, unknown>;

  const pack = getPack((overrides.persona as string) ?? state.basePersonaId);

  const dials: Dials = { ...pack.dials };
  applyDials(dials, learned.dials);     // learned beats base
  applyDials(dials, overrides.dials);   // override beats learned

  const level = typeof learned.level === "number" ? learned.level : 0;
  return { pack, dials, level };
}

function applyDials(into: Dials, from: unknown): void {
  if (!from || typeof from !== "object") return;
  for (const k of ["chaos", "warmth", "brevity"] as const) {
    const v = (from as Record<string, unknown>)[k];
    if (typeof v === "number") into[k] = clamp01(v);
  }
}
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** map a beat + dials to a mood the sprite will animate. */
export function moodForReveal(p: EffectivePersona): Mood { return p.dials.chaos > 0.5 ? "plotting" : "thinking"; }
export function moodForMediate(owed: boolean): Mood { return owed ? "thinking" : "smug"; }
export function planMood(i: number): Mood { return (["mischief", "smug", "wink"] as Mood[])[i % 3]; }

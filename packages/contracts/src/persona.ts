import type { PersonaState } from "./memory";

export interface EffectivePersona {
  basePersonaId: string;
  basePersonaVersion: string;
  resolved: Record<string, unknown>;
}

// CANONICAL persona resolution. Strict precedence: override > learned > base.
// Customization steers; evolution drifts; the steer always wins.
export function resolveEffectivePersona(s: PersonaState): EffectivePersona {
  return {
    basePersonaId: s.basePersonaId,
    basePersonaVersion: s.basePersonaVersion,
    resolved: { ...(s.learnedDeltas ?? {}), ...(s.overrides ?? {}) }, // overrides spread last -> win
  };
}

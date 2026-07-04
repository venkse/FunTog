import type { NightRecord, PersonaDelta, PersonaState } from "@funtog/contracts";

const BASE_PERSONA_ID = "troublemaker";
const BASE_PERSONA_VERSION = "1.0.0";

/**
 * Persona state folded from the log: base + learned deltas + overrides.
 * - `level` grows with shared history (a "power" the crew unlocks over nights)
 * - learned deltas merge in event order (later wins per key)
 * - declared overrides merge in event order and are returned as `overrides` — the highest-
 *   precedence layer (override > learned > base). Memory only records them; Character applies
 *   precedence at resolution.
 */
export function foldPersona(
  crewId: string,
  nights: NightRecord[],
  deltas: PersonaDelta[],
  declaredOverrides: Record<string, unknown>[] = [],
): PersonaState {
  const learnedDeltas: Record<string, unknown> = { level: nights.length };
  for (const d of deltas) Object.assign(learnedDeltas, d.delta);

  const overrides: Record<string, unknown> = {};
  for (const ov of declaredOverrides) Object.assign(overrides, ov); // later declaration wins

  return {
    crewId,
    basePersonaId: BASE_PERSONA_ID,
    basePersonaVersion: BASE_PERSONA_VERSION,
    learnedDeltas,
    overrides,
  };
}

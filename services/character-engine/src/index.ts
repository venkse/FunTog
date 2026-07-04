import type {
  CharacterService, MemoryService, PlanCandidate, PersonaState, VoicePacket, Tally, LedgerSnapshot,
} from "@funtog/contracts";
import { resolvePersona, moodForReveal, moodForMediate } from "./persona-resolver";
import { templateVoiceModel, type VoiceModel } from "./voice-model";
import { guardVoicePacket } from "./safety-guard";
import { makeEvolutionConsumer } from "./evolution";

export interface CharacterDeps {
  memory: MemoryService;
  model?: VoiceModel;       // default: deterministic template (also the LLM-down fallback)
}

const BASE_STATE = (crewId: string): PersonaState => ({
  crewId, basePersonaId: "troublemaker", basePersonaVersion: "1.0.0", learnedDeltas: {}, overrides: {},
});

/**
 * Character Engine. Hot render path (persona resolve → model → guard) is decoupled from the cold
 * evolution path (NightRecord stream → bounded delta). It VOICES the verdict; it never decides it.
 */
export function createCharacter(deps: CharacterDeps): CharacterService {
  const model = deps.model ?? templateVoiceModel;

  async function persona(crewId: string): Promise<PersonaState> {
    try { return await deps.memory.getPersonaState(crewId); }
    catch { return BASE_STATE(crewId); } // persona read down → base
  }

  return {
    async render(crewId, plans: PlanCandidate[]): Promise<VoicePacket> {
      const eff = resolvePersona(await persona(crewId));
      let voiced;
      try { voiced = await model.renderPlans(eff, plans); }
      catch { voiced = templateVoiceModel.renderPlans(eff, plans); } // LLM down → template
      const packet: VoicePacket = { intro: introLine(eff.level), mood: moodForReveal(eff), plans: voiced };
      return guardVoicePacket(packet, new Set(plans.map((p) => p.id)));
    },

    async mediate(crewId, tally: Tally, ledger: LedgerSnapshot): Promise<VoicePacket> {
      const eff = resolvePersona(await persona(crewId));
      const owed = mostOwed(ledger);
      let read: string;
      try { read = (await model.mediate(eff, tally, ledger)).read; }
      catch { read = templateVoiceModel.mediate(eff, tally, ledger).read; }
      const packet: VoicePacket = {
        read, mood: moodForMediate(!!owed),
        advocacy: owed ? { for: owed, line: `${owed}'s been overruled lately — let's lean their way.` } : null,
      };
      return guardVoicePacket(packet, new Set());
    },

    // declared intent is event-sourced in Memory (contracts 0.1.0). The resolver reads it back as
    // the highest-precedence layer; an explicit persona choice is itself an override.
    async setPersona(crewId, personaId) { await deps.memory.declareOverride(crewId, { persona: personaId }, "user chose persona"); },
    async setOverrides(crewId, overrides) { await deps.memory.declareOverride(crewId, overrides, "user override"); },
  };
}

function introLine(level: number): string {
  return level >= 3 ? "You know the drill. Three ways to make tonight a story:" : "Alright, three flavours of trouble:";
}
function mostOwed(ledger: LedgerSnapshot): string | undefined {
  let best: { id: string; streak: number } | undefined;
  for (const m of ledger.members) {
    if (m.streak > 0 && (!best || m.streak > best.streak)) best = { id: m.memberId, streak: m.streak };
  }
  return best?.id;
}

// re-exports for tests / wiring
export { resolvePersona } from "./persona-resolver";
export { guardVoicePacket } from "./safety-guard";
export { templateVoiceModel } from "./voice-model";
export { makeEvolutionConsumer } from "./evolution";
export { REGISTRY, getPack } from "./persona-registry";

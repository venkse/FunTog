// The executable contract: each subsystem implements its interface; mocks implement it too.
import type { PlanRequest, PlanCandidate, SlotSpec, VenueRef, CrewConstraints } from "./plans";
import type { VoicePacket } from "./voice";
import type { Vote, Tally, SessionState } from "./session";
import type { NightRecord, LedgerSnapshot, PersonaState, PersonaDelta } from "./memory";
import type { CrewProfile } from "./crew";

export interface SuggestionService {
  generatePlans(req: PlanRequest): Promise<PlanCandidate[]>;
  refinePlan(plan: PlanCandidate, feedback: string): Promise<PlanCandidate>;
}

export interface CharacterService {
  render(crewId: string, plans: PlanCandidate[]): Promise<VoicePacket>;
  mediate(crewId: string, tally: Tally, ledger: LedgerSnapshot): Promise<VoicePacket>;
  setPersona(crewId: string, personaId: string): Promise<void>;
  // Must persist via MemoryService.declareOverride so declared intent is event-sourced.
  setOverrides(crewId: string, overrides: Record<string, unknown>): Promise<void>;
}

export interface MemoryService {
  appendNightRecord(r: NightRecord): Promise<void>;
  writePersonaDelta(d: PersonaDelta): Promise<void>;
  /**
   * Persist a declared-intent override for the crew's persona. Stored as an immutable
   * `override_declared` event and folded into PersonaState.overrides, which ALWAYS wins at
   * resolution (precedence: override > learned > base). Added in contracts 0.1.0.
   */
  declareOverride(crewId: string, overrides: Record<string, unknown>, reason?: string): Promise<void>;
  getLedgerSnapshot(crewId: string): Promise<LedgerSnapshot>;
  getPersonaState(crewId: string): Promise<PersonaState>;
  getCrewTimeline(crewId: string): Promise<unknown>;
}

export interface VenueService {
  resolveVenues(slots: SlotSpec[], area: string, constraints: CrewConstraints): Promise<VenueRef[]>;
}

export interface CrewService {
  createCrew(name?: string): Promise<CrewProfile>;
  joinByLink(token: string): Promise<{ sessionId: string }>;
}

export interface OrchestratorService {
  openSession(crewId: string, sparkInput: Record<string, unknown>): Promise<{ sessionId: string; joinToken: string }>;
  castVote(v: Vote): Promise<void>;
  converge(sessionId: string): Promise<void>;
  getState(sessionId: string): Promise<SessionState>;
}

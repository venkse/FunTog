import type { SessionPhase } from "./session";

// CANONICAL session lifecycle. The state machine IS the Orchestrator's contract.
export const LEGAL_TRANSITIONS: Record<SessionPhase, SessionPhase[]> = {
  draft: ["gathering", "cancelled"],
  gathering: ["gathering", "converging", "cancelled"],
  converging: ["resolved", "spinning"],
  spinning: ["resolved"],
  resolved: ["archived"],
  archived: [],
  cancelled: [],
};

export function isLegalTransition(from: SessionPhase, to: SessionPhase): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

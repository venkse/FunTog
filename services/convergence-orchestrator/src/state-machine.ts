import type { SessionPhase } from "@funtog/contracts";

/**
 * The session state machine IS the contract. Every mutation is a guarded transition; nothing
 * skips a phase. draft → gathering → converging → (spinning) → resolved → archived.
 */
const LEGAL: Record<SessionPhase, SessionPhase[]> = {
  draft:      ["gathering", "cancelled"],
  gathering:  ["converging", "cancelled"],
  converging: ["resolved", "spinning", "cancelled"],
  spinning:   ["resolved", "cancelled"],
  resolved:   ["archived"],
  archived:   [],
  cancelled:  [],
};

export function canTransition(from: SessionPhase, to: SessionPhase): boolean {
  return LEGAL[from]?.includes(to) ?? false;
}
export function assertTransition(from: SessionPhase, to: SessionPhase): void {
  if (!canTransition(from, to)) throw new Error(`illegal session transition: ${from} -> ${to}`);
}

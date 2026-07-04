import type { PlanCandidate } from "./plans";
import type { VoicePacket } from "./voice";

export type SessionPhase =
  | "draft" | "gathering" | "converging" | "spinning" | "resolved" | "archived" | "cancelled";

export interface Vote {
  sessionId: string;
  memberId: string;
  planId: string;
  clientSeq: number;          // for idempotency / last-write-wins
}

export type Tally = Record<string, number>;

export type Verdict =
  | { type: "winner"; planId: string; fairnessFor?: string }
  | { type: "wheel"; contenders: string[] };

export interface WheelResult {
  planId: string;
  seed: string;               // verifiable, stored in NightRecord
}

export interface SessionState {
  sessionId: string;
  crewId: string;
  phase: SessionPhase;
  candidates: PlanCandidate[];
  voice?: VoicePacket;
  tally: Tally;
  verdict?: Verdict;
  wheelResult?: WheelResult;
}

/**
 * A session's full recoverable record: the last authoritative snapshot plus the append-only vote
 * history (clientSeq preserved, so last-write-wins semantics survive a replay bit-for-bit).
 */
export interface PersistedSession {
  sessionId: string;
  crewId: string;
  sparkInput: Record<string, unknown>;
  snapshot: SessionState;
  votes: (Vote & { at: number })[];
}

/**
 * Durability port for live sessions (added in contracts 0.3.0). An orchestrator checkpoints here
 * on every state change and rehydrates on a cache miss, so a crashed or drained process can hand
 * its sessions to another one. HONEST SCOPE: this is crash-recovery and process handoff, NOT
 * concurrency control — routing must still guarantee a single live actor per sessionId
 * (single-writer). In-memory for the pilot; Redis/Postgres implement the same two methods.
 */
export interface SessionStore {
  save(s: PersistedSession): Promise<void>;
  load(sessionId: string): Promise<PersistedSession | null>;
}

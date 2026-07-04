import type { PlanCandidate } from "./plans";
import type { Verdict } from "./session";

export interface NightRecord {
  nightId: string;
  crewId: string;
  timestamp: string;
  sparkInput: Record<string, unknown>;
  candidatePlans: PlanCandidate[];
  votes: { memberId: string; planId: string }[];
  verdict: Verdict & { wheelSeed?: string };
  fairnessCall?: { for?: string; applied: boolean };
  tweaks?: unknown[];
}

export interface MemberLedger { memberId: string; got: number; overruled: number; streak: number; }
export interface LedgerSnapshot { crewId: string; members: MemberLedger[]; }

export interface PersonaState {
  crewId: string;
  basePersonaId: string;
  basePersonaVersion: string;
  learnedDeltas: Record<string, unknown>;  // dials, preferences, unlockedPowers, level
  overrides: Record<string, unknown>;       // declared intent — highest precedence
}

export interface PersonaDelta { crewId: string; delta: Record<string, unknown>; reason?: string; }

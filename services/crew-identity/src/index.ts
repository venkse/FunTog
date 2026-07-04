import { randomUUID } from "node:crypto";
import type { CrewService, CrewProfile, MemberRef } from "@funtog/contracts";
import { issueJoinToken as issue, verifyJoinToken, ringFromSecret } from "./tokens";
import { CrewStore } from "./store";

export interface CrewDeps {
  secret?: string;               // convenience: single-key ring
  keyring?: import("./tokens").Keyring;  // rotation-ready: kid → secret, with a current kid
  now?: () => number;
  idgen?: () => string;
}

// CrewService + the crew-owned extras the Orchestrator/client use at integration (token mint, the
// one-tap identity claim, membership reads). Only createCrew/joinByLink are in the frozen contract.
export interface CrewIdentity extends CrewService {
  issueJoinToken(sessionId: string, crewId: string): string;
  claimIdentity(crewId: string, displayName?: string, memberId?: string): Promise<MemberRef>;
  getCrew(crewId: string): CrewProfile | undefined;
}

/**
 * Crew + Identity. THE defining decision: join by link — no install, no account to vote. Identity is
 * a one-tap claim; the crew (organizer-owned) is durable. Tokens are signed + stateless (O(1) verify);
 * joins are idempotent; everything partitions by crewId.
 */
export function createCrew(deps: CrewDeps = {}): CrewIdentity {
  const ring = deps.keyring ?? ringFromSecret(deps.secret ?? "funtog-dev-secret");
  const now = deps.now ?? Date.now;
  const newId = deps.idgen ?? (() => randomUUID().slice(0, 8));
  const store = new CrewStore();

  return {
    async createCrew(name): Promise<CrewProfile> {
      const crewId = `crew_${newId()}`;
      return store.create(crewId, name);
    },

    async joinByLink(token): Promise<{ sessionId: string }> {
      if (token.includes(".")) {
        const claims = verifyJoinToken(token, ring);
        if (!claims) throw new Error("invalid or tampered join token");
        return { sessionId: claims.sid };                 // signed token → embedded session
      }
      return { sessionId: token };                        // opaque handle (the link IS the session ref)
    },

    issueJoinToken(sessionId, crewId) { return issue({ sid: sessionId, cid: crewId }, ring, now); },

    async claimIdentity(crewId, displayName, memberId): Promise<MemberRef> {
      const member: MemberRef = { memberId: memberId ?? `m_${newId()}`, displayName: displayName ?? "Someone" };
      return store.addMember(crewId, member);             // idempotent by memberId
    },

    getCrew(crewId) { return store.get(crewId); },
  };
}

export { issueJoinToken, verifyJoinToken, ringFromSecret } from "./tokens";
export type { Keyring } from "./tokens";

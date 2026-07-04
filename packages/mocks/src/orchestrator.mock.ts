import type { OrchestratorService, SessionState } from "@funtog/contracts";

let phase: SessionState["phase"] = "gathering";

export const mockOrchestrator: OrchestratorService = {
  async openSession() { phase = "gathering"; return { sessionId: "s1", joinToken: "t1" }; },
  async castVote() {},
  async converge() { phase = "resolved"; },
  async getState(sessionId): Promise<SessionState> {
    return {
      sessionId, crewId: "c1", phase,
      candidates: [{ id: "p1", arc: "a -> b", stops: [{ time: "20:00" }] }],
      tally: { p1: 1 },
      verdict: { type: "winner", planId: "p1" },
    };
  },
};

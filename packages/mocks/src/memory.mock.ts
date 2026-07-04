import type { MemoryService, LedgerSnapshot, PersonaState } from "@funtog/contracts";

// minimally stateful so declared overrides surface on read (contract-faithful, not a reference impl)
const declaredOverrides = new Map<string, Record<string, unknown>>();

export const mockMemory: MemoryService = {
  async appendNightRecord() {},
  async writePersonaDelta() {},
  async declareOverride(crewId, overrides) {
    declaredOverrides.set(crewId, { ...(declaredOverrides.get(crewId) ?? {}), ...overrides });
  },
  async getLedgerSnapshot(crewId): Promise<LedgerSnapshot> {
    return { crewId, members: [
      { memberId: "riya", got: 2, overruled: 1, streak: 0 },
      { memberId: "sam",  got: 0, overruled: 2, streak: 2 }, // owed one
      { memberId: "maya", got: 1, overruled: 1, streak: 1 },
    ]};
  },
  async getPersonaState(crewId): Promise<PersonaState> {
    return { crewId, basePersonaId: "troublemaker", basePersonaVersion: "1.0.0",
      learnedDeltas: { level: 3, prefers: ["fewer-stops"] },
      overrides: declaredOverrides.get(crewId) ?? {} };
  },
  async getCrewTimeline() { return { nights: 3, level: 3 }; },
};

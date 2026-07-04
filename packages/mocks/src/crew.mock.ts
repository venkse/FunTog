import type { CrewService } from "@funtog/contracts";

export const mockCrew: CrewService = {
  async createCrew(name) { return { crewId: "c1", name, members: [] }; },
  async joinByLink() { return { sessionId: "s1" }; },
};

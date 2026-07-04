import assert from "node:assert/strict";
import type { CrewService } from "@funtog/contracts";

export async function runCrewContract(impl: CrewService): Promise<void> {
  const crew = await impl.createCrew("the crew");
  assert.ok(crew.crewId, "crew has an id");
  assert.ok(Array.isArray(crew.members), "crew has members");
  const join = await impl.joinByLink("tok");
  assert.ok(join.sessionId, "joinByLink returns a session id");
}

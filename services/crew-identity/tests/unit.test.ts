import { test } from "node:test";
import assert from "node:assert/strict";
import { createCrew, issueJoinToken, verifyJoinToken } from "../src/index";

test("createCrew: durable crew with id, name, empty members", async () => {
  const svc = createCrew({ idgen: () => "abc" });
  const crew = await svc.createCrew("the crew");
  assert.equal(crew.crewId, "crew_abc");
  assert.equal(crew.name, "the crew");
  assert.deepEqual(crew.members, []);
});

// ---- DEFINING DECISION: join by link, signed stateless token ----
test("joinByLink: a valid signed token resolves to its embedded session", async () => {
  const svc = createCrew({ secret: "k" });
  const token = svc.issueJoinToken("s_42", "crew_1");
  assert.deepEqual(await svc.joinByLink(token), { sessionId: "s_42" });
});

test("joinByLink: an opaque link string is treated as a direct session handle", async () => {
  const svc = createCrew();
  assert.deepEqual(await svc.joinByLink("tok"), { sessionId: "tok" });
});

test("joinByLink: a tampered signed token is rejected (not silently accepted)", async () => {
  const svc = createCrew({ secret: "k" });
  const token = svc.issueJoinToken("s_42", "crew_1");
  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
  await assert.rejects(() => svc.joinByLink(tampered), /invalid or tampered/);
});

test("tokens are STATELESS: a second instance with the same secret validates without shared state", async () => {
  const minter = createCrew({ secret: "shared" });
  const token = minter.issueJoinToken("s_99", "crew_9");
  const fresh = createCrew({ secret: "shared" });            // no shared store
  assert.deepEqual(await fresh.joinByLink(token), { sessionId: "s_99" });
  assert.equal(verifyJoinToken(token, "wrong-secret"), null, "wrong secret fails O(1)");
});

// ---- one-tap identity claim + idempotent joins (viral link stays flat) ----
test("claimIdentity: adds a member; re-tap with same memberId is idempotent", async () => {
  const svc = createCrew();
  await svc.createCrew("crew");
  const crewId = "crew_x";
  await svc.claimIdentity(crewId, "Sam", "m_sam");
  await svc.claimIdentity(crewId, "Sam (again)", "m_sam");   // same identity re-tapping the link
  await svc.claimIdentity(crewId, "Jo", "m_jo");
  const crew = svc.getCrew(crewId);
  assert.equal(crew?.members.length, 2, "no duplicate from re-tap");
  assert.deepEqual(crew?.members.map((m) => m.memberId).sort(), ["m_jo", "m_sam"]);
});

test("standalone issue/verify round-trips and carries crew id", () => {
  const t = issueJoinToken({ sid: "s1", cid: "crew_1" }, "k", () => 1000);
  const claims = verifyJoinToken(t, "k");
  assert.equal(claims?.sid, "s1");
  assert.equal(claims?.cid, "crew_1");
  assert.equal(claims?.iat, 1000);
});

import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * THE GOLDEN NIGHT — the one test that wires all six REAL services together
 * (template models stand in for LLMs; everything else is the production code path):
 *
 *   Crew/Identity → Orchestrator → Suggestion → Venue (grounded) → Character → Memory/Ledger
 *
 * Night 1: join by link (opaque + signed + tampered), grounded plans, a 2–2 tie,
 *          a verifiable wheel spin → resolved. Wheel is fair: nobody is overruled.
 * Night 2: a decisive 3–1 vote → winner. The dissenter becomes owed in the Ledger,
 *          and Character's evolution consumer learns from the decisive night.
 *
 * If any seam drifts, this test fails before any user ever sees it.
 */
import { createCrew } from "@funtog/crew-identity";
import { createMemory } from "@funtog/memory-ledger";
import { createVenue, isCovered } from "@funtog/venue-knowledge";
import { createSuggestion } from "@funtog/suggestion-engine";
import { createCharacter, makeEvolutionConsumer } from "@funtog/character-engine";
import { createOrchestrator, spin } from "@funtog/convergence-orchestrator";
import type { NightRecord, Vote } from "@funtog/contracts";

function pickCoveredArea(): string {
  const candidates = ["Indiranagar", "Koramangala", "Soho", "Shoreditch", "Dalston", "Peckham", "Clerkenwell"];
  for (const a of candidates) if (isCovered(a)) return a;
  throw new Error("stub provider covers none of the candidate areas — widen the list");
}

test("golden night: all six services, tie→wheel then decisive→ledger+evolution", async () => {
  // ---- wire the real system (late-bind evolution: memory ⇄ character) ----
  let onNight: ((r: NightRecord) => Promise<void>) | undefined;
  const memory = createMemory({ onNightRecord: (r) => { void onNight?.(r); } });
  onNight = makeEvolutionConsumer(memory);

  const venue = createVenue();                         // deterministic stub provider
  const suggestion = createSuggestion({ venue });      // template StructureModel + REAL grounding
  const character = createCharacter({ memory });       // template VoiceModel + safety guard
  const SEED = "e2e-golden-seed";
  const crew = createCrew({ secret: "e2e-secret" });
  const orchestrator = createOrchestrator({
    suggestion, character, memory, seedFn: () => SEED,
    mintJoinToken: (sid, cid) => crew.issueJoinToken(sid, cid),   // Crew/Identity owns tokens
  });

  // ---- crew forms ----
  const profile = await crew.createCrew("The Usual Suspects");
  const members = await Promise.all(
    ["Ana", "Bo", "Chi", "Dev"].map((n, i) => crew.claimIdentity(profile.crewId, n, `m_${i + 1}`)),
  );
  assert.equal(members.length, 4);
  // one-tap claim is idempotent by memberId
  const again = await crew.claimIdentity(profile.crewId, "Ana", "m_1");
  assert.equal(again.memberId, "m_1");

  // ---- NIGHT 1: spark → grounded plans → join links → tie → wheel ----
  const area = pickCoveredArea();
  const { sessionId, joinToken } = await orchestrator.openSession(profile.crewId, {
    vibe: "lively, then something silly", area, groundingMode: "grounded", crewConstraints: {},
  });

  // the session's own join link is a SIGNED stateless token that round-trips to the session…
  assert.ok(joinToken.includes("."), "orchestrator link is a signed token minted by Crew/Identity");
  assert.equal((await crew.joinByLink(joinToken)).sessionId, sessionId);
  // …opaque handles still resolve (the link IS the session ref)…
  assert.equal((await crew.joinByLink(sessionId)).sessionId, sessionId);
  // …and tampering is rejected
  const tampered = joinToken.slice(0, -2) + (joinToken.endsWith("aa") ? "bb" : "aa");
  await assert.rejects(() => crew.joinByLink(tampered), /invalid|tampered/i);

  // plans are real-venue grounded: no invented places, and at least one fully-bound arc
  const s1 = await orchestrator.getState(sessionId);
  assert.equal(s1.phase, "gathering");
  assert.ok(s1.candidates.length >= 2, "need ≥2 candidates for a tie");
  const fullyBound = s1.candidates.filter((c) => c.stops.length > 0 && c.stops.every((st) => st.venue?.venueId));
  assert.ok(fullyBound.length >= 1, "covered area must yield at least one fully-grounded candidate");
  assert.ok(s1.voice?.mood, "character voice rides along with a mood");

  // a 2–2 tie, with an idempotency probe (stale clientSeq is ignored)
  const [A, B] = s1.candidates;
  const vote = (memberId: string, planId: string, clientSeq = 1): Vote => ({ sessionId, memberId, planId, clientSeq });
  await orchestrator.castVote(vote("m_1", A.id));
  await orchestrator.castVote(vote("m_2", A.id));
  await orchestrator.castVote(vote("m_3", B.id));
  await orchestrator.castVote(vote("m_4", B.id));
  await orchestrator.castVote(vote("m_1", B.id, 1)); // stale replay → must be ignored
  const mid = await orchestrator.getState(sessionId);
  assert.equal(mid.tally[A.id], 2);
  assert.equal(mid.tally[B.id], 2);

  await orchestrator.converge(sessionId);
  const done = await orchestrator.getState(sessionId);
  assert.equal(done.phase, "resolved");
  assert.equal(done.verdict?.type, "wheel");
  assert.ok(done.wheelResult, "tie resolves by wheel");
  // provably fair: anyone can recompute the spin from contenders + published seed
  const contenders = (done.verdict as { contenders: string[] }).contenders;
  const recomputed = spin(contenders, SEED);
  assert.ok(recomputed.planId, "recomputed spin names a winner");
  assert.equal(done.wheelResult!.planId, recomputed.planId);
  assert.ok(contenders.includes(done.wheelResult!.planId), "winner is one of the tied plans");

  // wheel is fair → ledger records participation but overrules NOBODY
  const led1 = await memory.getLedgerSnapshot(profile.crewId);
  assert.equal(led1.members.length, 4);
  assert.ok(led1.members.every((m) => m.overruled === 0 && m.streak === 0));

  // ---- NIGHT 2: decisive 3–1 → winner; dissenter owed; evolution learns ----
  const n2 = await orchestrator.openSession(profile.crewId, { vibe: "cozy dinner", area, groundingMode: "grounded", crewConstraints: {} });
  const s2 = await orchestrator.getState(n2.sessionId);
  const [P, Q] = s2.candidates;
  const v2 = (m: string, p: string): Vote => ({ sessionId: n2.sessionId, memberId: m, planId: p, clientSeq: 1 });
  await orchestrator.castVote(v2("m_1", P.id));
  await orchestrator.castVote(v2("m_2", P.id));
  await orchestrator.castVote(v2("m_3", P.id));
  await orchestrator.castVote(v2("m_4", Q.id)); // Dev dissents
  await orchestrator.converge(n2.sessionId);
  const done2 = await orchestrator.getState(n2.sessionId);
  assert.equal(done2.phase, "resolved");
  assert.equal(done2.verdict?.type, "winner");
  assert.equal((done2.verdict as { planId?: string }).planId, P.id);

  const led2 = await memory.getLedgerSnapshot(profile.crewId);
  const dev = led2.members.find((m) => m.memberId === "m_4")!;
  const ana = led2.members.find((m) => m.memberId === "m_1")!;
  assert.equal(dev.overruled, 1);
  assert.equal(dev.streak, 1);
  assert.equal(ana.got, 1);

  // evolution consumed the decisive night: learned dials now exist on persona state
  await new Promise((r) => setTimeout(r, 10)); // consumer is fire-and-forget
  const persona = await memory.getPersonaState(profile.crewId);
  assert.ok(persona.learnedDeltas && (persona.learnedDeltas as { dials?: unknown }).dials,
    "decisive night must feed Character evolution (learned dials)");

  // and Character can mediate with the fairness context (safety-guarded voice out)
  const mediation = await character.mediate(profile.crewId, done2.tally, led2);
  assert.ok(mediation.read.length > 0 && mediation.mood, "mediation voice renders");
});

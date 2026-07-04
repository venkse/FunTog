import assert from "node:assert/strict";
import type { CharacterService, PlanCandidate, LedgerSnapshot } from "@funtog/contracts";

const MOODS = new Set(["idle","plotting","tada","wink","thinking","mischief","smug","cheer"]);
const plans: PlanCandidate[] = [{ id: "p1", arc: "a -> b", stops: [{ time: "20:00" }] }];
const ledger: LedgerSnapshot = { crewId: "c1", members: [{ memberId: "sam", got: 0, overruled: 2, streak: 2 }] };

export async function runCharacterContract(impl: CharacterService): Promise<void> {
  const vp = await impl.render("c1", plans);
  assert.ok(vp && Array.isArray(vp.plans), "render returns voiced plans");
  if (vp.mood) assert.ok(MOODS.has(vp.mood), "VoicePacket.mood is a known Mood");
  const ids = new Set(plans.map((p) => p.id));
  for (const pv of vp.plans!) {
    assert.ok(pv.planId && ids.has(pv.planId), "voice planId maps to an input plan");
    assert.ok(pv.name && pv.tagline && pv.pitch, "voice carries name/tagline/pitch");
    if (pv.mood) assert.ok(MOODS.has(pv.mood), "PlanVoice.mood is a known Mood");
  }
  const med = await impl.mediate("c1", { p1: 2 }, ledger);
  assert.equal(typeof med.read, "string", "mediate returns a read");
  if (med.mood) assert.ok(MOODS.has(med.mood), "mediate mood is a known Mood");
  if (med.advocacy) assert.equal(typeof med.advocacy.line, "string", "advocacy carries a line");
  await impl.setPersona("c1", "troublemaker");
  await impl.setOverrides("c1", { dial: "chill" });
}

import type { VoicePacket, PlanVoice, Mood } from "@funtog/contracts";

const MOODS = new Set<Mood>(["idle","plotting","tada","wink","thinking","mischief","smug","cheer"]);
const BANNED = [/\bdamn\b/gi]; // placeholder; real list lives in config

/**
 * Safety + Consistency Guard — runs on EVERY output, never bypassed. Local + cheap (no model call).
 * Guarantees a schema-valid, on-shape VoicePacket: planIds restricted to the input set, non-empty
 * fields within length caps, moods normalised to the known vocabulary, basic content scrub. If a
 * piece is unusable it is replaced with a safe default rather than dropped.
 */
export function guardVoicePacket(vp: VoicePacket, inputIds: Set<string>): VoicePacket {
  const out: VoicePacket = {};
  if (vp.intro !== undefined) out.intro = nonEmpty(clean(vp.intro, 120), "Alright, here's the plan:");
  if (vp.mood !== undefined) out.mood = mood(vp.mood, "plotting");

  if (vp.plans) {
    const plans = vp.plans
      .filter((p) => inputIds.has(p.planId))
      .map((p): PlanVoice => ({
        planId: p.planId,
        name: nonEmpty(clean(p.name, 60), "A Solid Plan"),
        tagline: nonEmpty(clean(p.tagline, 90), "trust me on this"),
        pitch: nonEmpty(clean(p.pitch, 160), "you'll thank me later"),
        mood: mood(p.mood, "mischief"),
        ...(p.stopNotes ? { stopNotes: p.stopNotes } : {}),
      }));
    if (plans.length) out.plans = plans;
  }

  if (vp.read !== undefined) out.read = nonEmpty(clean(vp.read, 160), "Let me read the room...");
  if (vp.advocacy !== undefined) {
    out.advocacy = vp.advocacy
      ? { for: vp.advocacy.for, line: nonEmpty(clean(vp.advocacy.line, 140), "someone's owed one") }
      : null;
  }
  return out;
}

function clean(s: unknown, max: number): string {
  let t = (s ?? "").toString().trim();
  for (const re of BANNED) t = t.replace(re, "…");
  return t.slice(0, max);
}
const nonEmpty = (s: string, fallback: string) => (s.length ? s : fallback);
const mood = (m: Mood | undefined, fallback: Mood): Mood => (m && MOODS.has(m) ? m : fallback);

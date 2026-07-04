import type { VenueRef, SlotSpec, CrewConstraints } from "@funtog/contracts";
import type { RawPlace } from "./provider";

/** Positional coverage-gap marker: empty venueId trips the consumer's feasibility check (→ shapes),
 *  while keeping one entry per slot so the array stays aligned. */
export const GAP: VenueRef = { venueId: "", name: "", coverageGap: true };

const BAND: Record<string, number> = { cheap: 0, comfortable: 1, splashing: 2 };
const withinBand = (price: string, cap?: string): boolean =>
  !cap || !(cap in BAND) ? true : (BAND[price] ?? 1) <= BAND[cap];

/** Filter provider candidates by crew constraints + slot mustHave, then pick deterministically.
 *  Returns null when nothing satisfies (→ caller emits a GAP, which triggers upstream repair). */
export function pickVenue(raw: RawPlace[], slot: SlotSpec, c: CrewConstraints): VenueRef | null {
  const dislikes = new Set((c.dislikes ?? []).map((s) => s.toLowerCase()));
  const need = new Set((slot.mustHave ?? []).map((s) => s.toLowerCase()));

  const cand = raw.filter((p) => {
    if (!p.open) return false;
    if (c.veg && !p.tags.includes("veg")) return false;
    if (dislikes.has(p.kind)) return false;
    for (const t of p.tags) if (dislikes.has(t)) return false;
    for (const m of need) if (!p.tags.includes(m) && p.kind !== m) return false;
    if (!withinBand(p.price, slot.priceBand)) return false;
    return true;
  });
  if (!cand.length) return null;

  cand.sort((a, b) => (BAND[a.price] - BAND[b.price]) || a.id.localeCompare(b.id));
  const p = cand[0];
  return { venueId: p.id, name: p.title, kind: p.kind, priceBand: p.price, open: p.open, tags: p.tags };
}

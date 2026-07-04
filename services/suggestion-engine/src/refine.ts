import type { PlanCandidate, PlanStop, SlotSpec } from "@funtog/contracts";

/** Stateless structural refinement from free-text feedback. Stays NEUTRAL; same plan id. */
export function refinePlan(plan: PlanCandidate, feedback: string): PlanCandidate {
  const f = feedback.toLowerCase();
  let stops: PlanStop[] = plan.stops.map((s) => ({ ...s, slot: s.slot ? { ...s.slot } : undefined }));
  const onSlots = (fn: (s: SlotSpec) => SlotSpec) => { stops = stops.map((s) => (s.slot ? { ...s, slot: fn(s.slot) } : s)); };

  if (/\b(quiet|quieter|chill|mellow|calm)\b/.test(f)) onSlots((s) => ({ ...s, venueType: s.venueType.replace(/lively|loud|buzzy/gi, "low-key") }));
  if (/\b(livel|loud|wild|hype)\b/.test(f)) onSlots((s) => ({ ...s, venueType: s.venueType.replace(/low-key|quiet|cosy/gi, "lively") }));
  if (/\b(cheap|cheaper|budget)\b/.test(f)) onSlots((s) => ({ ...s, priceBand: "$" }));
  if (/\b(fancy|fancier|nicer|splash)\b/.test(f)) onSlots((s) => ({ ...s, priceBand: "$$$" }));
  if (/\b(close|closer|walkab)\b/.test(f)) onSlots((s) => ({ ...s, walkableFromPrev: true }));
  if (/\b(fewer|less|shorter|drop)\b/.test(f) && stops.length > 1) stops = stops.slice(0, -1);
  if (/\b(more|another|extra|longer)\b/.test(f)) { const last = stops[stops.length - 1]; if (last) stops = [...stops, { ...last, time: bumpHour(last.time) }]; }

  return { id: plan.id, arc: plan.arc, stops };
}

function bumpHour(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${String(((h || 0) + 1) % 24).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
}

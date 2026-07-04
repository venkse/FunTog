import type { SlotSpec } from "@funtog/contracts";
import type { GenContext } from "./context";

export interface SkeletonStop { time: string; slot: SlotSpec; }
export interface PlanSkeleton { arc: string; stops: SkeletonStop[]; }

/**
 * Phase 1. The model emits a plan SKELETON: an arc + typed venue SLOTS (shapes, never names).
 * In production this is LLM-backed; the default template makes it deterministic + testable, and is
 * also the fallback when an injected model fails. THE RULE: never ask the model for facts — slots
 * describe a venue's *shape*, and the Venue service binds reality later.
 */
export interface StructureModel { generate(ctx: GenContext): Promise<PlanSkeleton[]> | PlanSkeleton[]; }

export const templateStructureModel: StructureModel = {
  generate(ctx) {
    const must = ctx.constraints.veg ? ["veg"] : undefined;
    const band = priceBand(ctx);
    const slot = (venueType: string, walkableFromPrev = true): SlotSpec => ({ venueType, priceBand: band, mustHave: must, walkableFromPrev });
    const bar = barType(ctx.vibe), main = mainType(ctx.vibe);
    return [
      { arc: "small plates → lively bar → late-night sweet", stops: [
        { time: "20:00", slot: slot("cosy small-plates spot", false) },
        { time: "21:30", slot: slot(bar) },
        { time: "23:00", slot: slot("late-night dessert window") },
      ]},
      { arc: "straight to the main event", stops: [
        { time: "20:30", slot: slot(main, false) },
        { time: "22:30", slot: slot("nightcap nearby") },
      ]},
      { arc: "wildcard", stops: [
        { time: "20:00", slot: slot("somewhere unexpected", false) },
        { time: "22:00", slot: slot("kick-on spot") },
      ]},
    ];
  },
};

function priceBand(ctx: GenContext): string {
  const b = (ctx.budget ?? (ctx.constraints.budget as string) ?? "").toString().toLowerCase();
  if (/cheap|broke|budget/.test(b)) return "$";
  if (/splash|fancy|nice/.test(b)) return "$$$";
  return "$$";
}
function barType(vibe: string): string {
  const v = vibe.toLowerCase();
  if (/danc|club/.test(v)) return "a loud pre-dance bar";
  if (/chill|cosy|cozy/.test(v)) return "a quiet natural-wine bar";
  return "a lively natural-wine bar";
}
function mainType(vibe: string): string {
  const v = vibe.toLowerCase();
  if (/danc|club/.test(v)) return "a dance floor that fills up late";
  if (/chill|cosy|cozy/.test(v)) return "a low-key room to settle into";
  return "a buzzy room with great energy";
}

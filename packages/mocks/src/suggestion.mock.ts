import type { SuggestionService, PlanCandidate } from "@funtog/contracts";

const canned = (id: string): PlanCandidate => ({
  id, arc: "small-plates -> lively bar -> late-night sweet",
  stops: [
    { time: "20:00", slot: { venueType: "cramped small-plates spot", mustHave: ["veg"] } },
    { time: "21:30", slot: { venueType: "lively natural-wine bar", walkableFromPrev: true } },
    { time: "23:00", slot: { venueType: "late-night dessert window" } },
  ],
});

export const mockSuggestion: SuggestionService = {
  async generatePlans() { return [canned("p1"), canned("p2"), canned("p3")]; },
  async refinePlan(plan) { return { ...plan, arc: plan.arc + " (tweaked)" }; },
};

import { section, latency } from "@funtog/perf";
import { mockVenue } from "@funtog/mocks";
import { createSuggestion } from "../src/index";

async function main() {
  section("Suggestion Engine · PERFORMANCE (template model — isolates our overhead)");
  const s = createSuggestion({ venue: mockVenue });
  let n = 0;
  await latency("generatePlans (cache MISS, shapes)", 300, async () => {
    await s.generatePlans({ crewId: "c", vibe: "v" + (n++), crewConstraints: {}, groundingMode: "shapes" });
  });
  await latency("generatePlans (cache HIT)", 300, async () => {
    await s.generatePlans({ crewId: "c", vibe: "fixed", crewConstraints: {}, groundingMode: "shapes" });
  });
  await latency("generatePlans (grounded, mock Venue)", 300, async () => {
    await s.generatePlans({ crewId: "c", vibe: "g" + (n++), crewConstraints: {}, groundingMode: "grounded" });
  });
  console.log("  NOTE: stateless given PlanRequest ⇒ scale replicas freely; the semantic cache is the lever");
  console.log("        (note the HIT vs MISS gap); grounding fan-out goes to Venue; the repair loop is capped.");
}
main();

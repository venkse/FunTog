import { section, latency } from "@funtog/perf";
import { mockVenue } from "@funtog/mocks";
import { createSuggestion } from "../src/index";

async function main() {
  section("Suggestion Engine · STRESS");
  const s = createSuggestion({ venue: mockVenue });
  let n = 0;
  await latency("generatePlans (grounded) under load", 800, async () => {
    await s.generatePlans({ crewId: "c", vibe: "g" + (n++), crewConstraints: {}, groundingMode: "grounded" });
  });
  console.log("  => stateless ⇒ horizontal replicas; protect the model + Venue with rate-limits + cache.");
  console.log("     With a real model, cache cold-start hit-ratio and Venue rate-limits are the ceilings.");
}
main();

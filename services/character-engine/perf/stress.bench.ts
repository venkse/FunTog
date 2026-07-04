import { section, latency } from "@funtog/perf";
import { mockMemory } from "@funtog/mocks";
import { createCharacter } from "../src/index";

const plans = [{ id: "p1", arc: "a", stops: [] }];

async function main() {
  section("Character Engine · STRESS");
  const ch = createCharacter({ memory: mockMemory });
  await latency("render under load", 1000, async () => { await ch.render("c1", plans); });
  console.log("  => template path is cheap; with a real model the ceiling is model rate-limit + cache hit-ratio.");
  console.log("     Evolution is a SEPARATE async worker keyed by crewId; it must never block render.");
}
main();

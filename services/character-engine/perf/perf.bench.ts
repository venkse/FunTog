import { section, latency, throughput } from "@funtog/perf";
import { mockMemory } from "@funtog/mocks";
import { createCharacter } from "../src/index";

const plans = [{ id: "p1", arc: "a -> b", stops: [] }, { id: "p2", arc: "c -> d", stops: [] }, { id: "p3", arc: "wildcard", stops: [] }];

async function main() {
  section("Character Engine · PERFORMANCE (template model — isolates our overhead from model time)");
  const ch = createCharacter({ memory: mockMemory });
  await latency("render", 300, async () => { await ch.render("c1", plans); });
  await latency("mediate", 300, async () => { await ch.mediate("c1", { p1: 2 }, { crewId: "c1", members: [{ memberId: "sam", got: 0, overruled: 2, streak: 2 }] }); });
  await throughput("render/sec", 1000, async () => { await ch.render("c1", plans); });
  console.log("  NOTE: with a real model the LLM call dominates — cache VoicePackets (persona+plan-shape keyed)");
  console.log("        and PersonaState; render is stateless given persona ⇒ scale replicas behind a rate-limiter.");
}
main();

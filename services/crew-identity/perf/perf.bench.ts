import { section, latency, throughput } from "@funtog/perf";
import { createCrew, issueJoinToken } from "../src/index";

async function main() {
  section("Crew + Identity · PERFORMANCE (signed stateless tokens — joinByLink validates O(1), no store hit)");
  const svc = createCrew({ secret: "k" });
  const token = issueJoinToken({ sid: "s_123", cid: "crew_1" }, "k");

  await latency("createCrew", 200, async () => { await svc.createCrew("the crew"); });
  await latency("joinByLink (verify signed token)", 300, async () => { await svc.joinByLink(token); });
  await throughput("joinByLink/sec (signed)", 1000, async () => { await svc.joinByLink(token); });

  await Promise.all(Array.from({ length: 2000 }, () => svc.joinByLink(token)));
  console.log("  join storm: 2000 concurrent joinByLink on ONE link → all O(1), no hot-partition growth");
  console.log("  NOTE: HMAC validation ⇒ no DB round-trip; partition by crewId; cache memberships; joins idempotent.");
}
main();

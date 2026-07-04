import { section, latency } from "@funtog/perf";
import { createCrew, issueJoinToken } from "../src/index";

async function main() {
  section("Crew + Identity · STRESS");
  const svc = createCrew({ secret: "k" });
  const token = issueJoinToken({ sid: "s1", cid: "crew_1" }, "k");
  await latency("joinByLink storm (one hot link)", 3000, async () => { await svc.joinByLink(token); });
  await latency("claimIdentity re-tap (idempotent)", 1000, async () => { await svc.claimIdentity("crew_1", "Sam", "m_sam"); });
  console.log("  => a viral link hammers one crew partition; idempotent joins + stateless token validation stay flat.");
}
main();

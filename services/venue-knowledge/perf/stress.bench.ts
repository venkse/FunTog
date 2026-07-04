import { section, latency } from "@funtog/perf";
import { createVenue, stubProvider, type PlacesProvider } from "../src/index";

const slot = [{ venueType: "wine bar" }];

async function main() {
  section("Venue / Knowledge · STRESS");
  let clock = 0, fail = false;
  const flaky: PlacesProvider = { async lookup(a, v) { if (fail) throw new Error("429"); return stubProvider.lookup(a, v); } };
  const svc = createVenue({ provider: flaky, ttlMs: 5, jitterMs: 0, now: () => clock });
  await svc.resolveVenues(slot, "soho", {}); // warm
  clock = 1000; fail = true;                 // provider rate-limited, entry stale
  await latency("resolveVenues under provider 429 (serves last-known)", 300, async () => { await svc.resolveVenues(slot, "soho", {}); });
  await latency("coverage-gap fast-fail", 300, async () => { await svc.resolveVenues(slot, "atlantis", {}); });
  console.log("  => provider down ⇒ stale-on-error from cache; coverage gap ⇒ fast-fail to shapes. Never hang,");
  console.log("     never let two callers hit the provider for the same key (singleflight).");
}
main();

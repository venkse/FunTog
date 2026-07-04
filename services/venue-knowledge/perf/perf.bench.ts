import { section, latency, throughput } from "@funtog/perf";
import { createVenue, stubProvider, type PlacesProvider, type RawPlace } from "../src/index";

const slot = [{ venueType: "wine bar" }];

async function main() {
  section("Venue / Knowledge · PERFORMANCE (stub provider is in-memory — the REAL ceiling is provider network quota)");
  const svc = createVenue();
  await svc.resolveVenues(slot, "soho", {}); // warm

  await latency("resolveVenues (cache HIT)", 300, async () => { await svc.resolveVenues(slot, "soho", {}); });
  let i = 0;
  await latency("resolveVenues (cache MISS, covered)", 300, async () => { await svc.resolveVenues([{ venueType: `bar ${i++}` }], "soho", {}); });
  await latency("resolveVenues (coverage gap, fast-fail)", 300, async () => { await svc.resolveVenues(slot, "atlantis", {}); });
  await throughput("resolveVenues/sec (HIT)", 1000, async () => { await svc.resolveVenues(slot, "soho", {}); });

  let calls = 0;
  const prov: PlacesProvider = { async lookup(a, v): Promise<RawPlace[]> { calls++; await new Promise((r) => setTimeout(r, 5)); return stubProvider.lookup(a, v); } };
  const svc2 = createVenue({ provider: prov });
  await Promise.all(Array.from({ length: 50 }, () => svc2.resolveVenues(slot, "dalston", {})));
  console.log(`  singleflight: 50 concurrent identical lookups → ${calls} provider call(s)`);
  console.log("  NOTE: cache hit-ratio is THE metric. Cache by area+constraints, warm popular areas,");
  console.log("        coalesce identical lookups, jitter the TTL. The provider quota is the global ceiling.");
}
main();

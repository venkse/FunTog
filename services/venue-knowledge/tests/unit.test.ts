import { test } from "node:test";
import assert from "node:assert/strict";
import type { SlotSpec } from "@funtog/contracts";
import { createVenue, stubProvider, type PlacesProvider, type RawPlace } from "../src/index";

const wineBar: SlotSpec[] = [{ venueType: "wine bar" }];

// counting wrapper to observe provider calls (the global ceiling we must protect)
function counting(delayMs = 0): PlacesProvider & { calls: number } {
  return {
    calls: 0,
    async lookup(a, v): Promise<RawPlace[]> {
      this.calls++;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      return stubProvider.lookup(a, v);
    },
  };
}

test("binds a covered area: one real venue ref per slot", async () => {
  const svc = createVenue();
  const refs = await svc.resolveVenues([{ venueType: "wine bar" }, { venueType: "ramen" }], "soho", {});
  assert.equal(refs.length, 2);
  for (const r of refs) assert.ok(r.venueId && r.name, "real binding");
});

test("coverage gap: uncovered area returns positional GAP markers (→ shapes upstream)", async () => {
  const svc = createVenue();
  const refs = await svc.resolveVenues(wineBar, "atlantis", {});
  assert.equal(refs.length, 1, "still one entry per slot");
  assert.equal(refs[0].venueId, "", "empty venueId signals the gap");
});

test("cache: repeated identical lookup hits cache → provider called once", async () => {
  const prov = counting();
  const svc = createVenue({ provider: prov });
  await svc.resolveVenues(wineBar, "soho", {});
  await svc.resolveVenues(wineBar, "soho", {});
  assert.equal(prov.calls, 1, "second call served from cache");
});

test("singleflight: many concurrent identical lookups → ONE provider call", async () => {
  const prov = counting(5);
  const svc = createVenue({ provider: prov });
  await Promise.all(Array.from({ length: 40 }, () => svc.resolveVenues(wineBar, "shoreditch", {})));
  assert.equal(prov.calls, 1, "concurrent callers coalesced onto one in-flight lookup");
});

test("degradation: provider down → serve last-known from cache (stale-on-error)", async () => {
  let clock = 0;
  let fail = false;
  const flaky: PlacesProvider = { async lookup(a, v) { if (fail) throw new Error("429"); return stubProvider.lookup(a, v); } };
  const svc = createVenue({ provider: flaky, ttlMs: 10, jitterMs: 0, now: () => clock });
  const warm = (await svc.resolveVenues(wineBar, "soho", {}))[0];
  assert.ok(warm.venueId, "warmed a real ref");
  clock = 10_000;                       // let the entry go stale
  fail = true;                          // provider now rate-limited
  const after = (await svc.resolveVenues(wineBar, "soho", {}))[0];
  assert.equal(after.venueId, warm.venueId, "served last-known, did not throw or gap");
});

test("provider down with no cache → GAP markers, never throws", async () => {
  const dead: PlacesProvider = { async lookup() { throw new Error("down"); } };
  const svc = createVenue({ provider: dead });
  const refs = await svc.resolveVenues(wineBar, "soho", {});
  assert.equal(refs[0].venueId, "", "fast-fails to a gap instead of throwing");
});

test("mustHave/constraints filter: unsatisfiable → GAP; relaxed → binds (this is what makes repair work)", async () => {
  const svc = createVenue();
  const gap = await svc.resolveVenues([{ venueType: "wine bar", mustHave: ["unicorn"] }], "soho", {});
  assert.equal(gap[0].venueId, "", "no candidate satisfies mustHave → gap");
  const ok = await svc.resolveVenues([{ venueType: "wine bar" }], "soho", {});
  assert.ok(ok[0].venueId, "relaxed → binds");
});

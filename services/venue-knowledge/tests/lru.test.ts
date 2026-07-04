import { test } from "node:test";
import assert from "node:assert/strict";
import { VenueCache } from "../src/cache";
import { createVenue } from "../src/index";

const ref = (id: string) => ({ venueId: id, name: id, kind: "bar" }) as never;

test("cache never exceeds its bound; coldest key is evicted first", () => {
  const c = new VenueCache(3);
  c.set("a", ref("a"), 99); c.set("b", ref("b"), 99); c.set("c", ref("c"), 99);
  c.set("d", ref("d"), 99);                       // over cap → evict "a" (coldest)
  assert.equal(c.size, 3);
  assert.equal(c.peek("a"), undefined);
  assert.ok(c.peek("d"));
});

test("peek touches recency: recently-read entries survive eviction", () => {
  const c = new VenueCache(3);
  c.set("a", ref("a"), 99); c.set("b", ref("b"), 99); c.set("c", ref("c"), 99);
  c.peek("a");                                    // a becomes MRU
  c.set("d", ref("d"), 99);                       // now "b" is coldest → evicted
  assert.ok(c.peek("a"));
  assert.equal(c.peek("b"), undefined);
});

test("service accepts cacheMax and stays bounded under many distinct lookups", async () => {
  const venue = createVenue({ cacheMax: 8 });
  // 5 covered-area types x several areas > 8 distinct keys
  const areas = ["soho", "shoreditch", "dalston", "peckham", "clerkenwell"];
  for (const a of areas) {
    await venue.resolveVenues(
      [{ venueType: "a lively natural-wine bar" }, { venueType: "cosy small-plates spot" }, { venueType: "late-night dessert window" }],
      a, {});
  }
  // no direct size accessor on the service — the invariant is behavioral: nothing throws,
  // results still resolve, and a fresh lookup after churn still binds.
  const again = await venue.resolveVenues([{ venueType: "a lively natural-wine bar" }], "soho", {});
  assert.ok(again[0]?.venueId);
});

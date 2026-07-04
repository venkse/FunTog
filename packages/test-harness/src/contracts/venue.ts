import assert from "node:assert/strict";
import type { VenueService, SlotSpec } from "@funtog/contracts";

const slots: SlotSpec[] = [{ venueType: "wine bar" }, { venueType: "ramen" }];

export async function runVenueContract(impl: VenueService): Promise<void> {
  const refs = await impl.resolveVenues(slots, "soho", {});
  assert.ok(Array.isArray(refs), "resolveVenues returns an array");
  assert.equal(refs.length, slots.length, "one binding per slot");
  for (const r of refs) assert.ok(r.venueId && r.name, "venue ref has id + name");
}

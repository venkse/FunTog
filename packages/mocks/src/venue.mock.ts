import type { VenueService, VenueRef } from "@funtog/contracts";

export const mockVenue: VenueService = {
  async resolveVenues(slots): Promise<VenueRef[]> {
    return slots.map((s, i) => ({ venueId: `v${i}`, name: `A ${s.venueType}`, open: true }));
  },
};

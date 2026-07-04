import type { VenueService, VenueRef, SlotSpec, CrewConstraints } from "@funtog/contracts";
import { stubProvider, type PlacesProvider } from "./provider";
import { pickVenue, GAP } from "./normalize";
import { VenueCache } from "./cache";

export interface VenueDeps {
  provider?: PlacesProvider;   // default: deterministic stub (real Places SDK plugs in here, nowhere else)
  ttlMs?: number;
  jitterMs?: number;           // TTL jitter prevents synchronized expiry stampedes
  now?: () => number;
  cacheMax?: number;           // LRU bound on the venue cache (default 10k keys)
}

/**
 * Venue / Knowledge. THE defining decision: all external data is contained behind resolveVenues.
 * Stateless compute over a shared cache keyed by area + slot constraints (hit-ratio is the scaling
 * metric — the provider quota is the global ceiling). Identical concurrent lookups are coalesced
 * (singleflight); provider failure serves last-known; unresolved slots fast-fail to a GAP marker.
 */
export function createVenue(deps: VenueDeps = {}): VenueService {
  const provider = deps.provider ?? stubProvider;
  const ttlMs = deps.ttlMs ?? 5 * 60_000;
  const jitterMs = deps.jitterMs ?? 30_000;
  const now = deps.now ?? Date.now;
  const cache = new VenueCache(deps.cacheMax);
  const inflight = new Map<string, Promise<VenueRef | null>>();

  const keyFor = (area: string, s: SlotSpec, c: CrewConstraints): string => JSON.stringify([
    area.trim().toLowerCase(), s.venueType.toLowerCase(), s.priceBand ?? "",
    (s.mustHave ?? []).slice().sort(), c.veg ?? false, (c.dislikes ?? []).slice().sort(), c.budget ?? "",
  ]);

  async function resolveOne(area: string, s: SlotSpec, c: CrewConstraints): Promise<VenueRef | null> {
    const k = keyFor(area, s, c);
    const entry = cache.peek(k);
    if (entry && now() < entry.expiresAt) return entry.ref;     // fresh hit (ref or known gap)

    const flying = inflight.get(k);
    if (flying) return flying;                                   // singleflight: coalesce identical lookups

    const p = (async (): Promise<VenueRef | null> => {
      try {
        const raw = await provider.lookup(area, s.venueType);
        const ref = pickVenue(raw, s, c);
        cache.set(k, ref, now() + ttlMs + Math.floor(Math.random() * jitterMs));
        return ref;
      } catch {
        if (entry) return entry.ref;                             // provider down → serve last-known (stale)
        return null;                                             // no cache → signal a gap (never throw)
      } finally {
        inflight.delete(k);
      }
    })();
    inflight.set(k, p);
    return p;
  }

  return {
    async resolveVenues(slots, area, constraints): Promise<VenueRef[]> {
      const c = constraints ?? {};
      const refs = await Promise.all(slots.map((s) => resolveOne(area ?? "", s, c)));
      return refs.map((r) => r ?? GAP);                          // one entry per slot; GAP keeps alignment
    },
  };
}

export { stubProvider, isCovered } from "./provider";
export { GAP } from "./normalize";
export type { PlacesProvider, RawPlace } from "./provider";

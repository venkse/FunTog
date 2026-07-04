import type { VenueRef } from "@funtog/contracts";

// ref === null means a KNOWN gap (negative cache, short TTL) — avoids re-hammering the provider
// for areas/slots that don't resolve. Entries are retained past expiry to serve last-known on error.
export interface CacheEntry { ref: VenueRef | null; expiresAt: number }

const DEFAULT_MAX = 10_000; // key = area|type|constraints — 10k covers a whole city's hot set

/**
 * BOUNDED LRU. Without a cap, every distinct area+constraint combo lives forever (the memory
 * grows monotonically as the crawlable key space is explored). Recency-ordered via Map iteration:
 * peek() re-inserts the entry (touch), evictions remove the coldest key first. The stale-on-error
 * degrade still works — an entry only disappears when it's the least-recently-used AND we're full,
 * which is exactly the entry least likely to save anyone during an outage.
 */
export class VenueCache {
  private m = new Map<string, CacheEntry>();
  constructor(private readonly max: number = DEFAULT_MAX) {
    if (max <= 0) throw new Error("VenueCache max must be positive");
  }

  peek(key: string): CacheEntry | undefined {
    const e = this.m.get(key);
    if (e) { this.m.delete(key); this.m.set(key, e); } // touch → most-recently-used
    return e;
  }

  set(key: string, ref: VenueRef | null, expiresAt: number): void {
    if (this.m.has(key)) this.m.delete(key);           // re-insert at MRU position
    this.m.set(key, { ref, expiresAt });
    while (this.m.size > this.max) {
      const coldest = this.m.keys().next().value as string;
      this.m.delete(coldest);
    }
  }

  get size(): number { return this.m.size; }
}

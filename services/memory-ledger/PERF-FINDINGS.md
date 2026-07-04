# Memory + Ledger — scaling findings (toward ~1B users)

Numbers below are from a sample single-process run. Treat the **shape** of each curve as the
finding, not the absolute figure. The headline: nothing in the **contract or architecture** needs
to change — every fix lives behind `MemoryService`, behind the same interface the contract tests
already guard. The pilot's two naive choices (in-memory store, fold-on-read) are exactly the two
the deep-dive flagged as "production swaps"; this suite quantifies *when* and *why* to make them.

## Results at a glance
| Axis | Measured behaviour | Verdict |
|---|---|---|
| Append | O(1), flat ~80–120k ev/s across log sizes | ✅ scales as-is |
| Persona read | O(1) in depth (~0.5 µs) — only needs the night *count* | ✅ already fine |
| Ledger read | O(nights/crew): ~122 µs @1k → 1.3 ms @10k → 16 ms @100k | ⚠️ fold-on-read |
| Timeline read | O(nights/crew) (same fold pattern as ledger) | ⚠️ fold-on-read |
| Rebuild | O(total events): 500k in ~174 ms (~3M ev/s) | ⚠️ global replay |
| Memory | ~700 B/event, ~2.8 KB/crew → ~0.7 TB for 250M crews | ⚠️ in-memory |
| Crew ceiling | ~382k crews/GB → ~654 GB resident for 250M crews | ⚠️ in-memory |
| Hot partition | shallow 1.4 µs vs 200k-night crew 34.5 ms (~25,000×) | ⚠️ isolated but slow |
| Soak | heap 7 → 405 MB over 515k appends (no eviction) | ⚠️ unbounded retention |
| Burst | 244k reads/s, p50 3.5 µs / p99 8.9 µs on shallow crews | ✅ until per-process ceiling |

## The four real bottlenecks, and the fix for each

**1. Fold-on-read ledger/timeline projections — the primary CPU bottleneck.**
The ledger read recomputes from the full per-crew log every call, so it is O(nights). A single crew
won't realistically reach 10k nights (~27 years of nightly outings), so the *per-crew* risk is low —
but this fold runs on **every session read across hundreds of millions of crews**. At even 50 nights
that's ~50× more work per read than necessary, multiplied by fleet QPS = a lot of wasted CPU.
*Fix:* maintain **incremental materialized projections** (update running got/overruled/streak on each
append) so reads are O(1); persona already proves this is cheap. The interface is unchanged.

**2. In-memory store — the hard capacity wall.**
~2.8 KB/crew ⇒ ~0.7 TB of resident state at 1B users; ~654 GB ⇒ one process can hold low-hundreds-of-
thousands of crews. *Fix:* a **durable, crew-partitioned store** (the in-memory `EventStore` is already
the swappable seam). The architectural gift: everything keys on `crewId` with **zero cross-crew
queries**, so sharding is embarrassingly parallel — a process/replica caches only its hot crews.

**3. Global synchronous replay — won't rebuild at scale.**
`rebuildFrom(all)` is O(total events); you can't replay a fleet-wide log synchronously. *Fix:*
**per-crew rebuild** (replay only that crew's partition) plus **periodic snapshots** so replay starts
from the last snapshot, not genesis. Rebuild then stays bounded per crew, preserving the
defining-decision guarantee (replay reproduces projections) without a global stop-the-world.

**4. Unbounded retention.**
The store never evicts (soak: monotonic growth). *Fix:* the durable store owns the cold log; the
process keeps an LRU of hot crews + their snapshots. Retention/compaction policy lives in storage.

## Concurrency note
Reads are **stateless given the store**, so the single-process read ceiling (≈244k reads/s here)
scales out horizontally via read replicas + cache. Writes serialize per crew (the partition), which
is correct — append order per crew is the source of truth.

## Bottom line
The architecture's shape — append-only log, rebuildable projections, partition-by-`crewId` — is the
right one and survives the stress test. The work to reach 1B users is **implementation behind
`MemoryService`**: materialize ledger/timeline, move the log to a partitioned durable store, snapshot
+ per-crew replay, cache hot crews. The contract, the contract tests, and this suite are the
guardrails that let that swap happen without breaking the six teams building around it.

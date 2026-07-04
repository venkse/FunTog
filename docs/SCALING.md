# Scaling & bottleneck map (build horizontally-scalable from the ground up)

**MVP intent:** we are NOT optimizing yet. The goals here are (1) be *aware* of where each subsystem
will hurt at scale, and (2) make the cheap-now / expensive-later structural choices correctly —
**partition keys, stateless compute, externalizable state, single-writer where order matters**.
Those decide whether scaling later is a config change or a rewrite. Each subsystem ships a perf +
stress skeleton in `perf/` (`npm run bench` / `npm run stress`) that documents its scenarios now and
measures them once built.

Reference target: ~1B users ≈ **250M crews** at ~4 members/crew.

## Cross-cutting principles (apply to every subsystem)
- **Pick the partition key now.** Almost everything keys on `crewId` (no cross-crew queries) or
  `sessionId`. Honor it everywhere; it's the shard key later.
- **Keep compute stateless** wherever correctness allows ⇒ horizontal replicas. Where order matters
  (vote sequencing), use a **single-writer per partition**, not shared mutable state.
- **Externalize state.** In-memory is for hot/cached data only; the durable store owns the truth.
- **Put slow/external things behind a boundary** (circuit breaker, cache, rate-limiter) so the hot
  path's latency is independent of the model/provider.
- **Degrade, don't stall.** Every dependency has a fast fallback (template, shapes mode, last-known).

## Per-subsystem map

### Memory + Ledger — MEASURED (see services/memory-ledger/PERF-FINDINGS.md)
Axes: events/crew, #crews, read QPS. Bottlenecks: ledger/timeline **fold-on-read is O(nights)**
(persona is already O(1)); **in-memory store** (~2.8 KB/crew → ~0.7 TB at 250M crews); **global
replay** is O(total). Fixes (all behind `MemoryService`): incremental materialized ledger/timeline +
snapshots; durable **crew-partitioned** store; **per-crew** rebuild; cache hot crews.

### Convergence Orchestrator — stateful, correctness-critical
Axes: concurrent active sessions; per-session fan-out (crew size); vote rate. Bottlenecks: **session
state is in-memory per node** (concurrent-session ceiling); **broadcast fan-out** = K× amplification
per vote; **generation coupling** could stall the core. Design: shard by `sessionId`, **single-writer
per session** for vote ordering, **stateless broadcast/pub-sub tier** (publish once), deterministic
core never awaits the generation tier, archive-on-resolve to Memory.

### Character Engine — LLM-bound hot path + async evolution
Axes: render/mediate QPS; persona reads; evolution volume. Bottlenecks: **model latency / cost /
rate-limits** dominate; **PersonaState refetch** per render; **guard** on every output; evolution
must not block render. Design: render **stateless given PersonaState** ⇒ replicas behind a
rate-limiter to the model; **cache VoicePackets** (persona+plan-shape keyed) and PersonaState;
**guard is local/non-LLM**; evolution is a **separate async worker pool keyed by crewId**.

### Suggestion Engine — two-phase, stateless
Axes: generate QPS; grounding calls/slot; cache hit-ratio. Bottlenecks: **model structure-gen**
latency/cost; **grounding fan-out** (N+1 to Venue); **repair loop** tail latency. Design: **fully
stateless given PlanRequest** ⇒ free horizontal scale; **semantic cache** is the lever; **batch** slot
grounding; **cap** repair iterations; Venue down ⇒ shapes mode.

### Venue / Knowledge — external-data wrapper, cache-heavy
Axes: resolve QPS; provider rate-limit/latency; cache hit-ratio. Bottlenecks: **external provider
quota/latency is the global ceiling**; **cache-miss stampede**; coverage gaps. Design: stateless
compute over a **shared cache** keyed by area+constraints; **request coalescing (singleflight)** +
TTL jitter; warm popular areas; **fast-fail** coverage gaps so Suggestion falls back.

### Crew + Identity — partitioned CRUD (lowest risk)
Axes: CRUD + join-token validation QPS; membership reads. Bottlenecks: **join storm** on a viral link
(hot partition); token validation on the hot path. Design: stateless behind a **crew-partitioned**
store; **signed/stateless join tokens** (validate O(1), no DB hit); **idempotent** joins; cache
memberships.

## How to use this
Agents: read your subsystem's entry + your `AGENTS.md` "Build for horizontal scale" section before
designing. Run `npm run bench` / `npm run stress` in your folder — they print the scenarios now and
measure once you build. If you discover a new bottleneck, capture it here and in your `perf/`.

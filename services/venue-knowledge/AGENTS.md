# Subteam brief — Venue / Knowledge

## Mission
Bind typed venue **slots** to real venues. **Contain the external-data swamp** (rate limits,
coverage gaps, freshness) behind one contract.

## Defining decision (sacred)
Everything external lives here, behind `ResolveVenues`. The rest of the system only speaks
`SlotSpec` and `VenueRef`. Cache hard.

## You implement
`VenueService` (resolveVenues).

## You PRODUCE
`VenueRef[]`.

## You CONSUME
External Places/Maps (start with a stub provider).

## Build
ResolveVenues API · provider adapter · normalization · cache (by area + slot constraints).

## Degradation (must hold)
Provider down/rate-limited → cache / last-known. Coverage gap → signal so Suggestion uses shapes.

## Boundaries
Edit only this folder. No other subsystem imports a Places SDK.

## Definition of done
`resolveVenues` returns typed VenueRefs from a stub provider; cache present; coverage-gap signal
defined; contract test green.

## Build for horizontal scale
Stateless compute over a **shared cache** keyed by area+constraints — **cache hit-ratio is THE scaling metric** because the external provider quota/latency is the global ceiling. **Coalesce** identical concurrent lookups (singleflight) + TTL jitter to prevent stampedes; warm popular areas; **fast-fail** coverage gaps. Bottlenecks: provider rate-limit/latency, cache-miss stampede.

A perf + stress skeleton is in `perf/` (`npm run bench` / `npm run stress`) — it prints its scenarios now and measures once you build. Keep it honest; capture new bottlenecks in `docs/SCALING.md`. Full map: `docs/SCALING.md`.

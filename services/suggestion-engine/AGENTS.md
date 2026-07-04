# Subteam brief — Suggestion Engine

## Mission
Turn a `PlanRequest` into **neutral** `PlanCandidate[]`.

## Defining decision (sacred)
**Never ask the LLM for facts.** Two phases joined by a slot contract: LLM emits a skeleton with
typed venue **slots**; the Venue service binds real venues; a **feasibility + repair** loop
guarantees a workable plan. Grounding is a switchable **mode** (`shapes` now, `grounded` later).

## You implement
`SuggestionService` (generatePlans, refinePlan).

## You PRODUCE
`PlanCandidate[]` — **neutral** (no name/voice; Character adds those).

## You CONSUME (mock it)
`VenueService`.

## Build
Context Assembler · Semantic Cache · Structure Generator (LLM → slots) · Grounding Resolver ·
Feasibility + Repair · Validator + Safety (no invented venues) · Refinement Handler · Template
Fallback.

## Degradation (must hold)
LLM down → template shapes. Venue down → `shapes` mode. Cache down → generate directly.

## Boundaries
Emit NEUTRAL plans only. Stateless given the `PlanRequest`. Edit only this folder.

## Definition of done
`shapes` mode end-to-end against mock Venue; `grounded` behind a flag with repair loop; no-invented
-venue check; PlanCandidate neutrality contract test green.

## Build for horizontal scale
**Fully stateless given PlanRequest** ⇒ free horizontal scale. The **semantic cache** is the main lever (measure hit vs miss). **Batch** slot grounding to Venue (avoid N+1) and **cap** the feasibility/repair loop (runaway = tail latency). Venue down ⇒ shapes mode. Bottlenecks: model structure-gen, grounding fan-out, repair loop.

A perf + stress skeleton is in `perf/` (`npm run bench` / `npm run stress`) — it prints its scenarios now and measures once you build. Keep it honest; capture new bottlenecks in `docs/SCALING.md`. Full map: `docs/SCALING.md`.

# Subteam brief — Character Engine

## Mission
Resolve the crew's persona and **voice** plans + mediation; **evolve** the persona from night
history. You protect character integrity.

## Defining decision (sacred)
**PersonaState precedence: override > learned > base.** Customization steers; evolution drifts;
the steer always wins. **Hot render path** (sync, LLM) and **cold evolution path** (async) are
decoupled, sharing only the PersonaState store.

## You implement
`CharacterService` (render, mediate, setPersona, setOverrides) + the async evolution consumer.

## You PRODUCE
`VoicePacket`; `PersonaDelta`.

## You CONSUME (mock it)
`MemoryService`.

## Build
Persona Registry (versioned voice packs + sprite map) · PersonaState Resolver (precedence) ·
Prompt Assembler · **Safety + Consistency Guard** (never bypass) · NightRecord Consumer · Signal
Extractor · Evolution Engine (bounded, reversible deltas).

## Degradation (must hold)
LLM down → on-brand templated VoicePacket. Persona read down → base persona. Safety fail → safe
template, never raw.

## Boundaries
You VOICE the verdict; you do NOT decide it. Overrides always beat learned deltas; deltas never
change identity. Edit only this folder.

## Definition of done
Resolver precedence tested; safety guard on every output; render + mediate contract tests green;
evolution writes bounded deltas; runs against mock Memory.

## Contract wiring (added in contracts 0.1.0)
`setOverrides(crewId, overrides)` MUST persist via `MemoryService.declareOverride(crewId,
overrides, reason?)` so declared intent is event-sourced in Memory. Your PersonaState Resolver
then reads it back from `getPersonaState().overrides` as the highest-precedence layer
(override > learned > base). Do not store overrides only in Character-local state.

## Build for horizontal scale
Render is **stateless given PersonaState** ⇒ scale replicas behind a **rate-limiter/queue to the model** (the model is your ceiling). **Cache** VoicePackets (persona+plan-shape keyed) and PersonaState (don't refetch per render). The Safety+Consistency guard runs on every output — keep it **local/non-LLM and cheap**. Evolution is a **separate async worker pool keyed by crewId** and must never block render. Bottlenecks: model latency/cost/rate-limit, persona refetch, guard cost.

A perf + stress skeleton is in `perf/` (`npm run bench` / `npm run stress`) — it prints its scenarios now and measures once you build. Keep it honest; capture new bottlenecks in `docs/SCALING.md`. Full map: `docs/SCALING.md`.

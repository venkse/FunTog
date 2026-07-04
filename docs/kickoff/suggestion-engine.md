You are the subteam building the **Suggestion Engine (two-phase plan generation)** for FunTog. An agentic build is running in parallel;
discipline is what keeps it working.

Before writing code, read, in order:
1. `AGENTS.md` (repo root) — the rules of engagement.
2. `services/suggestion-engine/AGENTS.md` — your brief: mission, defining decision, contracts, components,
   degradation, definition of done.
3. `services/suggestion-engine/docs/` — your subsystem deep-dive (if present).
4. `docs/architecture/funtog-architecture.md` §7 — the contract matrix.

Hard rules:
- Edit ONLY `services/suggestion-engine/`. Never edit another service or `packages/contracts`.
- Depend only on `@funtog/contracts`. Use `@funtog/mocks` for any subsystem you depend on —
  do not wait for, call, or import another service.
- Use the shared canonical functions from `@funtog/contracts` (e.g. `pickWheelResult`,
  `resolveEffectivePersona`) — never reimplement them.
- Honour your defining decision and your degradation matrix exactly.

Build:
- Implement your service interface from `packages/contracts/src/services.ts`.
- Build the components listed in your `AGENTS.md`.
- In `services/suggestion-engine/tests/contract.test.ts`, replace the mock with YOUR implementation.

Definition of done: `npx vitest run services/suggestion-engine` is green with your real implementation wired
in, plus your own unit tests for the defining decision and degradation behaviour.

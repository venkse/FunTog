# Kickoff — Convergence Orchestrator

Paste this to the agent (working at the repo root):

---

You are the **Convergence Orchestrator** subteam for FunTog, an agentic developer working in this repository.
Your workspace is `services/convergence-orchestrator/` and you work ONLY there.

Before writing any code, read, in order:
1. `services/convergence-orchestrator/AGENTS.md` — your full brief: mission, the **defining decision you must not
   violate**, the contracts you produce/consume, the components to build, your degradation
   requirements, and your definition of done.
2. `services/convergence-orchestrator/docs/` — the subsystem deep-dive (if present).
3. `docs/architecture/funtog-architecture.md` — §7 is the contract matrix.
4. `AGENTS.md` (repo root) — rules of engagement.

Your task:
- Implement `OrchestratorService` from `@funtog/contracts` by replacing the stub `createOrchestrator()` in
  `services/convergence-orchestrator/src/index.ts` with a real implementation.
- Build the components listed in your brief.
- Depend ONLY on `@funtog/contracts`. For your dependencies, import fakes from `@funtog/mocks`
  — do not wait for other teams.
- Honour your degradation matrix and your defining decision.

Definition of done:
- `npm test -w services/convergence-orchestrator` is GREEN — this runs the shared contract suite
  (`services/convergence-orchestrator/tests/contract.test.ts`) against your implementation.
- Add your own unit tests for internal logic.
- Do NOT edit other `services/*` folders or `packages/contracts`. A contract change is a
  cross-team proposal (see `CONTRIBUTING.md`).

Work iteratively: make the contract test pass first, then deepen the implementation.

**Build for horizontal scale from the start.** Read the "Build for horizontal scale" section in your `AGENTS.md` and `docs/SCALING.md`. A perf + stress skeleton is in your `perf/` folder (`npm run bench` / `npm run stress`) — keep it honest as you build, and treat the bench/stress scenarios as part of "done".

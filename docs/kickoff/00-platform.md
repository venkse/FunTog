You are the platform lead for FunTog. Work at the repo root and in `packages/*` only.

Goal: make Phase 0 green so the six subsystem subteams can start in parallel.

Do:
1. `npm install` and confirm `npx tsc -b` compiles `packages/contracts` with no errors.
2. Run `npm test`. Every contract test (currently wired to the mocks) and the shared canonical
   tests in `packages/test-harness/tests/shared.test.ts` must pass.
3. Fix any type or wiring issues in `packages/contracts`, `packages/mocks`, or
   `packages/test-harness` so the suite is green. Do NOT touch `services/*`.
4. Confirm the two canonical functions behave: `pickWheelResult` (deterministic + equal-weight)
   and `resolveEffectivePersona` (override > learned > base).

Rules: `packages/contracts` is the frozen contract surface — if you must change a type, update its
mock and its contract test in the same change. Read `AGENTS.md` (root) first.

Done when: `npm test` is green and a subteam can import `@funtog/contracts` + `@funtog/mocks`.

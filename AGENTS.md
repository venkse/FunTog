# Rules of engagement — all subteams

FunTog is built by independent subteams (human or agentic), one per subsystem. Parallelism
only works if everyone obeys these rules.

## The golden rules
1. **Code to contracts, never to internals.** Depend only on `packages/contracts`. Never import
   from another `services/*` folder.
2. **You own your folder only.** Work exclusively inside your `services/<you>/` directory.
   Do not edit another service's folder.
3. **`packages/contracts` is shared and frozen.** Changing a contract is a cross-team event:
   open a contract-change proposal, update the type + its mock + the contract tests, and announce
   it. Never quietly change a shared schema.
4. **Build against mocks.** Your dependencies may not exist yet. Use `packages/mocks` so you can
   build and test in isolation today. Integration swaps mocks for reals later.
5. **Definition of done = green contract tests.** You are done when (a) your unit tests pass and
   (b) the contract tests for the contracts you *produce* pass against your implementation.
6. **Honour your degradation matrix.** Your `AGENTS.md` lists what must still work when a
   dependency is down. This is not optional.
7. **Keep your defining decision sacred.** Each subsystem has one (in your `AGENTS.md`). It is the
   reason the architecture holds. Do not violate it for convenience.

8. **Build for horizontal scale from the ground up.** Honour your partition key, keep compute
   stateless where correctness allows, and externalize state. Each subsystem has a perf + stress
   skeleton in `perf/` and a brief in its `AGENTS.md`; the system-wide bottleneck map is
   `docs/SCALING.md`.

## Where truth lives
- Architecture: `docs/architecture/funtog-architecture.md` (start here), then your deep-dive.
- The contract matrix (who produces/consumes what): §7 of that doc.
- Your brief: `services/<you>/AGENTS.md`.

## Commands
- Install: `npm install`
- Build all: `npm run build`
- Test all: `npm test`
- Test one service: `npm test -w services/<name>`

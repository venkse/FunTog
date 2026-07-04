# FunTog

A character-driven group event planner. FunTog is the friend in your group who actually
plans things — and makes the planning itself fun.

This is a **modular monorepo**. Each subsystem lives in its own folder under `services/`,
owned by one (agentic) subteam, and built against shared contracts in `packages/contracts`.

## Navigation
- `docs/architecture/` — the architecture source of truth (high-level view, sequence, contract
  matrix, and the four subsystem deep-dives). **Read `funtog-architecture.md` first.**
- `docs/BUILD-PLAN.md` — how the parallel build is sequenced.
- `AGENTS.md` — rules of engagement for every subteam. **Read before touching code.**
- `packages/contracts/` — the frozen contract surface every team codes against.
- `packages/mocks/` — contract-faithful fakes of every subsystem, so you can build in isolation.
- `services/<subsystem>/` — one subsystem per folder, each with its own `AGENTS.md` brief.

## Quick start (per subteam)
1. Read `AGENTS.md` (root) and your `services/<you>/AGENTS.md`.
2. Implement your service's interface from `packages/contracts/src/services.ts`.
3. Develop and test against `packages/mocks` for your dependencies.
4. Done = your unit tests + the contract tests for what you produce are green.

## Run & deploy

`apps/server` is the deployable surface: a small HTTP server wiring the real
suggestion-engine + venue-knowledge services (stub venue provider) plus the character
demo pages. Like everything here it runs straight from TypeScript via tsx — no build step.

```sh
npm install
npm test                                  # all workspaces
npm start --workspace @funtog/server      # http://localhost:3000
```

Endpoints: `/` (index), `/healthz`, `GET|POST /api/plans` (params/body: `vibe`, `area`,
`groundingMode`, `crewConstraints`), `/demo/<page>.html`.

**Container:** `docker build -t funtog . && docker run -p 3000:3000 funtog`

**Pipeline:** `.github/workflows/ci.yml` tests every push/PR; `.github/workflows/deploy.yml`
runs on pushes to `main` — tests, builds the image, pushes it to
`ghcr.io/venkse/funtog` (`latest` + short-SHA tags), and smoke-tests the pushed image
against `/healthz`. Pull a deployed build with `docker pull ghcr.io/venkse/funtog:latest`.

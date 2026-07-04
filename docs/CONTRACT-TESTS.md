# Contract tests — how "done" is enforced

Each subsystem has a **contract test** in `services/<you>/tests/contract.test.ts`. It runs a
reusable suite from `@funtog/test-harness` against an implementation of your service interface.

Right now every contract test runs against the **mock** of that subsystem — this proves the suite
and the mock agree. **Your job:** swap the mock for your real implementation and keep the test
green. That is your definition of done.

```ts
// before
import { mockSuggestion } from "@funtog/mocks";
suggestionContract("mock", mockSuggestion);

// after (your work)
import { SuggestionEngine } from "../src";
suggestionContract("real", new SuggestionEngine(/* deps via mocks */));
```

The two **defining decisions** are encoded as shared, executable contracts in
`packages/contracts` and tested in `packages/test-harness/tests/shared.test.ts`:
- `pickWheelResult(contenders, seed)` — deterministic + equal-weight (the honest wheel).
- `resolveEffectivePersona(state)` — override > learned > base (customization always wins).

Every team must use these shared functions rather than reimplementing them, so server and clients
never diverge.

## Run
```bash
npm install            # installs vitest (Phase 0)
npm test               # runs every contract test in the monorepo
npx vitest run services/character-engine   # just one subsystem
```

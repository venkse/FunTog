# @funtog/design-system

FunTog's React component library: the plum/coral/flame brand as reusable parts.

- **Tokens** — CSS variables (`--ft-*`) in `src/tokens.css`: colors, type scale, spacing, radii.
- **Styles** — plain CSS classes (`ft-<component>[--modifier]`) in `src/components.css`; no CSS-in-JS.
- **Components** — `Button`, `Badge`, `Card`, `Input`, `Select`, `StopRow`, `PlanCard`, `Mascot`.

## Usage

```tsx
import { Button, PlanCard } from "@funtog/design-system";
import "@funtog/design-system/dist/styles.css";

<div className="ft-root">
  <PlanCard
    arc="small plates → lively bar → late-night sweet"
    stops={[{ time: "20:00", what: "The Midnight Kitchen", tags: ["$$"] }]}
    actionLabel="Lock it in"
  />
  <Button variant="flame">Plan my night</Button>
</div>
```

Wrap the app (or any styled region) in `.ft-root` — it sets the plum background,
cream text, and body font that the components are designed against.

## Build

```sh
npm run build --workspace @funtog/design-system   # dist/index.js + styles.css + .d.ts
```

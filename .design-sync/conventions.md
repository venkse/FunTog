# FunTog conventions

**Wrap every screen in `.ft-root`.** It sets the plum radial background, cream text, and the Nunito body font the components are designed against — without it, components sit on white and the cream/muted text is unreadable:

```jsx
<div className="ft-root" style={{ minHeight: "100vh", padding: 32 }}>
  …your screen…
</div>
```

**Styling idiom: `ft-*` classes on components, `var(--ft-*)` tokens for your own layout glue.** Components style themselves — never restyle their internals. For your own containers and text, use the tokens defined in `styles.css`:

| Kind | Tokens |
|---|---|
| Brand colors | `--ft-plum` `--ft-plum-2` `--ft-plum-3` `--ft-coral` `--ft-coral-dark` `--ft-flame-1` `--ft-flame-2` `--ft-spark` `--ft-blush` `--ft-cream` `--ft-muted` `--ft-ink` |
| Semantic | `--ft-bg` `--ft-surface` `--ft-surface-raised` `--ft-border` `--ft-border-strong` `--ft-text` `--ft-text-muted` `--ft-danger` |
| Type | `--ft-font-display` (Fredoka — headings/buttons) `--ft-font-body` (Nunito); sizes `--ft-text-xs` … `--ft-text-xl` |
| Space / shape | `--ft-space-xs|sm|md|lg|xl`; `--ft-radius-sm|md|lg|pill`; `--ft-focus-ring` `--ft-shadow` |

Headings: `font-family: var(--ft-font-display)`, usually colored `var(--ft-spark)` (like card titles) or `var(--ft-cream)` with a `var(--ft-coral)` accent word.

**Components** (all from `window.FunTogDS`): `Button` (variants `flame`=primary CTA, `coral`, `outline`, `ghost`; sizes `sm|md|lg`), `Badge` (tones `coral|flame|muted|cream` — uppercase pill tags), `Card` (title/footer/interactive/selected), `Input` + `Select` (label/hint/error built in — don't hand-roll field labels), `StopRow` (time + venue + tags line), `PlanCard` (a full night plan: arc title + StopRows + CTA — the app's centerpiece card), `Mascot` (the flame character; moods `idle plotting thinking mischief smug wink tada cheer` — use sparingly, one per screen as personality).

**Truth lives in** `styles.css` (tokens + every `ft-*` class) and each component's `.d.ts` / `.prompt.md`. Read them before inventing anything.

**Idiomatic screen:**

```jsx
const { Button, Input, PlanCard, Mascot } = window.FunTogDS;

<div className="ft-root" style={{ minHeight: "100vh", padding: "var(--ft-space-xl)", display: "grid", gap: "var(--ft-space-lg)", justifyItems: "center" }}>
  <Mascot mood="plotting" size={120} />
  <h1 style={{ fontFamily: "var(--ft-font-display)", margin: 0 }}>
    Meet <b style={{ color: "var(--ft-coral)" }}>FunTog</b>
  </h1>
  <Input label="Vibe" placeholder="rooftop sunset drinks" hint="What's the energy tonight?" />
  <PlanCard
    arc="small plates → lively bar → late-night sweet"
    stops={[{ time: "20:00", what: "The Midnight Kitchen", tags: ["$$", "veg"] }]}
    actionLabel="Lock it in"
    selected
  />
  <Button variant="flame" size="lg">Plan my night</Button>
</div>
```

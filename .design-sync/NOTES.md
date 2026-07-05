# design-sync notes — FunTog

- The DS package must be built before the converter: `npm run build --workspace @funtog/design-system` (cfg.buildCmd). Entry is `./packages/design-system/dist/index.js`; `--node-modules` points at the repo root (react is hoisted there).
- This sandbox's playwright cache pins chromium build 1194 while staged playwright wants 1228 — run validate/capture/driver with `DS_CHROMIUM_PATH=/opt/pw-browsers/chromium`. On other machines a normal `npx playwright install chromium` works and the env var is unneeded.
- Components are designed against the dark `.ft-root` surface. Every authored preview wraps its cells in a `.ft-root` frame div — keep doing that for new previews or they render cream-on-white.
- Fonts (Fredoka, Nunito) load via a remote Google Fonts `@import` in styles.css → validate prints `[FONT_REMOTE]`, which is expected, not a miss. This sandbox blocks fonts.googleapis.com so local screenshots show fallback fonts; the uploaded DS loads them fine.
- `PlanCard` and `StopRow` have `cardMode: column` overrides (were flagged `[GRID_OVERFLOW]` as wide).

## Known render warns
- (none currently — the 8/8 render check is clean)

## Re-sync risks
- Mascot "Celebrating" cells: the spark animation fades 0→1→0, so a static capture can catch tada/cheer sparkles mid-fade (near-invisible). Graded good deliberately; don't chase it as a regression.
- First sync could NOT upload: DesignSync authorization is unavailable in this claude.ai/code environment (`/design-login` needs an interactive terminal). No `projectId` is pinned yet. When authorization exists (user runs "Send to Claude Code Web" from claude.ai/design, or an interactive terminal), pick the target per base SKILL §1, pin `projectId`, and upload the already-verified `ds-bundle/` (verdict at `ds-bundle/.resync-verdict.json` says upload.any=true, deletePaths=[]).
- Grades live in gitignored `.design-sync/.cache/review/` — until a first successful upload writes `_ds_sync.json` to a project, a fresh clone re-verifies everything (expected).

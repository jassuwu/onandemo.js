# onandemo — context

oneko.js put a pixel cat on your page; onandemo.js puts **anything** there. o-nandemo
(何でも, "anything") is a cursor-companion engine: bundled characters or your own
sprite sheet, chasing the mouse with oneko's exact manners.

## Language

Controlled vocabulary. Use these terms exactly; avoid the listed synonyms.

- **Companion** — the animated character that chases the cursor (the generalized cat). _Avoid_: pet, mascot, follower, sprite (the companion is driven *by* sprites; it isn't one).
- **Preset** — a bundled, ready-to-run companion: sheet + frame map + tuning, selectable by name. v1 ships `neko` (the homage) plus CC0 friends. _Avoid_: skin (the forks' word for re-arting the cat; a preset swaps the whole companion), theme.
- **Sheet** — the sprite-sheet image: a uniform grid of fixed-size cells. _Avoid_: spritesheet (in prose), atlas (the packed-rect format we deliberately don't parse — see ADR-0003), texture.
- **Cell** — one tile of a sheet, addressed `[col, row]` from the top-left. _Avoid_: frame (a frame is a cell shown at a tick; a cell is a position), tile.
- **Frame map** — the table that animates a sheet: each state name → an ordered list of cells. oneko.js hardcodes this as `spriteSets`; onandemo takes it as data. _Avoid_: spriteSets, animations object, atlas data.
- **State** — a named behavior the engine is in at each tick. Reserved names: `idle`, `alert`, and the eight run directions; only `idle` plus one run direction are required (ADR-0007). _Avoid_: mode, animation (an animation is what a state shows).
- **Antic** — a random idle performance: any non-reserved state in the frame map (sleeping, scratching, whatever the sheet offers). Triggered the oneko way: rare, and only after lingering. _Avoid_: idle animation (verbose), easter egg (antics are the product, not hidden).
- **Tick** — one engine step, 100 ms (~10 fps), rAF-gated. All speeds and durations count ticks. _Avoid_: frame (see Cell), interval.
- **Rest radius** — the distance (default 48 px) inside which the companion stops chasing and idles. _Avoid_: threshold, dead zone, stop distance.
- **Recipe** — the published prompt template a user pastes into their own image model to get back a compliant Sheet; onandemo never calls a model itself (ADR-0004). _Avoid_: generator, AI feature, prompt (bare, in user-facing copy).
- **Manners** — the courtesies inherited from oneko, engine behavior rather than options: the reduced-motion bail, position memory, self-cleanup, staying out of input and the accessibility tree, the fixed 10 fps tick (ADR-0009). _Avoid_: settings, defaults (manners can't be configured away; persistence is the lone opt-out).

## Shape

- A turborepo around one deliberately tiny, zero-dependency TypeScript library
  (`packages/onandemo`): pure engine logic unit-tested with bun test; one `onandemo()`
  factory returning `destroy()`. Everything that isn't chase behavior is an app (ADR-0005).
- Ships two builds — ESM for `import`, auto-initialising IIFE for a `<script>` tag —
  plus bundled preset assets. Live demo at **onandemo.jass.gg**.
- Load-bearing decisions are logged in [docs/adr/](docs/adr/); sprite provenance lives
  in NOTICE.md once presets land (PLAN P4).

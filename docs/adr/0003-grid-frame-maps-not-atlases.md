# 0003 — Frame maps are grid-and-states, not atlases

## Context

Every tool exports a different sheet description: TexturePacker JSON-hash (packed rects
plus named frame arrays), Aseprite `frameTags` (linear ranges), Phaser's
frameWidth/frameHeight config, KAPLAY's sliceX/sliceY with named from/to ranges.
oneko.js itself uses the simplest possible form: a fixed cell grid and a `spriteSets`
table of `[col, row]` lists per state.

## Considered options

- **Accept TexturePacker / Aseprite JSON natively:** rejected for v1 — packed-rect atlases force per-frame geometry through the whole engine, for tooling most hand-made pixel sheets never touch.
- **Uniform grid + named cell lists (chosen).** oneko's own shape, generalized: cell size plus `states: { name: [[col, row], ...] }`.

## Decision

The native frame map is a **uniform-grid descriptor**: a cell size and state-named
lists of `[col, row]` cells — a superset of oneko's `spriteSets` that any existing
oneko skin can port to by hand in minutes.

## Consequences

- A frame map is plain JSON-able data: presets, docs, and the demo's bring-your-own-sheet playground all share one format.
- Aseprite/TexturePacker support, if it comes, is an _adapter_ that produces this descriptor (Deferred to v2) — the engine never learns about packed rects.
- Porting the ecosystem's existing cat skins (spicetify-oneko's picker, the OneShot sprites) is a data exercise, which is the point.

# 0001 — Generalize oneko.js into a preset-driven companion engine

## Context

oneko.js is a 279-line IIFE: one hardcoded cat, one hardcoded `spriteSets` table, and
an upstream policy of merging nothing the original neko didn't do. Every variation —
skins, other characters, other behaviors — lives in scattered forks that copy the whole
file. The name onandemo (何でも, "anything") is the thesis: the chase behavior is the
engine; the cat is just data.

## Considered options

- **DOM-element companions (any element follows the cursor):** deferred — charming, but it abandons the sprite-sheet state machine that makes oneko feel alive (alert, antics, directional runs); v2 once the engine is proven.
- **Sheet + frame map as data, behavior fixed (chosen).** The oneko state machine stays canonical; "anything" means any art driven through it.

## Decision

v1 is a **preset-driven companion engine**: the oneko behavior model (rest radius,
alert countdown, 8-way chase, antics) is built in; the art is data — a bundled preset
or a user-supplied sheet + frame map.

## Consequences

- The engine must not assume 32×32 cells, an 8×4 grid, or the cat's exact state list — cell size and antics come from the frame map; only `idle`, `alert`, and the run directions are required.
- Bundled presets make zero-config `onandemo()` work; the `neko` homage preset is the default.
- DOM-element followers and multi-companion trails are explicitly out of v1 (PLAN: Deferred to v2).

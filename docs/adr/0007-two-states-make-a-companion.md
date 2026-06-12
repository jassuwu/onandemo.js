# 0007 — Two states make a Companion

Revisits [0001](0001-preset-driven-companion-engine.md).

## Context

0001 required `idle`, `alert`, and the run directions. Real sheets disagree: of the
verified CC0 candidates, Shepardskin's cat is side-view only, and Ninja Adventure /
Puny Characters walk in 4 directions, not oneko's 8. A contract our own bundled
presets can't pass makes "anything" false on day one.

## Considered options

- **Strict 8-direction + alert contract:** rejected — see above; it gates out most pixel art ever drawn.
- **Opt-in mirroring:** rejected — the no-config path must serve the most common sheet shape there is (side-view).
- **Two-state minimum with a load-time fallback ladder (chosen).**

## Decision

The minimum frame map is **`idle` plus at least one run direction**. Everything else
degrades at load time, never per tick:

- Direction ladder, resolved per missing direction in rung order: exact cells → mirrored opposite (`scaleX(-1)`; diagonals mirror before any snap, NE↔NW) → its horizontal (diagonals snap, horizontal wins: NE plays E) → mirrored horizontal → its vertical (NE plays N when no horizontal resolves) → any present direction, in the fixed order E, W, N, S, NE, NW, SE, SW. The last rung is what makes a vertical-only sheet legal under the two-state minimum. `mirror: false` opts asymmetric art out of every flipped rung.
- Missing `alert` → no alert pause: idle straight to chase. A frozen pause with no pose reads as jank, not anticipation.
- Antics by exclusion: any non-reserved state name is an Antic, triggered with oneko's manners. A sheet with no extra states just has a companion that never sleeps.

## Consequences

- This narrows 0001's "only `idle`, `alert`, and the run directions are required" to the two-state minimum above.
- oneko's edge-aware wall scratches and the tired→sleeping intro become neko-preset details, not engine concepts — the engine doesn't know what a wall is.
- The ladder resolves once when the frame map loads; the tick loop only ever sees a complete 8-direction table.

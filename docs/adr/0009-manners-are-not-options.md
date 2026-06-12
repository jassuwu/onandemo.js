# 0009 — Manners are not options

## Context

oneko shipped one knob (`data-cat`) and its courtesies hardcoded, and conquered the
internet anyway. Generalizing the cat invites generalizing the config — tick rate,
motion overrides, opt-outs for everything. A 60 fps "smooth mode" is the most
predictable future request, and it would be a different (worse) product.

## Considered options

- **Expose `tickMs`:** rejected — the 10 fps shuffle *is* the charm; speed tunes in px per tick, never in tick rate.
- **Container/mount-target option:** deferred — v1 companions live on `document.body`, full-viewport, like every oneko ever (PLAN: Deferred to v2).

## Decision

Five **Manners** are engine behavior, not options:

1. `prefers-reduced-motion` → hard bail: no element, no listeners.
2. Position memory in `localStorage["onandemo"]`, default on — the single opt-out-able manner (`persist: false`).
3. Self-cleanup: the rAF loop dies when the element leaves the DOM.
4. `pointer-events: none`, `aria-hidden`, `image-rendering: pixelated`, max-int z-index — never in your way, never in your accessibility tree.
5. A fixed, unexposed 100 ms tick.

The public surface is exactly six knobs — `preset` *or* `sheet` + `frameMap`, then
`speed`, `restRadius`, `scale`, `zIndex`, `persist` — mirrored as `data-*` attributes.

## Consequences

- Every future knob argues against oneko's one-knob history.
- `scale` is load-bearing, not decoration: the 16 px CC0 presets need 2× display; each preset's frame map carries its default, user options override it.
- "Make it smooth" requests get closed with a link here.

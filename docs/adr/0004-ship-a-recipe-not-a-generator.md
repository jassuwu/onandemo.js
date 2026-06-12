# 0004 — Ship a Recipe, not a generator

## Context

The "anything" promise begs for AI: describe a character, get a companion. The obvious
build is hosted generation — the site calls an image model server-side and returns a
finished Sheet. But image models are sloppy about exact pixel grids, so generated
output needs deterministic slicing and validation no matter who calls the model; and a
hosted path drags in API keys, cost, abuse handling, and a backend on a project whose
ethos is zero dependencies and as few lines as possible.

## Considered options

- **Hosted generation (site calls a model server-side):** rejected for v1 — backend, spend, and abuse surface for the part of the pipeline that isn't even the hard part.
- **Published prompt Recipe + client-side playground (chosen).** The user pastes the Recipe into whatever model they already have; the playground slices, validates, and exports the frame map.

## Decision

v1 ships a **Recipe** — a battle-tested prompt template published on the site — plus a
client-side playground that turns any image, generated or hand-drawn, into a Sheet +
frame map. onandemo never calls a model.

## Consequences

- The site stays fully static: no keys, no queue, no spend.
- The playground's slicer is the real engineering — grid detection, cell snapping, state assignment, frame-map export — and it serves hand-drawn sheets identically.
- The Recipe is shareable marketing on its own ("paste this into your image model").
- Hosted generation remains a clean v2 if the Recipe proves out (PLAN: Deferred to v2).

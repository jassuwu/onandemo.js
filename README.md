<div align="center">

# onandemo.js

_oneko.js, but anything chases your cursor._

**o-nandemo** (何でも) — "anything." the honorable cat, generalized: bring any
sprite sheet and it wakes up, chases your mouse, and naps when it catches you.

</div>

## use it

bring a sheet (a grid of cells) and a frame map (which cells mean what):

```html
<script
  src="https://unpkg.com/onandemo/dist/onandemo.js"
  data-sheet="./cat.png"
  data-frame-map="./cat.json"
></script>
```

or from npm — `bun add onandemo`:

```ts
import { onandemo } from "onandemo";

const destroy = onandemo({ sheet: "/cat.png", frameMap });
```

## the frame map

plain JSON: a cell size and state-named lists of `[col, row]` cells. this one
is the classic cat's actual layout:

```json
{
  "cellSize": 32,
  "states": {
    "idle": [[3, 3]],
    "alert": [[7, 3]],
    "E": [
      [3, 0],
      [3, 1]
    ],
    "W": [
      [4, 2],
      [4, 3]
    ],
    "sleeping": [
      [2, 0],
      [2, 1]
    ]
  }
}
```

`idle` plus one run direction is a complete companion — missing directions
resolve down a ladder (mirror, snap, fall back) so a side-view-only sheet still
chases in all eight. `alert` is optional. any other state name is an **antic**:
a rare idle performance, triggered the oneko way — only after lingering, about
once every twenty seconds.

## the knobs

| knob                 | default      | what it does                        |
| -------------------- | ------------ | ----------------------------------- |
| `sheet` + `frameMap` | —            | your art and its map                |
| `preset`             | —            | bundled companion by name (roadmap) |
| `speed`              | `10`         | chase speed in px per tick          |
| `restRadius`         | `48`         | distance inside which it rests      |
| `scale`              | `1`          | display multiplier                  |
| `zIndex`             | `2147483647` | stacking                            |
| `persist`            | `true`       | remember its position across loads  |

every knob is also a `data-*` attribute on the script tag (`data-speed="15"`).

## manners

inherited from oneko, engine behavior rather than options:

- bails out entirely under `prefers-reduced-motion` — no element, no listeners.
- never intercepts input and hides from assistive tech.
- the loop dies when the element leaves the DOM.
- remembers where it was (`persist: false` is the one opt-out).
- ten frames per second, always. the shuffle is the charm.

## how it works

every 100 ms the engine measures the distance to your cursor. past the rest
radius it runs one of eight directions at `speed` px per tick — the animation
is just `background-position` moving over your sheet, nothing else. inside the
rest radius it idles, and after lingering it might perform an antic from your
sheet. that is the whole engine: 6.6 KB minified, zero dependencies.

## roadmap

- bundled presets — zero-config `onandemo()` with the classic cat homage (public-domain provenance receipts in NOTICE.md) and CC0 friends.
- [onandemo.jass.gg](https://onandemo.jass.gg) — live demo, a playground that slices any image into a sheet + frame map, and the recipe: a prompt you paste into your own image model to get a compliant sheet back.
- npm `0.1.0` — the engine above is built and tested; the publish is imminent.
- a demo gif right here.
- chrome extension, then an electron desktop companion — the cat goes home.

---

<div align="center">

[MIT](LICENSE) · a love letter to [oneko.js](https://github.com/adryd325/oneko.js)

</div>

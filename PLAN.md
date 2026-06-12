# onandemo — build plan

> oneko.js, but anything chases your cursor. → **onandemo.jass.gg**

See [CONTEXT.md](CONTEXT.md) for vocabulary and [docs/adr/](docs/adr/) for decisions.

## Architecture

```
onandemo.js/                           # turborepo (ADR-0005); bun is the runtime everywhere
├── CONTEXT.md / PLAN.md / NOTICE.md   # docs root trio (NOTICE lands with presets, P4)
├── docs/adr/                          # numbered decisions
├── turbo.json                         # task graph: library build → app builds
├── packages/
│   └── onandemo/                      # THE library — deliberately tiny, zero deps; npm publishes from here
│       ├── src/
│       │   ├── engine.ts              # tick loop: idle gate → alert countdown → 8-way chase (oneko's manners)
│       │   ├── frame-map.ts           # frame map types + resolution: state → [col,row] → background-position
│       │   ├── direction.ts           # normalized vector → "N".."NW" with ±0.5 bands (pure, unit-tested)
│       │   └── dom.ts                 # the one impure file: div, fixed positioning, rAF gate, reduced-motion bail
│       ├── index.ts                   # onandemo(options) factory → destroy(); re-exports types
│       └── presets/                   # bundled sheets + frame maps (neko homage + CC0 friends)
├── apps/
│   ├── site/                          # Astro, static, no adapter → vercel → onandemo.jass.gg
│   │                                  # landing (dogfoods the IIFE build) + playground island + Recipe page
│   └── remotion/                      # hero (README gif) + social (sound + CTA) comps
└── scripts/                           # art.ts mark → build-icons.ts + build-og.ts
```

## Phases

- **P1 — Docs.** CONTEXT / PLAN / ADR 0001–0003. ✅
- **P2 — Scaffold.** turborepo + bun workspaces (packages/onandemo, apps/site, apps/remotion); prettier, tsconfig, CLAUDE.md bun rules; ESM + IIFE build like liquid-glass-cursor; publish the `onandemo` 0.0.1 name-stub (ADR-0008).
- **P3 — Core.** engine / frame-map / direction as pure modules with bun test; oneko parity pinned to its constants (48 px rest radius, 10 px/tick, alert countdown, 1-in-200 antic odds). ✅
- **P4 — Presets.** neko homage + 2–3 CC0 characters; NOTICE.md provenance (ADR-0002); neko inlined, the rest as package files resolved relative to the script (ADR-0006).
- **P5 — Site.** fonts + theme tokens, then Astro static (no adapter): landing that dogfoods the IIFE build, playground island (slice → assign states → export frame map), Recipe page; deploy to onandemo.jass.gg.
- **P6 — Identity.** mark in scripts/art.ts → favicons / PWA set / seeded byte-stable OG card.
- **P7 — Video.** Remotion hero + social from one component; choreography.ts beat sheet.
- **P8 — Ship.** mojify-style README (land the pun); CI (fmt / test / typecheck / build); npm publish 0.1.0 as `onandemo` (semver — ADR-0008); gh repo description + homepage + topics.

## Deferred to v2

- Chrome extension (`apps/extension`) — inject the companion on any page; first fast-follow.
- Desktop companion (`apps/desktop`) — Electron transparent click-through overlay: the same library with an OS-global cursor source. (Raycast: cut — extensions are sandboxed to Raycast's own surfaces, and a desktop app needs no remote.)
- DOM-element companions (point it at an emoji or an existing element — no sheet at all).
- Multiple companions (a trail/party chasing together).
- Atlas adapters (Aseprite `frameTags`, TexturePacker JSON-hash — see ADR-0003).
- Webring travel (oneko-webring's cross-site cat, generalized).
- Hosted sheet generation (v1's Recipe is copy-paste into your own model — see ADR-0004).
- Container/mount-target option (a companion scoped to an element instead of the viewport — see ADR-0009).

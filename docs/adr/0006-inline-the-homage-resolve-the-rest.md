# 0006 — Inline the homage, resolve the rest relative to the script

## Context

Zero-config `onandemo()` needs the neko Sheet from somewhere, and "tiny library" and
"bundled presets" pull in opposite directions. oneko.js assumed `./oneko.gif` next to
your HTML — the exact setup friction onandemo claims to remove. The scale of the
tension is small (oneko's whole sheet is 3.3 KB; ~4.4 KB base64) but the mechanics
become public contract the moment a script tag works.

## Considered options

- **Art-free core, every preset fetched:** rejected — even zero-config does a network round-trip and can flash an empty page before the companion exists.
- **All presets inlined:** rejected — the core bundle grows with every preset added; the size discipline dies by a thousand cats.
- **Inline only the default; the rest are package files (chosen).**

## Decision

The `neko` preset is base64-inlined into every build — one script tag, zero extra
requests, no path assumptions. Every other preset ships as files inside the npm
package: npm users `import ninja from 'onandemo/presets/ninja'` (subpath exports,
pay-per-import); script-tag users write `data-preset="ninja"` and the library resolves
`./presets/ninja.json` **relative to `document.currentScript.src`** — unpkg serves the
files from the same package, self-hosting works unchanged.

## Consequences

- The core bundle is never smaller than neko: ~4–5 KB of the budget is art, by design.
- The package's `presets/` URL layout is public API — renaming a preset file is a breaking change.
- Resolving against the script URL (not the page URL) is what makes the same snippet work from unpkg, jsdelivr, or a self-hosted copy — the oneko `./oneko.gif` failure mode is structurally gone.
- Presets stay inside `packages/onandemo` until a real size problem says otherwise.

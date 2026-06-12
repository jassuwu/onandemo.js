# 0008 — Semver for the library, CalVer for the apps

## Context

mojify ships `vYYYY.MM.DD.BUILD` calendar+build tags, and the instinct was to carry
that here. But npm's version field must be valid semver — mojify's scheme fails it
twice (four segments; leading zeros) — and a library's version signals compatibility,
not time: the preset URL layout (0006), the frame map contract (0003, 0007), and the
script-tag attributes are public API whose breaks must surface as major bumps for
`^`-range consumers and pinned unpkg snippets. The house already splits this way:
liquid-glass-cursor (library) is semver; mojify (app) is CalVer.

## Considered options

- **CalVer on npm (`2026.6.x`):** rejected — every January becomes a fake breaking change, real breaks hide in Tuesdays, and the build segment doesn't fit semver at all.
- **Semver everywhere, including apps:** rejected — apps have no compatibility contract; mojify's date tags are better release journalism.
- **Split by artifact kind (chosen).**

## Decision

`packages/onandemo` versions in **semver**, starting 0.1.0 (a 0.0.1 stub reserves the
npm name early). Apps version in **CalVer** where a version is needed at all — Chrome
Web Store accepts 1–4 dot-separated integers, so `apps/extension` can carry mojify's
exact `2026.6.12.0` shape when it ships.

## Consequences

- The documented script-tag snippet can pin by major (`onandemo@1`) once 1.0 lands.
- Breaking any ADR-declared contract (frame map, preset URLs, data attributes) forces a major bump — the ADRs are the record of what counts as breaking.
- The site needs no version; Vercel deploys are its timeline.

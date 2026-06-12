# 0002 — Bundle the classic cat on its public-domain record, with receipts

## Context

The homage preset wants the classic neko cat. adryd325/oneko.js bundles `oneko.gif`
under a blanket MIT notice with zero provenance — the ecosystem norm is silence on
artwork rights. The actual record: the oneko distribution's README/LSM declare the
program and bitmaps public domain, recorded by both [Debian's copyright file](https://metadata.ftp-master.debian.org/changelogs/main/o/oneko/unstable_copyright)
and the [FSF Free Software Directory](https://directory.fsf.org/wiki/Oneko). The
weakest link is the popular claim that Kenji Gotoh (who drew the 1989 art) declared it
public domain — that exists only on a fan site, with no primary source found.

## Considered options

- **Hot-link adryd's gif at a pinned commit (Vencord's approach):** rejected — no offline use, a third-party point of failure, and it dodges the rights question rather than answering it.
- **Original cat art only, no homage:** rejected — the homage is the pun's payoff; the public-domain record is solid enough to stand on if cited honestly.
- **Bundle oneko-derived frames + a NOTICE.md provenance file (chosen).**

## Decision

Bundle the classic cat frames for the `neko` preset, citing the Debian copyright file
and the FSF directory entry in **NOTICE.md**, hedged exactly as far as the record
supports: the oneko distribution declares itself public domain; the Gotoh declaration
stays attributed as reported, not established.

## Consequences

- NOTICE.md ships with the package and names every preset's source and license — exceeding the ecosystem norm on purpose.
- Never bundle oneko's non-cat sprites: the BSD daemon (© 1988 Marshall Kirk McKusick, all rights reserved) and the Sakura/Tomoyo CLAMP characters are carved out of the public-domain grant.
- Additional bundled presets are CC0-only (verified candidates: Shepardskin's "Cat sprites", Shade's "Puny Characters", Pixel-Boy & AAA's "Ninja Adventure", Kenney's "Tiny Dungeon"); CC-BY packs become documentation pointers, never bundled files.

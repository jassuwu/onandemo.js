# 0011 — Companions are links, and the repo is the registry

## Context

The playground's output was a JSON download — an artifact, not a creature. A
bring-your-own companion has no destination: nothing to send, nowhere to live.
quilt's lesson applies (the result lives in the URL, so it's a shareable link),
and the oneko ecosystem's lesson too: dozens of forks exist only to swap art.
ADR-0003 already declared that porting art is a data exercise; what's missing
is the path that data travels.

## Considered options

- **A hosted gallery with uploads:** rejected — backend, storage, moderation, spend; the opposite of the static-site spine (ADR-0004).
- **Third-party paste services for sharing:** rejected — a dependency with someone else's lifetime.
- **The URL is the creature + the repo is the registry (chosen).**

## Decision

The BYO ladder, all static:

1. **Mint** — the playground turns a sheet + frame map into a companion link: `{ v, sheet (data url), frameMap }`, base64url'd into the **URL fragment** of `/c`. The fragment never reaches a server; nothing is uploaded anywhere.
2. **`/c`** mounts the creature on arrival — whoever opens the link gets chased — and offers two doors: keep it, or make your own.
3. **Immortalize** — a PR adding `presets/<name>.{json,png}` to the repo ships the companion in the npm package (`data-preset="<name>"` everywhere, via unpkg) with credit in NOTICE.md. CC0/public-domain art only, same bar as ADR-0002.

## Consequences

- Link length scales with the sheet (~1.3× its bytes): a slime-sized sheet travels anywhere; a soldier-sized one (~33 KB link) can get truncated by chat apps. The mint UI shows a size meter — tiny sheets travel best.
- The fragment payload carries `v: 1`; future format changes bump it rather than breaking old links.
- The registry needs no infrastructure, but it does need a CONTRIBUTING note and review discipline: license receipts before merge, every time.
- Sharing becomes the product's growth loop — every minted link is a demo page for the library.

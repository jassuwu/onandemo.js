# contributing

the contribution this repo wants most is a companion — the repo is the
registry ([ADR-0011](docs/adr/0011-companions-are-links.md)): a merged preset
ships on npm and answers to `data-preset="<name>"` everywhere.

## add a companion

a preset is two files, side by side in
[`packages/onandemo/presets/`](packages/onandemo/presets/):

```
presets/
  <kebab-name>.json   { "sheet": "./<kebab-name>.png", "frameMap": { ... } }
  <kebab-name>.png    the sheet — a uniform grid of cells
```

the frame map needs `idle` plus at least one run direction; that is the whole
contract ([ADR-0007](docs/adr/0007-two-states-make-a-companion.md)). missing
directions resolve down the mirror/snap/fallback ladder, `alert` is optional,
and any other state name is an antic. tuning (`scale`, `speed`, `restRadius`)
rides inside the frame map, not in your PR description.

[`soldier.json`](packages/onandemo/presets/soldier.json) is the worked
example: 32 px cells at 2× scale, idle + alert + all eight directions + three
antics.

don't hand-write the cells. the
[playground](https://onandemo.jass.gg/playground) slices your sheet and
exports exactly this shape — mint the link first, see it chase, then open
the PR.

## the license bar

bundled art is CC0 or public domain. nothing else
([ADR-0002](docs/adr/0002-bundle-classic-cat-public-domain.md) set the bar;
every preset since clears it). no exceptions.

receipts required: your PR adds an entry to
[NOTICE.md](packages/onandemo/NOTICE.md) — source url, author, and the
license statement quoted from where it's published. the soldier & slime entry
shows the form.

drew it yourself? welcome — but say so explicitly in the PR and grant CC0 in
your NOTICE entry. "i drew it so it's fine" left unsaid doesn't merge.

## test it locally

```sh
bun install
bun dev   # at the repo root
```

then run your companion against the local site with
`data-preset="<your-name>"`, or feed it to the playground directly:

```ts
onandemo({ sheet: "/your-name.png", frameMap });
```

watch it chase before you push: every direction, the rest inside the rest
radius, each antic after lingering.

## code prs

- `bun test` and `bun run typecheck` must pass.
- the engine guards its manners
  ([ADR-0009](docs/adr/0009-manners-are-not-options.md)): new knobs,
  tick-rate changes, and manner opt-outs need an ADR conversation first, not
  a PR.
- many small commits beat one big one.

## pr checklist

- [ ] `presets/<kebab-name>.json` + `<kebab-name>.png`, side by side
- [ ] frame map has `idle` plus at least one run direction
- [ ] NOTICE.md entry: source url, author, quoted license
- [ ] art is CC0 or public domain (or yours, declared in the PR)
- [ ] ran it locally — directions, rest, antics all behave
- [ ] `bun test` and `bun run typecheck` pass

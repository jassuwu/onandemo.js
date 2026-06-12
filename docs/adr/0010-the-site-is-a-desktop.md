# 0010 — The site is a desktop

## Context

Site v1 ("desktop at dusk") was a website _about_ the library — warm dark theme,
sections, a demo. But the product is a desktop pet: NekoDA was a 1989 Macintosh
desk accessory before the cat ever saw a browser. A retro _skin_ would be a
theme without a reason; the honest move is the metaphor itself.

## Considered options

- **Windows 95 chrome:** rejected — maximum recognition, heavily mined territory (95.css, poolsuite); comfortable, not ownable.
- **X11/Motif (oneko's literal home):** rejected — the deepest cut, but hard to make beautiful and few visitors get the reference.
- **System 7, 1-bit (chosen).** The cat's birthplace. Paper white, ink black, dither texture, striped title bars, bitmap type.

## Decision

The site **is** a 1989-flavored desktop the companion lives on: the menu bar is
the nav, sections are windows with title-bar chrome, the playground is just
another window, and the companion roams over everything. One law governs color:
**the desktop is 1-bit; color belongs to companions** — amber appears only on
creature affordances (summon buttons, mint actions, the live odometer).

## Consequences

- Design tokens collapse to paper / ink / one amber pair; the dusk system retires.
- Type is bitmap-first: DotGothic16 for UI and body (it renders 何でも natively), Silkscreen for micro-labels, JetBrains Mono for code.
- Texture is dither, not gradients: the classic 50% checker desktop, pinstriped title bars.
- The icon and OG card restyle to match — the OG card becomes a screenshot of this desktop.
- Hover and selection are inversion (ink ↔ paper), the period-correct interaction signal.

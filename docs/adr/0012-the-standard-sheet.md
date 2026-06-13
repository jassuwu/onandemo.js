# 0012 — The standard sheet: one layout the recipe writes and the playground reads

## Context

The make-your-own path was two hard steps bolted together: craft a prompt, then
hand-slice whatever came back — drop the image, guess a cell size, select a
state, click cells in order, repeat for every state. The recipe and the
playground knew nothing about each other, so the human was the glue. The ask was
blunt: drop a sheet and immediately have a pet, no snipping.

The fix is to make the two ends share a contract. If the recipe always produces
the **same layout**, the playground never has to ask what's in each cell — it
already knows. The richness moves into the prompt (which you paste, not read) so
it can come back out of the playground automatically.

## Considered options

- **A minimal 4×2 layout (walk + idle/sleep):** rejected — simplest for a model to land, but the resulting pet only walks left/right with one antic; a pale shadow of the bundled cat.
- **The full neko 8×4 layout (chosen).** The exact 32-cell slot map the `neko` preset uses: eight directions, alert, and the sleep/tired/scratch antics. A recipe sheet becomes a complete cat-equivalent pet, and the prompt's length is fine because nobody hand-writes it.

## Decision

The **standard sheet** is the neko layout: a grid of 8 columns by 4 rows, 32
cells, mapped exactly as `packages/onandemo/src/presets/neko.ts`.

The recipe prompts for precisely this slot map. The playground assumes it on
drop: cell size is **derived from the image's own dimensions**
(`floor(width/8)` × `floor(height/4)`), not a fixed 32 — so any size the model
returns slices correctly as long as the grid count is right. It applies the
known neko frame map and the companion is live, full-featured, before the
visitor touches a control.

Hand-slicing arbitrary sheets stays — demoted to a "different layout?" fold — so
the "anything" promise (ADR-0001) is intact for non-standard art.

## Consequences

- The recipe and playground are coupled by the standard sheet; changing the layout means changing both and is breaking for in-flight recipes.
- Deriving cell size from the image makes the playground forgiving of a model that nails the grid shape but not the pixel count.
- A minted link (ADR-0011) is reachable in two drops-and-a-click: drop → it chases → mint.
- A standard pet is the cat's equal — eight hand-drawn directions and every antic — not a mirrored-walk approximation. The cost is asking the model for 32 clean cells; the recipe leans on tight constraints to get them, and the fold catches the misses.

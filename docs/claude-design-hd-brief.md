# Brief for Claude Design: LOAMKEEP, HD pixel-art pass (3× fine grid)

## What the game is

LOAMKEEP is a calm, exploratory pixel-art platformer in a late-80s Amiga spirit.
- A small hooded figure walks through a meadow, a keep, a crypt, a flooded cistern, a glowing grotto and a stone observatory.
- There is no combat. You meet animals (snail, frog, hare, hedgehog, bats, owls, moths, fish, glowfish…) and find landmarks.
- Both fill sketchbooks: parchment pages with a portrait and a short text.

The attached stills show the game as it ships today.

## The idea of the pass

- **Logical grid:** the game is authored on a **320×224** grid.
- **Stage:** drawn at a fixed **×3**, so the stage is **960×672** and never scales with the window.
- **Today:** every sprite is drawn in logical pixels, so each one is a block of 3×3 screen pixels. Two thirds of the resolution the canvas already has is wasted.
- **The pass:** draw on the **fine grid**, where 1 fine px = ⅓ logical px. That gives finer outlines, ordered dithering, rim lights, rounder shapes and three-times-finer motion.

It must still read as **pixel art, not as a smoothed or vector game**:
- every fine pixel is a hard square
- no antialiasing, no blur, no alpha gradients
- no rotation or scaling of sprites

**Nothing under the drawing moves.** Every sprite keeps its exact footprint in logical pixels, so its HD silhouette, downsampled ÷3, must match the classic one. Hitboxes, tile size (16×16) and level layouts are fixed.

## Palette

The game uses **DawnBringer 32 (DB32)**. The HD art stays inside it:
- Intermediate tones come from **4×4 Bayer dithering between two DB32 tones**, not from new colours.
- If a recipe truly needs a blended tone, name it as `mix(DB32 a, DB32 b, t)`. Never use a free hex.

The DB32 values are in the attached `constants.ts`.

## Deliverables

1. **A playable HTML prototype**, like the one made for my other game, SHATTER. It must have:
   - **C** to toggle classic ↔ HD
   - **V** for a split view: classic on the left half, HD on the right half, over the same scene
   - a small scene of the meadow (sky, hills, ground tiles, the figure walking, a snail, a plant or two)
   - a second panel with the other anchor pieces listed below
2. **A README of recipes**, written as plain pixel code that is easy to port. The game draws with PixiJS `Graphics.rect().fill()` and will bake HD sprites into textures. Use small primitives:
   - `set`, `rect`, `dither(t)`, `vgrad`, `disc`, `ring`, `mix`
   - Say for each piece which recipe draws it, and the rule behind it (outline weight, where the light comes from, how dithering is used). The rest of the game (19 tile kinds, 13 creatures, 13 plants, 9 levels of landmarks) will be extended from these rules, so the **rules matter more than the individual sprites**.

## The anchor pieces to draw (classic footprints in logical px)

| Piece | Classic size | What to show |
|---|---|---|
| **The figure** (player) | 12×16 | idle, a walk cycle (the existing stride/bob frames), jump, climb (on a ladder), swim. Facing right; left is a mirror. |
| **Snail** | 10×7 | the in-world crawl frames |
| **Hare** | 12×13 | in-world idle + hop |
| **Glowfish** | in-world ~9 px, portrait ~24×14 | both, including its glow as a dithered radial falloff (same radius as today) |
| **Moth** | 7×4 in-world, 15×10 portrait | both; wing frames |
| **Tiles**, 16×16 | Grass (top edge with tufts), Dirt, Stone, CastleBrick, CryptBrick, Water (body + animated surface ripple) | |
| **Parallax** | full 320 wide | the meadow sky + two ranges of hills (today: flat sky blue, dark hills with a light rim); and the belfry night sky with stars |
| **Sketchbook page** | the parchment popup in still 04 | the parchment (edge, shading, a fold or vignette by dithering), a portrait drawn at its own large size (not an enlarged small sprite), and the text block |
| **Type** | | propose a pixel font for the in-game text, which is a system monospace today (visible in still 04), sized to land on whole fine pixels. The title menu uses a 5×7 bitmap font: show it on the fine grid too. |

## What to avoid

- No new colours outside DB32 (see above).
- No change of silhouette, proportions or footprint. HD adds outline, rim light, shading and texture. It does not add anatomy or change the character design. A 7-px-tall snail must still read as the same snail at play distance.
- No 1-fine-pixel "noise" in place of texture. A speck that was 1 logical px should become ~2 fine px, with more of them, or the material reads as a flat slab with grain on it.
- No always-on effects the game doesn't have (trails, bloom, particles) unless proposed separately and clearly marked as optional.
- No scaling to the window. The stage is 960×672.

## Attached

- **Stills of the current game** (from `e2e/demo/out/shots/`): `01-the-meadow`, `03-the-lake`, `04-the-sketchbook`, `06-the-old-keep`, `07-the-crypt`, `08-the-title`.
- **Source of the pieces above**, so the classic side of the split view is exact:
  - `src/constants.ts`: DB32 and the grid
  - `src/entities/player.ts`: `drawFigure`
  - `src/entities/snail.ts`, `hare.ts`, `glowfish.ts`, `moth.ts`
  - `src/world/tilemap.ts`: `drawGrass`, `drawDirt`, `drawStone`, `drawCastleBrick`, `drawCryptBrick`, water
  - `src/world/parallax.ts`
  - `src/systems/sketchbook.ts`, `src/systems/pixel-font.ts`

# Handoff: LOAMKEEP HD pixel-art pass (3× fine grid)

> **Amended 2026-10-11 — superseded by `docs/superpowers/specs/2026-10-11-hd-pixel-art-pass-design.md`.**
> The art below is the target and is unchanged. The spec overrules five points: no whole-level bake (tiles in chunks), `ART_MODE` instead of a boolean, the sketchbook backdrop as a palette-remap filter, the book font's re-paging, and box arguments instead of positional ones. It also carries the current inventory, which has grown past this document.


## Overview
The game is authored on a 320×224 logical grid and drawn at a fixed ×3 (960×672). Today every sprite is drawn in logical pixels, so each is a 3×3 block of screen pixels. This pass draws sprites, tiles, skies, the sketchbook page and the in-game text on the **fine grid** (1 fine px = 1 screen px = ⅓ logical px) while keeping every footprint, hitbox, tile size and level layout unchanged.

## About the design files
The files in `prototype/` are **design references written in plain HTML/JS**, not production code. They show the intended look and behaviour. The job is to recreate them in the LOAMKEEP codebase (TypeScript + PixiJS v8, `Graphics.rect().fill()`), following its existing patterns:
- each HD piece becomes a draw function next to its classic one (e.g. `drawFigureHD` beside `drawFigure`),
- poses are baked once into textures (`renderer.generateTexture` or a `Graphics` cached per pose key), drawn as Sprites with `scale.x = ±1` for facing, exactly as today,
- a single flag switches classic ↔ HD.

`prototype/classic.js` is a verbatim JS port of the game's current draw code (player, snail, hare, glowfish, moth, plants, tilemap, parallax). `prototype/hd.js` holds the HD recipes. Port `hd.js` function by function; the primitives in `prototype/engine.js` are small and map 1:1 to Pixi.

## Fidelity
**High fidelity.** Every pixel colour, position and dither threshold in `hd.js` is final. Recreate it pixel-for-pixel. `RECIPES.md` gives the rules behind each recipe, so the remaining pieces (13 other tiles, 9 other creatures, 10 other plants, landmarks) can be drawn the same way.

## Non-negotiables (from the brief)
- Every fine px is a hard square: no antialiasing, no blur, **no alpha** (glow halos are opaque dithered pixels), no rotation or scaling of sprites.
- **Palette = DB32** (`src/constants.ts`). Intermediate tones only by 4×4 Bayer dither between two adjacent ramp tones. The off-palette tones the game already ships (meadow sky `0x88b6e8`, crypt greys `0x202020 / 0x303030 / 0xcfcfcf`, grotto `0x1a2030`, night hills `0x18162a / 0x0e0d16`, heath/peat/granite/puffball) are kept and never extended.
- **Footprint law.** Downsample each HD texture ÷3 by majority (a logical px is ink when ≥ 5 of its 9 fine px are ink). The result must equal the classic mask. `footprint(g, layers)` in `engine.js` does it. Port it as a unit test over every pose of every sprite; the prototype reports 0 mismatches for all anchor pieces.
- Stage stays 960×672 and never scales to the window.

## Screens / views (prototype pages)
1. **Meadow (playable).** 40×14-tile level: ground at row 8, a 2-tile step at x 12–15, a floating island at x 24–27, row 4. Figure, snail, hare, bush / small tree / pine (from `plants.ts`), three hill ranges plus sky. ←/→ or A/D walk, Space/↑/W jump. An attract mode walks the figure until a key is pressed.
2. **Figure & creatures.** The figure in idle, walk ±1, one HD-only walk in-between, jump, climb 0/1 (on a ladder) and swim −1/0/+1 (in water), each shown at play size with a ×2 loupe. Snail f0/f1, hare sit/ear/hop, glowfish tail0/glow .25 and tail1/glow 1, glowfish portrait, moth f0/f1, moth portrait. Each piece shows its footprint result.
3. **Tiles & type.** Grass, Dirt, Stone, CastleBrick, CryptBrick and Water (animated), each as a 2×2 block with a ×2 loupe. Menu font 5×7 on the fine grid. The proposed book font.
4. **Belfry night.** Sky, glow band, stars, moon and two hill ranges with the camera drifting (parallax factors as in `parallax.ts`).
5. **Sketchbook page.** Parchment, border, vignette, dog-ear, title, rule, page-size snail portrait, text block and hint, over a dimmed CastleBrick wall.

**Keys:** C classic/HD · V split (classic left half, HD right half) · M fine motion on/off · 1–5 pages. URL params `?page=N&mode=classic|hd|split` work too.

## Interactions & behaviour
- **Physics, critter AI and camera** come from the game's constants: walk 72 px/s, jump 300, gravity 700 (×1.6 falling), release cut ×0.5, camera smoothing rate 10. The prototype's physics is simplified and is not to be ported.
- **Fine motion** (HD only, toggle M): the stride becomes `round(sin(t·8)·3)` fine px instead of `round(sin)` logical px, the bob is `-|step|` fine, swim-arm lengths are `3·(3+2·phase)` fine, the hare hop is `round(sin·5·3)` fine, and parallax rounds to fine px. With M off, every HD frame is the classic frame redrawn.
- **Water ripple:** only on the active pool, as today. Surface offset ±3 fine (for the classic ±1 logical) plus a travelling 1-fine wave `round(sin(x·0.26 − 5t))`.
- **Glowfish glow:** keep the classic 4 quantised steps. Bake 5 halo textures and swap them.
- **Underwater:** `SUBMERGED_TINT` keeps applying on top of the HD figure, unchanged.

## State
- One global `hdArt: boolean`, persisted with the other settings. Optionally `fineMotion: boolean`, default on.
- Texture caches keyed by pose: figure `{air, swim, climb, climbPhase, step, bob, front, back}`, hare `{bounding, ear}`, snail frame, moth frame, glowfish `{tail, glow}`.
- Tiles: bake the whole level once into an HD render texture (Bayer is world-aligned, so tiles join seamlessly). Water is redrawn per frame, as now.

## Design tokens
- **DB32**: as `src/constants.ts`.
- **Ramp** (lit ↔ shadow neighbours, one step only). Full table in `engine.js` (`RAMP`):
  `white → lightSteel → heather → topaz → dimGray → verdigris → opal → valhalla → black` ·
  `pancho → twine → rope → oiledCedar → loulou → valhalla` ·
  `atlantis → christi → eltGreen → dell → opal` ·
  `lightSteel → viking → venice → deepKoamaru → valhalla` · `mandy → smokeyAsh` · `brown → clairvoyant → loulou`.
- **Bayer 4×4**: `[0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5]`, threshold `(v+.5)/16`. Allowed densities: 25 / 50 / 75 %. Anchored to the texture for sprites and to the world for tiles.
- **Outline:** 1 fine px. A full valhalla outline for the player only; everything else uses selout (light upper-left).
- **Type:** book font at dot 2 fine (12×18 fine cell, 6-dot advance, line pitch 30 fine = 10 logical) and dot 3 fine for titles. Menu font at dot 3 fine with diagonal bridges and a 1-fine shadow. Sketchbook geometry: frame 40,32,240,160 logical; text column at 150,78, wrap 30 characters; `TEXT_LINE_H = 10`.

## Assets
None. Everything is drawn in code from DB32. No images or fonts are loaded; the book font is a bitmap table (`BOOK` in `engine.js`).

## Files
- `RECIPES.md`: the laws (L1–L8) and the recipe for every piece. Read this first.
- `prototype/LOAMKEEP HD.html`: open in a browser.
- `prototype/engine.js`: palette, ramp, Bayer, the `F` fine buffer (`set / rect / dither / vgrad / hgrad / disc / ring / line / outline / edges / seam / round / elbows / shade`), the classic `G` recorder, `footprint()`, fonts.
- `prototype/classic.js`: the game's current draw code, ported verbatim (the reference for the split view).
- `prototype/hd.js`: every HD recipe. **This is what to port.**
- `prototype/app.js`: prototype harness (pages, toggles, simplified physics). Not to be ported.

## Suggested order
1. Port `engine.js` primitives as a tiny `FineCanvas` that bakes to a Pixi texture, plus `footprint()` as a Vitest test.
2. Figure → the 4 critters → tiles (one brick shader for all masonry kinds) → water → parallax → sketchbook → fonts.
3. Extend to the remaining tiles, creatures and plants with `RECIPES.md` §1, 3, 4 and 5, adding each to the footprint test.

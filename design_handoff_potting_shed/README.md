# Handoff: LOAMKEEP — The Potting Shed's interior (LOA-48), in HD

## Overview
A new level behind the Kitchen Garden's potting shed. From outside it is 7 tiles of shed. Inside it is a whole house: attic, two upper floors, a ground floor, a basement, and tunnels under the garden. The level is 120 × 88 tiles, with 30 rooms and 5 landmarks. It brings 3 new creatures (spider, mole, earthworm), 4 new tiles, 9 backdrop kinds and a light model. Everything is drawn to the HD pass rules (fine grid, DB32, footprint law).

## About the design files
The files in `prototype/` are **design references in plain HTML/JS**, not production code. They show the level, the art and the behaviour. Recreate them in the LOAMKEEP codebase (TypeScript + PixiJS v8), following its patterns:
- Level spec in `src/world/levels/potting-shed.ts`. A ready start is `potting-shed.ts` in this folder: rows, spawns, rooms, lights, decorations, creatures and landmarks with their texts, all in the game's format.
- New tiles in `tilemap.ts`. New entities `Spider`, `Mole` and `Earthworm` follow the `Critter` / `PatrolSpec` pattern of `mouse.ts` and `bookworm.ts`. Props become `DecorationSpec` draw functions.
- HD textures are baked once and drawn as sprites (see `HD_PASS_RECIPES.md` from the previous handoff).
- Classic draw code for every new piece is in `prototype/shed-art.js` (`C.*` tiles and creatures, `P.*` props and landmarks), in the same `g.rect().fill()` style as `drawShed`. Port it as-is. The HD versions are derived from it by `hdOf()` (in `app.js`) plus the per-tile HD recipes (`H.*` in `shed-art.js`).

## Fidelity
**High fidelity** for the map, tiles, backdrops, light model, props, creatures and texts. Port them pixel-for-pixel. The prototype's physics is simplified (no coyote/buffer edge cases): use the game's real `Player`.

## What to build
1. **Tiles** (`CHAR_TO_TILE` + `drawTile`):
   - `f` Floorboards. It needs `{up, down}` air flags from the map.
   - `j` Plank wall.
   - `e` Packed earth.
   - `r` Root earth: roots draw below its own tile.

   All four are solid. Recipes are in `RECIPES.md` §2.
2. **Backdrop regions with a kind.** Extend `backdropRegions` to `{col,row,cols,rows,kind}` and add the 9 `BD.*` patterns (RECIPES §3). The rooms list in `potting-shed.ts` *is* the region list.
3. **Light** (RECIPES §4). Bake per screen chunk: tiles, then backdrop, then decorations, then the `L` ramp. Warm sources also scatter glow pixels on backdrop pixels only. Creatures take the light band at their feet.
4. **Room reveal (proposal, presentation only).** Rooms not yet visited draw black. On entry they light up in 4 Bayer steps over 0.7 s. While the figure is in the shed, the camera holds the shed centred. This is what makes the "too big inside" gag land. If you'd rather not, see RECIPES §1 for the fallback.
5. **Entities.** Each one has a patrol/idle cycle, a greeting line and a portrait: `Spider` (on a thread), `Mole`, `Earthworm`. The cat, mouse, bookworm and moth are reused unchanged.
6. **Landmarks.** Five, with `drawBody`, `drawSketch` and description (exact texts in `potting-shed.ts`).
7. **Garden side.** Add a `Door` on the shed in `kitchen-garden.ts` (cols 29–35; door at col 30) to `potting-shed` / `from-garden`, and a `from-shed` spawn. The shed's outside does not change.
8. **Test.** Port `SHED.reach` (`shed-map.js`) as a Vitest check: every standing cell in a room must be reachable from the door, and back. The prototype gets 806/806. Better still, run the game's own physics port, as the garden's header comment describes.

## Interactions & behaviour
- Doors use E. Ladders: up/down to climb, a pop of 225 off the top. Water: swim. Jumps: 2 rows, or 3 with air. There are no other mechanics.
- Creatures:
  - spider: bobs `len·(0.8+0.2 sin 0.9t)`, legs alternate at 2.5 Hz;
  - mole: walks 9 px/s for 2.2 s, then rests 1.4 s;
  - earthworm: moves 4 px/s while stretched, 2 Hz frames.
- Prototype keys: C classic/HD, V split, F reveal on/off. Page 2 is a cutaway map: click it to go there.

## Design tokens
DB32 only, as `src/constants.ts`, plus the HD ramp in `engine.js` (`RAMP`), extended with `tahitiGold → twine/rope`, `smokeyAsh → mandy/loulou` and `rainforest → plum/stinger`. The light constants are 0.62 (no-shade level), 0.16 per ramp step and 0.86 (lift threshold). Glow density is 0.1, with goldenFizz inside r/4 and tahitiGold out to 0.6 r. Walls take 0.55 × the ambient of the neighbouring room.

## Files
- `RECIPES.md`: the level, the tiles, backdrops, light, props, creatures, landmarks. **Read first.**
- `HD_PASS_RECIPES.md`: the HD laws (L1–L8) everything obeys.
- `potting-shed.ts`: the level data in the game's format, generated from the prototype.
- `prototype/Potting Shed.html`: open in a browser.
- `prototype/shed-map.js`: room list → rows, lights, props, critters, landmarks, plus the reachability check. Edit rooms here, not the rows.
- `prototype/shed-art.js`: every new classic draw function, HD tile recipes, backdrops, light functions.
- `prototype/app.js`: harness: chunk baking, `hdOf()` derivation, physics, camera, reveal, pages.
- `prototype/engine.js`, `hd.js`, `classic.js`: shared HD primitives, the figure, existing tiles.

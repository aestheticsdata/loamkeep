# Handoff: The Meadow v3 — the level rebuilt 10× larger

## Overview
`src/world/levels/meadow.ts` goes from 60 × 32 tiles to **200 × 96**. On the surface it has four zones, each 50 columns wide: Forest edge, Stream & mill, Wheat field, Cliff. Underground there are four networks, linked at the bottom by a Great Gallery. The level keeps every exit it has today: the Old Keep, the Glow Grotto (through the crack) and the Observatory (trail gate). It also keeps its 7 existing landmarks and adds 19 new ones.

## About the design files
`Prairie v3 - Carte.dc.html` is a **design reference in HTML**: an annotated map, not production code. Open it in a browser next to `support.js`. The job is to rebuild the level in the LOAMKEEP codebase (TypeScript + PixiJS v8) following its existing patterns: an ASCII `LevelSpec`, `LandmarkSpec`, `DecorationSpec`, entities created in `createEntities()`, and the art in classic + HD (see `design_handoff_hd_pass/`).

## Fidelity
- **Tilemap: final.** `meadow-v3-rows.ts` holds the 96 rows of 200 characters, generated from the map. Paste it in as `MEADOW_ROWS`.
- **Not yet playtested.** Reachability is not guaranteed tile by tile. Check each route with the same reach rule as `potting-shed.test.ts` (walk and fall; jump up 1–2 rows with ≤3 columns of drift, or 3 rows with a column of air; jump across ≤3–4 columns). Adjust a ledge by one tile wherever it is needed.
- **New landmarks:** name and position are given; the art (classic + HD) is to be drawn following `RECIPES.md`.

## Files
- `meadow-v3-rows.ts`: `MEADOW_V3_ROWS`, the final tilemap.
- `meadow-v3.txt`: the same tilemap as plain text.
- `meadow-v3-markers.json`: the 67 numbered markers from the map: `{ n, col, row, kind }`. `row` is the row of the tile the object stands on, so world y = `row * TILE_SIZE`, like `onGrass`. `kind` is one of `checkpoint | existing-landmark | new-landmark | mechanic | hazard | exit`.
- `Prairie v3 - Carte.dc.html` + `support.js`: the annotated map (overview + two zooms).

## Tile legend
These characters already exist in `CHAR_TO_TILE`:
- `.` empty, `G` grass, `D` dirt, `S` stone, `K` dark stone, `W` water
- `B` castle brick, `F` castle floor, `P` gold pillar, `T` timber
- `H` ladder, `U` puffball (bounces), `g` granite, `j` plank wall

**Two new tiles** to add in `tilemap.ts`:
- `V` **Vine**: not solid, climbed exactly like `Ladder` (reuse the climbing code in `Player`). Art: a vine stem 2 px wide with alternating leaves, in `christi` / `eltGreen` / `dell`.
- `X` **Bramble**: not solid. On contact the player goes back to the last cairn they passed (see Checkpoints). Art: thorny stems in `brown` / `clairvoyant` / `loulou`, drawn standing on the tile below.

## Systems to add
1. **Checkpoints (cairn lanterns).** A `Cairn` entity: a small lit cairn (`goldenFizz` glow, dithered as in HD). Walking past it records `{levelId, x, y}` in `WorldState`. Touching a bramble, or a future hazard, fades the screen (`screen-fade.ts`) and respawns the player there. Markers: `kind: checkpoint`, 10 of them.
2. **MillWheel** (marker 13, centred around col 74, row 17). Four timber paddles turning slowly, about 1 revolution every 8 s. Each paddle is a moving 2 × 1 tile platform that carries the player. It lifts the player from the stream (row 20) to the mill roof (row 12).
3. **HayBale / Barrel**: a pushable block, 1 × 1 tile (16 × 16). It moves at 24 px/s while the player walks into it, falls with gravity, and cannot be pulled. Two hay bales in the field (markers 17 and 20): the loft at row 16 is 4 rows above the ground, out of reach without a bale. Barrels in the barrel cellar (marker 56): same entity, different art.
4. **Water current** (marker 46, the underground river rows 40–43, cols 58–104). Pushes the swimming player east at about 30 px/s. Swimming against it is possible but slow.
5. **Per-zone backdrops.** The level mixes several underground materials: dirt in the Burrows, dark stone, castle brick in the Cellars, granite under the Cliff. `LevelSpec.backdrop` is a single value today. Add a list of rectangles `{x0, y0, x1, y1, backdrop}` so that:
   - cols 105–150, rows 31–92 use `indoor-dark`;
   - cols 151–199, rows 24–92 use a grotto-style backdrop;
   - the rest uses `cave`.

## Zones and routes (numbers = markers)
### Surface (ground at row 20)
- **1 · Forest edge (cols 0–49).**
  - 1 Starting cairn, 2 Old Cairn, 3 Stone Marker (on the row-17 branch).
  - Canopy on three levels of timber branches (rows 17, 14, 11, 3), reached by vines (4, 7). 6 Ruined Arch at the very top, 5 Woodcutter's Stump.
  - Three ways down into the Burrows: holes 8 (cols 6–7) and 9 (cols 24–25), ravine 10 (cols 39–42).
  - Only the edges of these surface holes are irregular, on rows 20–25.
- **2 · Stream & mill (cols 50–99).**
  - 11 Cairn, 12 Hollow Tree.
  - The stream is crossed on two stepping stones (cols 64 and 69).
  - 13 Wheel, 14 Weathervane on the roof, 15 waterfall into the cavern.
- **3 · Wheat field (cols 100–149).**
  - 16 Cairn, 17 and 20 Hay bales, 18 Scarecrow, 19 Owl's Roost on the loft.
  - 21 Brambles (cols 120–123).
  - 22 Well with a ladder (col 131), down to 23, the Old Keep door (row 30).
- **4 · Cliff (cols 150–199).**
  - 24 Cairn. A zigzag chimney inside the cliff (cols 158–169), with 25 brambles on a ledge, 26 a shortcut rope and 27 Old Nest.
  - 28 Crystal Vein on the crag (row 4). 45 Observatory trail (col 196, row 4).

### Underground
- **The Roots, under the forest edge (cols 0–59, rows 22–92).**
  - A · Burrows: two levels of earth tunnels. 30 Cairn. 31 Hare's Larder, a secret reached through a one-tile hole in the floor at col 12. 37 Shortcut ladder down to the hall.
  - B · Root Shaft: cols 48–55, rows 25–88. It serves every sub-zone. Its top climbs back to the surface by a vine (44).
  - C · Root Hall: cols 4–44, rows 40–55, with a floor of thorns (35). It is crossed by the hanging roots (34) and four platforms. 33 Cairn, 36 Mother Root.
  - D · Black Pool: a swim around four pillars, with air pockets (39). 38 Sunken Stone, moved here.
  - E · Maze: three levels of galleries joined by ladders. 40 Cairn, 41 thorns, 42 Spiral Fossil in a closed pocket, 43 crack to the Grotto.
- **Under the stream (cols 56–105).**
  - Underground river with current (46).
  - Millstone Hall (rows 48–56): 48 Forgotten Millstones, 49 gears (hazard).
  - Cistern with columns and a walkway (rows 62–80): 47 waterfall, 50 Cairn, 51 Wishing Basin.
- **Vaulted Cellars, under the field (cols 105–150, castle brick).**
  - Joined by a silo (54) and by ladders. 53 Trapdoor from the Old Keep chamber.
  - Four cellars: the gold-column cellar (52 Cairn), 55 Ossuary, the barrel cellar (56), the harvesters' crypt (57 Harvester's Tomb, 58 Cairn).
- **Heart of the Cliff (cols 151–199, granite).**
  - Crystal gallery with puffballs (60). The one at col 191 launches the player into a secret chimney that leads to the summit (62).
  - 61 Geode.
  - Chasm in two sections (59), cut by 67 the Bat Hall.
  - 63 Crystal Lake.
- **Great Gallery (rows 86–88, cols 56–168).** It joins the Root Shaft, the silo and the chasm. 64 Cairn, 65 thorns, 66 Miner's Lantern.

## Spawns (to update)
- `default`: col 9, row 20 (on the grass, near the starting cairn).
- `from-keep`: next to marker 23 (col 135, row 30).
- `from-grotto`: next to marker 43 (col 11, row 88).
- `from-observatory`: col 194, row 4.

The Old Keep, the Grotto and the Observatory each have a door targeting `meadow`. Keep their spawn ids; only the coordinates change.

## Creatures (to place in `createEntities`)
- Rabbits on the forest and field grass.
- Birds at the canopy and cliff heights.
- Fish in the Black Pool, the deep lake under the stream and the cistern.
- Bats in the Bat Hall; moths and glowfish in the crystal gallery.

Use the existing entities (`rabbit`, `bird`, `fish`, `bat`, `moth`, `glowfish`, `owl` for the Owl's Roost).

## Design tokens
DB32 palette from `src/constants.ts`. The map's colours are only there for reading it (sky `#639bff`, cave background `#25222f`). In game, the tiles keep their `drawTile` art and its HD version.

## Suggested order
1. Add the `V` and `X` tiles, then paste `MEADOW_V3_ROWS` in and get the level loading.
2. Write a reachability test (in the style of `potting-shed.test.ts`) and fix the ledges it flags.
3. Add the cairns and the respawn.
4. Build HayBale, MillWheel and the current.
5. Place the existing landmarks, the doors and the spawns, then the new landmarks (classic + HD art).
6. Add the per-zone backdrops, then the creatures.

## Known code issue (decor audit)
In `old-keep.ts`, the `hangFromCeiling(10, 13)` and `hangFromCeiling(36, 13)` banners date from before the hidden passage (rows 12–13). They now hang inside it and stick 10 px into the solid floor above. Remove them, or re-anchor them to the lower room's real ceiling (the underside of row 14, bottom tip at about row 17).

## Next steps
The other levels (Glow Grotto, Old Keep, Garden, Shed, Library, Belfry, Crypt, Cistern, Observatory) will get the same treatment, one handoff each.

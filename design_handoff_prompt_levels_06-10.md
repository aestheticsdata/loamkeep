# Prompt for Claude Design — LOAMKEEP Levels 06 to 10

Paste everything below the line into Claude Design.

---

I need the last five design handoffs for LOAMKEEP, in the same format as the ones you already made (Level 02 Glow Grotto v2, Level 03 Old Keep v2, Level 04 Kitchen Garden v2, Level 05 Potting Shed v2). Deliver them as five folders, in this order — one at a time as each is ready is fine:

- `design_handoff_level_06_library_v2/`
- `design_handoff_level_07_belfry_v2/`
- `design_handoff_level_08_crypt_v2/`
- `design_handoff_level_09_flooded_cistern_v2/`
- `design_handoff_level_10_cairn_observatory_v2/`

## The game

LOAMKEEP is a 16-bit-style exploration platformer in TypeScript + PixiJS v8. Tiles are 16 px, the palette is DB32 (`src/constants.ts`), and every sprite and tile has a classic drawing and an HD drawing on a ×3 fine grid. Each level is an ASCII tilemap (one char per tile), with `LandmarkSpec` landmarks (name, short description in the game's gentle voice, position), decorations, and entities created in `createEntities()`. Every level is being rebuilt at roughly ten times its playable area. Levels 01–05 are built.

## Each folder holds

- `README.md` with the same sections as before: Overview, About the design files, Fidelity, Files, Tile legend, Mechanics, Regions (numbers = markers), Doors & spawns, Creatures, Design tokens, Suggested order.
- `level-NN-<name>-v2-rows.ts` (`<NAME>_V2_ROWS`) and the same as `.txt`: the final tilemap.
- `level-NN-<name>-v2-markers.json`: `{ n, name, col, row, kind }`, `row` = the row of the tile the object stands on (for a hanging hazard, the ceiling tile it hangs from); kind one of `checkpoint-* | existing-landmark | new-landmark | mechanic | hazard | exit`.
- `level-NN-<name>-v2-water-currents.json` if there are currents: `{ x0, y0, x1, y1, dir, speedPxPerS }`, tiles, inclusive.
- `level-NN-<name>-v2-map.png`: the annotated map, 1 tile = 8 px, today's level framed, markers numbered.

## What must not change in any level

Every door id, its target level and target spawn id, and every spawn id other levels target. Only positions move. Keep every existing landmark (moved if you like) and add new ones.

## Movement rules — please check the map against these before delivering

Levels 03 and 04 needed many fixes after delivery, all of the same few kinds, so please run your reachability script with exactly these rules, counting columns **from the take-off column to the landing column**:

- A jump rises at most 3 rows. Rising 3 rows it lands at most 3 columns over; rising 1–2 rows, at most 4 columns over. It needs clear headroom straight above the take-off tile.
- A flat jump crosses a gap of at most 3 empty columns.
- A hazard tile on a floor (`X`) is at most 2 tiles wide where the route has to cross it; 3 is not clearable.
- Puffballs (`U`) throw 8 rows. Ladders (`H`) and vines (`V`) are climbed; from their top the player steps onto a ledge beside it.
- A swimmer climbs out only onto a bank whose tile is **in the row directly above the water's top row** (one row up). A bank two rows up is a wall.
- Water sits in a basin: under every water tile is rock or more water; beside water, air only where it is a falling column at most 3 tiles wide.
- Every place reachable from the level's default spawn, the spawn reachable from every place, and **no one-way pockets**: every hole, shaft, sinkhole, drop or pool the player can fall into must have a way back out, or lead on to somewhere that does.
- A switch (lever, pump, crystal) must be reachable without what it opens. If a pocket is one-way until a switch is worked, that switch must be inside the pocket.

Mistakes we had to fix in Levels 03–04, please avoid them:

- pillars, piers and posts running floor to ceiling across a walkway or a channel meant to be walked or swum (make arches, or stop posts short of the bed);
- a ledge or platform directly under a ceiling or a walk, with no headroom to jump from it;
- a drop into a shaft or a pit with no ladder or ledges back up;
- maze walls that leave the next floor's hole on the unreachable side;
- landmarks or checkpoints placed on a tile you later turned into a hole.

## Tiles

Chars already taken; do not reuse them for anything new: `.` `G` `D` `S` `K` `W` `B` `F` `P` `c` `v` `T` `R` `L` `H` `h` `p` `g` `U` `a` `f` `j` `e` `r` `V` `X` `C` `Z` `^` `O` `Q` `Y` `N` (roof slate). If a level needs a new tile, pick a free char and specify its art (classic + HD), whether it is solid, and what it does.

## Systems already in the game — reuse them freely

- **Checkpoints**: a lit-when-passed checkpoint per region. Each level has its own look (cairn, glowcap lantern, tall candle, pumpkin lantern so far); give each new level its own.
- **Hazards** (`X`): send the player back to the last checkpoint. The look is chosen per region (bramble, iron spikes, hearth embers, cactus, hot pipes, thorny roots so far); new looks are welcome, with their art specified.
- **Climbing**: ladders `H`, vines `V`.
- **Push blocks**: hay bale, barrel, crate, ice (an ice block slides 2 tiles further after a push).
- **Moving platforms**: a wheel of paddles (any radius, paddle count and speed — the mill wheel, the noria, a gear wheel), and a shuttle between two points with pauses (minecart, lift).
- **Water**: swimming, water currents, a rising-water tank driven by a pump.
- **Updrafts** (`^`): always on, or pulsed (on/off cycle), and switchable by a lever.
- **Switches**: crystal switches that dissolve a crystal gate once all are lit; levers (one-shot, they drive portcullises, vents, tanks, anything switchable); the `Y` portcullis.
- **Falling hazards**: loose stone, icicle, keystone — they drop when the player passes under, respawn after 6 s.
- **Grab-and-ride**: swinging chandeliers (grab, swing as a pendulum, jump off with the swing's speed) and clotheslines (grab, slide downhill, let go at the end).
- **Creature hazards**: a wasps' nest whose swarm circles it.
- **Puffballs** (`U`).
- Per-region backdrops, and doors between levels.

## The five levels

### 06 · The Library (today 120 × 100, `old-keep-library.ts`)
Behind the keep's bookshelf door: a hall of stacks, floors above it, a dome, an archive below.
- Door: `library-return-door` (col 3, floor row 86) → `old-keep` `from-library`.
- Spawn others target: `from-keep`.
- Landmarks: First Account, Great Globe, Orrery.

### 07 · The Belfry (today 90 × 120, `old-keep-belfry.ts`)
The bell tower, climbed at night from the keep's upper floor to the roof.
- Door: `belfry-return-door` (col 33, floor row 115) → `old-keep` `from-belfry`.
- Spawn others target: `from-keep`.
- Landmarks: Tower Clock, Silent Bell, Weathervane.
- The keep now has ramparts and three towers at its top (Level 03); the belfry can share their night sky (`parallax: 'night'`).

### 08 · The Crypt (today only 22 × 28, `old-keep-crypt.ts`)
Small, dark, cosy, deeply buried, under the keep's basement. It grows the most of all.
- Doors: `crypt-return-door` (floor row 23) → `old-keep` `from-crypt`; `crypt-cistern-door` (col 8, row 27) → `flooded-cistern` `from-crypt`.
- Spawns others target: `from-keep`, `from-cistern`.
- Landmarks: Crypt Inscription, Ossuary.

### 09 · The Flooded Cistern (today 150 × 80, `flooded-cistern.ts`)
A swimming level under the crypt.
- Door: `cistern-return-door` (col 3, row 12) → `old-keep-crypt` `from-cistern`.
- Spawn others target: `from-crypt`.
- Landmarks: Drowned Statue, Sluice Wheel, Dry Shrine.
- Foreshadowed by the Kitchen Garden: at the east end of its east aqueduct stands **The Walled-up Arch** (a bricked arch carved with the spiral, water seeping east "toward somewhere flooded"). Please give the cistern the other face of that arch somewhere — no door, or a door if you decide the two should finally connect (then add a spawn for it on each side and say so).

### 10 · The Cairn Observatory (today 192 × 100, `cairn-observatory.ts`)
The spiral turns out to be a star chart: the hill at night above the meadow.
- Door: `observatory-return-door` (col 3, floor row 86) → `meadow` `from-observatory`.
- Spawn others target: `from-meadow`.
- Landmarks: Sighting Stone, Fallen Star, Watcher's Bothy.
- Tiles in use: `h` heath, `p` peat, `g` granite, `U` puffballs, `H`, `T`, `W`.

## Scope for each

Grow it to about ten times today's playable area, with new regions, routes that branch and loop, new landmarks (name, position, a short description in the game's gentle voice), creatures from the existing cast, and the mechanics above used where they suit the place — plus any new mechanic the place calls for, specified as fully as Level 03 specified the portcullis and the lever. Mark which walls and holes are irregular on purpose; everything else gets clean edges. List any tile you move after your reachability check, as Levels 03 and 04 did.

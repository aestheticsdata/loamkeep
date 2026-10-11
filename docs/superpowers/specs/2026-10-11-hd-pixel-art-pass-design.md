# The HD pixel-art pass

Epics LOA-25 (the world) and LOA-26 (the screens). This spec is LOA-27.

The art is Claude Design's, in `design_handoff_hd_pass/`:
- `README.md`
- `RECIPES.md`, laws L1–L8
- the prototype `prototype/LOAMKEEP HD.html`. Keys: C classic/HD, V split, M fine motion, 1–5 pages.

This document is that bundle measured against the repo. **Where the two disagree, this spec wins.** The bundle's README points here.

## The idea

The game simulates on a 320×224 grid and the stage is a fixed ×3 (960×672). Every sprite today is `Graphics.rect()` in logical px, so each one is made of 3×3 blocks of screen px. The pass draws on the **fine grid**: 1 fine px = 1 screen px = ⅓ logical px.

**Nothing under the drawing moves.** These stay exactly as they are:
- tile size, AABBs, physics, camera and level rows
- the 960×672 stage
- the 16-px wave wipe

## Rules

1. **Nothing that ships is dropped.** The game is the inventory, not the bundle. The bundle draws the anchor pieces. Everything else is drawn by its laws.
2. **Classic stays, intact and reachable**, behind `ART_MODE`. It stays the default until LOA-42.
3. **Footprint (L1).** The HD texture, downsampled ÷3 by majority (≥ 5 of 9 fine px), equals the classic mask exactly. This is enforced by `src/hd/footprint.test.ts` over every baked pose.
4. **DB32 only, no alpha (L4, L5, L7).**
   - Shading moves one step along `RAMP`.
   - Dither is 4×4 Bayer between two adjacent ramp tones, at 25 / 50 / 75 %.
   - The off-palette tones already shipped are kept, and none are added.
   - Halos are opaque Bayer pixels on a separate layer, excluded from the footprint.

## Measured against the prototype (2026-10-11)

- The footprint check reports **0 px off** on every anchor pose: figure ×9, snail ×2, hare ×3, glowfish ×2 plus its portrait, moth ×2 plus its portrait, and bush, small tree and pine. The figure's HD-only walk in-between has no classic twin.
- Belfry stars stand in the same places on both paths.

## Where the bundle is overruled

1. **No whole-level bake.**
   - The Cairn Observatory (192×100 tiles) would be a 9216×4800 texture, about 177 MB, and past many GPUs' `MAX_TEXTURE_SIZE`. The Old Keep would be 5232×6048.
   - Tiles are baked in **chunks** of 16×16 tiles (768×768 fine), on demand around the camera, and evicted when far away.
   - Bayer is anchored to the world, so chunk seams are invisible (LOA-29).
2. **The flag is `ART_MODE` (`classic` / `hd` / `split`), not a boolean.** Split is the A/B tool.
   - `fineMotion` is a separate switch, default on.
   - Both live in `src/hd/art-mode.ts` and are persisted in `localStorage` (`loamkeep.art`, `loamkeep.fineMotion`), with every access wrapped, as `sketchbook-store.ts` does.
   - In dev builds they are switched from the console: `__loamkeep.art('hd')`, `__loamkeep.fineMotion(false)`, or with `?art=hd` in the URL.
3. **Sketchbook backdrop.** It is `valhalla` at `alpha 0.7` today. The bundle steps every pixel behind two places down its ramp. In Pixi that is a palette-remap filter over the world layer (LOA-40).
4. **Book type.**
   - `TEXT_LINE_H` goes 13 → 10, and wrapping is by character count.
   - Every long page re-splits into leaves.
   - The glyph table must cover every character the books use (LOA-38).
5. **Parameters.** The prototype's primitives take up to seven positional arguments. The port takes a box object instead (`rect(box, colour)`, `dither(box, spec)`), per the house rule of three parameters at most.

## The toolkit — `src/hd/`

| File | What |
|---|---|
| `palette.ts` | `RAMP` (lit ↔ shadow neighbour per DB32 tone), `hiOf` / `loOf`, `bayer(x, y)` |
| `fine-canvas.ts` | `FineCanvas`, the fine-pixel raster. `set`, `rect`, `dither`, `vgrad`, `hgrad`, `disc`, `ring`, `line`, `shade`, `recolor`, `clear`, and the derived passes `outline`, `edges`, `seam`, `round`, `elbows` |
| `classic-recorder.ts` | a stand-in `Graphics` that records `rect().fill()`, so a classic draw function yields its mask and its ops (`up()` lifts them ×3) |
| `footprint.ts` | the L1 check |
| `bake.ts` | `FineCanvas` → Pixi texture, and `FineSprite`: a container whose child sprite sits at `(x0/3, y0/3)` at scale ⅓, so it is anchored and mirrored exactly like the classic `Graphics` it replaces |
| `art-mode.ts` | the flag, `fineMotion`, persistence and listeners |

**Positions already land on screen px** (`roundPixels`, `resolution = dpr`). HD adds fine in-betweens to the *animation* only (L8):
- stride `round(sin·3)` fine, and bob `-|step|`
- swim arms
- the hare's hop
- parallax rounded to fine px

With `fineMotion` off, every HD frame is a classic frame redrawn.

## Inventory and tickets

| Ticket | What | In the bundle | By the laws |
|---|---|---|---|
| LOA-29 | 20 tiles, water, backdrops | Grass, Dirt, Stone, CastleBrick, CryptBrick, Water, Ladder; the brick shader covers CastleFloor, DarkStone, CryptFloor | Timber, GrottoRock, Bookcase, Heath, Peat, Granite, Puffball, GoldPillar, AutumnTurf, the 3 backdrops |
| LOA-30 | the figure | all poses | — |
| LOA-31 | walkers | snail, hare | frog, hedgehog, rabbit, pumpkin, cat, mouse, hen, crab, newt, bookworm, spider |
| LOA-32 | fliers, swimmers | glowfish (+ halo), moth | bat, owl, bird, pigeon, bees, fireflies, fish, eel, kelp, spores |
| LOA-33 | props, 14 plants | bush, small tree, pine | the other 11 plants, door, chandelier, tall candle |
| LOA-34, LOA-35 | landmarks of every level | — | all |
| LOA-36 | parallax | meadow hills, night sky, moon | autumn sky, low sun, dust band, spiral constellation |
| LOA-37 | effects | — | leaves, `glow.ts`, sparkle, motes |
| LOA-38 – LOA-41 | type, title, sketchbook and greeting, stills | menu font, book font, sketchbook page | title, greeting |

## Tiles, measured (LOA-29, 2026-10-11)

- **Every tile kind keeps its footprint**: `src/world/tiles-hd.test.ts` checks all 18 drawn kinds (every kind but Empty and Water) over 40 tiles each, so every hashed variant (tufts, flowers, pebbles, rivets, cracks both ways, spines) is covered. The test found one thing classic does: Heath and AutumnTurf lay their dither row at `i + (ty & 1)`, which on odd rows paints one pixel in the next tile's first column — covered by that tile's own fill in the map, floating in the air beside an edge. HD keeps to its own tile.
- **Chunks are 128 logical px** (384 fine, 590 KB). Painting one costs about 5 ms; at 256 it was 4–25 ms, a dropped frame each time a chunk came into the margin while scrolling. Every chunk the view touches is baked on the frame it is needed, one more in the margin each frame, and chunks more than 384 px off the view are freed.
- **Headless Chromium, running across a level for 3 s:** the HD ground costs no more than the classic Graphics it replaces, and less in the big indoor levels (Keep: p95 33 ms HD, 67 ms classic; Cistern: 33 ms against 83 ms), since a texture draws cheaper than a level-sized Graphics. Headless renders without a GPU; the absolute numbers are the harness's, the comparison is the finding.
- **Water**: the still body bakes into the chunks with the tiles; each pool's surface band is a sprite of its own, baked once at rest. Only the pool the player is in is repainted, every frame it moves, into one canvas re-uploaded in place (`LiveTexture`).
- **Dev travel**: `__loamkeep.travel(levelId, { x, y })` in dev builds goes straight to a level and a spot, for checks like these.

## Creatures (LOA-31, LOA-32, 2026-10-11)

- **`ArtBody`** (`src/hd/art-body.ts`) carries a creature's body in both arts. It is keyed by what the classic drawing paints (its rects, signed), not by a pose object, so the eel — a continuous phase that only ever draws a few dozen shapes — bakes a few dozen textures, and every creature of a species shares them.
- **The bundle's own recipes** (snail, hare, glowfish with its halo, moth, both portraits) are ported in `src/entities/critters-hd.ts`. Every other creature takes the **common recipe** (`src/hd/critter-hd.ts`): lift ×3, round, selout with its emissive tones skipped, single-pixel eyes narrowed to 2×2. Classic translucent glows become **opaque Bayer halos** on a layer of their own, the density the alpha was.
- **The footprint test covers 75 poses of 24 creatures** (`src/entities/critters-hd.test.ts`): every bundle recipe still fits today's classic drawings exactly, and so does every common one.
- **Swarms** — bees, fireflies, spores — move every member every frame, so **`ArtSwarm`** gives each member a sprite and each member's look one texture, placed by the fine pixel under fine motion.
  - The spores' continuous fade becomes how many of a 2×2 mote's pixels are lit, in four steps (no alpha).
  - The fireflies' three faint discs, dithered as drawn, read as a disc of dots. They take a radial gold falloff instead, the glowfish's recipe in their own colour.

## Props, plants, effects, parallax, landmarks (LOA-33 – LOA-37, 2026-10-11)

- **Plants** take the bundle's `H.plant` (`plantHd` in `src/hd/critter-hd.ts`): all 14 species pass the footprint test. Other scenery, the candles, chandeliers, doors, beacons and **all 31 landmarks** take the common recipe, with the tones that give light kept lit. Every one passes the footprint test.
- **Glows.** `drawGlow` is recognised by the recorder (`recordGlow`) and drawn in HD as a radial falloff rather than its three faint discs, which dithered as drawn read as a disc of dots. The falloff peaks at 28 % (classic's discs add up to about 18 %), and past a third of the radius it steps to the colour's shadow on the ramp, so a big glow dims outward instead of sparkling.
- **Half-pixel geometry.** Some classic drawings centre an odd width on 0, so a rect starts at x = −25.5. On screen that lands on a pixel boundary at ×3. `FineCanvas` snaps every box's edges to the nearest fine pixel, and the classic mask is rasterised the same way before the majority is read, so the footprint law judges such a rect the way it is displayed.
- **Parallax** layers are `ChunkLayer`s too (a star field over the Observatory is more than 10 000 fine px wide), each following the camera by its own scroll factor. The same polygons and the same seeded generator, call for call, place every hill, star and grain of dust where classic does. Flat skies stay classic in both arts.
- **Falling leaves** are pointed, lit along the top and shaded along the bottom, and stand as a blade on their edge.

## Screens (LOA-38 – LOA-40, 2026-10-11)

- **Type.** Every in-game `Text` is an `ArtText`: the classic Text unchanged, and in HD the same words in the book font (`src/hd/book-font.ts`). Its capitals are the game's own 5×7 glyphs, and the bundle's alphabet is extended with — ; " ← → ↑ ↓. A test scans every string the game writes and refuses a character without a glyph. Body text is set at 2 fine a dot, titles (12 px and up in classic) at 3. The sketchbook pages by the book's metrics (lines 10 px apart, wrapped by character count) only in pure HD; classic and split keep classic's page breaks, which the book font always fits.
- **Title.**
  - The sky's seams are three dithered steps.
  - The sun's rings are round and feathered.
  - The stars are 2×2.
  - The scenery's silhouettes are smoothed by elbow passes.
  - The wordmark is chamfered.
  - The sweep is the HD wordmark in the shine colour, seen through a moving mask, so it is never baked per frame.
  - The menu is in the menu font's HD recipe.
  - The layers that move every frame (clouds, mist, twinkles) stay classic.
  - The dark plates behind text stay translucent in both arts: they are scrims that keep text legible over a moving scene, not pixel art. This is the one place alpha remains.
- **Behind a book or a greeting** there is no veil in HD. `rampDownFilter` (`src/hd/ramp-filter.ts`) snaps every pixel of the world and its sky to its nearest DB32 tone and paints the tone two steps down its ramp; tones without a ramp borrow the nearest ramped tone's. WebGL 1 can index a uniform array only by the loop counter, so the shader carries the answer out of its search loop.
- **Parchment** (`src/systems/parchment-hd.ts`): the prototype's page 5, ported — vignette, 6-fine border with its bevel, dog-ear, faded rule.
- **Large drawings** (a greeting's subject at ×4–×8, a page's sketch) are recorded at their displayed size and chamfered in proportion to it (`portraitHd`), never a small sprite enlarged.

## HD by default (LOA-42, 2026-10-11)

The renderer starts in `hd`. `?art=classic`, a stored choice, or `__loamkeep.art('classic' | 'split')` still pick the others, and the classic code is unchanged.

Frame time was measured before the switch. The figure is the JS time inside each animation frame (update and render submission), taken over 3 s of walking right from each level's spawn. Setup: headless Chromium (ANGLE), M-series Mac, warm caches. Values are mean / p95 / max, in ms.

| level | classic | hd |
|---|---|---|
| meadow | 0.66 / 1.9 / 2.5 | 0.49 / 1.7 / 12.2 |
| old-keep | 0.42 / 1.1 / 2.5 | 0.30 / 1.0 / 4.7 |
| old-keep-library | 0.66 / 1.7 / 2.3 | 0.20 / 0.4 / 2.5 |
| old-keep-belfry | 0.55 / 1.6 / 2.9 | 0.33 / 1.1 / 7.8 |
| old-keep-crypt | 0.29 / 0.9 / 1.9 | 0.12 / 0.3 / 1.8 |
| flooded-cistern | 1.10 / 2.9 / 3.7 | 0.47 / 1.4 / 12.8 |
| glow-grotto | 0.99 / 2.5 / 15.6 | 0.33 / 1.3 / 11.0 |
| kitchen-garden | 0.93 / 2.5 / 2.8 | 0.19 / 0.5 / 0.7 |
| cairn-observatory | 0.91 / 3.4 / 10.6 | 0.18 / 0.5 / 3.3 |

On average HD is cheaper than classic: a baked chunk or sprite is one textured quad, where classic re-tessellates its Graphics. Its peaks are the 128-px chunks baked as the camera reaches them, and the worst of them stays under a 60 Hz frame. The first visit to the first level after load can take one long frame (about 200 ms once, in a cold run) while the shared caches fill.

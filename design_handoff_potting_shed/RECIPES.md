# LOAMKEEP — The Potting Shed, inside (LOA-48) · HD recipes

Prototype: `Potting Shed.html` — pages **1** play · **2** cutaway map (click to go anywhere) · **3** props · **4** creatures & landmarks · **5** tiles, backdrops, light · **6** sketchbook (← →).
Keys: C classic/HD · V split · F room reveal on/off · E door.
Level data: `potting-shed.ts` (rows, rooms, lights, decorations, creatures, landmarks — generated from `shed-map.js`).
Art: `shed-art.js` (classic draw code for every new piece + HD recipes). Shared HD primitives and laws: `engine.js`, `hd.js`, and the HD-pass README (§1, laws L1–L8) — everything here obeys them.

---

## 1. The house

120 × 88 tiles, taller than it is wide. The ground floor walks on row 50 — the shed's own floor.

| Storey | Rooms (west → east) |
|---|---|
| Attic (rows 5–22, under a stepped roof) | The Attic (trunks, dust sheets, rocking horse, beams up to the skylight + moths) · Eaves Bedroom (bed, candle, **Wrong-Size Window**) |
| Floor 2 (24–31) | Drying Loft (lavender, herbs, onions hung from the rafters; two small dusk windows) · Narrow Landing (4 tiles tall) |
| Floor 1 (33–40) | Lumber Room (nook, off the hall's west gallery) · Library (**Seed Catalogue**, bookcases, desk lamp, bookworm) · Sewing Room |
| Ground (42–49) | **The Shed** (7 × 6, bench, pots, rake, the window with the pot) · Seed Hall (46 × 17, drawers wall, galleries, a stair, **Grandfather Clock**) · Kitchen (stove, sleeping cat) · Pantry (mouse) |
| Spine (16–58) | The Stairwell (ladder + a landing on every floor) · the Dumbwaiter shaft → Box Room, Linen Cupboard, Boot Room (**Dumbwaiter**), Coal Hole |
| Basement (51–58) | Apple Store (trapdoor from the hall) · Preserves Cellar · Boiler Room |
| Tunnels (60–80) | West Tunnel (spider) · Mole's Chamber · East Tunnel (worm, a hole in the floor) · The Still Pool · Deep Tunnel · Root Chamber (**Root Map**, the dead end) |

Ways between floors (≥ 2 everywhere): hall stair + east ladder + kitchen ladder + stairwell (ground↔1) · library ladder + gallery ladder + stairwell + dumbwaiter (1↔2) · loft ladder + stairwell (2↔attic) · trapdoor + stairwell + dumbwaiter (ground↔basement) · apple-store ladder + boiler ladder (basement↔tunnels). Loops: hole at col 62 into the pool, the long ladder at col 79 back up.
Every jump is ≤ 2 rows with ≤ 3 columns of drift; reachability is checked on load (page 2, bottom line, and the header of `potting-shed.ts`).

**The gag.** The shed room is exactly the 7 × 6 tiles of the outside, its window is the outside window (same panes, same pot). While the figure is in the shed the camera holds the shed centred, and every room not yet visited is unlit. Crossing the second doorway lights the Seed Hall: 4 dither steps over 0.7 s, and the camera lets go and slides.
*Proposal, presentation only* (toggle F): rooms not yet visited draw black. Without it, keep the gag by never letting the hall share a screen with the shed (the wall between them would need to be ≥ 10 tiles).

## 2. New tiles (letters free in `CHAR_TO_TILE`)

| Char | Tile | Solid | Recipe |
|---|---|---|---|
| `f` | Floorboards | yes | **neighbour-aware**: board face (12 fine: 2 twine · 50 % · 9 rope with 2-fine grain · 2 oiledCedar · 1 loulou) only when air is above; lath-and-plaster underside (2 rope · 7 twine · 25 % pancho) only when air is below; joist block (9 × 24 fine, rope lit edge) in a loulou void dithered 25 % valhalla. Joint every board, a nail head 2 × 2 topaz. |
| `j` | Plank wall | yes | 12-fine boards: 2 loulou gap · 1 rope lit edge · oiledCedar face; 2 grain marks per board (1 × 4 loulou with a rope lit partner — L6); nails 2 × 2 twine. |
| `e` | Packed earth | yes | loulou · 14 clods 6 × 2 oiledCedar with a 4 × 1 rope lit top · 9 valhalla 2 × 1 · 25 % of tiles a stone (disc r3.2 topaz, heather lit, dimGray under, cast shadow). |
| `r` | Root earth | yes | `e` + 2 roots: a 2-fine rope line with a twine lit edge, wavering `sin(k·0.35)`, leaving the tile's underside by 6–18 fine; a side root on the long ones. Drawn below its own tile, like the grass tufts. |

Classic versions of all four are in `shed-art.js` (`C.floorboards`, `C.plankWall`, `C.packedEarth`, `C.rootEarth`). `f` needs the tile above and below: pass `{up, down}` from `renderTilemap` (it already knows the map).
Existing tiles used: `T` timber (stairs, galleries, shelves, landings, tunnel lintels every 9th column), `L` bookcase, `H` ladder, `W` water, `K` dark stone (basement). HD recipes for T, L, K are in `shed-art.js` (K = the brick shader with `{topaz, heather, dimGray, valhalla}`).

Generation rules (in `shed-map.js`): house mass is `j`, underground mass `e`; any house tile with air above becomes `f`; basement mass becomes `K`; earth with air below becomes `r`.

## 3. Backdrops (not tiles — room regions)

Each room carries a `kind`; extend `backdropRegions` with it (`{col,row,cols,rows,kind}`). Rule: **a backdrop is its foreground material one ramp step down**, so anything you stand on reads in front. All patterns are world-aligned fine-px functions (`BD.*`):

- `shed` — 24-fine boards: 2 valhalla gap · 1 oiledCedar lit edge · loulou face, knots by hash.
- `drawers` — 24 × 18 cells: valhalla frame 2 · rope lit top · oiledCedar face (loulou right/bottom) · label card 6 × 3 twine/rope · tahitiGold knob 2 × 2 · 7 % of drawers ajar (a black gap).
- `kitchen` — 18-fine tiles, loulou grout, oiledCedar with 25 % rope; wainscot 36 fine (rope cap, loulou boards).
- `wallGreen` (library, landing) — dell, 2-fine eltGreen stripe every 18, a christi diamond every 24 rows; dado + wainscot.
- `wallRose` (sewing, bedroom, linen) — loulou, oiledCedar hairline, a mandy/smokeyAsh/dell sprig, half-drop repeat.
- `rafters` (attic, loft, lumber, box) — 12-fine boards loulou with valhalla seam + oiledCedar lit row; a rafter post every 6 tiles.
- `brick` (cellars) — 18 × 9 running bond: valhalla mortar 2 · rope lit top · oiledCedar, 20 % loulou bricks.
- `earth` (tunnels) — valhalla with oiledCedar clods; **shoring**: a 12-fine timber post every 7 tiles (twine | rope | oiledCedar) and a lintel along the room's top row.
- `cave` (pool) — valhalla with deepKoamaru clods and rare venice drips.

## 4. Light

The backdrop is dark indoors; light is a value `L` per fine pixel:
```
L = ambient(room)         bilinear between tile centres; walls get 0.55 × the brightest neighbouring room
  + Σ str · (1 − d/r)^1.5 over light sources (tiles)
draw(c, L):  L > 0.86        → Bayer up to 50 % of ramp-hi(c)
             else  k = (0.62 − L) / 0.16 steps down the ramp, Bayer between ⌊k⌋ and ⌈k⌉ (max 4 → black)
warm sources: on backdrop pixels only, sparse glow pixels — goldenFizz inside r/4, tahitiGold out to 0.6 r,
             density 0.1·(1 − d/0.6r)², on a 2×2 hash so each speck is 2 fine (L6)
```
Ambient falls with depth: shed 0.72 · ground 0.42–0.66 · floors 0.44–0.54 · attic 0.32 · basement 0.28–0.32 · tunnels 0.14–0.25. Sources: hall lamps (r 6), stove (6.5, the strongest), desk lamp, candles (3–4), boiler (7), windows/skylight (cool: light, no glow pixels), the pool (cool, dim). Page 5 shows the ramp and both kinds of pool.
Bake the tile + backdrop + decoration layer once per screen-sized chunk with `L` applied (it never moves). Creatures are drawn live and take the band at their feet: `round((0.62 − L)/0.16)` steps down, cached per band.

## 5. Props (`P.*`, classic, base on y = 0; `hang` props anchor at the ceiling and draw downward)

potting bench (34 × 23), pots, rake, shed door, shed window (= the outside window), small window, skylight, drawer cabinet (30 × 42), stove (32 × 64 with flue), kitchen table, jars (opaque HD streak), candle, hanging lamp, herbs, lavender, onions, dress form, desk + lamp, trunk, dust sheet, rocking horse, bed, apple crate, boiler (22 × 50), pipes, roots.
**HD derivation** (`hdOf` in `app.js`), the same for every prop and any future one:
```
S = up(classic)  →  round()  →  elbows()  →  edges(skip: goldenFizz, white, valhalla, black)
  →  grain: interior rope/oiledCedar px on every 6th row, hash < .4 → ramp-lo   (wood)
  →  foliage(): dell/eltGreen scallops                                          (leaves)
  →  a translucent 1-px classic highlight (alpha) becomes a 1-fine solid line   (glass, no alpha)
```
Emissive tones (flames, lamp glass, fire) skip shading — L4.

## 6. Creatures

New (classic + HD by the same derivation, footprint law checked: **fp ok** on page 4):
- **Spider** 9 × 6, on a thread from its ceiling point; body bobs `len·(0.8 + 0.2·sin 0.9t)`, legs swap at 2.5 Hz. Thread: 1 logical px heather in classic, 1 fine px in HD (a line, not texture). *“Don't mind me. I'm just hanging around. Literally, it's the whole job.”*
- **Mole** 12 × 7, velvet valhalla with a deepKoamaru sheen, pink hands; walks 9 px/s for 2.2 s, rests 1.4 s; paws swap at 4 Hz. *“Is someone there? You smell like you're wearing boots indoors.”*
- **Earthworm** — the bookworm's two frames in mandy, a brown band, no spectacles; 4 px/s while stretched. *“Down here we call it a tunnel. Up there they call it a lawn. Same thing, really.”*
- Portraits (page size, `C.spiderLarge`, `C.moleLarge`, `C.wormLarge`).

Existing, unchanged: sleeping cat (kitchen, by the stove), mice (pantry, apple store), bookworm (library, on the tall bookcase), moths (attic skylight).

## 7. Landmarks

| Landmark | Where | Text |
|---|---|---|
| Grandfather Clock | Seed Hall | A tall clock in the seed hall, ticking politely. Its hands do not go round the dial: they wind inward, a little further every hour, toward the middle. |
| Seed Catalogue | Library | Every seed the garden has ever grown, drawn and named in a careful hand. The last page has a packet glued in, labelled only with the spiral, and it is full. |
| Wrong-Size Window | Eaves Bedroom | The shed's little window, the one with the pot in it. From the garden it is the size of a tea tray. From up here it is the size of a door, and the pot is the same pot. |
| Dumbwaiter | Boot Room | A box on a rope, for sending things between floors. There is a cup of tea in it, still warm, and no one to say who it was sent to. |
| Root Map | Root Chamber (the dead end) | At the end of the last tunnel the roots of the garden come through the wall, and someone has labelled them: pear, bean, sunflower, well. Followed far enough, they all turn the same way. |

Each has `drawBody` (in-world, `P.grandfatherClock` …) and `drawSketch` (page size, `P.clockSketch` …). The spiral of the Sundial and the Seed Store runs through four of them.

## 8. Not changed
The shed's outside and its size (7 tiles, 112 × 96). No new mechanics: doors, ladders, water and jumps only. DB32 only (the HD backdrops and light add no tone).

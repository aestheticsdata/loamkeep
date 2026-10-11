# LOAMKEEP — HD pass, recipes

Prototype: `LOAMKEEP HD.html` (C classic/HD · V split · M fine motion · 1–5 pages).
Source of truth for every recipe below: `hd.js` (HD) next to `classic.js` (verbatim port of the game's draw code).
`engine.js` holds the primitives, the DB32 ramp, the fonts and the footprint check.

---

## 0. Grid and primitives

- Logical grid 320×224, stage 960×672. **1 fine px = 1 screen px = ⅓ logical px.**
- An HD sprite is authored in fine px around the **same anchor** as the classic one (feet / base on y = 0). Logical `x` → fine `3x`.
- Bake each pose once into a texture (`F` buffer → canvas / Pixi texture). Mirror = `scale.x = -1`, fine `x → -x-1`, exactly as today.

```
set(x, y, c)                       one fine px
rect(x, y, w, h, c)                Graphics.rect().fill()
dither(x, y, w, h, a, b, t)        4×4 Bayer: b where bayer(x,y) < t, else a (a = null keeps what is there)
vgrad / hgrad(x, y, w, h, a, b)    dither with t ramping 0→1 down / across the box
disc(cx, cy, r, c)                 px whose centre is within r
ring(cx, cy, r, w, c)              r-w < d ≤ r
mix(a, b, t)                       named blend — never needed by any recipe here
```
Derived passes (all in `engine.js`, each a few lines):
```
outline(c)        every ink px with an empty 4-neighbour → c            (inside the silhouette)
edges(skip)       ink px with empty below/right → ramp.lo, else empty above/left → ramp.hi
seam(a, b, c)     px of a touching b below/right → c                    (material boundary)
round()           remove convex corner px                                (1 fine px per corner)
elbows()          fill the inner px of a staircase step                  (1 fine px per step)
shade(box, from, to, t)   dither restricted to pixels already of colour `from`
```
Bayer matrix: `[0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5]`, threshold `(v + .5) / 16`.
Bayer is anchored to the **texture** for sprites (pattern travels with the sprite) and to the **world** for tiles (pattern continuous across tiles).

---

## 1. The laws (apply to all 19 tiles, 13 creatures, 13 plants, every landmark)

**L1 — Footprint.** Downsample the HD texture ÷3 by majority: a logical px is ink when ≥ 5 of its 9 fine px are ink. It must equal the classic mask exactly. Consequences you can design with:
- you may shave up to 4 fine px off a classic ink px (round a corner, thin a 1-px stalk to 2 fine);
- you may add up to 4 fine px into a classic empty px (bridge a staircase, an elbow, a drop shadow);
- a 1-logical feature must stay **≥ 2 fine wide** (a 1-fine line through a cell is 3/9: it vanishes).
The prototype runs this check on every sprite (page 2 labels, and the console). All anchor pieces: 0 px off.
Translucent layers (glow halos) are not part of the footprint — they are a separate texture under the body.

**L2 — Light.** One sun, upper-left, everywhere (the game's existing convention: "lit from above", rim on the hills, left catch-light on the pillar). Night scenes take the light from the moon (upper-right) only where the moon is in frame.

**L3 — Outline weight.** 1 fine px. Only the player gets a full dark outline (valhalla, every edge): it must read over every background. Everything else uses **selout**: edges facing the light take the tone's ramp-hi, edges facing away its ramp-lo (`edges()`). Where two materials meet, the front material takes its lo on the far side (`seam()`).

**L4 — Ramp.** Shading only ever moves one step along a DB32 ramp (`RAMP` in `engine.js`):
```
white → lightSteel → heather → topaz → dimGray → verdigris → opal → valhalla → black
pancho → twine → rope → oiledCedar → loulou → valhalla
atlantis → christi → eltGreen → dell → opal
lightSteel → viking → venice → deepKoamaru → valhalla       mandy → smokeyAsh    brown → clairvoyant → loulou
```
Emissive tones (glowfish belly, lures, eyes) are skipped by `edges()` — light sources never take shade.

**L5 — Dither.** Ordered Bayer between **two adjacent ramp tones**, never more. Allowed densities: 25 / 50 / 75 %. A dither band is ≥ 2 fine rows; a gradient is 3–4 discrete bands, not a per-row ramp (per-row Bayer reads as scanlines — tested and dropped on the night glow).

**L6 — Texture scale.** A speck that was 1 logical px becomes a 2-fine mark (2×1 or 1×2), with ~3× as many. A dark mark gets its lit partner directly above it (grain lit from above). Never single fine px as texture; single fine px are allowed only as glints on a deliberate highlight.

**L7 — Shipped off-palette tones stay, none are added.** The game already ships 8 tones outside DB32 (meadow sky `0x88b6e8`, crypt greys, grotto rock, night hills, heath/peat/granite…). HD keeps them as they are and dithers only between them and their DB32 neighbours.

**L8 — Motion.** Positions already land on screen px. HD adds fine in-betweens to the *animation*: the stride and bob move by fine px (`step = round(sin·3)`, `bob = -|step|`), swim-arm lengths and the hare's hop in fine px, parallax rounded to fine px. Off with `M`; with it off every HD frame is a classic frame.

---

## 2. The figure (12×16) — `H.figure(p)`

Pose in fine px: `step`, `bob`, `front`, `back` = 3× the classic values (`H.poseFromClassic`), or the fine in-betweens (L8).
```
boots      rect(-9+step,-6,6,6, heather)  rect(3-step,-6,6,6, heather)      (air/swim: -6 and 0)
cloak      rect(-15,-30+bob,30,24, lightSteel)
hood       rect(-12,-48+bob,24,18, lightSteel)
swim arms  rect(6,-21,front,3, dimGray)  rect(-6-back,-21,back,3, dimGray)  (before the outline: they leave the cloak)
round()    + clear 2 more px at each hood top corner (hood reads round, cell keeps 6/9)
cloak      rows 0-1 white (shoulder line, = classic cloakHi) · row 2 50% white
           right form shadow: 2 cols heather at x 12-13, 50% heather at x 8-11
           hem: 4 rows 50% heather, last 3 rows heather (= classic cloakLo)
hood       top 3 rows white, 2 cols heather at x 9-10
opening    rect(-9,hy+3,18,12, valhalla), top corners back to cloak (arched), bottom 2 rows 50% deepKoamaru (chin bounce)
outline(valhalla)                                  — the only full outline in the game
contact    boot px directly under the hem → topaz
eye        rect(3, -39+bob, 2,2, twine) + set(3, …, pancho)     (airborne: 6 fine higher)
arm        idle/walk: line(-12-step,-20+bob → -3-step,-11+bob, dimGray, 2 thick) with a 1-fine heather shadow 2 px under it
           jump: line(0,-29 → 9,-38, 2 thick) · climb: two 2-wide bars of 12, top px topaz, alternate by 3 fine
```
Underwater, the game's binary `SUBMERGED_TINT` still applies on top (unchanged; not shown).

## 3. Creatures

Common recipe for any critter that has no hand-made HD yet (this is how hare, glowfish, moth were done):
```
S = up(classic)          classic opaque rects ×3
S.round()                then any thinning (1-logical ears/stalks → 2 fine)
S.edges(skip = emissive) selout, L3
details                  eyes 2×2 valhalla (+1 lighter px if the eye is large), tips 3 rows, form shade by shade()
```
- **Snail 10×7** `H.snail(f)`: foot + head heather, stalks 2 fine wide, shell rope with 6 px rounded off; `seam(rope, heather, oiledCedar)`; `edges()`; spiral = Archimedean `r = 1 + 0.7θ`, 1.5 turns, 2×2 twine stamps clipped to rope; eyes = 7-px rounded valhalla blobs; 3-px pancho glint top-left of the shell.
- **Hare 12×13** `H.hare(pose)`: `up` → `round` → ears thinned to 2 fine above the head → back corner rounded (4 px) → eye 2×2 valhalla → `edges` with white→lightSteel → bottom row topaz (ground contact). Sit, ear-flick and hop all 0 px off.
- **Glowfish** `H.glowfish(frame)`: body by the common recipe, belly viking kept emissive with a 50 % lightSteel top row, lure a 5-px plus (white when glow > .5).
  **Glow** `H.halo(cx, cy, rx, ry, peak)`: viking pixels at Bayer density `peak·(1-e)^1.3`, `e` = elliptic distance. Radii = the classic rect extents: in-world centre (-1.5,-4.5), rx 22.5, ry 16.5, peak .22 + .3·glow (4 steps as today); portrait centre (0,-18), rx 42, ry 21, peak .42. Opaque pixels only — no alpha anywhere.
- **Glowfish portrait 24×14**: common recipe + `elbows()`; fins get rays (every other column lightSteel); eye disc r3 valhalla with a 2×2 white catch-light.
- **Moth 7×4 / 15×10**: common recipe; spread wings 50 % twine on the trailing half; folded wings thinned to 2 fine. Portrait: wing gradient pancho→twine by `shade` toward the tips, eye-spots `disc r3.2 rope` + `disc r1.6 valhalla` + 1 twine glint, body banded oiledCedar.

## 4. Plants — `H.plant(fn)`
`up` → `round` → `elbows` → `edges` (trunk skipped) → **foliage scallops**: on every 6th fine row, a 3-px arc in the next-lighter tone, offset rows of 2-px arcs in the next-darker; trunks get a 1-fine rope catch-light on the left. Bush, small tree, pine: 0 px off. The other 10 plants follow this unchanged.

## 5. Tiles (16×16 = 48×48 fine), world-aligned

- **Grass** `H.grass`: eltGreen · top 2 rows atlantis + 1 row 50 % · body specks: 15 dell 1×2 + 6 atlantis 1×2 · bottom: 6-row vgrad to dell, 9 rows dell, last 3 rows 25 % opal (into the soil).
  Tufts (on the classic tuft cells): short = 1+2+3 px blade, tall = 1+2+2 / 2+2+3, tip leaning by hash. Flower: 2-fine stem (eltGreen | dell), head 4-6-4 clairvoyant with brown highlight and a pancho centre.
- **Dirt** `H.dirt`: oiledCedar · stratum = 2-fine loulou line that wavers ±1 fine (`sin(x·0.18)`) · 20 loulou 2×1 grains · 9 lit grains (rope 2×1 over loulou 2×1) · pebble = `disc r3.2 topaz`, heather top-left, lightSteel glint, dimGray underside, 1 row loulou cast shadow.
- **Brick shader** (Stone, CastleBrick, CryptBrick, and CastleFloor / DarkStone / CryptFloor with their palettes): per fine px, from its position (bx, by) in a 24×24 brick, running bond offset 12 on odd rows:
  ```
  bx ≥ 22 or by ≥ 22   lo      (mortar, 2 fine)
  bx = 21 or by ∈ 20..21  mid  (bevel shadow)
  by ≤ 1               hi      (lit top, 2 fine — the classic 1-logical highlight minus 1)
  else                 base
  ```
  Palettes `{base, hi, mid, lo}`: Stone heather/lightSteel/topaz/dimGray · Castle dimGray/heather/verdigris/valhalla · Crypt shipped greys, mid = 50 % base/lo.
  Face marks per brick (hash): a pit = mid 2×1 over hi 2×1. Stone crack: 4-px mid zigzag with a lightSteel lit lip. Castle rivet: 3×3 valhalla, heather top-left, black bottom-right. Crypt glint: 2 white + 2 cryptHi in a cross.
- **Water** `H.water(..., off, wave, t)`: surface band from the rest line: 2 cornflower · 1 50 % · 2 royalBlue · 2 50 % · venice. Ripple = whole-band offset in fine px (`off`, ±3 for the classic ±1) plus a travelling 1-fine wave `round(sin(x·0.26 − 5t))` — only while the pool is active, as today. Body darkens with depth by ≤ 50 % deepKoamaru. Sparkle: 2×1 lightSteel + 1 cornflower, riding the wave.
- **Ladder**: rails 6 fine (2 twine | 3 rope | 1 oiledCedar), rungs 6 fine (2 twine | 2 rope | 2 oiledCedar).

## 6. Parallax — `H.hills(S, opts, light)`
Same polygon as `makeHillSilhouette`, rasterised per **fine column** (centre under the ridge = ink), so the silhouette is the classic one with 3× finer slopes. Rim = the 3 fine above the ridge: on slopes facing the light 3 fine of rim + 2 rows 50 % below the ridge; on slopes facing away 1 fine of rim. Sky stays the shipped flat blue.
Night sky: valhalla, glow band in 3 steps of 3 fine (25/50/75 %) then deepKoamaru. Dim star = 2×2. Bright star = 3×3 white plus, 5-fine lightSteel cross, 9-fine heather cross (same 3×3-logical footprint). Moon = discs at fine radius 3r + 1.5: deepKoamaru halo with a 50 % outer 3 fine, lightSteel limb, pancho face, bite in valhalla, 50 % twine terminator, three twine craters.

## 7. Sketchbook page
- Backdrop: no alpha. Every pixel of the world behind is stepped **two places down its ramp** (`lo(lo(c))`).
- Parchment pancho; vignette = twine at `0.45·(fx + fy)`, `f = (1 − e/40)^1.6` per edge distance `e`, capped 60 % — corners darken where both edges add up.
- Border = the classic 2-logical stroke, 6 fine: loulou | 3 oiledCedar | rope top-left / loulou bottom-right | 2 rows 50 % rope on the paper.
- Dog-ear bottom-right, 42 fine: the corner is cut to the backdrop, the flap is twine shading to rope at its edges with a pancho fold line, and a 5-fine 50 % twine shadow on the page.
- Rule: 2 oiledCedar + 1 twine, ends fading over 12 fine by dither.
- Portrait drawn at page size (`H.snailPortrait`, ~50×35 logical) with the same laws (selout, ramp, spiral by stamps), plus a dithered twine ground shadow. It is not a scaled sprite.

## 8. Type
- **Book face** (in-game text, replaces system monospace): capitals = the menu's 5×7, lowercase with a 5-dot x-height, 2-dot descenders, 9 rows, 6-dot advance. Drawn at **dot = 2 fine** for body (cell 12×18 fine, line pitch 30 fine = 10 logical), **dot = 3 fine** for titles. The description column (130 logical = 390 fine) holds 30–32 characters a line, 10 lines a leaf: set `TEXT_LINE_H = 10` and wrap by character count instead of `CanvasTextMetrics`. Glyphs in `BOOK`, `engine.js`.
- **Menu font on the fine grid** `menuHD`: each dot 3×3; where two dots touch only diagonally, 1 fine px bridges each elbow (L1 allows it); 1-fine drop shadow one ramp step down.

---

### Not covered yet
The 13 non-anchor tiles, 9 other creatures, 10 other plants and the landmarks: they follow sections 1, 3, 4 and 5 unchanged. Off-palette tones in heath/peat/granite/puffball are kept per L7.

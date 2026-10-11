import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Old Keep — THREE-storey great hall with floating staircase + basement.
//
// 61 wide × 26 tall (cols 0-1 and 59-60 are the outer walls). A full jump
// peaks at ~67 px: 4 tiles (64) is only just within reach, with ~3 px to
// spare, so no climb here asks for more than 3 tiles up.
//
//   Upper floor (row 8, cols 2-29, with a one-tile-lower lip at row 9 out to
//   col 35) — the "balcony"
//     - Belfry door at col 4, up to the bell tower
//     - Stone Throne (col 14) + Bookshelf (col 20) + columns + candles
//     - The bookshelf is a door: E swings it out onto the library
//     - The gold columns are not solid; the player walks through them
//
//   East ledges — row 16 (cols 39-58), row 10 (cols 41-58), row 7 (cols 47-58)
//
//   The climb (every jump ≤3 tiles up, each with clear headroom):
//     lower floor → hop the hole onto col 38 → up-right onto the row-16
//     ledge → up-left onto the landing (row 14, cols 33-36) → up-right onto
//     the step (row 11, cols 39-40) → up-left onto the upper floor's lip →
//     up onto the upper floor. From the step, the row-10 ledge and then the
//     row-7 ledge (Stained Glass) go on up to the right.
//
//   Hidden passage (rows 12-13, floor at row 14 cols 2-30) — a two-tile
//     jump west off the landing; the Masons' Niche is at its far end.
//
//   Lower floor (row 18, cols 2-35 and 38-58) — the entry hall
//     - Return door at col 3 (back to meadow)
//     - Garden door at col 26, out to the kitchen garden
//     - Hole in the floor at cols 36-37 — player drops to the basement
//     - East of col 38 the row-16 ledge leaves one tile of headroom
//
//   Basement chamber (rows 19-21, floor at row 22) — the "souterrain"
//     - Reached by falling through the hole in the lower floor
//     - A plinth (row 21, cols 36-37) sits right under the hole. The fall
//       lands on it; stepping off it reaches the basement floor. It is also
//       the way back out: hop onto it (1 tile), then jump straight up
//       through the hole (3 tiles) and drift onto the lower floor.
//     - Descend door at col 8 (down to the crypt) — far from the hole, so
//       the player has to walk left through the basement to find it
//     - Two gold columns + two candles light the basement
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   B CastleBrick   F CastleFloor   P GoldPillar
const OLD_KEEP_ROWS = [
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  0  ceiling top
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  1  ceiling underside
  'BB.....PP......PP......PP..................................BB', //  2  upper room
  'BB.....PP......PP......PP..................................BB', //  3
  'BB.....PP......PP......PP..................................BB', //  4
  'BB.....PP......PP......PP..................................BB', //  5  upper-floor columns (capitals)
  'BB.....PP......PP......PP..................................BB', //  6
  'BB.....PP......PP......PP......................FFFFFFFFFFFFBB', //  7  upper-floor columns (bases) + high east ledge (cols 47-58)
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFF....................PP.......BB', //  8  UPPER FLOOR (cols 2-29)
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..............PP.......BB', //  9  upper floor's lip (cols 30-35)
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFF...........FFFFFFFFFFFFFFFFFFBB', // 10  east ledge (cols 41-58)
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFF.........FF..................BB', // 11  step (cols 39-40)
  'BB.........................................................BB', // 12  hidden passage (rows 12-13, over the row-14 floor)
  'BB.........................................................BB', // 13
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..FFFF......................BB', // 14  passage floor (cols 2-30) + landing (cols 33-36)
  'BB....PP......PP......PP...................................BB', // 15
  'BB....PP......PP......PP...............FFFFFFFFFFFFFFFFFFFFBB', // 16  east ledge (cols 39-58)
  'BB....PP......PP......PP...................................BB', // 17  lower-room columns
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..FFFFFFFFFFFFFFFFFFFFFBB', // 18  LOWER FLOOR (cols 2-35, 38-58) — hole at 36-37
  'BB.....PP..............PP..................................BB', // 19  basement chamber (top)
  'BB.....PP..............PP..................................BB', // 20
  'BB.....PP..............PP...........FF.....................BB', // 21  basement gold columns + plinth under the hole (cols 36-37)
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBB', // 22  BASEMENT FLOOR (cols 2-58)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 23  foundation top
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 24  foundation
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 25  foundation
] as const;

// Three floors — entities sit on whichever is appropriate. Y is the world-Y
// of each floor's top edge (the surface the player walks on); the SPAWN
// counterpart is 16 px above so the player AABB feet land exactly on it.
const UPPER_FLOOR_ROW = 8;
const UPPER_FLOOR_Y = UPPER_FLOOR_ROW * TILE_SIZE;

const LOWER_FLOOR_ROW = 18;
const LOWER_FLOOR_Y = LOWER_FLOOR_ROW * TILE_SIZE;
const LOWER_SPAWN_Y = LOWER_FLOOR_Y - TILE_SIZE;

// The floor of the hidden passage between the storeys (row 14, cols 2-30),
// and the high east ledge (row 7, cols 47-58).
const PASSAGE_FLOOR_Y = 14 * TILE_SIZE;
const HIGH_LEDGE_Y = 7 * TILE_SIZE;

const BASEMENT_FLOOR_ROW = 22;
const BASEMENT_FLOOR_Y = BASEMENT_FLOOR_ROW * TILE_SIZE;
const BASEMENT_SPAWN_Y = BASEMENT_FLOOR_Y - TILE_SIZE;

// Door placement:
//   - Return door (back to meadow) on the LOWER floor.
//   - Descend door (down to the crypt) in the BASEMENT — far from the
//     hole the player drops in through, so they have to walk through the
//     basement chamber to find it.
//   - Stone Throne on the UPPER floor — the climb is the reward.
const RETURN_DOOR_COL = 3;
const RETURN_DOOR_X = RETURN_DOOR_COL * TILE_SIZE + 8;

const DESCEND_DOOR_COL = 8;
const DESCEND_DOOR_X = DESCEND_DOOR_COL * TILE_SIZE + 8;

// Belfry door — UPPER floor, west end, past the throne: the tower is the
// next climb after this one.
const BELFRY_DOOR_X = 4 * TILE_SIZE + 8;

// Garden door — LOWER floor, in the hall's back wall between the last
// lower-room column (cols 22-23) and the Great Kettle (col 29).
const GARDEN_DOOR_X = 26 * TILE_SIZE + 8;

// The bookshelf on the upper floor, which is the way into the library.
const BOOKSHELF_DOOR_X = 20 * TILE_SIZE + 8;
const UPPER_SPAWN_Y = UPPER_FLOOR_Y - TILE_SIZE;

// Spawns:
//   'from-meadow' - LOWER floor, near the return door (cool down on entry).
//   'from-crypt'  - BASEMENT floor, near the descend door (where the
//                   player exited the crypt).
//   'from-belfry' - UPPER floor, two tiles right of the belfry door.
//   'from-garden' - LOWER floor, two tiles left of the garden door.
//   'from-library' - UPPER floor, between the throne and the bookshelf.
const SPAWN_FROM_MEADOW_X = 5 * TILE_SIZE + 2;
const SPAWN_FROM_CRYPT_X = 11 * TILE_SIZE + 2;
const SPAWN_FROM_BELFRY_X = 6 * TILE_SIZE + 2;
const SPAWN_FROM_GARDEN_X = 24 * TILE_SIZE + 2;
const SPAWN_FROM_LIBRARY_X = 17 * TILE_SIZE + 2;

const OLD_KEEP_SPAWNS: SpawnPoint[] = [
  { id: 'from-meadow', x: SPAWN_FROM_MEADOW_X, y: LOWER_SPAWN_Y },
  { id: 'from-crypt', x: SPAWN_FROM_CRYPT_X, y: BASEMENT_SPAWN_Y },
  { id: 'from-belfry', x: SPAWN_FROM_BELFRY_X, y: UPPER_SPAWN_Y },
  { id: 'from-garden', x: SPAWN_FROM_GARDEN_X, y: LOWER_SPAWN_Y },
  { id: 'from-library', x: SPAWN_FROM_LIBRARY_X, y: UPPER_SPAWN_Y },
];

// ---------------------------------------------------------------------------
// Landmarks — keep-specific: the Stone Throne on the upper floor, the
// Masons' Niche in the hidden passage, the Stained Glass on the high east
// ledge, and the Great Kettle in the entry hall.
// ---------------------------------------------------------------------------

const inkFor = (discovered: boolean): number => (discovered ? DB32.opal : DB32.valhalla);

const OLD_KEEP_LANDMARKS: LandmarkSpec[] = [
  // Stone Throne — centred on the UPPER floor (col 14). The throne is the
  // climb's reward: player has to find the staircase on the right side and
  // ascend four steps to reach this room.
  {
    id: 'stone-throne',
    x: 14 * TILE_SIZE + 8,
    y: UPPER_FLOOR_Y,
    name: 'Stone Throne',
    description:
      'A throne carved from a single block of dark stone. The seat is worn smooth in the shape of someone ' +
      'who sat here often, long ago. The back is engraved with a spiral motif you have seen before — ' +
      'on the Stone Marker.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      const stoneShadow = discovered ? DB32.opal : DB32.dimGray;
      const accent = discovered ? DB32.heather : DB32.goldenFizz;

      // Base — 16 wide × 4 tall slab.
      g.rect(-8, -4, 16, 4).fill(stone);
      g.rect(-8, -4, 16, 1).fill(stoneHi);
      g.rect(-8, -4, 1, 4).fill(ink);
      g.rect(7, -4, 1, 4).fill(ink);
      g.rect(-8, -1, 16, 1).fill(ink);

      // Seat block — 12 wide × 4 tall sitting on the base.
      g.rect(-6, -8, 12, 4).fill(stone);
      g.rect(-6, -8, 12, 1).fill(stoneHi);
      g.rect(-6, -8, 1, 4).fill(ink);
      g.rect(5, -8, 1, 4).fill(ink);
      g.rect(-6, -5, 12, 1).fill(stoneShadow);

      // Backrest — 12 wide × 12 tall rising from the seat.
      g.rect(-6, -20, 12, 12).fill(stone);
      g.rect(-6, -20, 12, 1).fill(stoneHi);
      g.rect(-6, -20, 1, 12).fill(ink);
      g.rect(5, -20, 1, 12).fill(ink);

      // Spiral motif carved into the backrest centre. Three short lines
      // at increasing depth — reads as a coiled glyph.
      g.rect(-3, -16, 6, 1).fill(ink);
      g.rect(-3, -16, 1, 4).fill(ink);
      g.rect(2, -16, 1, 4).fill(ink);
      g.rect(-3, -13, 6, 1).fill(ink);
      g.rect(-1, -15, 1, 2).fill(ink);

      // Finial — small carved cap on top of the backrest.
      g.rect(-4, -22, 8, 2).fill(stone);
      g.rect(-4, -22, 8, 1).fill(stoneHi);
      g.rect(-1, -24, 2, 2).fill(accent);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      const accent = DB32.goldenFizz;

      // Base.
      g.rect(-20, 16, 40, 6).fill(stone);
      g.rect(-20, 16, 40, 1).fill(stoneHi);
      // Seat.
      g.rect(-16, 8, 32, 8).fill(stone);
      g.rect(-16, 8, 32, 1).fill(stoneHi);
      // Backrest.
      g.rect(-16, -24, 32, 32).fill(stone);
      g.rect(-16, -24, 32, 1).fill(stoneHi);
      // Spiral.
      g.rect(-8, -16, 16, 1).fill(ink);
      g.rect(-8, -16, 1, 8).fill(ink);
      g.rect(7, -16, 1, 8).fill(ink);
      g.rect(-8, -8, 16, 1).fill(ink);
      g.rect(-3, -14, 1, 6).fill(ink);
      g.rect(2, -14, 1, 4).fill(ink);
      // Finial.
      g.rect(-10, -28, 20, 4).fill(stoneHi);
      g.rect(-3, -32, 6, 4).fill(accent);
    },
  },

  // Masons' Niche — at the far west end of the hidden passage between the
  // floors (rows 12-13, col 3). The only way in is the two-tile jump west
  // off the landing, so finding it is the whole reward. Kept under 24 px
  // tall: the passage is two tiles high.
  {
    id: 'masons-niche',
    x: 3 * TILE_SIZE + 8,
    y: PASSAGE_FLOOR_Y,
    name: "Masons' Niche",
    description:
      'A low gap between the floors, left on purpose. At its end someone scratched a spiral into the mortar ' +
      'and, beside it, a long row of tally marks — days, or steps, or names. ' +
      'The dust here has not been disturbed in a very long time.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      const tool = discovered ? DB32.opal : DB32.rope;

      // A loose block of dressed stone, left where it was cut.
      g.rect(-7, -6, 10, 6).fill(stone);
      g.rect(-7, -6, 10, 1).fill(stoneHi);
      g.rect(-7, -6, 1, 6).fill(ink);
      g.rect(2, -6, 1, 6).fill(ink);
      g.rect(-7, -1, 10, 1).fill(ink);
      // The spiral scratched into its face.
      g.rect(-5, -4, 4, 1).fill(ink);
      g.rect(-5, -4, 1, 2).fill(ink);
      g.rect(-2, -4, 1, 2).fill(ink);
      g.rect(-4, -2, 3, 1).fill(ink);
      // Tally marks on the wall behind it.
      for (let i = 0; i < 4; i++) {
        g.rect(-6 + i * 2, -12, 1, 4).fill(ink);
      }
      g.rect(-7, -10, 8, 1).fill(ink);
      // A mason's chisel leaning against the block.
      g.rect(4, -7, 1, 7).fill(tool);
      g.rect(4, -8, 1, 1).fill(stoneHi);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      // Block.
      g.rect(-24, -2, 34, 22).fill(stone);
      g.rect(-24, -2, 34, 2).fill(stoneHi);
      // Spiral.
      g.rect(-17, 4, 16, 1).fill(ink);
      g.rect(-17, 4, 1, 10).fill(ink);
      g.rect(-2, 4, 1, 10).fill(ink);
      g.rect(-17, 14, 16, 1).fill(ink);
      g.rect(-12, 8, 6, 1).fill(ink);
      g.rect(-12, 8, 1, 4).fill(ink);
      // Tallies — four strokes and a fifth across them, three times over.
      for (let set = 0; set < 3; set++) {
        for (let i = 0; i < 4; i++) {
          g.rect(-24 + set * 16 + i * 3, -24, 1, 14).fill(ink);
        }
        g.rect(-25 + set * 16, -17, 12, 1).fill(ink);
      }
      // Chisel.
      g.rect(16, -6, 3, 26).fill(DB32.rope);
      g.rect(16, -10, 3, 4).fill(stoneHi);
    },
  },

  // Stained Glass — on the high east ledge (row 7, col 54), the far end of
  // the climb past the staircase. The window stands against the back wall
  // with nothing but stone behind it.
  {
    id: 'stained-glass',
    x: 54 * TILE_SIZE + 8,
    y: HIGH_LEDGE_Y,
    name: 'Stained Glass',
    description:
      'A window of coloured glass, set high where no one would think to look. There is no daylight behind it, ' +
      'only stone — and still the glass glows faintly. At its heart, picked out in gold: the spiral.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const frame = discovered ? DB32.dimGray : DB32.heather;
      const blue = discovered ? DB32.opal : DB32.cornflower;
      const red = discovered ? DB32.dimGray : DB32.clairvoyant;
      const green = discovered ? DB32.opal : DB32.eltGreen;
      const gold = discovered ? DB32.heather : DB32.goldenFizz;

      // Sill.
      g.rect(-8, -2, 16, 2).fill(frame);
      g.rect(-8, -2, 16, 1).fill(ink);
      // Pointed-arch frame, 12 wide × 26 tall.
      g.rect(-6, -24, 12, 22).fill(frame);
      g.rect(-4, -26, 8, 2).fill(frame);
      g.rect(-2, -28, 4, 2).fill(frame);
      // Glass panes inside the frame, in bands.
      g.rect(-4, -22, 8, 6).fill(blue);
      g.rect(-4, -16, 8, 6).fill(red);
      g.rect(-4, -10, 8, 6).fill(green);
      g.rect(-2, -25, 4, 3).fill(blue);
      // Lead lines.
      g.rect(0, -25, 1, 21).fill(ink);
      g.rect(-4, -16, 8, 1).fill(ink);
      g.rect(-4, -10, 8, 1).fill(ink);
      // The gold spiral at the centre.
      g.rect(-2, -15, 4, 1).fill(gold);
      g.rect(-2, -15, 1, 3).fill(gold);
      g.rect(1, -15, 1, 3).fill(gold);
      g.rect(-1, -13, 2, 1).fill(gold);
    },
    drawSketch(g) {
      const frame = DB32.heather;
      const ink = DB32.valhalla;
      const gold = DB32.goldenFizz;
      // Frame and arch.
      g.rect(-18, -20, 36, 40).fill(frame);
      g.rect(-12, -28, 24, 8).fill(frame);
      g.rect(-6, -34, 12, 6).fill(frame);
      // Panes.
      g.rect(-14, -18, 28, 12).fill(DB32.cornflower);
      g.rect(-14, -6, 28, 12).fill(DB32.clairvoyant);
      g.rect(-14, 6, 28, 12).fill(DB32.eltGreen);
      g.rect(-8, -28, 16, 10).fill(DB32.royalBlue);
      // Lead.
      g.rect(-1, -28, 2, 46).fill(ink);
      g.rect(-14, -6, 28, 1).fill(ink);
      g.rect(-14, 6, 28, 1).fill(ink);
      // Spiral in gold leaf over the centre.
      g.rect(-8, -4, 16, 2).fill(gold);
      g.rect(-8, -4, 2, 9).fill(gold);
      g.rect(6, -4, 2, 9).fill(gold);
      g.rect(-8, 4, 16, 2).fill(gold);
      g.rect(-3, 0, 6, 2).fill(gold);
    },
  },

  // Great Kettle — on the lower floor (col 29), past the garden door,
  // under the passage floor.
  {
    id: 'great-kettle',
    x: 29 * TILE_SIZE + 8,
    y: LOWER_FLOOR_Y,
    name: 'Great Kettle',
    description:
      'An iron kettle big enough to bathe in, cold for longer than anyone can say. Something has dried in a ring ' +
      'around the inside — soup, or dye, or ink. The ladle still hangs on the rim, as if the cook only stepped out.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const iron = discovered ? DB32.opal : DB32.verdigris;
      const ironHi = discovered ? DB32.dimGray : DB32.topaz;
      const wood = discovered ? DB32.dimGray : DB32.rope;

      // Three stubby legs.
      g.rect(-6, -2, 2, 2).fill(iron);
      g.rect(-1, -2, 2, 2).fill(iron);
      g.rect(4, -2, 2, 2).fill(iron);
      // Pot body — 14 wide, rounded by trimming the corners.
      g.rect(-7, -10, 14, 8).fill(iron);
      g.rect(-6, -11, 12, 1).fill(iron);
      g.rect(-6, -2, 12, 1).fill(ink);
      g.rect(-7, -10, 1, 7).fill(ink);
      g.rect(6, -10, 1, 7).fill(ink);
      g.rect(-5, -9, 3, 1).fill(ironHi);
      // Rim.
      g.rect(-8, -12, 16, 2).fill(ironHi);
      g.rect(-8, -12, 16, 1).fill(ink);
      // Ladle hooked over the rim, handle up and out.
      g.rect(5, -17, 1, 6).fill(wood);
      g.rect(6, -18, 1, 2).fill(wood);
    },
    drawSketch(g) {
      const iron = DB32.verdigris;
      const ironHi = DB32.topaz;
      const ink = DB32.valhalla;
      // Legs.
      g.rect(-18, 14, 5, 8).fill(iron);
      g.rect(-2, 14, 5, 8).fill(iron);
      g.rect(13, 14, 5, 8).fill(iron);
      // Body.
      g.rect(-22, -8, 44, 24).fill(iron);
      g.rect(-18, -12, 36, 4).fill(iron);
      g.rect(-18, 14, 36, 2).fill(ink);
      g.rect(-16, -4, 8, 2).fill(ironHi);
      // Rim, with the dried ring just under it.
      g.rect(-24, -16, 48, 5).fill(ironHi);
      g.rect(-24, -16, 48, 1).fill(ink);
      g.rect(-20, -10, 40, 1).fill(DB32.oiledCedar);
      // Ladle.
      g.rect(14, -34, 3, 20).fill(DB32.rope);
      g.rect(16, -38, 3, 5).fill(DB32.rope);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — static visuals. The hanging banner anchors at its BOTTOM
// tip (so we can hang it from a known ceiling row); the bookshelf anchors
// at its foot (standard floor-stand convention).
// ---------------------------------------------------------------------------

// A long burgundy banner hanging from an iron pole. 8 wide × 26 tall when
// fully drawn. Anchored at its BOTTOM tip (y=0) so the spec passes the
// world-Y of the lowest pixel — the pole sits 26 px above that.
//
// Visual brief: iron pole across the top, two flat hanging straps, then
// cloth in deep burgundy with a paler vertical band down the middle and a
// 3-tooth fringe at the bottom. Reads at game scale as "stately heraldic
// banner."
function drawBanner(g: Graphics): void {
  const iron = DB32.dimGray;
  const ironHi = DB32.heather;
  const cloth = DB32.clairvoyant; // deep red
  const clothHi = DB32.brown; // bright red highlight
  const clothShadow = DB32.loulou; // very dark plum
  const trim = DB32.goldenFizz; // gold trim

  // Iron pole across the very top — 8 wide × 1 tall.
  g.rect(-4, -26, 8, 1).fill(iron);
  g.rect(-4, -26, 8, 1).fill(ironHi); // (single bright top line, will be overwritten by content below)
  g.rect(-4, -25, 8, 1).fill(iron);

  // Two short iron straps connecting pole to cloth — 1 wide × 2 tall each.
  g.rect(-3, -24, 1, 2).fill(iron);
  g.rect(2, -24, 1, 2).fill(iron);

  // Cloth body — 6 wide × 20 tall.
  g.rect(-3, -22, 6, 20).fill(cloth);
  // Top highlight strip and shadow accents.
  g.rect(-3, -22, 6, 1).fill(clothShadow);
  g.rect(-3, -22, 1, 20).fill(clothShadow);
  g.rect(2, -22, 1, 20).fill(clothShadow);
  // Vertical highlight stripe down the middle — 1 px wide.
  g.rect(-1, -21, 1, 19).fill(clothHi);
  // Single gold trim emblem near the top of the cloth.
  g.rect(-1, -18, 2, 2).fill(trim);

  // Fringe at the bottom — 3 hanging teeth, each 2 wide × 2 tall.
  g.rect(-3, -2, 2, 2).fill(cloth);
  g.rect(0, -2, 1, 2).fill(cloth);
  g.rect(2, -2, 1, 2).fill(cloth);
  // Tooth shadows.
  g.rect(-3, -2, 1, 2).fill(clothShadow);
  g.rect(2, -2, 1, 2).fill(clothShadow);
}

// Tall wooden bookshelf — 14 wide × 22 tall. Three shelves of books in
// varied colours. Anchored at the foot (standard floor-stand). The wood
// frame matches the existing Hollow Tree's palette so castle furniture
// feels visually related to the outdoor wooden world.
function drawBookshelf(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const woodHi = DB32.rope;
  const woodShadow = DB32.valhalla;
  const cavity = DB32.valhalla;

  // Outer frame fill.
  g.rect(-7, -22, 14, 22).fill(wood);
  g.rect(-7, -22, 14, 1).fill(woodHi);
  g.rect(-7, -22, 1, 22).fill(woodShadow);
  g.rect(6, -22, 1, 22).fill(woodShadow);

  // Interior cavity — 10 wide × 18 tall, inset 2 px from the frame.
  g.rect(-5, -20, 10, 18).fill(cavity);

  // Three shelves at y=-8, y=-14 (creating a top, middle, bottom row of
  // books). Each shelf is a 1-px wood line across the cavity.
  g.rect(-5, -8, 10, 1).fill(wood);
  g.rect(-5, -14, 10, 1).fill(wood);

  // Books — varied 1-px-wide spines, varied heights, varied colours.
  // Top shelf (between y=-19 and y=-15, so 4 px tall):
  drawBookSpines(g, -5, -19, 10, [DB32.clairvoyant, DB32.eltGreen, DB32.tahitiGold, DB32.cornflower, DB32.brown]);
  // Middle shelf (y=-13 to y=-9, 4 tall):
  drawBookSpines(g, -5, -13, 10, [DB32.deepKoamaru, DB32.brown, DB32.dell, DB32.mandy, DB32.goldenFizz, DB32.venice]);
  // Bottom shelf (y=-7 to y=-3, 4 tall):
  drawBookSpines(g, -5, -7, 10, [DB32.rainforest, DB32.brown, DB32.eltGreen, DB32.cornflower]);

  // Bottom trim (just below the cavity — masks the wood floor edge).
  g.rect(-7, -2, 14, 1).fill(woodHi);
}

// Helper: fill a shelf with varied-height book spines starting at (x, y),
// across `width` px. Picks heights pseudo-randomly per spine from `palette`.
// Pure presentation — no logic depends on the colours so the array can be
// freely reordered.
function drawBookSpines(g: Graphics, x: number, y: number, width: number, palette: readonly number[]): void {
  // Simple hash so per-call book pattern stays stable across redraws.
  // (Decoration draws once at construction, so any deterministic pattern
  // works; this just keeps things reproducible if we ever redraw.)
  let cursor = x;
  let i = 0;
  while (cursor < x + width) {
    const colour = palette[i % palette.length];
    const w = 1 + ((i * 5) % 2); // alternate 1 px and 2 px wide spines
    if (cursor + w > x + width) break;
    const dropTop = (i * 7) % 3 === 0 ? 1 : 0; // tilt a few books down 1 px
    g.rect(cursor, y + dropTop, w, 4 - dropTop).fill(colour);
    // 1-px shadow line on the right edge of each book for separation.
    g.rect(cursor + w - 1, y + dropTop, 1, 4 - dropTop).fill(DB32.valhalla);
    cursor += w;
    i += 1;
  }
}

// Convenience constructor for placing decorations.
//   hangFromCeiling - bottom-tip anchored, hangs from a known ceiling row.
//                      (Used for both the top ceiling banner and the
//                      upper-floor-underside banner — same anchor logic.)

const hangFromCeiling = (col: number, bottomRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  // Banner's anchor is its BOTTOM tip, so y is the world-Y of the lowest
  // visible pixel. We pass the bottom of the row where the banner ends.
  y: bottomRow * TILE_SIZE,
  draw,
});

const OLD_KEEP_DECORATIONS: DecorationSpec[] = [
  // Banner in the UPPER room — hangs from the top ceiling, ends around
  // row 5 (above where the player walks on the upper floor at row 8).
  hangFromCeiling(17, 5, drawBanner),
  hangFromCeiling(33, 5, drawBanner),

  // Banner in the LOWER room — hangs from the underside of the upper
  // floor (which is the lower room's "ceiling" at row 9). Bottom tip at
  // row 13 — clears the lower-room columns.
  hangFromCeiling(10, 13, drawBanner),
  hangFromCeiling(36, 13, drawBanner),
];

export const oldKeepLevel: LevelSpec = {
  id: 'old-keep',
  name: 'The Old Keep',
  rows: OLD_KEEP_ROWS,
  spawns: OLD_KEEP_SPAWNS,
  defaultSpawnId: 'from-meadow',
  landmarks: OLD_KEEP_LANDMARKS,
  decorations: OLD_KEEP_DECORATIONS,
  parallax: 'keep',
  backdrop: 'indoor-dark',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      // Return door — LOWER floor left side, back to the meadow.
      new Door({
        id: 'keep-return-door',
        x: RETURN_DOOR_X,
        y: LOWER_FLOOR_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-keep',
        promptLabel: 'leave',
      }),
      // Descend door — BASEMENT floor (the new "souterrain") west side,
      // down to the crypt level.
      new Door({
        id: 'keep-descend-door',
        x: DESCEND_DOOR_X,
        y: BASEMENT_FLOOR_Y,
        targetLevelId: 'old-keep-crypt',
        targetSpawnId: 'from-keep',
        promptLabel: 'descend',
      }),
      // Belfry door — UPPER floor west end, up into the bell tower.
      new Door({
        id: 'keep-belfry-door',
        x: BELFRY_DOOR_X,
        y: UPPER_FLOOR_Y,
        targetLevelId: 'old-keep-belfry',
        targetSpawnId: 'from-keep',
        promptLabel: 'climb',
      }),
      // Garden door — LOWER floor, out to the kitchen garden.
      new Door({
        id: 'keep-garden-door',
        x: GARDEN_DOOR_X,
        y: LOWER_FLOOR_Y,
        targetLevelId: 'kitchen-garden',
        targetSpawnId: 'from-keep',
        promptLabel: 'go outside',
      }),
      // The bookshelf on the UPPER floor — to the right of the throne,
      // between the middle and right gold columns. It looks like furniture
      // and is a door: behind it, the library.
      new Door({
        id: 'keep-bookshelf-door',
        x: BOOKSHELF_DOOR_X,
        y: UPPER_FLOOR_Y,
        targetLevelId: 'old-keep-library',
        targetSpawnId: 'from-keep',
        promptLabel: 'pull a book',
        drawBody: drawBookshelf,
      }),
      // Candles — three on the lower floor, two on the upper floor (near
      // the throne and the bookshelf), two in the basement (one on each
      // side of the basement chamber). Each instance ticks on its own
      // clock so they don't all flicker in sync.
      new TallCandle(9 * TILE_SIZE + 8, LOWER_FLOOR_Y),
      new TallCandle(21 * TILE_SIZE + 8, LOWER_FLOOR_Y),
      // Col 34, beside the hole rather than over it — at col 36 it stood
      // on thin air.
      new TallCandle(34 * TILE_SIZE + 8, LOWER_FLOOR_Y),
      new TallCandle(11 * TILE_SIZE + 8, UPPER_FLOOR_Y),
      new TallCandle(26 * TILE_SIZE + 8, UPPER_FLOOR_Y),
      new TallCandle(14 * TILE_SIZE + 8, BASEMENT_FLOOR_Y),
      new TallCandle(30 * TILE_SIZE + 8, BASEMENT_FLOOR_Y),
    ];
  },
};

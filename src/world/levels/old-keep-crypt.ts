import { DB32, TILE_SIZE } from '@constants';
import { Chandelier } from '@entities/chandelier';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Crypt — small, dark, cosy. Deeply buried.
//
// 22 wide × 28 tall. The visible chamber is small (one screen wide,
// 5 rows of interior) but it sits buried under many layers of stone,
// so when the player jumps in the crypt they NEVER see sky above the
// ceiling — only more brick. The visible interior:
//
//   Rows 0-13   solid CryptBrick — 14 rows of overhead stone. Camera
//               can only ever reveal brick at the top of the viewport.
//   Rows 14-17  ceiling (the bricks the player can JUST see above their
//               head if they jump from the floor)
//   Rows 18-22  interior (5 rows of headroom)
//   Row 23      polished crypt floor, open at cols 10-11: the grave, its
//               lid slid aside onto the floor beside it
//   Rows 24-26  the ossuary under the floor (cols 5-16). A stone bier
//               (row 26, cols 10-11) sits right under the grave: the drop
//               lands on it, and from it a straight jump up (3 tiles)
//               climbs back out through the opening. A stair at col 8
//               goes down again, to the flooded cistern.
//   Row 27      ossuary floor
//
// Walls are CryptBrick (true neutral near-black with white "reflets"
// highlights) and floor is CryptFloor (one notch lighter). Backdrop is
// 'crypt-black' (pure black) so every gap between objects reads as
// "the candlelight can't reach back there."
//
// Furniture: two red-velvet armchairs flanking the open tomb, each by a
// candle, and one more candle down in the ossuary. A cosy hideout buried under the keep — a place
// you'd want to sit down in, not just pass through.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   c CryptBrick   v CryptFloor
const OLD_KEEP_CRYPT_ROWS = [
  'cccccccccccccccccccccc', //  0  deep stone overhead
  'cccccccccccccccccccccc', //  1
  'cccccccccccccccccccccc', //  2
  'cccccccccccccccccccccc', //  3
  'cccccccccccccccccccccc', //  4
  'cccccccccccccccccccccc', //  5
  'cccccccccccccccccccccc', //  6
  'cccccccccccccccccccccc', //  7
  'cccccccccccccccccccccc', //  8
  'cccccccccccccccccccccc', //  9
  'cccccccccccccccccccccc', // 10
  'cccccccccccccccccccccc', // 11
  'cccccccccccccccccccccc', // 12
  'cccccccccccccccccccccc', // 13
  'cccccccccccccccccccccc', // 14  ceiling (visible from inside)
  'cccccccccccccccccccccc', // 15
  'cccccccccccccccccccccc', // 16  interior
  'cccccccccccccccccccccc', // 17
  'cc..................cc', // 18
  'cc..................cc', // 19
  'cc..................cc', // 20
  'cc..................cc', // 21
  'cc..................cc', // 22
  'ccvvvvvvvv..vvvvvvvvcc', // 23  polished crypt floor — the open grave at cols 10-11
  'ccccc............ccccc', // 24  ossuary (rows 24-26, cols 5-16)
  'ccccc............ccccc', // 25
  'ccccc.....cc.....ccccc', // 26  bier under the grave (cols 10-11)
  'cccccccccccccccccccccc', // 27  ossuary floor
] as const;

const FLOOR_ROW = 23;
const STAND_Y = FLOOR_ROW * TILE_SIZE;
const STAND_SPAWN_Y = STAND_Y - TILE_SIZE;

// The ossuary's floor, under the crypt floor (row 27).
const OSSUARY_FLOOR_Y = 27 * TILE_SIZE;

// Return door — back up to the keep's basement. Sits at the left wall.
const RETURN_DOOR_COL = 3;
const RETURN_DOOR_X = RETURN_DOOR_COL * TILE_SIZE + 8;

// Cistern stair — in the ossuary, between the candle and the bier, down to
// the flooded cistern.
const CISTERN_DOOR_X = 8 * TILE_SIZE + 8;

const OLD_KEEP_CRYPT_SPAWNS: SpawnPoint[] = [
  // 'from-keep' — player descended from the keep's basement. Two tiles
  // right of the return door, clear of its interaction zone.
  { id: 'from-keep', x: 6 * TILE_SIZE + 2, y: STAND_SPAWN_Y },
  // 'from-cistern' — back up the cistern stair, in the ossuary, west of it.
  { id: 'from-cistern', x: 5 * TILE_SIZE + 2, y: OSSUARY_FLOOR_Y - TILE_SIZE },
];

// ---------------------------------------------------------------------------
// Landmarks — the engraved tomb lid on the crypt floor, and the ossuary
// under it.
// ---------------------------------------------------------------------------

const inkFor = (discovered: boolean): number => (discovered ? DB32.opal : DB32.valhalla);

const OLD_KEEP_CRYPT_LANDMARKS: LandmarkSpec[] = [
  {
    // The lid lies on solid floor (cols 12-13) right beside the grave it
    // was slid off — the opening at cols 10-11 is the way down.
    id: 'crypt-inscription',
    x: 13 * TILE_SIZE,
    y: STAND_Y,
    name: 'Crypt Inscription',
    description:
      'A flat stone tomb lid, slid aside from an opening in the floor. It is engraved in a language you do not know, but ' +
      'the script spirals — the same spiral as the Stone Marker, as the Throne. ' +
      'Three names are picked out in faint gold leaf. The dates have worn away.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      const stoneShadow = discovered ? DB32.opal : DB32.dimGray;
      const gold = discovered ? DB32.dimGray : DB32.goldenFizz;

      // Base slab — 20 wide × 5 tall, sitting flat on the floor.
      g.rect(-10, -5, 20, 5).fill(stone);
      g.rect(-10, -5, 20, 1).fill(stoneHi);
      g.rect(-10, -5, 1, 5).fill(ink);
      g.rect(9, -5, 1, 5).fill(ink);
      g.rect(-10, -1, 20, 1).fill(ink);

      // Inset carved area — slightly recessed on the lid. 16 wide × 3 tall.
      g.rect(-8, -4, 16, 3).fill(stoneShadow);
      g.rect(-8, -4, 16, 1).fill(ink);

      // Engraved spiral motif in the centre of the lid — same shape as
      // the Stone Marker and Throne.
      g.rect(-2, -3, 4, 1).fill(ink);
      g.rect(-2, -3, 1, 2).fill(ink);
      g.rect(1, -3, 1, 2).fill(ink);
      g.rect(-2, -2, 4, 1).fill(ink);

      // Three small gold marks on the lid — the "names in gold leaf."
      g.rect(-7, -3, 1, 1).fill(gold);
      g.rect(-5, -3, 1, 1).fill(gold);
      g.rect(6, -3, 1, 1).fill(gold);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      const gold = DB32.goldenFizz;
      const stoneShadow = DB32.dimGray;

      g.rect(-22, 8, 44, 12).fill(stone);
      g.rect(-22, 8, 44, 2).fill(stoneHi);
      g.rect(-22, 8, 2, 12).fill(ink);
      g.rect(20, 8, 2, 12).fill(ink);

      g.rect(-18, -8, 36, 16).fill(stone);
      g.rect(-18, -8, 36, 2).fill(stoneHi);
      g.rect(-18, 6, 36, 2).fill(stoneShadow);
      g.rect(-18, -8, 2, 16).fill(ink);
      g.rect(16, -8, 2, 16).fill(ink);

      g.rect(-12, -4, 24, 2).fill(ink);
      g.rect(-12, -4, 2, 10).fill(ink);
      g.rect(10, -4, 2, 10).fill(ink);
      g.rect(-12, 4, 24, 2).fill(ink);
      g.rect(-4, -2, 2, 6).fill(ink);
      g.rect(2, -2, 2, 6).fill(ink);

      g.rect(-16, 0, 4, 1).fill(gold);
      g.rect(-16, 2, 3, 1).fill(gold);
      g.rect(13, 0, 4, 1).fill(gold);
    },
  },

  // Ossuary — against the east wall of the chamber under the floor
  // (col 15). Stone chests rather than bones: the room is meant to read as
  // kept with care, not as something to be afraid of. Under 32 px tall —
  // the chamber is three tiles high.
  {
    id: 'ossuary',
    x: 15 * TILE_SIZE + 8,
    y: OSSUARY_FLOOR_Y,
    name: 'Ossuary',
    description:
      'A low room under the tomb, lined with small stone chests stacked high against the walls — kept tidy by someone ' +
      'long gone. Three of the chests sit apart, each with a fleck of gold leaf on its lid. ' +
      'The three names from the tomb, at rest.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      const gold = discovered ? DB32.dimGray : DB32.goldenFizz;

      // One small chest: 6 wide × 4 tall, lid line on top.
      const chest = (x: number, y: number): void => {
        g.rect(x, y, 6, 4).fill(stone);
        g.rect(x, y, 6, 1).fill(stoneHi);
        g.rect(x, y, 1, 4).fill(ink);
        g.rect(x + 5, y, 1, 4).fill(ink);
        g.rect(x, y + 3, 6, 1).fill(ink);
      };
      // The stack against the wall: five rows of chests, narrowing upward.
      for (const [x, y] of [
        [-1, -4],
        [5, -4],
        [-1, -8],
        [5, -8],
        [-1, -12],
        [5, -12],
        [2, -16],
        [2, -20],
      ] as const) {
        chest(x, y);
      }
      // The three set apart on the floor, each with its fleck of gold.
      for (const x of [-12, -8, -4]) {
        g.rect(x, -3, 3, 3).fill(stone);
        g.rect(x, -3, 3, 1).fill(stoneHi);
        g.rect(x + 1, -2, 1, 1).fill(gold);
      }
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      const gold = DB32.goldenFizz;
      const chest = (x: number, y: number): void => {
        g.rect(x, y, 16, 10).fill(stone);
        g.rect(x, y, 16, 2).fill(stoneHi);
        g.rect(x, y + 9, 16, 1).fill(ink);
        g.rect(x + 15, y, 1, 10).fill(ink);
      };
      // The stack.
      for (const [x, y] of [
        [0, 10],
        [16, 10],
        [0, 0],
        [16, 0],
        [8, -10],
        [8, -20],
      ] as const) {
        chest(x, y);
      }
      // The three apart, gold on each lid.
      for (const x of [-26, -16, -6]) {
        g.rect(x, 12, 8, 8).fill(stone);
        g.rect(x, 12, 8, 2).fill(stoneHi);
        g.rect(x + 3, 15, 2, 2).fill(gold);
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Cosy armchair decoration. Drawn around (0, 0) with feet at y=0.
//
// Visual brief: a small wooden-framed armchair upholstered in deep red
// velvet, with a gold finial across the top of the backrest. 12 wide × 12
// tall. Reads at game scale as "this is where you sit by the candle to
// read a book." The dark crypt context makes the warm red+gold pop.
// ---------------------------------------------------------------------------

function drawArmchair(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const woodHi = DB32.rope;
  const woodShadow = DB32.valhalla;
  const cushion = DB32.clairvoyant; // deep red
  const cushionHi = DB32.brown; // brighter red highlight
  const cushionShadow = DB32.loulou; // dark plum shadow
  const trim = DB32.goldenFizz;

  // Two short wooden legs at the bottom, 2 px wide each at the chair's
  // left and right edges. Tiny shadow gap between them suggests the
  // chair is lifted off the floor.
  g.rect(-6, -2, 2, 2).fill(wood);
  g.rect(4, -2, 2, 2).fill(wood);
  g.rect(-6, -2, 2, 1).fill(woodHi);
  g.rect(4, -2, 2, 1).fill(woodHi);

  // Wooden seat frame — 12 wide × 2 tall above the legs.
  g.rect(-6, -4, 12, 2).fill(wood);
  g.rect(-6, -4, 12, 1).fill(woodHi);
  g.rect(-6, -3, 12, 1).fill(woodShadow);

  // Red velvet seat cushion — 10 wide × 1 tall on the frame.
  g.rect(-5, -5, 10, 1).fill(cushionHi);

  // Armrests — 2 px wide × 4 tall on each side, between seat and backrest top.
  g.rect(-6, -9, 2, 4).fill(wood);
  g.rect(4, -9, 2, 4).fill(wood);
  g.rect(-6, -9, 2, 1).fill(woodHi);
  g.rect(4, -9, 2, 1).fill(woodHi);

  // Backrest cushion — 8 wide × 6 tall, between the armrests.
  g.rect(-4, -11, 8, 6).fill(cushion);
  g.rect(-4, -11, 8, 1).fill(cushionHi);
  g.rect(-4, -11, 1, 6).fill(cushionShadow);
  g.rect(3, -11, 1, 6).fill(cushionShadow);
  g.rect(-4, -6, 8, 1).fill(cushionShadow); // seat-back transition shadow

  // Gold finial trim across the top of the backrest.
  g.rect(-3, -12, 6, 1).fill(trim);

  // Single decorative tuft (gold button) on the backrest centre.
  g.rect(-1, -8, 2, 1).fill(trim);
}

// The cistern stair: a stone arch, 14 wide × 22 tall, over three steps
// going down into black, and a line of water-blue at the foot. Drawn around
// (0, 0) with its base on the y = 0 line, as every door is.
function drawCisternStair(g: Graphics): void {
  const stone = DB32.dimGray;
  const stoneHi = DB32.heather;
  g.rect(-7, -20, 14, 20).fill(stone);
  g.rect(-5, -22, 10, 2).fill(stone);
  g.rect(-5, -22, 10, 1).fill(stoneHi);
  g.rect(-7, -20, 2, 1).fill(stoneHi);
  g.rect(5, -20, 2, 1).fill(stoneHi);
  g.rect(-5, -19, 10, 19).fill(DB32.black);
  g.rect(-3, -21, 6, 2).fill(DB32.black);
  // Steps, each a little darker and narrower than the one above it.
  g.rect(-5, -9, 10, 1).fill(stoneHi);
  g.rect(-4, -6, 8, 1).fill(stone);
  g.rect(-3, -3, 6, 1).fill(DB32.opal);
  g.rect(-2, -1, 4, 1).fill(DB32.venice);
}

const onCryptFloor = (col: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: STAND_Y,
  draw,
});

const OLD_KEEP_CRYPT_DECORATIONS: DecorationSpec[] = [
  // Two armchairs flanking the open tomb (the grave at cols 10-11, its lid
  // beside it at cols 12-13).
  // Left chair faces right (toward the inscription), right chair faces
  // left. Together with the candles either side, the chamber reads as
  // a private reading nook around the tomb.
  onCryptFloor(7, drawArmchair),
  onCryptFloor(15, drawArmchair),
];

export const oldKeepCryptLevel: LevelSpec = {
  id: 'old-keep-crypt',
  name: 'The Crypt',
  rows: OLD_KEEP_CRYPT_ROWS,
  spawns: OLD_KEEP_CRYPT_SPAWNS,
  defaultSpawnId: 'from-keep',
  landmarks: OLD_KEEP_CRYPT_LANDMARKS,
  decorations: OLD_KEEP_CRYPT_DECORATIONS,
  parallax: 'keep',
  // Pure-black backdrop — darker than the keep's indoor-dark. The crypt
  // is meant to feel like a candle-lit hideout where you can't see the
  // back of the room. Walls of CryptBrick (opal) read as "almost-black
  // brick" against this; only the candles and armchair upholstery have
  // any warm colour at all.
  backdrop: 'crypt-black',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      // Return door — back up to the keep's basement. Player exited from
      // the keep's descend door at basement col 8; coming back lands them
      // at the 'from-keep' spawn there (col 11).
      new Door({
        id: 'crypt-return-door',
        x: RETURN_DOOR_X,
        y: STAND_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-crypt',
        promptLabel: 'ascend',
      }),
      // Two candles, one beside each armchair.
      new TallCandle(5 * TILE_SIZE + 8, STAND_Y),
      new TallCandle(17 * TILE_SIZE + 8, STAND_Y),
      // One down in the ossuary, at the west end, away from the chests.
      new TallCandle(6 * TILE_SIZE + 8, OSSUARY_FLOOR_Y),
      // The stair down to the cistern — a low arch over steps going into the
      // dark, with the water's glint at the bottom.
      new Door({
        id: 'crypt-cistern-door',
        x: CISTERN_DOOR_X,
        y: OSSUARY_FLOOR_Y,
        targetLevelId: 'flooded-cistern',
        targetSpawnId: 'from-crypt',
        promptLabel: 'descend',
        drawBody: drawCisternStair,
      }),
      // Iron chandelier hanging from the ceiling underside above the
      // tomb inscription (centre of the room). Anchored at its top
      // (chain attachment point) at the world Y of the ceiling
      // underside — the bottom of the last solid brick row = top of
      // the first interior row (row 18). Hangs ~10 px down into the
      // chamber, well above the player's head.
      new Chandelier(11 * TILE_SIZE + 8, 18 * TILE_SIZE),
    ];
  },
};

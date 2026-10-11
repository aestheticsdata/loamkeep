import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { FallingLeaf } from '@entities/falling-leaf';
import type { LandmarkSpec } from '@entities/landmark';
import { type FloraId, PLANTS } from '@entities/plants';
import { Pumpkin } from '@entities/pumpkin';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Kitchen Garden — walled in beside the keep, on an autumn evening. The
// pumpkin lives here now.
//
// 50 wide × 18 tall, one storey of ground (row 14) under an open sky:
//
//   Keep wall (cols 0-3) — the door back into the entry hall is at its foot.
//   Raised beds (row 13, cols 10-15 and 20-25) — timber frames a tile high,
//     squash and beans in them. One pumpkin hops along the second bed.
//   The patch (cols 26-35) — bare ground where the other pumpkin hops.
//   The Sundial (col 18), between the beds.
//   The way up: compost bin (rows 12-13, cols 36-37, two up) → potting-shed
//     roof (row 10, cols 39-43, two up) → the top of the garden wall (row 8,
//     cols 46-49, two up), where the sunflowers have the last of the sun.
//     Every step is two tiles, so none of them can catch the player's head.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . sky   B CastleBrick   G grass   D dirt   T Timber
const KITCHEN_GARDEN_ROWS = [
  'BBBB..............................................', //  0  the keep's outer wall (cols 0-3)
  'BBBB..............................................', //  1
  'BBBB..............................................', //  2
  'BBBB..............................................', //  3
  'BBBB..............................................', //  4
  'BBBB..............................................', //  5
  'BBBB..............................................', //  6
  'BBBB..............................................', //  7
  'BBBB..........................................BBBB', //  8  top of the garden wall (cols 46-49)
  'BBBB..........................................BBBB', //  9
  'BBBB...................................TTTTT..BBBB', // 10  potting-shed roof (cols 39-43)
  'BBBB..........................................BBBB', // 11
  'BBBB................................TT........BBBB', // 12  compost bin (cols 36-37)
  'BBBB......TTTTTT....TTTTTT..........TT........BBBB', // 13  raised beds (cols 10-15, 20-25)
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // 14  GROUND
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 15
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 16
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 17
] as const;

const GROUND_ROW = 14;
const GROUND_Y = GROUND_ROW * TILE_SIZE;
const BED_Y = 13 * TILE_SIZE;
const WALL_TOP_Y = 8 * TILE_SIZE;

const RETURN_DOOR_X = 5 * TILE_SIZE;

const KITCHEN_GARDEN_SPAWNS: SpawnPoint[] = [{ id: 'from-keep', x: 7 * TILE_SIZE + 2, y: GROUND_Y - TILE_SIZE }];

// ---------------------------------------------------------------------------
// Landmark — the Sundial, on the path between the beds.
// ---------------------------------------------------------------------------

const KITCHEN_GARDEN_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'sundial',
    x: 18 * TILE_SIZE,
    y: GROUND_Y,
    name: 'Sundial',
    description:
      'A stone dial on a column, its bronze blade casting a long evening shadow. The hour lines are wrong: ' +
      'they do not fan out, they wind inward, round and round to the foot of the blade. Whatever it tells, ' +
      'it is not the time of day.',
    drawBody(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      // Foot, column and dial.
      g.rect(-5, -2, 10, 2).fill(stone);
      g.rect(-5, -2, 10, 1).fill(stoneHi);
      g.rect(-2, -10, 4, 8).fill(stone);
      g.rect(-2, -10, 1, 8).fill(stoneHi);
      g.rect(-7, -12, 14, 2).fill(stone);
      g.rect(-7, -12, 14, 1).fill(stoneHi);
      // The coiled hour lines, seen edge-on as ticks on the rim.
      for (const x of [-6, -4, -1, 2, 5]) g.rect(x, -11, 1, 1).fill(ink);
      // The blade, and its shadow thrown long across the dial.
      g.rect(0, -16, 1, 4).fill(DB32.rainforest);
      g.rect(-1, -15, 1, 3).fill(DB32.rainforest);
      g.rect(-7, -12, 6, 1).fill(DB32.verdigris);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const ink = DB32.valhalla;
      // The dial from above: a disc with the spiral of hour lines in it.
      for (let dy = -26; dy <= 26; dy++) {
        const half = Math.round(Math.sqrt(26 * 26 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(stone);
      }
      g.rect(-20, -20, 40, 2).fill(ink);
      g.rect(18, -20, 2, 36).fill(ink);
      g.rect(-16, 14, 36, 2).fill(ink);
      g.rect(-16, -12, 2, 28).fill(ink);
      g.rect(-16, -12, 28, 2).fill(ink);
      g.rect(10, -12, 2, 20).fill(ink);
      g.rect(-8, 6, 20, 2).fill(ink);
      g.rect(-8, -4, 2, 12).fill(ink);
      g.rect(-8, -4, 12, 2).fill(ink);
      // The blade at the centre, and its long shadow.
      g.rect(0, -6, 3, 10).fill(DB32.rainforest);
      g.rect(-24, 0, 24, 2).fill(DB32.verdigris);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — the planting, the shed, and the last of the sun.
// ---------------------------------------------------------------------------

const plant = (col: number, surfaceY: number, species: FloraId): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: surfaceY,
  species,
  draw: PLANTS[species].draw,
});

// The potting shed under its timber roof: board walls, a door ajar, a window
// with a pot on the sill. 72 wide × 48 tall, standing on the ground with the
// roof tiles (row 10) sitting on top of it. The player walks through it — it
// is backdrop, the roof is the platform.
function drawShed(g: Graphics): void {
  const board = DB32.rope;
  const boardDark = DB32.oiledCedar;
  g.rect(-36, -48, 72, 48).fill(board);
  for (let x = -36; x < 36; x += 6) g.rect(x, -48, 1, 48).fill(boardDark);
  // Door, ajar: dark gap down one side.
  g.rect(-28, -30, 14, 30).fill(boardDark);
  g.rect(-28, -30, 3, 30).fill(DB32.valhalla);
  g.rect(-17, -16, 2, 2).fill(DB32.twine);
  // Window and pot.
  g.rect(8, -36, 16, 12).fill(DB32.valhalla);
  g.rect(8, -36, 16, 12).stroke({ color: boardDark, width: 1 });
  g.rect(15, -36, 1, 12).fill(boardDark);
  g.rect(12, -28, 6, 4).fill(DB32.tahitiGold);
  g.rect(13, -31, 1, 3).fill(DB32.dell);
  g.rect(15, -32, 1, 4).fill(DB32.dell);
}

// A wooden water butt against the keep wall, 12 wide × 16 tall.
function drawWaterButt(g: Graphics): void {
  g.rect(-6, -16, 12, 16).fill(DB32.oiledCedar);
  g.rect(-6, -12, 12, 1).fill(DB32.dimGray);
  g.rect(-6, -4, 12, 1).fill(DB32.dimGray);
  g.rect(-5, -16, 10, 1).fill(DB32.venice);
  g.rect(-6, -16, 1, 16).fill(DB32.rope);
}

const KITCHEN_GARDEN_DECORATIONS: DecorationSpec[] = [
  { x: 9 * TILE_SIZE, y: GROUND_Y, draw: drawWaterButt },
  // First bed: beans at either end, squash between.
  plant(10, BED_Y, 'bean-trellis'),
  plant(12, BED_Y, 'squash'),
  plant(14, BED_Y, 'squash'),
  plant(15, BED_Y, 'bean-trellis'),
  // Second bed, where a pumpkin hops between the squash.
  plant(21, BED_Y, 'squash'),
  plant(24, BED_Y, 'squash'),
  // The shed, centred under its roof (cols 39-43).
  { x: 41 * TILE_SIZE + 8, y: GROUND_Y, draw: drawShed },
  // The sunflowers, up on the wall where the sun still reaches.
  plant(47, WALL_TOP_Y, 'sunflower'),
  plant(48, WALL_TOP_Y, 'sunflower'),
];

export const kitchenGardenLevel: LevelSpec = {
  id: 'kitchen-garden',
  name: 'The Kitchen Garden',
  rows: KITCHEN_GARDEN_ROWS,
  spawns: KITCHEN_GARDEN_SPAWNS,
  defaultSpawnId: 'from-keep',
  landmarks: KITCHEN_GARDEN_LANDMARKS,
  decorations: KITCHEN_GARDEN_DECORATIONS,
  parallax: 'autumn',
  backdrop: 'cave',
  rockBgStartRow: GROUND_ROW,
  openSky: true,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'garden-return-door',
        x: RETURN_DOOR_X,
        y: GROUND_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-garden',
        promptLabel: 'go in',
      }),
      // The pumpkins, home: one in the patch, one along the second bed.
      new Pumpkin({
        x: 30 * TILE_SIZE,
        y: GROUND_Y,
        minX: 26 * TILE_SIZE + 4,
        maxX: 35 * TILE_SIZE - 4,
        facing: 1,
      }),
      new Pumpkin({
        x: 22 * TILE_SIZE,
        y: BED_Y,
        minX: 20 * TILE_SIZE + 4,
        maxX: 26 * TILE_SIZE - 4,
        facing: -1,
      }),
      // Leaves coming down over the whole garden, from above the top of the
      // screen to the ground.
      ...[6, 13, 19, 27, 33, 40, 45].map(
        (col, i) => new FallingLeaf({ x: col * TILE_SIZE, top: -24, bottom: GROUND_Y, phase: (i * 0.37) % 1 }),
      ),
    ];
  },
};

import { DB32, TILE_SIZE } from '@constants';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { Glowfish } from '@entities/glowfish';
import type { LandmarkSpec } from '@entities/landmark';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Flooded Cistern — a vaulted reservoir under the crypt, mostly water.
//
// 44 wide × 24 tall. The water surface is row 8 everywhere it meets air;
// the floor is row 22. Left to right:
//
//   Entrance hall (cols 2-8) — the door from the ossuary on a dry landing
//     (row 6), one step down (row 7, cols 7-8) to the water's edge. The
//     step is one tile above the surface, so the exit pop out of a swim
//     lands on it.
//   First pool (cols 9-16) — under a high vault, with a broken pillar
//     standing on the floor (cols 12-13, rows 18-21).
//   Low vault (cols 17-20) — the ceiling comes down to row 11: dive under.
//   Air pocket (cols 21-26) — two rows of air over the water, room to
//     surface and nothing to stand on.
//   Lower vault (cols 27-31) — the ceiling comes down to row 13, so the
//     passage under it is the deepest dive in the game.
//   Shrine pocket (cols 32-41) — a high pocket of air, and the only dry
//     stone past the entrance: a shelf (row 7, cols 37-41) one tile above
//     the water, where the Dry Shrine stands.
//
// There is no breath to run out of: no fail states, in here as anywhere.
// The pockets are places to come up and look around, not to survive.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   c CryptBrick   v CryptFloor   W Water
const FLOODED_CISTERN_ROWS = [
  'cccccccccccccccccccccccccccccccccccccccccccc', //  0
  'cccccccccccccccccccccccccccccccccccccccccccc', //  1
  'cc...............ccccccccccccccccccccccccccc', //  2  entrance hall + first vault
  'cc...............ccccccccccccccc..........cc', //  3  shrine pocket (rows 3-7, cols 32-41)
  'cc...............ccccccccccccccc..........cc', //  4
  'cc...............ccccccccccccccc..........cc', //  5
  'ccvvvvv..........cccc......ccccc..........cc', //  6  landing (cols 2-6) + air pocket (rows 6-7, cols 21-26)
  'cccccccvv........cccc......ccccc.....vvvvvcc', //  7  step (cols 7-8) + shrine shelf (cols 37-41)
  'cccccccccWWWWWWWWccccWWWWWWcccccWWWWWccccccc', //  8  water surface
  'cccccccccWWWWWWWWccccWWWWWWcccccWWWWWccccccc', //  9
  'cccccccccWWWWWWWWccccWWWWWWcccccWWWWWccccccc', // 10
  'cccccccccWWWWWWWWccccWWWWWWcccccWWWWWccccccc', // 11  low vault's foot (cols 17-20)
  'cccccccccWWWWWWWWWWWWWWWWWWcccccWWWWWccccccc', // 12
  'cccccccccWWWWWWWWWWWWWWWWWWcccccWWWWWccccccc', // 13  lower vault's foot (cols 27-31)
  'cccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 14
  'cccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 15
  'cccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 16
  'cccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 17
  'cccccccccWWWccWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 18  broken pillar (cols 12-13)
  'cccccccccWWWccWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 19
  'cccccccccWWWccWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 20
  'cccccccccWWWccWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 21
  'cccccccccvvvvvvvvvvvvvvvvvvvvvvvvvvvvccccccc', // 22  cistern floor
  'cccccccccccccccccccccccccccccccccccccccccccc', // 23
] as const;

const LANDING_Y = 6 * TILE_SIZE;
const SHELF_Y = 7 * TILE_SIZE;

const RETURN_DOOR_X = 3 * TILE_SIZE + 8;

const FLOODED_CISTERN_SPAWNS: SpawnPoint[] = [
  // On the landing, two tiles right of the door.
  { id: 'from-crypt', x: 5 * TILE_SIZE + 2, y: LANDING_Y - TILE_SIZE },
];

// ---------------------------------------------------------------------------
// Landmark — the shrine on the one dry shelf past the entrance.
// ---------------------------------------------------------------------------

const FLOODED_CISTERN_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'dry-shrine',
    x: 39 * TILE_SIZE + 8,
    y: SHELF_Y,
    name: 'Dry Shrine',
    description:
      'The one dry stone past the steps, and someone made it a shrine: a niche in the wall, a stub of candle that ' +
      'is somehow still lit, a scatter of coins gone green. Over the niche, worn by the damp almost smooth, ' +
      'the spiral.',
    drawBody(g) {
      drawShrine(g);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      // Niche frame and arch.
      g.rect(-20, -22, 40, 42).fill(stone);
      g.rect(-14, -30, 28, 8).fill(stone);
      g.rect(-8, -34, 16, 4).fill(stone);
      g.rect(-20, -22, 40, 2).fill(stoneHi);
      // The dark recess.
      g.rect(-12, -18, 24, 34).fill(DB32.black);
      g.rect(-8, -24, 16, 6).fill(DB32.black);
      // Candle and flame.
      g.rect(-3, 4, 6, 12).fill(DB32.pancho);
      g.rect(-1, -4, 2, 8).fill(DB32.goldenFizz);
      g.rect(-1, 0, 2, 3).fill(DB32.tahitiGold);
      // Coins on the sill.
      for (const x of [-18, -12, 8, 14]) {
        g.rect(x, 18, 4, 2).fill(DB32.eltGreen);
      }
      // The spiral over the arch.
      g.rect(-6, -32, 12, 1).fill(ink);
      g.rect(-6, -32, 1, 5).fill(ink);
      g.rect(5, -32, 1, 5).fill(ink);
      g.rect(-6, -28, 12, 1).fill(ink);
      g.rect(-2, -30, 3, 1).fill(ink);
    },
  },
];

// A niche in the back wall, 14 wide × 20 tall, with a lit candle stub inside
// and coins on its sill. Anchored at the sill.
function drawShrine(g: Graphics): void {
  const stone = DB32.dimGray;
  const stoneHi = DB32.heather;
  g.rect(-7, -18, 14, 18).fill(stone);
  g.rect(-5, -20, 10, 2).fill(stone);
  g.rect(-3, -21, 6, 1).fill(stone);
  g.rect(-7, -18, 14, 1).fill(stoneHi);
  // Recess.
  g.rect(-4, -16, 8, 14).fill(DB32.black);
  g.rect(-3, -18, 6, 2).fill(DB32.black);
  // Candle stub and its flame.
  g.rect(-1, -5, 2, 3).fill(DB32.pancho);
  g.rect(-1, -7, 1, 2).fill(DB32.goldenFizz);
  g.rect(0, -8, 1, 1).fill(DB32.tahitiGold);
  // Coins on the sill, gone green.
  g.rect(-6, -1, 2, 1).fill(DB32.eltGreen);
  g.rect(-3, -1, 1, 1).fill(DB32.goldenFizz);
  g.rect(4, -1, 2, 1).fill(DB32.eltGreen);
  // The spiral, faint, over the arch.
  g.rect(-2, -20, 4, 1).fill(DB32.opal);
  g.rect(-2, -20, 1, 2).fill(DB32.opal);
  g.rect(1, -20, 1, 2).fill(DB32.opal);
}

export const floodedCisternLevel: LevelSpec = {
  id: 'flooded-cistern',
  name: 'The Flooded Cistern',
  rows: FLOODED_CISTERN_ROWS,
  spawns: FLOODED_CISTERN_SPAWNS,
  defaultSpawnId: 'from-crypt',
  landmarks: FLOODED_CISTERN_LANDMARKS,
  decorations: [],
  parallax: 'keep',
  // Pure black, as in the crypt above: the only light is the candle on the
  // landing and the fish themselves.
  backdrop: 'crypt-black',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'cistern-return-door',
        x: RETURN_DOOR_X,
        y: LANDING_Y,
        targetLevelId: 'old-keep-crypt',
        targetSpawnId: 'from-cistern',
        promptLabel: 'ascend',
      }),
      new TallCandle(6 * TILE_SIZE + 8, LANDING_Y),
      // Glowfish, one or two to each stretch of water, at the depths a
      // swimmer passes through: the first pool, the dive under the low
      // vault, the first pocket, the deep passage, and the shrine pocket.
      new Glowfish({
        x: 12 * TILE_SIZE,
        y: 13 * TILE_SIZE,
        speed: 18,
        minX: 9 * TILE_SIZE + 6,
        maxX: 17 * TILE_SIZE - 6,
      }),
      new Glowfish({
        x: 18 * TILE_SIZE,
        y: 16 * TILE_SIZE,
        speed: 24,
        minX: 14 * TILE_SIZE,
        maxX: 25 * TILE_SIZE,
        facing: -1,
      }),
      new Glowfish({
        x: 23 * TILE_SIZE,
        y: 10 * TILE_SIZE,
        speed: 14,
        minX: 21 * TILE_SIZE + 6,
        maxX: 27 * TILE_SIZE - 6,
      }),
      new Glowfish({ x: 29 * TILE_SIZE, y: 19 * TILE_SIZE, speed: 22, minX: 24 * TILE_SIZE, maxX: 35 * TILE_SIZE }),
      new Glowfish({
        x: 34 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        speed: 16,
        minX: 32 * TILE_SIZE + 6,
        maxX: 37 * TILE_SIZE - 6,
        facing: -1,
      }),
    ];
  },
};

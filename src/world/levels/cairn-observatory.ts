import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { PLANTS } from '@entities/plants';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Cairn Observatory — the hill above the meadow, the last place, at
// night. The trail up from the meadow's high east platform ends here.
//
// 40 wide × 24 tall. One climb, out in the open, terrace by terrace: the foot
// of the hill (row 20, cols 0-9), then grass terraces at rows 18, 16, 14, 12
// and 10, every one two tiles above the last, up to the summit (row 8, cols
// 26-35) and a lower shoulder beyond it (row 10, cols 36-39). Cairns mark the
// way. On the summit, a ring of standing stones and the Sighting Stone,
// which lines the eye up with the zenith sky's spiral of stars.
//
// The level is tinted moonlight-blue: its grass and stone are the meadow's
// daytime tiles, and this is the same hill at night.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . sky   G grass   D dirt   S stone
const CAIRN_OBSERVATORY_ROWS = [
  '........................................', //  0
  '........................................', //  1
  '........................................', //  2
  '........................................', //  3
  '........................................', //  4
  '........................................', //  5
  '........................................', //  6
  '........................................', //  7
  '..........................GGGGGGGGGG....', //  8  SUMMIT (cols 26-35)
  '..........................DDDDDDDDDD....', //  9
  '.......................GGGDDDDDDDDDDGGGG', // 10  terrace (cols 23-25) + shoulder (cols 36-39)
  '.......................DDDSSSSSSSSSSDDDD', // 11
  '.....................GGDDDSSSSSSSSSSDDDD', // 12  terrace (cols 21-22)
  '.....................DDSSSSSSSSSSSSSSSSS', // 13
  '.................GGGGDDSSSSSSSSSSSSSSSSS', // 14  terrace (cols 17-20)
  '.................DDDDSSSSSSSSSSSSSSSSSSS', // 15
  '...............GGDDDDSSSSSSSSSSSSSSSSSSS', // 16  terrace (cols 15-16)
  '...............DDSSSSSSSSSSSSSSSSSSSSSSS', // 17
  '..........GGGGGDDSSSSSSSSSSSSSSSSSSSSSSS', // 18  terrace (cols 10-14)
  '..........DDDDDSSSSSSSSSSSSSSSSSSSSSSSSS', // 19
  'GGGGGGGGGGDDDDDSSSSSSSSSSSSSSSSSSSSSSSSS', // 20  FOOT OF THE HILL (cols 0-9)
  'DDDDDDDDDDSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', // 21
  'DDDDDDDDDDSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', // 22
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', // 23
] as const;

const FOOT_Y = 20 * TILE_SIZE;
const SUMMIT_Y = 8 * TILE_SIZE;

const RETURN_DOOR_X = 2 * TILE_SIZE + 8;

const CAIRN_OBSERVATORY_SPAWNS: SpawnPoint[] = [{ id: 'from-meadow', x: 5 * TILE_SIZE + 2, y: FOOT_Y - TILE_SIZE }];

// The trail head: two rough uprights with a flat stone across them, and the
// path running on between. Both ends of the trail use it — the meadow's
// platform and the foot of the hill. 16 wide × 20 tall, base on y = 0.
export function drawTrailGate(g: Graphics): void {
  const stone = DB32.dimGray;
  const stoneHi = DB32.heather;
  g.rect(-8, -16, 4, 16).fill(stone);
  g.rect(4, -16, 4, 16).fill(stone);
  g.rect(-8, -16, 1, 16).fill(stoneHi);
  g.rect(4, -16, 1, 16).fill(stoneHi);
  g.rect(-9, -20, 18, 4).fill(stone);
  g.rect(-9, -20, 18, 1).fill(stoneHi);
  // The path, worn pale, going on through.
  g.rect(-4, -2, 8, 2).fill(DB32.twine);
  g.rect(-2, -4, 4, 2).fill(DB32.pancho);
}

// A walker's cairn, knee high: three stones balanced, the top one pale.
function drawWaymark(g: Graphics): void {
  g.rect(-4, -3, 8, 3).fill(DB32.dimGray);
  g.rect(-3, -6, 6, 3).fill(DB32.topaz);
  g.rect(-2, -8, 4, 2).fill(DB32.heather);
  g.rect(-4, -3, 8, 1).fill(DB32.heather);
}

// A standing stone, taller than the wanderer, leaning a little.
function drawStandingStone(g: Graphics): void {
  g.rect(-4, -26, 8, 26).fill(DB32.dimGray);
  g.rect(-3, -28, 6, 2).fill(DB32.dimGray);
  g.rect(-4, -26, 1, 26).fill(DB32.heather);
  g.rect(3, -20, 1, 20).fill(DB32.opal);
  g.rect(-1, -18, 2, 1).fill(DB32.opal);
}

// ---------------------------------------------------------------------------
// Landmark — the Sighting Stone on the summit.
// ---------------------------------------------------------------------------

const CAIRN_OBSERVATORY_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'sighting-stone',
    x: 30 * TILE_SIZE + 8,
    y: SUMMIT_Y,
    name: 'Sighting Stone',
    description:
      'A standing stone on the summit, bored clean through at eye height. Look through the hole and the stars ' +
      'overhead fall into line: the spiral — the one on the Marker, the Throne, the tomb, the one in the fossil — ' +
      'is this sky, drawn by people who stood here and looked up. Every carving below was a map. ' +
      'They were all pointing here.',
    drawBody(g) {
      const stone = DB32.dimGray;
      const stoneHi = DB32.heather;
      g.rect(-6, -30, 12, 30).fill(stone);
      g.rect(-5, -32, 10, 2).fill(stone);
      g.rect(-6, -30, 1, 30).fill(stoneHi);
      g.rect(-5, -32, 10, 1).fill(stoneHi);
      // The bore, with the sky showing through it.
      g.rect(-2, -22, 4, 4).fill(0x0c0b1a);
      g.rect(-1, -23, 2, 6).fill(0x0c0b1a);
      g.rect(0, -21, 1, 1).fill(DB32.white);
      // The spiral, small, cut under the hole.
      g.rect(-3, -14, 6, 1).fill(DB32.opal);
      g.rect(-3, -14, 1, 5).fill(DB32.opal);
      g.rect(-3, -10, 5, 1).fill(DB32.opal);
      g.rect(1, -12, 1, 2).fill(DB32.opal);
      g.rect(-1, -12, 2, 1).fill(DB32.opal);
    },
    drawSketch(g) {
      // The view through the bore: a disc of night with the spiral of stars
      // in it, ringed by the stone.
      for (let dy = -30; dy <= 30; dy++) {
        const half = Math.round(Math.sqrt(30 * 30 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(DB32.dimGray);
      }
      for (let dy = -24; dy <= 24; dy++) {
        const half = Math.round(Math.sqrt(24 * 24 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(0x0c0b1a);
      }
      const corners: readonly (readonly [number, number])[] = [
        [-16, -10],
        [16, -10],
        [16, 10],
        [-12, 10],
        [-12, -5],
        [12, -5],
        [12, 5],
        [-7, 5],
        [-7, 0],
        [3, 0],
      ];
      for (let i = 0; i + 1 < corners.length; i++) {
        const [ax, ay] = corners[i];
        const [bx, by] = corners[i + 1];
        const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let s = 2; s < steps; s += 3) {
          g.rect(Math.round(ax + ((bx - ax) * s) / steps), Math.round(ay + ((by - ay) * s) / steps), 1, 1).fill(
            DB32.royalBlue,
          );
        }
      }
      for (const [x, y] of corners) {
        g.rect(x - 1, y, 3, 1).fill(DB32.heather);
        g.rect(x, y - 1, 1, 3).fill(DB32.heather);
        g.rect(x, y, 1, 1).fill(DB32.white);
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — waymarks up the hill, the stone ring, a few hardy plants.
// ---------------------------------------------------------------------------

const at = (col: number, surfaceRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: surfaceRow * TILE_SIZE,
  draw,
});

const CAIRN_OBSERVATORY_DECORATIONS: DecorationSpec[] = [
  { x: 7 * TILE_SIZE + 8, y: FOOT_Y, species: 'pine-tree', draw: PLANTS['pine-tree'].draw },
  { x: 13 * TILE_SIZE + 8, y: 18 * TILE_SIZE, species: 'bush', draw: PLANTS.bush.draw },
  at(11, 18, drawWaymark),
  at(18, 14, drawWaymark),
  at(24, 10, drawWaymark),
  // The ring on the summit: stones either side of the Sighting Stone.
  at(27, 8, drawStandingStone),
  at(34, 8, drawStandingStone),
  at(38, 10, drawWaymark),
];

export const cairnObservatoryLevel: LevelSpec = {
  id: 'cairn-observatory',
  name: 'The Cairn Observatory',
  rows: CAIRN_OBSERVATORY_ROWS,
  spawns: CAIRN_OBSERVATORY_SPAWNS,
  defaultSpawnId: 'from-meadow',
  landmarks: CAIRN_OBSERVATORY_LANDMARKS,
  decorations: CAIRN_OBSERVATORY_DECORATIONS,
  parallax: 'zenith',
  // The hill is solid all the way down; no backdrop shows anywhere.
  backdrop: 'cave',
  rockBgStartRow: CAIRN_OBSERVATORY_ROWS.length,
  openSky: true,
  tint: 0x8090c8,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'observatory-return-door',
        x: RETURN_DOOR_X,
        y: FOOT_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-observatory',
        promptLabel: 'go down',
        drawBody: drawTrailGate,
      }),
    ];
  },
};

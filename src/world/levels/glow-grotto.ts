import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import type { LandmarkSpec } from '@entities/landmark';
import { Moth } from '@entities/moth';
import { type FloraId, PLANTS } from '@entities/plants';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Glow Grotto — a cave past the far end of the meadow's lower maze, lit
// only by what grows in it.
//
// 40 wide × 22 tall. A bowl:
//
//   Entrance shelf (row 8, cols 2-7) — the crack back to the maze, on a
//     ledge high on the west wall.
//   West slope — three rock steps down to the floor (tops at rows 10, 12
//     and 14, two tiles apart each), solid to the floor so nothing
//     overhangs a take-off: the way down is the way back up.
//   Floor (row 16, cols 14-28) — the Spiral Ring, and a pool (cols 18-23,
//     three deep). The pool's banks are level with its surface: the exit
//     pop lifts a swimmer straight out onto them.
//   East slope — two steps (tops at rows 14 and 12) up to the alcove
//     (row 10, cols 33-37), where the glowcaps grow thickest.
//
// The backdrop is pure black and the rock blue-black, so the glowcaps, the
// shelf fungus and the moss are the light.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   R GrottoRock   W Water
const GLOW_GROTTO_ROWS = [
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  0
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  1
  'RRRRRRRRRRRRRR...R.........RRRRRRRRRRRRR', //  2  the dome, with two stalactites (cols 17, 28)
  'RRRRRRRR.........R..........R.....RRRRRR', //  3
  'RR...............R..........R.........RR', //  4
  'RR...............R..........R.........RR', //  5
  'RR....................................RR', //  6
  'RR....................................RR', //  7
  'RRRRRRRR..............................RR', //  8  entrance shelf (cols 2-7)
  'RRRRRRRR..............................RR', //  9
  'RRRRRRRRRR.......................RRRRRRR', // 10  west step (cols 8-9) + alcove (cols 33-37)
  'RRRRRRRRRR.......................RRRRRRR', // 11
  'RRRRRRRRRRRR...................RRRRRRRRR', // 12  west step (cols 10-11) + east step (cols 31-32)
  'RRRRRRRRRRRR...................RRRRRRRRR', // 13
  'RRRRRRRRRRRRRR...............RRRRRRRRRRR', // 14  west step (cols 12-13) + east step (cols 29-30)
  'RRRRRRRRRRRRRR...............RRRRRRRRRRR', // 15
  'RRRRRRRRRRRRRRRRRRWWWWWWRRRRRRRRRRRRRRRR', // 16  FLOOR — pool at cols 18-23
  'RRRRRRRRRRRRRRRRRRWWWWWWRRRRRRRRRRRRRRRR', // 17
  'RRRRRRRRRRRRRRRRRRWWWWWWRRRRRRRRRRRRRRRR', // 18
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 19
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 20
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 21
] as const;

const SHELF_Y = 8 * TILE_SIZE;
const FLOOR_Y = 16 * TILE_SIZE;
const ALCOVE_Y = 10 * TILE_SIZE;

const RETURN_DOOR_X = 3 * TILE_SIZE + 8;

const GLOW_GROTTO_SPAWNS: SpawnPoint[] = [
  // On the shelf, two tiles right of the crack.
  { id: 'from-meadow', x: 5 * TILE_SIZE + 2, y: SHELF_Y - TILE_SIZE },
];

// The way through between the maze and the grotto: a tall, narrow crack in
// the rock, black inside, with the grotto's cyan showing at the back of it.
// 10 wide × 22 tall, base on y = 0 as every door's is. Exported because the
// meadow end of it is the same crack seen from the other side.
export function drawGrottoCrack(g: Graphics): void {
  const rock = DB32.opal;
  g.rect(-5, -20, 10, 20).fill(rock);
  g.rect(-3, -22, 6, 2).fill(rock);
  // The opening: wider at the foot, a jagged slot at the top.
  g.rect(-3, -16, 6, 16).fill(DB32.black);
  g.rect(-2, -19, 4, 3).fill(DB32.black);
  g.rect(-1, -21, 2, 2).fill(DB32.black);
  // Light from the far side.
  g.rect(-1, -12, 2, 1).fill(DB32.venice);
  g.rect(0, -8, 1, 4).fill(DB32.viking);
  g.rect(-2, -2, 4, 1).fill(DB32.venice);
  // Edge highlights on the rock.
  g.rect(-5, -20, 1, 20).fill(DB32.verdigris);
  g.rect(-3, -22, 6, 1).fill(DB32.verdigris);
}

// ---------------------------------------------------------------------------
// Landmark — the Spiral Ring, on the floor east of the pool.
// ---------------------------------------------------------------------------

// Glowcaps planted along a square spiral, outside in: the same glyph as the
// Marker's and the Throne's, laid out flat on the floor and seen edge-on, so
// what reads in the world is a row of caps of falling height with a gap where
// the coil turns.
const RING_CAPS: readonly (readonly [number, number])[] = [
  [-12, 7],
  [-8, 5],
  [-4, 8],
  [0, 4],
  [4, 6],
  [8, 9],
  [12, 5],
];

const GLOW_GROTTO_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'spiral-ring',
    x: 26 * TILE_SIZE,
    y: FLOOR_Y,
    name: 'Spiral Ring',
    description:
      'Glowcaps growing in a coil on the cave floor — too even to be chance. Walk round it and it is the spiral ' +
      'again, the one on the Marker and the Throne, drawn here in light by something that was never told it.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -6, radius: 18, color: DB32.viking });
      g.rect(-14, -1, 28, 1).fill(DB32.dell);
      for (const [x, h] of RING_CAPS) {
        g.rect(x, -h + 2, 1, h - 2).fill(DB32.lightSteel);
        g.rect(x - 1, -h, 3, 2).fill(DB32.viking);
        g.rect(x, -h, 1, 1).fill(DB32.white);
      }
    },
    drawSketch(g) {
      // The ring from above: a square spiral of caps, outside in.
      const cap = (x: number, y: number): void => {
        drawGlow(g, { x, y, radius: 5, color: DB32.viking });
        g.rect(x - 2, y - 2, 4, 4).fill(DB32.viking);
        g.rect(x - 1, y - 1, 1, 1).fill(DB32.white);
      };
      for (let i = -24; i <= 24; i += 8) cap(i, -24);
      for (let i = -16; i <= 24; i += 8) cap(24, i);
      for (let i = 16; i >= -24; i -= 8) cap(i, 24);
      for (let i = 16; i >= -8; i -= 8) cap(-24, i);
      for (let i = -16; i <= 8; i += 8) cap(i, -8);
      cap(8, 0);
      cap(8, 8);
      cap(0, 8);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — the grotto's flora.
// ---------------------------------------------------------------------------

const plantAt = (col: number, surfaceRow: number, species: FloraId): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: surfaceRow * TILE_SIZE,
  species,
  draw: PLANTS[species].draw,
});

const GLOW_GROTTO_DECORATIONS: DecorationSpec[] = [
  // Entrance shelf: a first glowcap by the crack, so the way back is lit.
  plantAt(6, 8, 'glowcap'),
  plantAt(4, 8, 'glow-moss'),
  // West slope.
  plantAt(9, 10, 'shelf-fungus'),
  plantAt(11, 12, 'glowcap'),
  // Floor, west of the pool.
  plantAt(14, 16, 'glow-moss'),
  plantAt(15, 16, 'glowcap'),
  plantAt(17, 16, 'glow-moss'),
  // Floor, east of the pool, round the ring.
  plantAt(24, 16, 'glow-moss'),
  plantAt(28, 16, 'glow-moss'),
  // East slope and the alcove.
  plantAt(30, 14, 'shelf-fungus'),
  plantAt(34, 10, 'glowcap'),
  plantAt(35, 10, 'glow-moss'),
  plantAt(36, 10, 'glowcap'),
  plantAt(37, 10, 'shelf-fungus'),
];

export const glowGrottoLevel: LevelSpec = {
  id: 'glow-grotto',
  name: 'The Glow Grotto',
  rows: GLOW_GROTTO_ROWS,
  spawns: GLOW_GROTTO_SPAWNS,
  defaultSpawnId: 'from-meadow',
  landmarks: GLOW_GROTTO_LANDMARKS,
  decorations: GLOW_GROTTO_DECORATIONS,
  parallax: 'keep',
  backdrop: 'crypt-black',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'grotto-return-door',
        x: RETURN_DOOR_X,
        y: SHELF_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-grotto',
        promptLabel: 'leave',
        drawBody: drawGrottoCrack,
      }),
      // Moths, each circling a glowcap: the one over the floor flies low
      // enough to walk into; the alcove's two keep their loops above a
      // standing head unless you jump.
      new Moth({ x: 15 * TILE_SIZE + 8, y: FLOOR_Y - 12, rx: 14, ry: 5, period: 3.2 }),
      new Moth({ x: 34 * TILE_SIZE + 8, y: ALCOVE_Y - 26, rx: 12, ry: 6, period: 2.7 }),
      new Moth({ x: 36 * TILE_SIZE + 8, y: ALCOVE_Y - 30, rx: 10, ry: 5, period: 3.6 }),
      new Moth({ x: 6 * TILE_SIZE + 8, y: SHELF_Y - 30, rx: 8, ry: 4, period: 2.9 }),
    ];
  },
};

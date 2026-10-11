import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import type { LandmarkSpec } from '@entities/landmark';
import { Owl } from '@entities/owl';
import { type FloraId, PLANTS } from '@entities/plants';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Cairn Observatory — the hill above the meadow, at night: the last place,
// where the spiral turns out to be the sky.
//
// 96 wide × 50 tall, and three ways round it that loop into each other:
//
//   Outside, west: from the foot of the hill (row 44, cols 0-16) a chimney of
//     granite ledges up the west face — cols 8-10 and 12-14, three rows
//     apart, a column of air between the two sides — to the shoulder (row 17),
//     then three crags (rows 14, 11, 8) up to the summit's cornice (row 5).
//   Inside: a cave mouth at the foot of the face (col 17) leads into a tunnel
//     and the hall (rows 34-41), where the Fallen Star lies. The hall's pool
//     drops under its east wall into a flooded shaft (cols 46-48) that rises
//     the height of the hill to a grotto under the summit (rows 13-16), and a
//     ladder climbs from the grotto through a hole in the summit (col 51).
//     The bottom of the shaft also runs east, flooded, to a basin.
//   Outside, east: from the summit, steps down to the ridge (row 17, cols
//     67-82) and the Watcher's Bothy; off the end of the ridge, a long drop to
//     the valley (row 44) and its tarn; a cave in the valley wall back to the
//     basin, the flooded tunnel and the shaft.
//
// Every jump is two rows up, or three with a column of air before the ledge
// and nothing overhead — a three-row jump onto a ledge that starts in the very
// next column puts the head under its corner. Checked with a port of the
// player's physics: every place is reachable from the gate, and the gate from
// every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . sky   h heath   p peat   g granite   W water   H ladder
const CAIRN_OBSERVATORY_ROWS = [
  '................................................................................................', //  0
  '................................................................................................', //  1
  '................................................................................................', //  2
  '................................................................................................', //  3
  '................................................................................................', //  4
  '............................hhhhhhhhhhhhhhhhhhhhhhhHhhhhh.......................................', //  5  SUMMIT (cols 28-56; cornice 28-31) — the ladder hole at col 51
  '............................ggggpppppppppppppppppppHppppp.......................................', //  6
  '................................pppppppppppppppppppHppppphh.....................................', //  7  east steps down: 57-58, 59-60, 61-62, 63-64, 65-66
  '.......................ggg......gggggggggggggggggggHgggggpp.....................................', //  8  crag (cols 23-25)
  '................................gggggggggggggggggggHgggggpphh...................................', //  9
  '................................gggggggggggggggggggHgggggggpp...................................', // 10
  '...........................ggg..gggggggggggggggggggHgggggggpphh.................................', // 11  crag (cols 27-29)
  '................................gggggggggggggggggggHgggggggggpp.................................', // 12
  '................................gggggggggg.........H.ggggggggpphh...............................', // 13  the grotto (rows 13-16, cols 42-52)
  '.......................ggg......gggggggggg.........H.ggggggggggpp...............................', // 14  crag (cols 23-25)
  '................................gggggggggg.........H.ggggggggggpphh.............................', // 15
  '................................gggggggggg.........H.ggggggggggggpp.............................', // 16
  '.............hhhhhhhhhhhhhhhhhhhggggggggggggggWWWggggggggggggggggpphhhhhhhhhhhhhhhh.............', // 17  SHOULDER (cols 13-31; cornice 13-16) + EAST RIDGE (cols 67-82) + top of the shaft
  '.............ggggpppppppppppppppggggggggggggggWWWggggggggggggggggggpppppppppppppppp.............', // 18
  '.................pppppppppppppppggggggggggggggWWWggggggggggggggggggpppppppppppppppp.............', // 19
  '........ggg......gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 20  west chimney: ledges at cols 8-10 and 12-14, three rows apart
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 21
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 22
  '............ggg..gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 23
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 24
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 25
  '........ggg......gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 26
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 27
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 28
  '............ggg..gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 29
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 30
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 31
  '...gggggggg......gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 32  the long west ledge (cols 3-10)
  '.................gggggggggggggggggggggggggggggWWWgggggggggggggggggggggggggggggggggg.............', // 33
  '.................gggggggggggggg..............gWWWgggggggggggggggggggggggggggggggggg.............', // 34  the hall (rows 34-41, cols 31-44)
  '............ggg..gggggggggggggg..............gWWWgggggggggggggggggggggggggggggggggg.............', // 35
  '.................gggggggggggggg..............gWWWgggggggggggggggggggggggggggggggggg.............', // 36
  '.................gggggggggggggg..............gWWWgggggggggggggggggggggggggggggggggg.............', // 37
  '........ggg......gggggggggggggg..............gWWWgggggggggggggggggggggggggggggggggg.............', // 38
  '.................gggggggggggggg..............gWWWgggggggggggggggggggggggggggggggggg.............', // 39
  '.............................................gWWWgggggggggggggggggggggggggggggggggg.............', // 40  west tunnel (rows 40-43) from the mouth at col 17
  '............ggg..............................gWWWggggggggggggg..................................', // 41  east tunnel (rows 41-43, cols 62-82) to the valley
  '...............................ggggggggggWWWWWWWWggggggggggggg..................................', // 42  hall floor (cols 31-40) + hall pool (cols 41-45)
  '...............................ggggggggggWWWWWWWWggggggggggggg..................................', // 43
  'hhhhhhhhhhhhhhhhhggggggggggggggggggggggggWWWWWWWWgggggggggggggWWWWggggggggggggggggghhhWWWWWWhhhh', // 44  WEST FOOT (cols 0-16) + basin (cols 62-65) + EAST VALLEY (cols 83-95) and tarn (86-91)
  'pppppppppppppppppggggggggggggggggggggggggWWWWWWWWgggggggggggggWWWWgggggggggggggggggpppWWWWWWpppp', // 45
  'pppppppppppppppppgggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWgggggggggggggggggpppWWWWWWpppp', // 46  flooded tunnel (rows 46-48) from the shaft to the basin
  'ggggggggggggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWgggggggggggggggggggggggggggggg', // 47
  'ggggggggggggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWgggggggggggggggggggggggggggggg', // 48
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 49
] as const;

const FOOT_Y = 44 * TILE_SIZE;
const SUMMIT_Y = 5 * TILE_SIZE;
const SHOULDER_Y = 17 * TILE_SIZE;
const RIDGE_Y = 17 * TILE_SIZE;
const HALL_Y = 42 * TILE_SIZE;

const RETURN_DOOR_X = 3 * TILE_SIZE + 8;

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

// A dead thorn tree, bent by the wind toward the east. 16 wide × 26 tall.
function drawThornTree(g: Graphics): void {
  const bark = 0x4a3c44;
  g.rect(-1, -14, 3, 14).fill(bark);
  g.rect(1, -18, 2, 4).fill(bark);
  g.rect(3, -22, 2, 4).fill(bark);
  g.rect(5, -24, 3, 2).fill(bark);
  g.rect(-5, -12, 4, 1).fill(bark);
  g.rect(-7, -14, 2, 2).fill(bark);
  g.rect(3, -15, 5, 1).fill(bark);
  g.rect(7, -18, 1, 3).fill(bark);
  g.rect(-1, -14, 1, 14).fill(DB32.topaz);
}

// ---------------------------------------------------------------------------
// Landmarks — the Sighting Stone on the summit, the Fallen Star in the hall,
// the Watcher's Bothy on the ridge.
// ---------------------------------------------------------------------------

const SPIRAL_CORNERS: readonly (readonly [number, number])[] = [
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

const CAIRN_OBSERVATORY_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'sighting-stone',
    x: 44 * TILE_SIZE + 8,
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
      for (let i = 0; i + 1 < SPIRAL_CORNERS.length; i++) {
        const [ax, ay] = SPIRAL_CORNERS[i];
        const [bx, by] = SPIRAL_CORNERS[i + 1];
        const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let s = 2; s < steps; s += 3) {
          const px = Math.round(ax + ((bx - ax) * s) / steps);
          const py = Math.round(ay + ((by - ay) * s) / steps);
          g.rect(px, py, 1, 1).fill(DB32.royalBlue);
        }
      }
      for (const [x, y] of SPIRAL_CORNERS) {
        g.rect(x - 1, y, 3, 1).fill(DB32.heather);
        g.rect(x, y - 1, 1, 3).fill(DB32.heather);
        g.rect(x, y, 1, 1).fill(DB32.white);
      }
    },
  },
  {
    id: 'fallen-star',
    x: 35 * TILE_SIZE + 8,
    y: HALL_Y,
    name: 'Fallen Star',
    description:
      'A lump of black, pitted stone in a shallow dish of rock it made when it landed, still faintly warm. ' +
      'It is heavier than any stone that size should be, and in the dark it gives off the same cold blue ' +
      'as the brightest stars overhead. Whoever carved the spiral had held one of these.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -5, radius: 14, color: DB32.cornflower });
      // The dish it made.
      g.rect(-11, -1, 22, 1).fill(0x58627a);
      g.rect(-9, -2, 3, 1).fill(0x58627a);
      g.rect(6, -2, 3, 1).fill(0x58627a);
      // The stone: pitted, with blue-white glints.
      g.rect(-5, -8, 10, 7).fill(0x1a1a24);
      g.rect(-4, -9, 7, 1).fill(0x1a1a24);
      g.rect(-6, -6, 1, 4).fill(0x1a1a24);
      g.rect(-3, -7, 2, 1).fill(0x3b4354);
      g.rect(1, -4, 2, 1).fill(0x3b4354);
      g.rect(-2, -8, 1, 1).fill(DB32.lightSteel);
      g.rect(3, -6, 1, 1).fill(DB32.cornflower);
      g.rect(-4, -3, 1, 1).fill(DB32.cornflower);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 30, color: DB32.cornflower });
      g.rect(-28, 18, 56, 3).fill(DB32.dimGray);
      g.rect(-20, -16, 40, 32).fill(0x1a1a24);
      g.rect(-16, -20, 30, 4).fill(0x1a1a24);
      g.rect(-24, -8, 4, 20).fill(0x1a1a24);
      for (const [x, y, w] of [
        [-12, -10, 6],
        [4, 2, 8],
        [-6, 8, 4],
        [8, -14, 4],
      ] as const) {
        g.rect(x, y, w, 3).fill(0x3b4354);
      }
      g.rect(-8, -14, 2, 2).fill(DB32.white);
      g.rect(12, -4, 2, 2).fill(DB32.cornflower);
      g.rect(-16, 4, 2, 2).fill(DB32.cornflower);
    },
  },
  {
    id: 'watchers-bothy',
    x: 75 * TILE_SIZE + 8,
    y: RIDGE_Y,
    name: "Watcher's Bothy",
    description:
      'A drystone hut on the ridge, one room, the roof long gone. Someone kept watch from here, night after ' +
      'night: the doorpost is scored with notches in rows of five, too many to count, and the hearth faces ' +
      'not the fire but the open sky to the east.',
    drawBody(g) {
      const stone = 0x58627a;
      const stoneLo = 0x3b4354;
      // Walls, with the rubble line of a fallen roof.
      g.rect(-20, -22, 40, 22).fill(stone);
      g.rect(-20, -24, 12, 2).fill(stone);
      g.rect(10, -26, 10, 4).fill(stone);
      for (let row = 0; row < 5; row++) {
        for (let i = 0; i < 6; i++) {
          g.rect(-20 + i * 7 + (row & 1) * 3, -4 - row * 4, 6, 1).fill(stoneLo);
        }
      }
      // The doorway, dark, and its scored post.
      g.rect(-4, -16, 9, 16).fill(DB32.black);
      g.rect(-6, -16, 2, 16).fill(DB32.heather);
      for (let i = 0; i < 6; i++) g.rect(-6, -15 + i * 2, 2, 1).fill(DB32.valhalla);
      // A gap in the east wall where the stars show.
      g.rect(13, -16, 3, 4).fill(0x0c0b1a);
      g.rect(14, -15, 1, 1).fill(DB32.white);
    },
    drawSketch(g) {
      // The doorpost, close up: tallies in fives, row after row.
      g.rect(-10, -30, 20, 60).fill(DB32.heather);
      g.rect(-10, -30, 2, 60).fill(DB32.lightSteel);
      for (let row = 0; row < 8; row++) {
        for (let i = 0; i < 4; i++) g.rect(-6 + i * 3, -26 + row * 7, 1, 5).fill(DB32.valhalla);
        g.rect(-7, -24 + row * 7, 12, 1).fill(DB32.valhalla);
      }
      g.rect(14, -30, 16, 60).fill(0x0c0b1a);
      g.rect(20, -12, 1, 1).fill(DB32.white);
      g.rect(24, 6, 1, 1).fill(DB32.white);
      g.rect(17, 18, 1, 1).fill(DB32.heather);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — waymarks, the stone ring, thorns, heather.
// ---------------------------------------------------------------------------

const at = (col: number, surfaceRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: surfaceRow * TILE_SIZE,
  draw,
});

const plant = (col: number, surfaceRow: number, species: FloraId): DecorationSpec => ({
  ...at(col, surfaceRow, PLANTS[species].draw),
  species,
});

const CAIRN_OBSERVATORY_DECORATIONS: DecorationSpec[] = [
  // The foot of the hill.
  plant(10, 44, 'pine-tree'),
  plant(13, 44, 'heather'),
  at(15, 44, drawWaymark),
  // The long west ledge, a resting place half way up the chimney.
  plant(4, 32, 'heather'),
  at(6, 32, drawThornTree),
  // The shoulder.
  at(18, 17, drawWaymark),
  plant(24, 17, 'heather'),
  at(28, 17, drawThornTree),
  // The summit: the stone ring round the Sighting Stone, and a cairn on the
  // cornice.
  at(30, 5, drawWaymark),
  at(39, 5, drawStandingStone),
  at(49, 5, drawStandingStone),
  plant(36, 5, 'heather'),
  plant(54, 5, 'heather'),
  // The ridge.
  at(68, 17, drawWaymark),
  plant(71, 17, 'heather'),
  at(80, 17, drawThornTree),
  // The valley.
  plant(84, 44, 'heather'),
  plant(93, 44, 'heather'),
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
  // Inside the hill the backdrop is pure black — the caves are lit by nothing
  // but the Fallen Star — and only inside it: the chimney and the valley are
  // open sky, so the backdrop covers the caves and nothing else.
  backdrop: 'crypt-black',
  rockBgStartRow: CAIRN_OBSERVATORY_ROWS.length,
  backdropRegions: [
    { col: 17, row: 33, cols: 29, rows: 14 }, // west tunnel, hall and its pool
    { col: 41, row: 12, cols: 13, rows: 37 }, // grotto and the flooded shaft
    { col: 51, row: 5, cols: 1, rows: 8 }, // the ladder's chimney
    { col: 49, row: 40, cols: 34, rows: 9 }, // flooded tunnel, basin, east tunnel
  ],
  openSky: true,
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
      new Owl({ x: 22 * TILE_SIZE + 8, y: SHOULDER_Y }),
      new Owl({ x: 8 * TILE_SIZE + 8, y: 32 * TILE_SIZE }),
      new Owl({ x: 79 * TILE_SIZE + 8, y: RIDGE_Y }),
    ];
  },
};

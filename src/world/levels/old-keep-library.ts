import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { Bookworm } from '@entities/bookworm';
import { Cat } from '@entities/cat';
import { Chandelier } from '@entities/chandelier';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { Moth } from '@entities/moth';
import { Mouse } from '@entities/mouse';
import { Owl } from '@entities/owl';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Library — behind the bookshelf on the keep's upper floor, a whole
// building of books.
//
// 120 wide × 100 tall. Floor by floor:
//
//   The archives (rows 88-97, floor 98) — under the hall: islands of stacks,
//     mice, moths round the candles. A book chute (cols 110-111) drops you
//     in from the hall; a ladder (col 70) climbs back.
//   The reading hall (floor 86) — the door back through the bookshelf, the
//     desks, chandeliers, the library cat.
//   The first gallery (floor 70) — up the ladder at col 20, or up the
//     staircase of bookcases (cols 90-103) that climbs the open atrium; its
//     steps float, so the hall runs on underneath them to the chute.
//   The second gallery (floor 54) — three rolling ladders up to it (cols 16,
//     60, 112); the Great Globe; and at its west end a wall of shelves with a
//     crawlway behind it, one row high, to a reading nook.
//   The third gallery (floor 38) — up the grand staircase of shelves (cols
//     22-35), two rows a step; the First Account on its lectern.
//   The dome (floor 22) — two ladders up through its floor (cols 60, 80), a
//     gallery ring reached by ladder each side, the Orrery, bats in the roof.
//
// Every climb is a ladder, two rows a step, or three with a column of air —
// and a floating floor is never reached from a step in the very next column:
// collision starts a pixel below the head, so the first frame of such a jump
// slips under the floor's edge.
// Checked with a port of the player's physics: every place is reachable from
// the door, and the door from every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   B CastleBrick   F CastleFloor   L Bookcase   H Ladder   T timber
const OLD_KEEP_LIBRARY_ROWS = [
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  0
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  1
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.....................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  2  the dome's lantern (rows 2-3, cols 50-70)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.....................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  3
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  4  the dome (rows 4-21, cols 38-82)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  5
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  6
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  7
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  8
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  9
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 10
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 11
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 12
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 13
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 14
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 15
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 16
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..TTTTTTTH.........................HTTTTTTT..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 17  the dome's gallery ring (cols 40-46, 74-80), a ladder up to each (cols 47, 73)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.........H.........................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 18
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.........H.........................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 19
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.........H.........................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 20
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.........H...........L.L...........H.....L.L.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 21
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBFFFFFFFFFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFHFFBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 22  THE DOME FLOOR (cols 38-82), ladders through it at cols 60 and 80
  'BB..........................................................H...................H.....................................BB', // 23
  'BB..........................................................H...................H.....................................BB', // 24
  'BB..........................................................H...................H.....................................BB', // 25
  'BB..........................................................H...................H.....................................BB', // 26
  'BB..........................................................H...................H.....................................BB', // 27
  'BB..........................................................H...................H.....................................BB', // 28
  'BB..........................................................H...................H.....................................BB', // 29
  'BB..........................................................H...................H.....................................BB', // 30
  'BB..........................................................H...................H.....................................BB', // 31
  'BB..........................................................H...................H.....................................BB', // 32
  'BB..........................................................H...................H.....................................BB', // 33
  'BB..........................................................H...................H.....................................BB', // 34
  'BB..........................................................H...................H.....................................BB', // 35
  'BB..........................................................H...................H.....................................BB', // 36
  'BB..........................................................H...................H.....................................BB', // 37
  'BB...................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF......................BB', // 38  THE THIRD GALLERY (cols 37-95)
  'BB....................................................................................................................BB', // 39
  'BB................................LL..................................................................................BB', // 40  the grand staircase of shelves (cols 22-35), two rows a step
  'BB................................LL..................................................................................BB', // 41
  'BB..............................LLLL..................................................................................BB', // 42
  'BB..............................LLLL..................................................................................BB', // 43
  'BB............................LLLLLL..................................................................................BB', // 44
  'BB............................LLLLLL..................................................................................BB', // 45
  'BB..........................LLLLLLLL..................................................................................BB', // 46
  'BB..........................LLLLLLLL..................................................................................BB', // 47
  'BBLLLLLLLLLLL.............LLLLLLLLLL..................................................................................BB', // 48  the wall of shelves (cols 2-12) with the nook (rows 49-52) and the crawlway (row 53) behind it
  'BBL....LLLLLL.............LLLLLLLLLL..................................................................................BB', // 49
  'BBL....LLLLLL...........LLLLLLLLLLLL..................................................................................BB', // 50
  'BBL....LLLLLL...........LLLLLLLLLLLL..................................................................................BB', // 51
  'BBL....LLLLLL.........LLLLLLLLLLLLLL..................................................................................BB', // 52
  'BBL............L.L....LLLLLLLLLLLLLL.......................L.L.................................................L.L....BB', // 53
  'BBFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFBB', // 54  THE SECOND GALLERY, rolling ladders at cols 16, 60 and 112
  'BB..............H...........................................H...................................................H.....BB', // 55
  'BB..............H...........................................H...................................................H.....BB', // 56
  'BB..............H...........................................H...................................................H.....BB', // 57
  'BB..............H...........................................H...................................................H.....BB', // 58
  'BB..............H...........................................H...................................................H.....BB', // 59
  'BB..............H...........................................H...................................................H.....BB', // 60
  'BB..............H...........................................H...................................................H.....BB', // 61
  'BB..............H...........................................H...................................................H.....BB', // 62
  'BB..............H...........................................H...................................................H.....BB', // 63
  'BB..............H...........................................H...................................................H.....BB', // 64
  'BB..............H...........................................H...................................................H.....BB', // 65
  'BB..............H...........................................H...................................................H.....BB', // 66
  'BB..............H...........................................H...................................................H.....BB', // 67
  'BB..............H...........................................H...................................................H.....BB', // 68
  'BB..............H..L.L......................................H...................................................H.....BB', // 69
  'BBFFFFFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..................FFFFFFFFFFFFFFBB', // 70  THE FIRST GALLERY (cols 2-85, 104-117) either side of the atrium; its ladder at col 20
  'BB..................H.................................................................................LL..............BB', // 71
  'BB..................H.................................................................................LL..............BB', // 72  the staircase of bookcases up the atrium (cols 90-105)
  'BB..................H...............................................................................LL................BB', // 73
  'BB..................H...............................................................................LL................BB', // 74
  'BB..................H.............................................................................LL..................BB', // 75
  'BB..................H.............................................................................LL..................BB', // 76
  'BB..................H...........................................................................LL....................BB', // 77
  'BB..................H...........................................................................LL....................BB', // 78
  'BB..................H.........................................................................LL......................BB', // 79
  'BB..................H.........................................................................LL......................BB', // 80
  'BB..................H.......................................................................LL........................BB', // 81
  'BB..................H.......................................................................LL........................BB', // 82
  'BB..................H.....................................................................LL..........................BB', // 83
  'BB..................H.....................................................................LL..........................BB', // 84
  'BB..................H................................................L.L..............................................BB', // 85  shelf ends either side of the archive ladder (cols 69, 71)
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..FFFFFFBB', // 86  THE READING HALL — the archive ladder at col 70, the book chute at cols 110-111
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..BBBBBBBB', // 87
  'BB....................................................................H...............................................BB', // 88  the archives (rows 88-97, floor 98) and their stacks
  'BB....................................................................H...............................................BB', // 89
  'BB....................................................................H...............................................BB', // 90
  'BB....................................................................H...............................................BB', // 91
  'BB....................................................................H...............................................BB', // 92
  'BB....................................................................H...............................................BB', // 93
  'BB..............................LLL...................................H...............................................BB', // 94
  'BB....................................................................H...............................................BB', // 95
  'BB........LLLLL...............LLLLL...............LLLLL...............H...........LLLLL........LLLLL..................BB', // 96
  'BB........LLLLL...............LLLLL...............LLLLL...............H...........LLLLL........LLLLL..................BB', // 97
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 98
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 99
] as const;

const T = TILE_SIZE;
const HALL_Y = 86 * T;
const FIRST_Y = 70 * T;
const SECOND_Y = 54 * T;
const THIRD_Y = 38 * T;
const DOME_Y = 22 * T;
const ARCHIVE_Y = 98 * T;

const RETURN_DOOR_X = 3 * T + 8;

const OLD_KEEP_LIBRARY_SPAWNS: SpawnPoint[] = [
  // Just clear of the bookshelf door's zone.
  { id: 'from-keep', x: 4 * T + 4, y: HALL_Y - T },
];

// The way through: the keep's bookshelf, swung out from the wall on a hinge,
// with the dark of the passage behind it. Used on both sides of the passage
// — the keep draws the shelf, the library draws it from the back. 14 wide ×
// 22 tall, base on y = 0.
export function drawSwungBookshelf(g: Graphics): void {
  g.rect(-7, -22, 14, 22).fill(DB32.black);
  g.rect(-7, -22, 14, 1).fill(DB32.dimGray);
  g.rect(-7, -22, 4, 22).fill(DB32.oiledCedar);
  g.rect(-7, -22, 1, 22).fill(DB32.rope);
  for (const y of [-20, -14, -8, -2]) g.rect(-6, y, 3, 1).fill(DB32.rope);
  g.rect(-4, -18, 1, 3).fill(DB32.clairvoyant);
  g.rect(-4, -12, 1, 3).fill(DB32.eltGreen);
  g.rect(3, -6, 1, 1).fill(DB32.goldenFizz);
}

// ---------------------------------------------------------------------------
// Landmarks — the First Account on the third gallery, the Great Globe on the
// second, the Orrery in the dome.
// ---------------------------------------------------------------------------

const OLD_KEEP_LIBRARY_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'first-account',
    x: 66 * T + 8,
    y: THIRD_Y,
    name: 'First Account',
    description:
      'The one book in the room that is not shelved, left open on a lectern. On the first page, drawn in brown ' +
      'ink, the spiral; under it, in a careful hand: "We did not make this. We found it wherever we looked, and ' +
      'we have written down where." The pages after are a list of places — the meadow, the keep, the crypt — ' +
      'and the last entry is a hill above them all, with a single word beside it: look up.',
    drawBody(g) {
      const wood = DB32.oiledCedar;
      const woodHi = DB32.rope;
      g.rect(-5, -2, 10, 2).fill(wood);
      g.rect(-1, -12, 2, 10).fill(wood);
      g.rect(-1, -12, 1, 10).fill(woodHi);
      g.rect(-7, -15, 14, 3).fill(wood);
      g.rect(-7, -15, 14, 1).fill(woodHi);
      g.rect(-6, -18, 6, 3).fill(DB32.pancho);
      g.rect(0, -18, 6, 3).fill(DB32.pancho);
      g.rect(-1, -18, 1, 3).fill(DB32.twine);
      g.rect(-5, -17, 3, 1).fill(DB32.rope);
      g.rect(-5, -17, 1, 2).fill(DB32.rope);
      for (const y of [-17, -16]) g.rect(1, y, 4, 1).fill(DB32.twine);
    },
    drawSketch(g) {
      const page = DB32.white;
      const ink = DB32.rope;
      g.rect(-30, -20, 29, 40).fill(page);
      g.rect(1, -20, 29, 40).fill(page);
      g.rect(-1, -20, 2, 40).fill(DB32.twine);
      g.rect(-30, 19, 60, 1).fill(DB32.twine);
      g.rect(-24, -14, 18, 2).fill(ink);
      g.rect(-24, -14, 2, 18).fill(ink);
      g.rect(-24, 2, 16, 2).fill(ink);
      g.rect(-10, -8, 2, 12).fill(ink);
      g.rect(-18, -8, 10, 2).fill(ink);
      g.rect(-18, -8, 2, 6).fill(ink);
      for (let i = 0; i < 6; i++) g.rect(6, -14 + i * 5, 14 + ((i * 7) % 9), 1).fill(DB32.valhalla);
      g.rect(6, 14, 10, 1).fill(DB32.valhalla);
      g.rect(20, 12, 3, 3).fill(DB32.valhalla);
    },
  },
  {
    id: 'great-globe',
    x: 92 * T,
    y: SECOND_Y,
    name: 'Great Globe',
    description:
      'A globe taller than you are, in a brass ring on a cradle of carved wood. The seas are painted, the ' +
      'coasts are careful — and the land in the middle of them is blank, except for one small spiral, inked ' +
      'in by hand, much later than the rest.',
    drawBody(g) {
      g.rect(-8, -2, 16, 2).fill(DB32.oiledCedar);
      g.rect(-1, -8, 2, 6).fill(DB32.oiledCedar);
      for (let dy = -12; dy <= 12; dy++) {
        const half = Math.round(Math.sqrt(144 - dy * dy));
        g.rect(-half, -20 + dy, half * 2 + 1, 1).fill(DB32.venice);
      }
      g.rect(-5, -26, 6, 4).fill(DB32.pancho);
      g.rect(2, -18, 7, 5).fill(DB32.pancho);
      g.rect(-9, -16, 5, 4).fill(DB32.pancho);
      g.rect(3, -17, 2, 2).fill(DB32.valhalla);
      g.rect(-13, -21, 1, 3).fill(DB32.goldenFizz);
      g.rect(12, -21, 1, 3).fill(DB32.goldenFizz);
      g.rect(-1, -33, 2, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      for (let dy = -26; dy <= 26; dy++) {
        const half = Math.round(Math.sqrt(26 * 26 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(DB32.venice);
      }
      g.rect(-14, -18, 16, 10).fill(DB32.pancho);
      g.rect(4, 2, 16, 12).fill(DB32.pancho);
      g.rect(-22, 4, 10, 8).fill(DB32.pancho);
      g.rect(8, 5, 6, 1).fill(DB32.valhalla);
      g.rect(8, 5, 1, 4).fill(DB32.valhalla);
      g.rect(8, 8, 5, 1).fill(DB32.valhalla);
      g.rect(12, 6, 1, 2).fill(DB32.valhalla);
      g.rect(-28, -2, 2, 6).fill(DB32.goldenFizz);
      g.rect(26, -2, 2, 6).fill(DB32.goldenFizz);
    },
  },
  {
    id: 'orrery',
    x: 54 * T,
    y: DOME_Y,
    name: 'Orrery',
    description:
      'A brass machine under the dome: balls on arms on arms, every one of them a star, and a crank to set ' +
      'it turning. Turned, it does not make circles. It winds the stars inward, round and round, into the ' +
      'spiral — the sky from the hill, worked out in brass by someone who had stood there.',
    drawBody(g) {
      const brass = DB32.rainforest;
      const brassHi = DB32.goldenFizz;
      g.rect(-6, -2, 12, 2).fill(brass);
      g.rect(-1, -24, 2, 22).fill(brass);
      g.rect(-14, -24, 28, 1).fill(brass);
      g.rect(-10, -16, 20, 1).fill(brass);
      g.rect(-14, -24, 1, 4).fill(brass);
      g.rect(13, -24, 1, 6).fill(brass);
      g.rect(-10, -16, 1, 3).fill(brass);
      g.rect(9, -16, 1, 5).fill(brass);
      g.rect(-2, -27, 4, 3).fill(brassHi);
      for (const [x, y] of [
        [-15, -20],
        [12, -18],
        [-11, -13],
        [8, -11],
      ] as const) {
        g.rect(x, y, 3, 3).fill(DB32.lightSteel);
        g.rect(x, y, 1, 1).fill(DB32.white);
      }
    },
    drawSketch(g) {
      const brass = DB32.rainforest;
      g.rect(-2, -30, 4, 56).fill(brass);
      g.rect(-24, 24, 48, 4).fill(brass);
      for (const [r, a] of [
        [28, 0.4],
        [20, 2.2],
        [13, 3.9],
        [7, 5.4],
      ] as const) {
        const x = Math.round(Math.cos(a) * r);
        const y = Math.round(Math.sin(a) * r) - 4;
        g.rect(Math.min(0, x), -4, Math.abs(x), 2).fill(brass);
        g.rect(x - 3, y - 3, 6, 6).fill(DB32.lightSteel);
        g.rect(x - 3, y - 3, 2, 2).fill(DB32.white);
      }
      g.rect(-5, -36, 10, 6).fill(DB32.goldenFizz);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations.
// ---------------------------------------------------------------------------

// A reading desk with a stool, an open book and a stack beside. 20 wide × 14
// tall, base on y = 0.
function drawReadingDesk(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const woodHi = DB32.rope;
  g.rect(-9, -9, 2, 9).fill(wood);
  g.rect(5, -9, 2, 9).fill(wood);
  g.rect(-10, -10, 18, 2).fill(woodHi);
  g.rect(-10, -9, 18, 1).fill(wood);
  g.rect(-6, -12, 7, 2).fill(DB32.pancho);
  g.rect(-3, -12, 1, 2).fill(DB32.twine);
  g.rect(3, -13, 4, 1).fill(DB32.clairvoyant);
  g.rect(3, -12, 4, 1).fill(DB32.venice);
  g.rect(4, -14, 3, 1).fill(DB32.eltGreen);
  g.rect(9, -6, 4, 1).fill(woodHi);
  g.rect(9, -5, 1, 5).fill(wood);
  g.rect(12, -5, 1, 5).fill(wood);
}

// A tall arched window in the hall's wall, night outside it: 32 wide × 80
// tall, a moon in the top pane. Base on the floor.
function drawTallWindow(g: Graphics): void {
  g.rect(-16, -80, 32, 72).fill(DB32.dimGray);
  g.rect(-12, -88, 24, 8).fill(DB32.dimGray);
  g.rect(-13, -78, 26, 68).fill(0x141228);
  g.rect(-9, -85, 18, 7).fill(0x141228);
  g.rect(-1, -86, 2, 76).fill(DB32.dimGray);
  g.rect(-13, -46, 26, 2).fill(DB32.dimGray);
  g.rect(4, -72, 5, 5).fill(DB32.pancho);
  g.rect(3, -73, 2, 3).fill(0x141228);
  for (const [x, y] of [
    [-9, -66],
    [-5, -38],
    [8, -30],
    [-10, -22],
  ] as const) {
    g.rect(x, y, 1, 1).fill(DB32.white);
  }
  g.rect(-18, -10, 36, 2).fill(DB32.heather);
}

// A pile of books on the floor, 18 wide.
function drawBookPile(g: Graphics): void {
  for (const [x, y, w, c] of [
    [-9, -3, 16, DB32.clairvoyant],
    [-7, -6, 14, DB32.venice],
    [-8, -9, 12, DB32.eltGreen],
    [-5, -12, 10, DB32.tahitiGold],
  ] as const) {
    g.rect(x, y, w, 3).fill(c);
    g.rect(x, y, w, 1).fill(DB32.pancho);
  }
}

const at = (col: number, surfaceRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * T + 8,
  y: surfaceRow * T,
  draw,
});

const OLD_KEEP_LIBRARY_DECORATIONS: DecorationSpec[] = [
  // The reading hall.
  at(12, 86, drawTallWindow),
  at(46, 86, drawTallWindow),
  at(78, 86, drawTallWindow),
  at(30, 86, drawReadingDesk),
  at(56, 86, drawReadingDesk),
  at(64, 86, drawBookPile),
  // The galleries.
  at(36, 70, drawReadingDesk),
  at(74, 70, drawBookPile),
  at(110, 70, drawReadingDesk),
  at(40, 54, drawReadingDesk),
  at(70, 54, drawBookPile),
  at(4, 54, drawBookPile),
  at(80, 38, drawReadingDesk),
  at(45, 38, drawBookPile),
  // The archives.
  at(20, 98, drawBookPile),
  at(64, 98, drawBookPile),
  at(100, 98, drawBookPile),
];

export const oldKeepLibraryLevel: LevelSpec = {
  id: 'old-keep-library',
  name: 'The Library',
  rows: OLD_KEEP_LIBRARY_ROWS,
  spawns: OLD_KEEP_LIBRARY_SPAWNS,
  defaultSpawnId: 'from-keep',
  landmarks: OLD_KEEP_LIBRARY_LANDMARKS,
  decorations: OLD_KEEP_LIBRARY_DECORATIONS,
  parallax: 'keep',
  // Books all the way up the back wall, not a black void.
  backdrop: 'library',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'library-return-door',
        x: RETURN_DOOR_X,
        y: HALL_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-library',
        promptLabel: 'go back',
        drawBody: drawSwungBookshelf,
      }),
      // Light: candles on every floor, chandeliers under the galleries.
      new TallCandle(8 * T + 8, HALL_Y),
      new TallCandle(66 * T + 8, HALL_Y),
      new TallCandle(100 * T + 8, HALL_Y),
      new TallCandle(28 * T + 8, FIRST_Y),
      new TallCandle(80 * T + 8, FIRST_Y),
      new TallCandle(50 * T + 8, SECOND_Y),
      new TallCandle(104 * T + 8, SECOND_Y),
      new TallCandle(74 * T + 8, THIRD_Y),
      new TallCandle(40 * T + 8, ARCHIVE_Y),
      new TallCandle(90 * T + 8, ARCHIVE_Y),
      new Chandelier(34 * T, 71 * T),
      new Chandelier(64 * T, 71 * T),
      new Chandelier(46 * T, 55 * T),
      new Chandelier(76 * T, 39 * T),
      new Chandelier(60 * T, 2 * T),
      // The library cats, asleep.
      new Cat({ x: 40 * T, y: HALL_Y }),
      new Cat({ x: 68 * T, y: DOME_Y }),
      // Bookworms on the archive stacks.
      new Bookworm({ x: 12 * T, y: 96 * T, minX: 10 * T + 4, maxX: 15 * T - 4 }),
      new Bookworm({ x: 52 * T, y: 96 * T, minX: 50 * T + 4, maxX: 55 * T - 4 }),
      new Bookworm({ x: 84 * T, y: 96 * T, minX: 82 * T + 4, maxX: 87 * T - 4 }),
      // Owls: the librarians.
      new Owl({ x: 90 * T, y: THIRD_Y }),
      new Owl({ x: 43 * T, y: 17 * T }),
      new Owl({ x: 115 * T, y: FIRST_Y }),
      // Mice and moths in the archives.
      new Mouse({ x: 22 * T, y: ARCHIVE_Y, minX: 15 * T + 4, maxX: 29 * T }),
      new Mouse({ x: 64 * T, y: ARCHIVE_Y, minX: 56 * T, maxX: 69 * T }),
      new Moth({ x: 40 * T + 8, y: ARCHIVE_Y - 20, rx: 10, ry: 4, period: 2.9 }),
      new Moth({ x: 90 * T + 8, y: ARCHIVE_Y - 20, rx: 12, ry: 5, period: 3.3 }),
      // Bats in the dome's roof.
      new Bat({ x: 42 * T, y: 4 * T }),
      new Bat({ x: 78 * T, y: 4 * T }),
      new Bat({ x: 66 * T, y: 2 * T }),
    ];
  },
};

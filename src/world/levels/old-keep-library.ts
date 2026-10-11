import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Library — behind the bookshelf on the keep's upper floor, a room three
// storeys tall, lined with stacks.
//
// 30 wide × 28 tall (cols 0-1 and 28-29 are the walls). The first level built
// around ladders: a ladder tile is climbed by holding up or down on it, and
// leaving its top with upward speed pops the player onto the ledge it leans
// against (see Player).
//
//   Floor (row 25) — the door back through the bookshelf, a reading desk.
//   Stacks you can stand on: A (rows 20-24, cols 6-9) with its own short
//     ladder (col 5), and B (rows 18-24, cols 11-14), two tiles up from A
//     across a one-column gap. D under the gallery is just books.
//   The long ladder (col 15, rows 13-24) — from the floor, or a step off
//     stack B, up to the gallery.
//   Gallery (row 13, cols 16-27) — a second reading desk, and stack C
//     standing on it (rows 9-12, cols 23-26).
//   The loft ladder (col 21, rows 6-12) — from the gallery up to the loft
//     (row 6, cols 13-20), where the First Account lies open on its lectern.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   B CastleBrick   F CastleFloor   L Bookcase   H Ladder
const OLD_KEEP_LIBRARY_ROWS = [
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  0
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', //  1
  'BB..........................BB', //  2
  'BB..........................BB', //  3
  'BB..........................BB', //  4
  'BB..........................BB', //  5
  'BB...........FFFFFFFFH......BB', //  6  LOFT (cols 13-20) + top of the loft ladder (col 21)
  'BB...................H......BB', //  7
  'BB...................H......BB', //  8
  'BB...................H.LLLL.BB', //  9  stack C (cols 23-26)
  'BB...................H.LLLL.BB', // 10
  'BB...................H.LLLL.BB', // 11
  'BB...................H.LLLL.BB', // 12
  'BB.............HFFFFFFFFFFFFBB', // 13  GALLERY (cols 16-27) + top of the long ladder (col 15)
  'BB.............H............BB', // 14
  'BB.............H............BB', // 15
  'BB.............H............BB', // 16
  'BB.............H............BB', // 17
  'BB.........LLLLH............BB', // 18  stack B (cols 11-14)
  'BB.........LLLLH............BB', // 19
  'BB...HLLLL.LLLLH............BB', // 20  stack A (cols 6-9) + its ladder (col 5)
  'BB...HLLLL.LLLLH.....LLLL...BB', // 21  stack D (cols 21-24)
  'BB...HLLLL.LLLLH.....LLLL...BB', // 22
  'BB...HLLLL.LLLLH.....LLLL...BB', // 23
  'BB...HLLLL.LLLLH.....LLLL...BB', // 24
  'BBFFFFFFFFFFFFFFFFFFFFFFFFFFBB', // 25  FLOOR
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 26
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 27
] as const;

const FLOOR_Y = 25 * TILE_SIZE;
const GALLERY_Y = 13 * TILE_SIZE;
const LOFT_Y = 6 * TILE_SIZE;

const RETURN_DOOR_X = 3 * TILE_SIZE + 8;

const OLD_KEEP_LIBRARY_SPAWNS: SpawnPoint[] = [
  // Just clear of the bookshelf door's zone, at the foot of stack A's ladder.
  { id: 'from-keep', x: 4 * TILE_SIZE + 4, y: FLOOR_Y - TILE_SIZE },
];

// The way through: the keep's bookshelf, swung out from the wall on a hinge,
// with the dark of the passage behind it. Used on both sides of the passage
// — the keep draws the shelf, the library draws it from the back. 14 wide ×
// 22 tall, base on y = 0.
export function drawSwungBookshelf(g: Graphics): void {
  // The opening behind.
  g.rect(-7, -22, 14, 22).fill(DB32.black);
  g.rect(-7, -22, 14, 1).fill(DB32.dimGray);
  // The shelf, turned edge-on: a narrow slab of cedar down the left side,
  // with the ends of its shelves showing.
  g.rect(-7, -22, 4, 22).fill(DB32.oiledCedar);
  g.rect(-7, -22, 1, 22).fill(DB32.rope);
  for (const y of [-20, -14, -8, -2]) g.rect(-6, y, 3, 1).fill(DB32.rope);
  g.rect(-4, -18, 1, 3).fill(DB32.clairvoyant);
  g.rect(-4, -12, 1, 3).fill(DB32.eltGreen);
  // Candlelight from the far end of the passage.
  g.rect(3, -6, 1, 1).fill(DB32.goldenFizz);
}

// ---------------------------------------------------------------------------
// Landmark — the First Account, open on its lectern in the loft.
// ---------------------------------------------------------------------------

const OLD_KEEP_LIBRARY_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'first-account',
    x: 16 * TILE_SIZE + 8,
    y: LOFT_Y,
    name: 'First Account',
    description:
      'The one book in the room that is not shelved, left open on a lectern. On the first page, drawn in brown ' +
      'ink, the spiral; under it, in a careful hand: "We did not make this. We found it wherever we looked, and ' +
      'we have written down where." The pages after are a list of places — the meadow, the keep, the crypt — ' +
      'and the last entry is a hill above them all, with a single word beside it: look up.',
    drawBody(g) {
      const wood = DB32.oiledCedar;
      const woodHi = DB32.rope;
      // Lectern: foot, post, sloped desk.
      g.rect(-5, -2, 10, 2).fill(wood);
      g.rect(-1, -12, 2, 10).fill(wood);
      g.rect(-1, -12, 1, 10).fill(woodHi);
      g.rect(-7, -15, 14, 3).fill(wood);
      g.rect(-7, -15, 14, 1).fill(woodHi);
      // The open book, its two pages and the spiral on the left one.
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
      // Two pages, open.
      g.rect(-30, -20, 29, 40).fill(page);
      g.rect(1, -20, 29, 40).fill(page);
      g.rect(-1, -20, 2, 40).fill(DB32.twine);
      g.rect(-30, 19, 60, 1).fill(DB32.twine);
      // The spiral on the left page.
      g.rect(-24, -14, 18, 2).fill(ink);
      g.rect(-24, -14, 2, 18).fill(ink);
      g.rect(-24, 2, 16, 2).fill(ink);
      g.rect(-10, -8, 2, 12).fill(ink);
      g.rect(-18, -8, 10, 2).fill(ink);
      g.rect(-18, -8, 2, 6).fill(ink);
      // The list of places on the right, a line each, and the last one apart.
      for (let i = 0; i < 6; i++) g.rect(6, -14 + i * 5, 14 + ((i * 7) % 9), 1).fill(DB32.valhalla);
      g.rect(6, 14, 10, 1).fill(DB32.valhalla);
      g.rect(20, 12, 3, 3).fill(DB32.valhalla);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — reading desks.
// ---------------------------------------------------------------------------

// A reading desk with a stool, an open book and a candle stub. 20 wide × 14
// tall, base on y = 0.
function drawReadingDesk(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const woodHi = DB32.rope;
  // Legs and top.
  g.rect(-9, -9, 2, 9).fill(wood);
  g.rect(5, -9, 2, 9).fill(wood);
  g.rect(-10, -10, 18, 2).fill(woodHi);
  g.rect(-10, -9, 18, 1).fill(wood);
  // Book open on it, and a stack beside.
  g.rect(-6, -12, 7, 2).fill(DB32.pancho);
  g.rect(-3, -12, 1, 2).fill(DB32.twine);
  g.rect(3, -13, 4, 1).fill(DB32.clairvoyant);
  g.rect(3, -12, 4, 1).fill(DB32.venice);
  g.rect(4, -14, 3, 1).fill(DB32.eltGreen);
  // Stool.
  g.rect(9, -6, 4, 1).fill(woodHi);
  g.rect(9, -5, 1, 5).fill(wood);
  g.rect(12, -5, 1, 5).fill(wood);
}

const OLD_KEEP_LIBRARY_DECORATIONS: DecorationSpec[] = [
  { x: 18 * TILE_SIZE, y: FLOOR_Y, draw: drawReadingDesk },
  { x: 18 * TILE_SIZE, y: GALLERY_Y, draw: drawReadingDesk },
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
  backdrop: 'indoor-dark',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'library-return-door',
        x: RETURN_DOOR_X,
        y: FLOOR_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-library',
        promptLabel: 'go back',
        drawBody: drawSwungBookshelf,
      }),
      new TallCandle(25 * TILE_SIZE + 8, FLOOR_Y),
      new TallCandle(26 * TILE_SIZE + 8, GALLERY_Y),
      new TallCandle(14 * TILE_SIZE + 8, LOFT_Y),
    ];
  },
};

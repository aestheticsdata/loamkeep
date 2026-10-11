import { DB32, TILE_SIZE } from '@constants';
import { Bees } from '@entities/bees';
import { Bird } from '@entities/bird';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { FallingLeaf } from '@entities/falling-leaf';
import { Fireflies } from '@entities/fireflies';
import { Fish } from '@entities/fish';
import { Frog } from '@entities/frog';
import { Hedgehog } from '@entities/hedgehog';
import { Hen } from '@entities/hen';
import type { LandmarkSpec } from '@entities/landmark';
import { Mouse } from '@entities/mouse';
import { type FloraId, PLANTS } from '@entities/plants';
import { Pumpkin } from '@entities/pumpkin';
import { Snail } from '@entities/snail';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Kitchen Garden — the walled estate behind the keep, on an autumn
// evening. The pumpkins live here.
//
// 170 wide × 72 tall; the ground is row 56. West to east:
//
//   The beds (cols 8-27) — raised beds, the pumpkins, the Sundial, and the
//     shed: up the compost bin (three high) onto its roof.
//   The greenhouse (cols 38-56) — a ladder up its west side through a hole
//     in its roof; staging inside two rows apart; the roof runs on east as a
//     vine-hung pergola to the first apple tree.
//   The orchard (cols 60-99) — apple tree A's branches, three rows apart on
//     two sides, climb from the ground to the pergola's end; tree B is low.
//   The pond (cols 100-112) — frogs, fish, a flat stone in the middle.
//   The well (col 118) — a ladder down into the root cellar (rows 60-67):
//     shelves of jars, mice, the Seed Store; the hatch at col 148 back up.
//   The beehive meadow (cols 119-150) — hives, a scarecrow, and a puffball
//     that throws you up onto the hayrick.
//   The dovecote (cols 152-160) — doors east and west, a ladder up the
//     middle to the loft and the Dovecote landmark.
//   The east wall (cols 165-169) — a ladder up, sunflowers on top.
//
// Every jump is two rows up, or three with a column of air before the ledge
// and nothing overhead, or a puffball's eight. Checked with a port of the
// player's physics: every place is reachable from the keep's door, and the
// door from every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . sky   a autumn turf   D soil   B CastleBrick   F CastleFloor
//   T timber   H ladder   W water   U puffball
const KITCHEN_GARDEN_ROWS = [
  'BBBB......................................................................................................................................................................', //  0
  'BBBB......................................................................................................................................................................', //  1
  'BBBB......................................................................................................................................................................', //  2
  'BBBB......................................................................................................................................................................', //  3
  'BBBB......................................................................................................................................................................', //  4
  'BBBB......................................................................................................................................................................', //  5
  'BBBB......................................................................................................................................................................', //  6
  'BBBB......................................................................................................................................................................', //  7
  'BBBB......................................................................................................................................................................', //  8
  'BBBB......................................................................................................................................................................', //  9
  'BBBB......................................................................................................................................................................', // 10
  'BBBB......................................................................................................................................................................', // 11
  'BBBB......................................................................................................................................................................', // 12
  'BBBB......................................................................................................................................................................', // 13
  'BBBB......................................................................................................................................................................', // 14
  'BBBB......................................................................................................................................................................', // 15
  'BBBB......................................................................................................................................................................', // 16
  'BBBB...................................................................................................................................................BBBBBBBBBBB........', // 17  the dovecote's roof (cols 151-161)
  'BBBB....................................................................................................................................................B.......B.........', // 18
  'BBBB....................................................................................................................................................B.......B.........', // 19
  'BBBB....................................................................................................................................................B.................', // 20
  'BBBB....................................................................................................................................................B.................', // 21
  'BBBB....................................................................................................................................................B.......B.........', // 22
  'BBBB....................................................................................................................................................B.......B.........', // 23
  'BBBB....................................................................................................................................................BFFFHFFFB.........', // 24  the dovecote's loft floor (cols 153-159), its ladder at col 156
  'BBBB....................................................................................................................................................B...H...B.........', // 25
  'BBBB....................................................................................................................................................B...H...B.........', // 26
  'BBBB....................................................................................................................................................B...H...B.........', // 27
  'BBBB....................................................................................................................................................B...H...B.........', // 28
  'BBBB....................................................................................................................................................B...H...B.........', // 29
  'BBBB....................................................................................................................................................B...H...B.........', // 30
  'BBBB....................................................................................................................................................B...H...B.........', // 31
  'BBBB....................................................................................................................................................B...H...B.........', // 32
  'BBBB....................................................................................................................................................B...H...B.........', // 33
  'BBBB....................................................................................................................................................B...H...B.........', // 34
  'BBBB....................................................................................................................................................B...H...B.........', // 35
  'BBBB....................................................................................................................................................B...H...B.........', // 36
  'BBBB....................................................................................................................................................B...H...B.........', // 37
  'BBBB....................................................................................................................................................B...H...B.........', // 38
  'BBBB....................................................................................................................................................B...H...B.........', // 39
  'BBBB....................................................................................................................................................B...H...B.........', // 40
  'BBBB..................................THTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.TTT.............................................................................B...H...B.........', // 41  the greenhouse roof (cols 38-56), its ladder hole at col 39, and the pergola (cols 57-70); tree A's top branch
  'BBBB...................................H................................................................................................................B...H...B.........', // 42
  'BBBB...................................H................................................................................................................B...H...B.........', // 43
  'BBBB...................................H.....................................TTT........................................................................B...H...B.........', // 44
  'BBBB...................................H................................................................................................................B...H...B.........', // 45
  'BBBB...................................H................................................................................................................B...H...B.........', // 46
  'BBBB...................................H................................TTT.............................................................................B...H...B.........', // 47
  'BBBB...................................H..........................................................................................TTTTTT................B...H...B...HBBBBB', // 48  the hayrick (cols 130-135) and the top of the east wall (cols 165-169, its ladder at 164)
  'BBBB...................................H................................................................................................................B...H...B...HBBBBB', // 49
  'BBBB.........................TTTTTTT...H............TTTT.....................TTT........TTT.............................................................B...H...B...HBBBBB', // 50  the shed roof (cols 29-35); tree A and B branches; greenhouse staging
  'BBBB...................................H................................................................................................................B...H...B...HBBBBB', // 51
  'BBBB...................................H.......TTTT.........................................TTT.........................................................B...H...B...HBBBBB', // 52
  'BBBB......................TT...........H................................TTT.................................................................................H.......HBBBBB', // 53  the compost bin (cols 26-27, rows 53-55); tree A's lowest branch
  'BBBB......................TT...........H..TTTT..........................................TTT.................................................................H.......HBBBBB', // 54
  'BBBB......TTTTT...TTTTT...TT...........H.............................................................................B.B...........................T.T......H.......HBBBBB', // 55  raised beds (cols 10-14, 18-22); the well's lip (117, 119) and the hatch frame (147, 149)
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaWWWWWaaWWWWWWaaaaaHaaaaaaaaaUaaaaaaaaaaaaaaaaaaaHaaaaaaaaaaaaaaaaaaaaa', // 56  THE GROUND — the pond (cols 100-112) with its stone (105-106), the well (118), puffball (128), hatch (148)
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWWWWWDDWWWWWWDDDDDHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHDDDDDDDDDDDDDDDDDDDDD', // 57
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWWWWWDDWWWWWWDDDDDHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHDDDDDDDDDDDDDDDDDDDDD', // 58
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWWWWWDDWWWWWWDDDDDHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHDDDDDDDDDDDDDDDDDDDDD', // 59
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWWWWWDDWWWWWWD....H.............................H..DDDDDDDDDDDDDDDDDDD', // 60  the root cellar (rows 60-67, cols 114-150), shelves two rows apart
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H.............................H..DDDDDDDDDDDDDDDDDDD', // 61
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H...............TTTT..........H..DDDDDDDDDDDDDDDDDDD', // 62
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H.............................H..DDDDDDDDDDDDDDDDDDD', // 63
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H.........TTTT................H..DDDDDDDDDDDDDDDDDDD', // 64
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H.............................H..DDDDDDDDDDDDDDDDDDD', // 65
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H...TTTT......................H..DDDDDDDDDDDDDDDDDDD', // 66
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....H.............................H..DDDDDDDDDDDDDDDDDDD', // 67
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 68
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 69
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 70
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', // 71
] as const;

const T = TILE_SIZE;
const GROUND_Y = 56 * T;
const BED_Y = 55 * T;
const CELLAR_Y = 68 * T;
const LOFT_Y = 24 * T;

const RETURN_DOOR_X = 5 * T;
// The middle of the shed's door, 29 px left of the shed's own middle
// (32 * T + 8), where drawShed used to draw it.
const SHED_DOOR_X = 30 * T + 11;

const KITCHEN_GARDEN_SPAWNS: SpawnPoint[] = [
  { id: 'from-keep', x: 7 * T + 2, y: GROUND_Y - T },
  { id: 'from-shed', x: SHED_DOOR_X - 6, y: GROUND_Y - T },
];

// ---------------------------------------------------------------------------
// Landmarks — the Sundial between the beds, the Seed Store in the cellar,
// the Dovecote in its loft.
// ---------------------------------------------------------------------------

const KITCHEN_GARDEN_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'sundial',
    x: 16 * T + 8,
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
      g.rect(-5, -2, 10, 2).fill(stone);
      g.rect(-5, -2, 10, 1).fill(stoneHi);
      g.rect(-2, -10, 4, 8).fill(stone);
      g.rect(-2, -10, 1, 8).fill(stoneHi);
      g.rect(-7, -12, 14, 2).fill(stone);
      g.rect(-7, -12, 14, 1).fill(stoneHi);
      for (const x of [-6, -4, -1, 2, 5]) g.rect(x, -11, 1, 1).fill(ink);
      g.rect(0, -16, 1, 4).fill(DB32.rainforest);
      g.rect(-1, -15, 1, 3).fill(DB32.rainforest);
      g.rect(-7, -12, 6, 1).fill(DB32.verdigris);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const ink = DB32.valhalla;
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
      g.rect(0, -6, 3, 10).fill(DB32.rainforest);
      g.rect(-24, 0, 24, 2).fill(DB32.verdigris);
    },
  },
  {
    id: 'seed-store',
    x: 142 * T,
    y: CELLAR_Y,
    name: 'Seed Store',
    description:
      'A cabinet of tiny drawers in the root cellar, each labelled in a careful hand: bean, squash, sunflower, ' +
      'apple pip. The mice have been into every one but a single drawer at the bottom, labelled only with the ' +
      'spiral, which is locked and smells faintly of rain.',
    drawBody(g) {
      const wood = DB32.oiledCedar;
      g.rect(-10, -22, 20, 22).fill(wood);
      g.rect(-10, -22, 20, 1).fill(DB32.rope);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          g.rect(-8 + col * 6, -20 + row * 5, 5, 4).fill(DB32.rope);
          g.rect(-6 + col * 6, -18 + row * 5, 1, 1).fill(DB32.goldenFizz);
        }
      }
      // The locked drawer, with its spiral.
      g.rect(-8, -3, 16, 3).fill(DB32.valhalla);
      g.rect(-2, -2, 4, 1).fill(DB32.goldenFizz);
      g.rect(-2, -3, 1, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      g.rect(-26, -30, 52, 56).fill(DB32.oiledCedar);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          g.rect(-23 + col * 16, -27 + row * 12, 14, 10).fill(DB32.rope);
          g.rect(-17 + col * 16, -23 + row * 12, 2, 2).fill(DB32.goldenFizz);
        }
      }
      g.rect(-23, 22, 46, 8).fill(DB32.valhalla);
      g.rect(-6, 24, 12, 1).fill(DB32.goldenFizz);
      g.rect(-6, 24, 1, 4).fill(DB32.goldenFizz);
      g.rect(-6, 27, 9, 1).fill(DB32.goldenFizz);
      g.rect(2, 25, 1, 2).fill(DB32.goldenFizz);
    },
  },
  {
    id: 'dovecote',
    x: 154 * T,
    y: LOFT_Y,
    name: 'Dovecote',
    description:
      'The loft at the top of the tower, lined to the roof with nesting boxes, every one of them empty and ' +
      'swept clean. The doves left all at once, by the look of it, and someone has kept the place ready for ' +
      'them ever since.',
    drawBody(g) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = -12 + col * 9;
          const y = -22 + row * 7;
          g.rect(x, y, 8, 6).fill(DB32.twine);
          g.rect(x + 2, y + 2, 4, 4).fill(DB32.valhalla);
        }
      }
      g.rect(-12, -1, 26, 1).fill(DB32.rope);
      g.rect(9, -4, 3, 3).fill(DB32.white);
    },
    drawSketch(g) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = -28 + col * 15;
          const y = -28 + row * 14;
          g.rect(x, y, 13, 12).fill(DB32.twine);
          g.rect(x + 3, y + 4, 7, 8).fill(DB32.valhalla);
        }
      }
      g.rect(14, 22, 4, 3).fill(DB32.white);
      g.rect(18, 20, 2, 2).fill(DB32.white);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations.
// ---------------------------------------------------------------------------

const at = (col: number, surfaceRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * T + 8,
  y: surfaceRow * T,
  draw,
});

const plant = (col: number, surfaceRow: number, species: FloraId): DecorationSpec => ({
  ...at(col, surfaceRow, PLANTS[species].draw),
  species,
});

// The potting shed under its roof (row 50): boards and a window. 112 wide ×
// 96 tall, standing on the ground; the roof tiles are the platform. Its door
// is the door into the house (drawShedDoor), drawn over it by the Door.
function drawShed(g: Graphics): void {
  const board = DB32.rope;
  const boardDark = DB32.oiledCedar;
  g.rect(-56, -96, 112, 96).fill(board);
  for (let x = -56; x < 56; x += 8) g.rect(x, -96, 1, 96).fill(boardDark);
  g.rect(10, -72, 30, 22).fill(DB32.valhalla);
  g.rect(24, -72, 1, 22).fill(boardDark);
  g.rect(10, -62, 30, 1).fill(boardDark);
  g.rect(16, -56, 8, 6).fill(DB32.tahitiGold);
  g.rect(19, -60, 1, 4).fill(DB32.dell);
}

// The shed's door, ajar, around its own foot: the way into the house (the
// potting shed level), where drawShed used to draw it.
function drawShedDoor(g: Graphics): void {
  g.rect(-11, -44, 22, 44).fill(DB32.oiledCedar);
  g.rect(-11, -44, 4, 44).fill(DB32.valhalla);
  g.rect(7, -24, 2, 2).fill(DB32.twine);
}

// The greenhouse's glass: 304 wide × 224 tall under its roof, panes of
// faint glass between white-painted glazing bars.
function drawGreenhouse(g: Graphics): void {
  g.rect(-152, -224, 304, 224).fill({ color: DB32.lightSteel, alpha: 0.1 });
  for (let x = -152; x <= 152; x += 32) g.rect(x, -224, 2, 224).fill(DB32.heather);
  for (const y of [-224, -150, -76]) g.rect(-152, y, 304, 2).fill(DB32.heather);
  g.rect(-150, -222, 10, 60).fill({ color: DB32.white, alpha: 0.2 });
  g.rect(40, -140, 10, 50).fill({ color: DB32.white, alpha: 0.18 });
}

// Vines hanging from the pergola's underside (anchor), with grapes.
function drawVines(g: Graphics): void {
  for (const [x, len] of [
    [-90, 18],
    [-60, 26],
    [-30, 14],
    [0, 22],
    [30, 30],
    [60, 16],
    [90, 24],
  ] as const) {
    g.rect(x, 0, 1, len).fill(DB32.dell);
    g.rect(x - 2, Math.round(len / 2), 3, 2).fill(DB32.eltGreen);
    g.rect(x + 1, len - 4, 3, 4).fill(DB32.smokeyAsh);
    g.rect(x + 1, len - 4, 1, 1).fill(DB32.mandy);
  }
}

// Apple tree A's trunk, from the ground up between its two columns of branches
// (cols 72-74 and 77-79) to the top branch, 15 rows up.
function drawTrunkA(g: Graphics): void {
  g.rect(-6, -240, 10, 240).fill(DB32.oiledCedar);
  g.rect(-6, -240, 3, 240).fill(DB32.rope);
  g.rect(-10, -4, 18, 4).fill(DB32.oiledCedar);
}

// A clump of leaves and apples under a branch, hanging from its underside.
function drawLeafClump(g: Graphics): void {
  g.rect(-22, 0, 44, 8).fill(DB32.dell);
  g.rect(-18, 8, 36, 5).fill(DB32.dell);
  g.rect(-20, 0, 12, 4).fill(DB32.christi);
  g.rect(10, 2, 8, 3).fill(DB32.rainforest);
  for (const [x, y] of [
    [-14, 6],
    [2, 9],
    [14, 5],
  ] as const) {
    g.rect(x, y, 3, 3).fill(DB32.clairvoyant);
    g.rect(x, y, 1, 1).fill(DB32.brown);
  }
}

// The well-head: a stone ring (the two lips are tiles), posts, a little roof,
// a bucket on its rope. Base on the ground at the well's column.
function drawWellHead(g: Graphics): void {
  g.rect(-24, -40, 2, 38).fill(DB32.oiledCedar);
  g.rect(22, -40, 2, 38).fill(DB32.oiledCedar);
  g.rect(-28, -46, 56, 6).fill(DB32.clairvoyant);
  g.rect(-28, -46, 56, 2).fill(DB32.brown);
  g.rect(-22, -34, 44, 2).fill(DB32.rope);
  g.rect(0, -32, 1, 14).fill(DB32.twine);
  g.rect(-3, -18, 7, 6).fill(DB32.oiledCedar);
}

// The hayrick's stilts and its hay: four poles down from the platform at row
// 48 to the ground, and a hay pile on top of it. Base on the ground.
function drawHayrick(g: Graphics): void {
  for (const x of [-44, -16, 14, 42]) g.rect(x, -112, 3, 112).fill(DB32.oiledCedar);
  g.rect(-48, -150, 96, 22).fill(DB32.twine);
  g.rect(-40, -158, 80, 8).fill(DB32.twine);
  g.rect(-28, -164, 56, 6).fill(DB32.pancho);
  for (let x = -44; x < 44; x += 6) g.rect(x, -146 + (x % 3), 1, 6).fill(DB32.rope);
}

// A straw skep, the old kind of beehive. 16 wide × 18 tall.
function drawSkep(g: Graphics): void {
  g.rect(-8, -12, 16, 12).fill(DB32.twine);
  g.rect(-6, -16, 12, 4).fill(DB32.twine);
  g.rect(-3, -18, 6, 2).fill(DB32.twine);
  for (const y of [-15, -11, -7, -3]) g.rect(-8, y, 16, 1).fill(DB32.rope);
  g.rect(-2, -3, 4, 3).fill(DB32.valhalla);
  g.rect(-10, 0, 20, 1).fill(DB32.oiledCedar);
}

// A scarecrow in an old coat, arms out, hat askew. 24 wide × 34 tall.
function drawScarecrow(g: Graphics): void {
  g.rect(-1, -34, 2, 34).fill(DB32.oiledCedar);
  g.rect(-12, -24, 24, 2).fill(DB32.oiledCedar);
  g.rect(-6, -24, 12, 12).fill(DB32.deepKoamaru);
  g.rect(-12, -23, 4, 2).fill(DB32.twine);
  g.rect(8, -23, 4, 2).fill(DB32.twine);
  g.rect(-4, -32, 8, 8).fill(DB32.pancho);
  g.rect(-2, -29, 1, 1).fill(DB32.valhalla);
  g.rect(1, -29, 1, 1).fill(DB32.valhalla);
  g.rect(-6, -34, 12, 2).fill(DB32.valhalla);
  g.rect(-4, -37, 7, 3).fill(DB32.valhalla);
}

// A wooden water butt, 12 wide × 16 tall.
function drawWaterButt(g: Graphics): void {
  g.rect(-6, -16, 12, 16).fill(DB32.oiledCedar);
  g.rect(-6, -12, 12, 1).fill(DB32.dimGray);
  g.rect(-6, -4, 12, 1).fill(DB32.dimGray);
  g.rect(-5, -16, 10, 1).fill(DB32.venice);
  g.rect(-6, -16, 1, 16).fill(DB32.rope);
}

// Jars on a cellar shelf, standing on the shelf's top.
function drawJars(g: Graphics): void {
  for (const [x, h, c] of [
    [-24, 8, DB32.clairvoyant],
    [-14, 10, DB32.tahitiGold],
    [-4, 7, DB32.eltGreen],
    [6, 9, DB32.mandy],
    [16, 8, DB32.goldenFizz],
  ] as const) {
    g.rect(x, -h, 7, h).fill(c);
    g.rect(x, -h, 7, 2).fill(DB32.lightSteel);
    g.rect(x + 1, -h + 3, 1, h - 4).fill({ color: DB32.white, alpha: 0.4 });
  }
}

const KITCHEN_GARDEN_DECORATIONS: DecorationSpec[] = [
  at(8, 56, drawWaterButt),
  // The beds.
  plant(10, 55, 'bean-trellis'),
  plant(12, 55, 'squash'),
  plant(14, 55, 'bean-trellis'),
  plant(19, 55, 'squash'),
  plant(21, 55, 'squash'),
  // The shed, under its roof (cols 29-35).
  { x: 32 * T + 8, y: GROUND_Y, draw: drawShed },
  // The greenhouse, and what grows on its staging.
  { x: 47 * T + 8, y: GROUND_Y, draw: drawGreenhouse },
  plant(43, 54, 'squash'),
  plant(48, 52, 'sunflower'),
  plant(53, 50, 'bean-trellis'),
  // The pergola's vines.
  { x: 64 * T, y: 42 * T, draw: drawVines },
  // The orchard: tree A's trunk and leaves, and flora apple trees.
  { x: 76 * T + 8, y: GROUND_Y, draw: drawTrunkA },
  ...[
    [73, 54],
    [78, 51],
    [73, 48],
    [78, 45],
    [73, 42],
  ].map(([col, row]) => ({ x: col * T + 8, y: row * T, draw: drawLeafClump })),
  plant(84, 56, 'apple-tree'),
  plant(91, 56, 'apple-tree'),
  plant(97, 56, 'apple-tree'),
  plant(62, 56, 'apple-tree'),
  // The well, the meadow and the hives.
  { x: 118 * T + 8, y: GROUND_Y, draw: drawWellHead },
  { x: 132 * T + 8, y: GROUND_Y, draw: drawHayrick },
  at(122, 56, drawSkep),
  at(124, 56, drawSkep),
  at(140, 56, drawSkep),
  at(145, 56, drawScarecrow),
  plant(126, 56, 'sunflower'),
  plant(143, 56, 'sunflower'),
  plant(150, 56, 'sunflower'),
  // The cellar's jars.
  { x: 123 * T + 8, y: 66 * T, draw: drawJars },
  { x: 129 * T + 8, y: 64 * T, draw: drawJars },
  { x: 135 * T + 8, y: 62 * T, draw: drawJars },
  // The east wall's sunflowers.
  plant(166, 48, 'sunflower'),
  plant(168, 48, 'sunflower'),
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
  // Dark only where it is indoors: the root cellar, and inside the dovecote.
  backdrop: 'indoor-dark',
  rockBgStartRow: KITCHEN_GARDEN_ROWS.length,
  backdropRegions: [
    // The cellar, and up the well and hatch shafts through the ground.
    { col: 114, row: 56, cols: 37, rows: 12 },
    { col: 153, row: 18, cols: 7, rows: 38 },
  ],
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
      // The potting shed's door, into a house far bigger than the shed.
      new Door({
        id: 'potting-shed-door',
        x: SHED_DOOR_X,
        y: GROUND_Y,
        targetLevelId: 'potting-shed',
        targetSpawnId: 'from-garden',
        promptLabel: 'go in',
        drawBody: drawShedDoor,
      }),
      // The pumpkins: two along the beds, one between them, one on the meadow.
      new Pumpkin({ x: 12 * T, y: BED_Y, minX: 10 * T + 4, maxX: 15 * T - 4, facing: 1 }),
      new Pumpkin({ x: 20 * T, y: BED_Y, minX: 18 * T + 4, maxX: 23 * T - 4, facing: -1 }),
      new Pumpkin({ x: 24 * T, y: GROUND_Y, minX: 23 * T + 2, maxX: 25 * T + 6, facing: 1 }),
      new Pumpkin({ x: 138 * T, y: GROUND_Y, minX: 136 * T, maxX: 147 * T, facing: -1 }),
      // Hens: under the pergola, in the orchard, on the meadow.
      new Hen({ x: 62 * T, y: GROUND_Y, minX: 57 * T, maxX: 70 * T }),
      new Hen({ x: 88 * T, y: GROUND_Y, minX: 81 * T, maxX: 98 * T }),
      new Hen({ x: 121 * T, y: GROUND_Y, minX: 120 * T, maxX: 127 * T }),
      // A hedgehog under the apple trees.
      new Hedgehog({ x: 92 * T, y: GROUND_Y, minX: 83 * T, maxX: 98 * T }),
      // Snails on the beds and the greenhouse staging.
      new Snail({ x: 11 * T, y: BED_Y, minX: 10 * T + 4, maxX: 15 * T - 4 }),
      new Snail({ x: 44 * T, y: 54 * T, minX: 42 * T + 4, maxX: 46 * T - 4 }),
      // Frogs at the pond, jumping on and off the stone.
      new Frog({ fromX: 99 * T, toX: 105 * T + 8, y: GROUND_Y }),
      new Frog({ fromX: 106 * T + 8, toX: 114 * T, y: GROUND_Y }),
      new Fish({ x: 102 * T, y: 58 * T + 11, speed: 18, minX: 100 * T + 4, maxX: 105 * T - 4, color: DB32.tahitiGold }),
      new Fish({ x: 109 * T, y: 59 * T + 11, speed: 22, minX: 107 * T + 4, maxX: 113 * T - 4, color: DB32.white }),
      // Mice in the cellar.
      new Mouse({ x: 124 * T, y: CELLAR_Y, minX: 119 * T + 4, maxX: 128 * T }),
      new Mouse({ x: 140 * T, y: CELLAR_Y, minX: 133 * T, maxX: 147 * T - 4 }),
      new Mouse({ x: 130 * T, y: 64 * T, minX: 128 * T + 4, maxX: 132 * T - 4 }),
      // Bees over the hives.
      new Bees({ x: 123 * T, y: GROUND_Y - 18 }),
      new Bees({ x: 140 * T + 8, y: GROUND_Y - 18 }),
      // Fireflies over the pond in the dusk.
      new Fireflies({ x: 106 * T, y: GROUND_Y - 30 }),
      // Birds going over high, toward the dovecote.
      new Bird({ x: 60 * T, y: 22 * T, speed: 40, minX: 20 * T, maxX: 150 * T, facing: 1 }),
      new Bird({ x: 120 * T, y: 30 * T, speed: 34, minX: 40 * T, maxX: 160 * T, facing: -1 }),
      // Leaves coming down over the whole garden.
      ...[6, 17, 28, 44, 59, 75, 86, 97, 116, 131, 147, 163].map(
        (col, i) => new FallingLeaf({ x: col * T, top: 20 * T, bottom: GROUND_Y, phase: (i * 0.37) % 1 }),
      ),
    ];
  },
};

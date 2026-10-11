import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { Fireflies } from '@entities/fireflies';
import { Frog } from '@entities/frog';
import { drawGlow } from '@entities/glow';
import { Hare } from '@entities/hare';
import { Hedgehog } from '@entities/hedgehog';
import type { LandmarkSpec } from '@entities/landmark';
import { Owl } from '@entities/owl';
import { type FloraId, PLANTS } from '@entities/plants';
import { Snail } from '@entities/snail';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Cairn Observatory — the hill above the meadow, at night: the last place,
// where the spiral turns out to be the sky.
//
// 192 wide × 100 tall. West to east:
//
//   The moor (cols 0-63) — the gate back to the meadow, heath at three
//     heights, hares and hedgehogs, and under it the warren: a tunnel two
//     rows high with holes up through the heath, and a lower burrow whose
//     puffball throws you straight back out onto the moor.
//   The west face — two ways up to the shoulder: a chimney of ledges (cols
//     51-53 and 55-57, three rows apart, a column of air between the sides)
//     with a long ledge out west, or the ladder bolted to the face (col 63).
//   The shoulder (row 53) — a puffball throws you onto P1, P1's onto P2,
//     P2's onto the summit's cornice.
//   The summit (row 33, cols 86-130) — the Sighting Stone under the spiral
//     of stars; a hole at col 120 drops down a ladder to the grotto.
//   The bridge (row 33, cols 131-159) — across the valley to the north tor,
//     one plank missing: the way down to the tarn.
//   The north tor (cols 160-191) — a puffball shortcut, steps up to the peak
//     (row 13) and the Watcher's Bothy.
//   The valley (row 86) — the tarn, its frogs, and the cavern's mouth.
//   Inside the hill — the west tunnel from the foot of the face to the hall
//     (the Fallen Star, a gallery reached by puffball), the hall's pool and
//     the one-row crawlway east to the bat cavern; the cavern's puffball well
//     up to the grotto and the ladder; and under it all the flooded tunnel
//     from the hall's pool to the bottom of the tarn.
//
// Every jump is two rows up, or three with a column of air before the ledge
// and nothing overhead, or a puffball's eight. Checked with a port of the
// player's physics: every place is reachable from the gate, and the gate from
// every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . sky   h heath   p peat   g granite   W water   H ladder   T timber
//   U puffball
const CAIRN_OBSERVATORY_ROWS = [
  '................................................................................................................................................................................................', //  0
  '................................................................................................................................................................................................', //  1
  '................................................................................................................................................................................................', //  2
  '................................................................................................................................................................................................', //  3
  '................................................................................................................................................................................................', //  4
  '................................................................................................................................................................................................', //  5
  '................................................................................................................................................................................................', //  6
  '................................................................................................................................................................................................', //  7
  '................................................................................................................................................................................................', //  8
  '................................................................................................................................................................................................', //  9
  '................................................................................................................................................................................................', // 10
  '................................................................................................................................................................................................', // 11
  '................................................................................................................................................................................................', // 12
  '........................................................................................................................................................................................hhhhhhhh', // 13  the north tor's peak (cols 184-191) — the Watcher's Bothy
  '........................................................................................................................................................................................pppppppp', // 14
  '......................................................................................................................................................................................hhpppppppp', // 15
  '......................................................................................................................................................................................ppgggggggg', // 16
  '....................................................................................................................................................................................hhppgggggggg', // 17
  '....................................................................................................................................................................................ppgggggggggg', // 18
  '..................................................................................................................................................................................hhppgggggggggg', // 19
  '..................................................................................................................................................................................ppgggggggggggg', // 20
  '................................................................................................................................................................................hhppgggggggggggg', // 21
  '................................................................................................................................................................................ppgggggggggggggg', // 22
  '..............................................................................................................................................................................hhppgggggggggggggg', // 23
  '..............................................................................................................................................................................ppgggggggggggggggg', // 24
  '................................................................................................................................................................ggggg.......hhppgggggggggggggggg', // 25  a crag at the tor's foot (cols 160-164)
  '............................................................................................................................................................................ppgggggggggggggggggg', // 26
  '..........................................................................................................................................................................hhppgggggggggggggggggg', // 27
  '..........................................................................................................................................................................ppgggggggggggggggggggg', // 28
  '........................................................................................................................................................................hhppgggggggggggggggggggg', // 29
  '........................................................................................................................................................................ppgggggggggggggggggggggg', // 30
  '......................................................................................................................................................................hhppgggggggggggggggggggggg', // 31
  '.......................................................................................................................g.g............................................ppgggggggggggggggggggggggg', // 32  a stone lip either side of the ladder hole (cols 119, 121)
  '......................................................................................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhhhhhhhhhhTTTTTTTTTTTTTT..TTTTTTTTTTTTThhhUhhppgggggggggggggggggggggggg', // 33  SUMMIT (cols 86-130; cornice 86-91) — ladder hole col 120 — the BRIDGE (cols 131-159, a plank missing at 145-146) — the tor's foot (cols 160-165)
  '......................................................................................ggggggppppppppppppppppppppppppppppHpppppppppp.............................ppppppgggggggggggggggggggggggggg', // 34
  '............................................................................................ppppppppppppppppppppppppppppHpppppppppp.............................ppppppgggggggggggggggggggggggggg', // 35
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 36
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 37
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 38
  '.................................................................................ggggU......ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 39  P2, the second puffball ledge (cols 81-85)
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 40
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 41
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 42
  '............................................................................................ggggggggggggggggggggggggggggHgggggggggg.............................gggggggggggggggggggggggggggggggg', // 43
  '............................................................................................gggggggggggggggg...................gggg.............................gggggggggggggggggggggggggggggggg', // 44  the grotto (rows 44-47, cols 108-126)
  '............................................................................................gggggggggggggggg...................gggg.............................gggggggggggggggggggggggggggggggg', // 45
  '............................................................ggggg.........gggggU............gggggggggggggggg...................gggg.............................gggggggggggggggggggggggggggggggg', // 46  P1, the first puffball ledge (cols 74-79), and a crag (cols 60-64)
  '............................................................................................gggggggggggggggg...................gggg.............................gggggggggggggggggggggggggggggggg', // 47
  '............................................................................................gggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 48  the well's throat (rows 48-57, cols 112-118)
  '............................................................................................gggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 49
  '............................................................................................gggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 50
  '............................................................................................gggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 51
  '............................................................................................gggggggggggggggggggg..ggU..gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 52
  '........................................................hhhhhhhHhhhhhhhhUhhhhhhhhhhhhhhhhhhhgggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 53  SHOULDER (cols 56-91; cornice 56-62) with a puffball at col 72 — the face ladder (col 63) to row 85
  '........................................................gggggggHppppppppppppppppppppppppppppgggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 54
  '...............................................................Hppppppppppppppppppppppppppppgggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 55
  '...................................................ggg.........Hgggggggggggggggggggggggggggggggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 56  west chimney: ledges at cols 51-53 and 55-57, three rows apart, rows 56-83
  '...............................................................Hgggggggggggggggggggggggggggggggggggggggggggggggg.......gggggggggggg.............................gggggggggggggggggggggggggggggggg', // 57
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg.Ugg......g...g.g..g.............................gggggggggggggggggggggggggggggggg', // 58  the bat cavern (rows 58-85, cols 111-129)
  '.......................................................ggg.....Hggggggggggggggggggggggggggggggggggggggggggggggg..........g...g.g..g.............................gggggggggggggggggggggggggggggggg', // 59
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg..........g...g....g.............................gggggggggggggggggggggggggggggggg', // 60
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg..............g....g.............................gggggggggggggggggggggggggggggggg', // 61
  '...................................................ggg.........Hggggggggggggggggggggggggggggggggggggggggggggggg..............g....g.............................gggggggggggggggggggggggggggggggg', // 62
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 63
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 64
  '.......................................................ggg.....Hggggggggggggggggggggggggggggggggggggggggggggggg......Uggg.........g.............................gggggggggggggggggggggggggggggggg', // 65
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 66
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 67
  '..........................................gggggggggggg.........Hggggggggggggggggggggggggggggggggggggggggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 68  the long ledge west of the chimney (cols 42-53)
  '...............................................................Hggggggggggggggggggggggggggggggggggggggggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 69
  '...............................................................Hggggggggggggggggg.........gg.........gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 70  the hall (rows 70-85, cols 81-100)
  '.......................................................ggg.....Hggggggggggggggggg.........gg.........gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 71
  '...............................................................Hggggggggggggggggg.........gg.........gggggggggg.........gggU......g.............................gggggggggggggggggggggggggggggggg', // 72
  '...............................................................Hggggggggggggggggg.........gg.........gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 73
  '...................................................ggg.........Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 74
  '...............................................................Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 75
  '...............................................................Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 76
  '.......................................................ggg.....Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 77
  '...............................................................Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 78
  '...............................................................Hggggggggggggggggggggggg..............gggggggggg....Uggg...........g.............................gggggggggggggggggggggggggggggggg', // 79  the hall's gallery (cols 81-86)
  '...................................................ggg.........Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 80
  '...............................................................Hggggggggggggggggg....................gggggggggg...................g.............................gggggggggggggggggggggggggggggggg', // 81
  '...............................................................H.....................................gggggggggg.................................................gggggggggggggggggggggggggggggggg', // 82  west tunnel (rows 82-85) from the mouth at col 64 — the cavern's mouth onto the valley at col 130
  '.......................................................ggg.....H.....................................gggggggggg.................................................gggggggggggggggggggggggggggggggg', // 83
  '................hhhhhhhhhhhh...................................H.....................................gggggggggg.................................................gggggggggggggggggggggggggggggggg', // 84  the moor's rise (cols 16-27)
  '..............hhpppppppppppphh.................................H................................................................................................gggggggggggggggggggggggggggggggg', // 85  the crawlway (cols 101-110), one row high
  'hhhhhhhhhhhh..pppppppppppppppphhhh..hhhhhhhh..hhhhhhhhhhhhhhhhhhggggggggggggggggggggggggUggggggWWWWWWgggggggggggggggggggggUgggggggghhhhhhhWWWWWWWWWWWWWWWhhhhhhhgggggggggggggggggggggggggggggggg', // 86  THE MOOR (cols 0-63) — hall floor with puffball (88) and pool (95-100) — cavern floor with puffball (122) — THE VALLEY (cols 131-159) and the tarn (138-152)
  'pppp...........................................pppppppppppppppppgggggggggggggggggggggggggggggggWWWWWWggggggggggggggggggggggggggggggpppppppWWWWWWWWWWWWWWWpppppppgggggggggggggggggggggggggggggggg', // 87  the warren (rows 87-88, cols 4-46) under holes at cols 12-13, 34-35, 44-45
  'pppp...........................................pppppppppppppppppgggggggggggggggggggggggggggggggWWWWWWggggggggggggggggggggggggggggggpppppppWWWWWWWWWWWWWWWpppppppgggggggggggggggggggggggggggggggg', // 88
  'ggggggggggggggggggggggggggg..ggggg..gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggWWWWWWgggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWggggggggggggggggggggggggggggggggggggggg', // 89
  'gggggggggggggggggggggggg.................ggggggggggggggggggggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWggggggggggggggggggggggggggggggggggggggg', // 90  the lower burrow (rows 90-91, cols 24-40) and the flooded tunnel (rows 90-93, cols 95-152)
  'gggggggggggggggggggggggg.................ggggggggggggggggggggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWggggggggggggggggggggggggggggggggggggggg', // 91
  'ggggggggggggggggggggggggggggggggggUggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWggggggggggggggggggggggggggggggggggggggg', // 92
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWggggggggggggggggggggggggggggggggggggggg', // 93
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 94
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 95
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 96
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 97
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 98
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // 99
] as const;

const T = TILE_SIZE;
const MOOR_Y = 86 * T;
const RISE_Y = 84 * T;
const SHOULDER_Y = 53 * T;
const SUMMIT_Y = 33 * T;
const PEAK_Y = 13 * T;
const HALL_Y = 86 * T;
const VALLEY_Y = 86 * T;

const RETURN_DOOR_X = 3 * T + 8;

const CAIRN_OBSERVATORY_SPAWNS: SpawnPoint[] = [{ id: 'from-meadow', x: 5 * T + 2, y: MOOR_Y - T }];

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

// A burrow mouth in the heath, beside a warren hole: a dark half-moon with a
// fan of spoil in front of it. 14 wide × 5 tall.
function drawBurrowMouth(g: Graphics): void {
  g.rect(-7, -1, 14, 1).fill(0x3a2c32);
  g.rect(-5, -4, 10, 3).fill(0x3a2c32);
  g.rect(-3, -4, 6, 3).fill(DB32.black);
  g.rect(-2, -5, 4, 1).fill(DB32.black);
}

// ---------------------------------------------------------------------------
// Landmarks — the Sighting Stone on the summit, the Fallen Star in the hall,
// the Watcher's Bothy on the north tor.
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
    x: 108 * T + 8,
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
    x: 84 * T + 8,
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
    x: 188 * T + 8,
    y: PEAK_Y,
    name: "Watcher's Bothy",
    description:
      'A drystone hut on the north tor, one room, the roof long gone. Someone kept watch from here, night after ' +
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
// Decorations — waymarks, the stone ring, thorns, pines, heather, burrows.
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

const CAIRN_OBSERVATORY_DECORATIONS: DecorationSpec[] = [
  // The moor.
  plant(1, 86, 'pine-tree'),
  plant(6, 86, 'heather'),
  at(10, 86, drawBurrowMouth),
  plant(8, 86, 'heather'),
  plant(18, 84, 'pine-tree'),
  plant(21, 84, 'heather'),
  at(25, 84, drawThornTree),
  plant(31, 86, 'bush'),
  at(37, 86, drawBurrowMouth),
  plant(41, 86, 'heather'),
  plant(48, 86, 'pine-tree'),
  plant(55, 86, 'heather'),
  at(60, 86, drawWaymark),
  // The long ledge out west of the chimney.
  plant(43, 68, 'heather'),
  at(46, 68, drawThornTree),
  // The shoulder.
  at(58, 53, drawWaymark),
  plant(66, 53, 'heather'),
  at(76, 53, drawThornTree),
  plant(84, 53, 'heather'),
  plant(88, 53, 'heather'),
  // The summit: the stone ring round the Sighting Stone.
  at(88, 33, drawWaymark),
  at(102, 33, drawStandingStone),
  at(114, 33, drawStandingStone),
  plant(96, 33, 'heather'),
  plant(110, 33, 'heather'),
  plant(126, 33, 'heather'),
  // The north tor.
  plant(161, 33, 'heather'),
  at(171, 27, drawWaymark),
  plant(177, 21, 'heather'),
  at(185, 13, drawThornTree),
  // The valley.
  plant(132, 86, 'heather'),
  plant(136, 86, 'bush'),
  plant(155, 86, 'heather'),
  plant(158, 86, 'pine-tree'),
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
  // Inside the hill the backdrop is pure black — lit by nothing but the
  // Fallen Star — and only inside it: the moor, the chimney, the shoulder and
  // the valley are open sky.
  backdrop: 'crypt-black',
  rockBgStartRow: CAIRN_OBSERVATORY_ROWS.length,
  backdropRegions: [
    { col: 4, row: 87, cols: 43, rows: 13 }, // the warren and the lower burrow
    { col: 64, row: 54, cols: 28, rows: 46 }, // under the shoulder: west tunnel, hall
    { col: 92, row: 33, cols: 39, rows: 67 }, // under the summit: cavern, well, grotto, ladder
    { col: 131, row: 87, cols: 22, rows: 13 }, // under the valley: the flooded tunnel
  ],
  openSky: true,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'observatory-return-door',
        x: RETURN_DOOR_X,
        y: MOOR_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-meadow',
        promptLabel: 'go down',
        drawBody: drawTrailGate,
      }),
      // Hares, on the flats of the moor, the summit and the valley.
      new Hare({ x: 20 * T, y: RISE_Y, minX: 16 * T + 6, maxX: 28 * T - 6 }),
      new Hare({ x: 52 * T, y: MOOR_Y, minX: 47 * T, maxX: 62 * T }),
      new Hare({ x: 100 * T, y: SUMMIT_Y, minX: 93 * T, maxX: 118 * T }),
      new Hare({ x: 134 * T, y: VALLEY_Y, minX: 131 * T + 6, maxX: 137 * T }),
      // Hedgehogs.
      new Hedgehog({ x: 39 * T, y: MOOR_Y, minX: 36 * T + 6, maxX: 44 * T - 6 }),
      new Hedgehog({ x: 66 * T, y: SHOULDER_Y, minX: 64 * T, maxX: 71 * T }),
      new Hedgehog({ x: 156 * T, y: VALLEY_Y, minX: 153 * T + 6, maxX: 160 * T - 6 }),
      new Hedgehog({ x: 4 * T, y: MOOR_Y, minX: 0 * T + 8, maxX: 11 * T }),
      // Snails on the granite.
      new Snail({ x: 52 * T, y: 74 * T, minX: 51 * T + 4, maxX: 54 * T - 4 }),
      new Snail({ x: 48 * T, y: 68 * T, minX: 42 * T + 4, maxX: 50 * T }),
      new Snail({ x: 76 * T, y: 46 * T, minX: 74 * T + 4, maxX: 79 * T - 4 }),
      new Snail({ x: 162 * T, y: 25 * T, minX: 160 * T + 4, maxX: 165 * T - 4 }),
      new Snail({ x: 84 * T, y: 79 * T, minX: 81 * T + 4, maxX: 87 * T - 4 }),
      // Bats: hung in the hall and the cavern, and one low in the west tunnel
      // and one in the crawlway, where a walker meets them.
      new Bat({ x: 72 * T, y: 82 * T }),
      new Bat({ x: 105 * T, y: 85 * T }),
      new Bat({ x: 83 * T + 8, y: 70 * T }),
      new Bat({ x: 90 * T + 16, y: 74 * T }),
      new Bat({ x: 97 * T, y: 70 * T }),
      new Bat({ x: 119 * T + 8, y: 58 * T }),
      new Bat({ x: 121 * T + 8, y: 61 * T }),
      new Bat({ x: 125 * T + 8, y: 63 * T }),
      new Bat({ x: 127 * T + 8, y: 60 * T }),
      new Bat({ x: 129 * T, y: 58 * T }),
      // Frogs, each jumping the tarn from one bank to the other.
      new Frog({ fromX: 135 * T, toX: 155 * T, y: VALLEY_Y }),
      new Frog({ fromX: 137 * T, toX: 153 * T + 8, y: VALLEY_Y }),
      // Fireflies, low over the heath and the water.
      new Fireflies({ x: 12 * T, y: MOOR_Y - 22 }),
      new Fireflies({ x: 24 * T, y: RISE_Y - 26 }),
      new Fireflies({ x: 46 * T, y: 68 * T - 22 }),
      new Fireflies({ x: 145 * T, y: VALLEY_Y - 30 }),
      new Fireflies({ x: 95 * T, y: SUMMIT_Y - 22 }),
      new Fireflies({ x: 188 * T, y: PEAK_Y - 30 }),
      new Fireflies({ x: 122 * T, y: 46 * T }),
      // Owls on the shoulder, the long ledge and the tor.
      new Owl({ x: 80 * T + 8, y: SHOULDER_Y }),
      new Owl({ x: 44 * T + 8, y: 68 * T }),
      new Owl({ x: 173 * T, y: 25 * T }),
    ];
  },
};

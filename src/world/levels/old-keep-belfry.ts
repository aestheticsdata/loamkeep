import { DB32, TILE_SIZE } from '@constants';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { Owl } from '@entities/owl';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Belfry — the keep's bell tower, climbed from the upper floor to the
// roof, at night.
//
// 24 wide × 41 tall (cols 0-1 and 22-23 are the tower walls). A full jump
// peaks at ~67 px, so no climb asks for more than 3 tiles up, and every
// storey has five rows of air: a jump from its floor can graze the boards
// above (~3 px) but has already cleared the ledge it is going for.
//
//   Roof (rows 4-10) — slate steps up to the peak, under an open sky. The
//     hatch at cols 4-5 in the eaves (row 10) is the way out onto it.
//
//   Bell chamber (rows 11-19, floor row 20) — open-sided: the backdrop
//     stops at row 20, so the night sky shows through the arches in the
//     walls and behind the bell. The bell hangs from its beam (row 14,
//     cols 17-21) over the ringers' floor, right of the stairwell, where a
//     player coming up it lands.
//     Climb, west of the stairwell: brick step (rows 18-19, cols 11-13, two
//     tiles up) → beam (row 16, cols 7-9, two up) → hatch ledge (row 13,
//     cols 2-5, three up) → straight up through the hatch. Two-tile steps
//     can sit diagonally off each other's corners; the one three-tile jump
//     has a column of air before its ledge, because a 3-tile target that
//     starts in the very next column catches the player's head under its
//     corner before the feet are high enough.
//
//   The shaft (rows 21-37) — three storeys of plank floors, each with a
//     stairwell hole on alternate sides (row 32 cols 15-16, row 26 cols 5-6,
//     row 20 cols 15-16). Under every hole, three rows down, a ledge: hop
//     onto it from the floor, then jump straight up through the hole. A fall
//     back through a hole lands on that same ledge, so a slip costs one
//     storey, never the whole tower.
//
//   Ground floor (row 38) — the door back down to the keep's upper floor.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   B CastleBrick   F CastleFloor   T Timber   K DarkStone (slate)
const OLD_KEEP_BELFRY_ROWS = [
  '........................', //  0  night sky
  '........................', //  1
  '........................', //  2
  '........................', //  3
  '...........KK...........', //  4  roof peak (cols 11-12)
  '..........KKKK..........', //  5
  '.........KKKKKK.........', //  6
  '........KKKKKKKK........', //  7
  '.......KKKKKKKKKK.......', //  8
  '......KKKKKKKKKKKK......', //  9
  'BBKK..KKKKKKKKKKKKKKKKBB', // 10  eaves — the hatch at cols 4-5
  'BB....................BB', // 11  arch lintels
  '........................', // 12  open arches (rows 12-17)
  '..TTTT..................', // 13  hatch ledge (cols 2-5)
  '.................TTTTT..', // 14  bell beam (cols 17-21)
  '........................', // 15
  '.......TTT..............', // 16  beam (cols 7-9)
  '........................', // 17
  'BB.........BBB........BB', // 18  arch sills + brick step (cols 11-13)
  'BB.........BBB........BB', // 19
  'BBFFFFFFFFFFFFF..FFFFFBB', // 20  RINGERS' FLOOR — hole at cols 15-16
  'BB....................BB', // 21  storey 3
  'BB....................BB', // 22
  'BB............TTTTT...BB', // 23  ledge under the row-20 hole (cols 14-18)
  'BB....................BB', // 24
  'BB....................BB', // 25
  'BBTTT..TTTTTTTTTTTTTTTBB', // 26  floor — hole at cols 5-6
  'BB....................BB', // 27  storey 2
  'BB....................BB', // 28
  'BB.TTTTTT.............BB', // 29  ledge under the row-26 hole (cols 3-8)
  'BB....................BB', // 30
  'BB....................BB', // 31
  'BBTTTTTTTTTTTTT..TTTTTBB', // 32  floor — hole at cols 15-16
  'BB....................BB', // 33  storey 1
  'BB....................BB', // 34
  'BB............TTTTT...BB', // 35  ledge under the row-32 hole (cols 14-18)
  'BB....................BB', // 36
  'BB....................BB', // 37
  'BBFFFFFFFFFFFFFFFFFFFFBB', // 38  GROUND FLOOR
  'BBBBBBBBBBBBBBBBBBBBBBBB', // 39  foundation
  'BBBBBBBBBBBBBBBBBBBBBBBB', // 40
] as const;

const GROUND_Y = 38 * TILE_SIZE;
const RINGERS_FLOOR_Y = 20 * TILE_SIZE;

const RETURN_DOOR_X = 3 * TILE_SIZE + 8;

const OLD_KEEP_BELFRY_SPAWNS: SpawnPoint[] = [
  // Two tiles right of the door, clear of its interaction zone.
  { id: 'from-keep', x: 5 * TILE_SIZE + 2, y: GROUND_Y - TILE_SIZE },
];

// ---------------------------------------------------------------------------
// Landmark — the bell, on the ringers' floor under its beam.
// ---------------------------------------------------------------------------

const OLD_KEEP_BELFRY_LANDMARKS: LandmarkSpec[] = [
  // Anchored on the floor under the middle of its beam (cols 17-21) so the
  // interaction zone is where the player stands; drawn hanging from the
  // beam's underside, 80 px up.
  {
    id: 'silent-bell',
    x: 19 * TILE_SIZE + 8,
    y: RINGERS_FLOOR_Y,
    name: 'Silent Bell',
    description:
      'A bronze bell as tall as you are, hung where the whole valley could have heard it. Its clapper has been ' +
      'bound fast with rope — many turns, knotted with care — so that it can never ring. ' +
      'Cast into its waist, where a maker would put their name: the spiral.',
    drawBody(g) {
      drawBell(g);
    },
    drawSketch(g) {
      const bronze = DB32.rainforest;
      const bronzeHi = DB32.twine;
      const shadow = DB32.stinger;
      // Yoke.
      g.rect(-22, -40, 44, 6).fill(DB32.oiledCedar);
      g.rect(-22, -40, 44, 2).fill(DB32.rope);
      // Bell: crown, shoulder, waist widening to the lip.
      g.rect(-6, -34, 12, 4).fill(bronze);
      g.rect(-14, -30, 28, 4).fill(bronze);
      for (let i = 0; i < 9; i++) {
        const half = 16 + Math.floor(i / 2);
        g.rect(-half, -26 + i * 4, half * 2, 4).fill(bronze);
      }
      g.rect(-24, 10, 48, 5).fill(bronze);
      g.rect(-24, 14, 48, 2).fill(shadow);
      g.rect(-12, -28, 4, 32).fill(bronzeHi);
      g.rect(14, -26, 3, 36).fill(shadow);
      // The spiral on the waist, cast in relief: lighter bronze, not gold.
      g.rect(-8, -16, 16, 2).fill(bronzeHi);
      g.rect(-8, -16, 2, 14).fill(bronzeHi);
      g.rect(-8, -4, 14, 2).fill(bronzeHi);
      g.rect(4, -12, 2, 10).fill(bronzeHi);
      g.rect(-4, -12, 10, 2).fill(bronzeHi);
      g.rect(-4, -12, 2, 5).fill(bronzeHi);
      g.rect(-8, -2, 14, 1).fill(shadow);
      // Clapper, and the rope wound round it.
      g.rect(-3, 16, 6, 10).fill(DB32.valhalla);
      for (let i = 0; i < 4; i++) {
        g.rect(-5, 17 + i * 2, 10, 1).fill(DB32.twine);
      }
      g.rect(-1, 26, 2, 10).fill(DB32.twine);
    },
  },
];

// The bell, hanging from the underside of its beam 80 px above the floor,
// with its clapper bound and the rope falling to a striped sally at hand
// height. Drawn around the floor anchor (0, 0).
function drawBell(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const bronze = DB32.rainforest;
  const bronzeHi = DB32.twine;
  const shadow = DB32.stinger;
  const rope = DB32.twine;

  // Headstock under the beam, and the crown that hangs from it.
  g.rect(-8, -80, 16, 3).fill(wood);
  g.rect(-8, -78, 16, 1).fill(DB32.valhalla);
  g.rect(-2, -77, 4, 2).fill(bronze);
  // Shoulder, waist and lip — widening downwards a pixel a side every few rows.
  g.rect(-5, -75, 10, 2).fill(bronze);
  for (let i = 0; i < 14; i++) {
    const half = 6 + Math.floor(i / 4);
    g.rect(-half, -73 + i, half * 2, 1).fill(bronze);
  }
  g.rect(-10, -59, 20, 3).fill(bronze);
  g.rect(-10, -57, 20, 1).fill(shadow);
  // Light from the left, shade on the right.
  g.rect(-4, -74, 1, 14).fill(bronzeHi);
  g.rect(6, -70, 1, 11).fill(shadow);
  // The spiral, small, cast in relief on the waist.
  g.rect(-2, -69, 5, 1).fill(bronzeHi);
  g.rect(-2, -69, 1, 4).fill(bronzeHi);
  g.rect(-2, -65, 4, 1).fill(bronzeHi);
  g.rect(2, -67, 1, 2).fill(bronzeHi);
  g.rect(0, -67, 2, 1).fill(bronzeHi);
  // Clapper under the lip, wound with rope.
  g.rect(-1, -56, 2, 4).fill(DB32.valhalla);
  g.rect(-2, -55, 4, 1).fill(rope);
  g.rect(-2, -53, 4, 1).fill(rope);
  // The rope down to the sally — red, cream and green bands, the grip a
  // ringer would pull — and its tail.
  g.rect(0, -52, 1, 28).fill(rope);
  const bands = [DB32.clairvoyant, DB32.pancho, DB32.eltGreen, DB32.pancho, DB32.clairvoyant];
  bands.forEach((band, i) => {
    g.rect(-1, -24 + i * 2, 3, 2).fill(band);
  });
  g.rect(0, -14, 1, 8).fill(rope);
}

// ---------------------------------------------------------------------------
// Decorations — slit windows in the shaft walls, the only hint of the night
// outside until the chamber.
// ---------------------------------------------------------------------------

// A narrow arched slit, 6 wide × 20 tall, anchored at its sill. Night-blue
// inside with one star, and moonlight on the sill.
function drawSlitWindow(g: Graphics): void {
  const stone = DB32.dimGray;
  g.rect(-3, -20, 6, 20).fill(stone);
  g.rect(-2, -21, 4, 1).fill(stone);
  g.rect(-1, -19, 2, 17).fill(DB32.valhalla);
  g.rect(-1, -10, 2, 8).fill(DB32.deepKoamaru);
  g.rect(0, -15, 1, 1).fill(DB32.white);
  g.rect(-3, -1, 6, 1).fill(DB32.lightSteel);
}

const slitWindow = (col: number, sillRow: number): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: sillRow * TILE_SIZE,
  draw: drawSlitWindow,
});

const OLD_KEEP_BELFRY_DECORATIONS: DecorationSpec[] = [slitWindow(9, 37), slitWindow(19, 31), slitWindow(9, 25)];

export const oldKeepBelfryLevel: LevelSpec = {
  id: 'old-keep-belfry',
  name: 'The Belfry',
  rows: OLD_KEEP_BELFRY_ROWS,
  spawns: OLD_KEEP_BELFRY_SPAWNS,
  defaultSpawnId: 'from-keep',
  landmarks: OLD_KEEP_BELFRY_LANDMARKS,
  decorations: OLD_KEEP_BELFRY_DECORATIONS,
  parallax: 'night',
  backdrop: 'indoor-dark',
  // The shaft is indoors; the chamber and the roof above it are not.
  rockBgStartRow: 20,
  openSky: true,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'belfry-return-door',
        x: RETURN_DOOR_X,
        y: GROUND_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-belfry',
        promptLabel: 'go down',
      }),
      new TallCandle(8 * TILE_SIZE + 8, GROUND_Y),
      // Owls: at the end of the first ledge, at the take-off end of the
      // chamber's beam, and on the roof's peak — one on the way up, one in
      // the way, one waiting.
      new Owl({ x: 18 * TILE_SIZE + 8, y: 35 * TILE_SIZE }),
      new Owl({ x: 7 * TILE_SIZE + 6, y: 16 * TILE_SIZE }),
      new Owl({ x: 12 * TILE_SIZE, y: 4 * TILE_SIZE }),
    ];
  },
};

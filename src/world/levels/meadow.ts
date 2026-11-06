import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { Bird } from '@entities/bird';
import { Cairn, cairnLitFlag } from '@entities/cairn';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import { Earthworm } from '@entities/earthworm';
import { Eel } from '@entities/eel';
import type { Entity, InteractContext } from '@entities/entity';
import { Fireflies } from '@entities/fireflies';
import { Fish } from '@entities/fish';
import { Glowfish } from '@entities/glowfish';
import { Hare } from '@entities/hare';
import { Kelp } from '@entities/kelp';
import { MillWheel } from '@entities/mill-wheel';
import { Mole } from '@entities/mole';
import { Moth } from '@entities/moth';
import { Mouse } from '@entities/mouse';
import { Newt } from '@entities/newt';
import { Owl } from '@entities/owl';
import { type FloraId, PLANTS } from '@entities/plants';
import { BLOCK_LOOK, PushBlock } from '@entities/push-block';
import { Rabbit } from '@entities/rabbit';
import { Snail } from '@entities/snail';
import { Spider } from '@entities/spider';
import { Spores } from '@entities/spores';
import type { LevelSpec, SpawnPoint } from '@world/level';
import { drawTrailGate } from '@world/levels/cairn-observatory';
import { drawGrottoCrack, drawOakHollow } from '@world/levels/glow-grotto';
import {
  bones,
  brazier,
  cobweb,
  crystalCluster,
  hangingCrystal,
  hangingRoots,
  mineProp,
  pebbles,
  sack,
  stalactite,
  stalagmite,
} from '@world/levels/meadow-decor';
import { MEADOW_LANDMARKS } from '@world/levels/meadow-landmarks';
import { MEADOW_ROWS } from '@world/levels/meadow-rows';
import type { Graphics } from 'pixi.js';

// Meadow level — the outdoor starting biome, rebuilt at 200 × 96 from
// design_handoff_meadow_v3 (the tilemap is in meadow-rows.ts, the landmarks
// in meadow-landmarks.ts). The numbers in the comments below are the
// handoff map's markers.
//
// Surface (ground at row 20), four zones of 50 columns:
//   - Forest edge (cols 0-49): a canopy of timber branches on four levels
//     (rows 17, 14, 11, 3) climbed by vines; three ways down into the
//     Burrows (holes at cols 6-7 and 24-25, the ravine at cols 39-42).
//   - Stream & mill (cols 50-99): the stream crossed on two stepping stones,
//     the mill wheel that lifts the player to the mill roof, the waterfall
//     into the cavern below.
//   - Wheat field (cols 100-149): hay bales to push under the loft, the
//     brambles, and the well whose ladder goes down to the Old Keep's door.
//   - Cliff (cols 150-199): a zigzag chimney inside it, the crag with the
//     Crystal Vein, and the trail up to the observatory.
//
// Underground: the Roots under the forest edge (the Burrows, the Root Shaft,
// the Root Hall, the Black Pool, the Maze — and in it the crack into the
// Glow Grotto), the river, Millstone Hall and the cistern under the stream,
// the Vaulted Cellars under the field, the Heart of the Cliff under the
// cliff, and at the bottom the Great Gallery joining them.

const T = TILE_SIZE;

// Row of the surface grass.
const GRASS_ROW = 20;

// ---------------------------------------------------------------------------
// Decorations. All draw at origin (0, 0) with the visible base on the y=0
// line, extending upward into negative y.
//
// Only the stones are still drawn here. Everything that grows moved to
// @entities/plants once the flora sketchbook needed to draw it too — these
// two have no page, and a book called FLORA holding gravel would be worse
// than a shorter book.
// ---------------------------------------------------------------------------

function drawBoulder(g: Graphics): void {
  const stone = DB32.heather;
  const stoneHi = DB32.lightSteel;
  const ink = DB32.valhalla;
  g.rect(-3, -5, 6, 5).fill(stone);
  g.rect(-3, -5, 6, 1).fill(stoneHi);
  g.rect(-3, -5, 1, 5).fill(ink);
  g.rect(2, -5, 1, 5).fill(ink);
  g.rect(-3, -1, 6, 1).fill(ink);
  g.rect(0, -3, 1, 1).fill(ink);
}

function drawPebbles(g: Graphics): void {
  const stone = DB32.heather;
  const stoneHi = DB32.lightSteel;
  g.rect(-2, -2, 2, 2).fill(stone);
  g.rect(-2, -2, 2, 1).fill(stoneHi);
  g.rect(0, -1, 2, 1).fill(stone);
}

// Convenience constructors for placing decorations on a tile row. The plant
// pair take a species rather than a drawing: that is what earns the thing a
// page in the flora book, and looking the drawing up by the same name is what
// keeps a bush from ever being planted under the oak's id.
const onRow = (col: number, row: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * T + 8,
  y: row * T,
  draw,
});

const plantOn = (col: number, row: number, species: FloraId): DecorationSpec => ({
  ...onRow(col, row, PLANTS[species].draw),
  species,
});

const plantOnGrass = (col: number, species: FloraId): DecorationSpec => plantOn(col, GRASS_ROW, species);

// A place for a prop: its column, the row (of the floor tile it stands on, or
// of the cell under the ceiling it hangs from), and which variant it is.
type PropSpot = readonly [number, number, number];

// Props standing on a floor tile, and props hanging from a ceiling: either
// way the origin is the tile edge the prop touches.
const standingOn = (prop: (variant: number) => (g: Graphics) => void, at: readonly PropSpot[]): DecorationSpec[] =>
  at.map(([col, row, variant]) => onRow(col, row, prop(variant)));
const hangingFrom = standingOn;

const plantsOn = (species: FloraId, at: readonly (readonly [number, number])[]): DecorationSpec[] =>
  at.map(([col, row]) => plantOn(col, row, species));

const MEADOW_DECORATIONS: DecorationSpec[] = [
  // Forest edge — the trees the canopy's branches seem to grow out of.
  plantOnGrass(12, 'giant-tree'),
  plantOnGrass(15, 'bush'),
  plantOnGrass(19, 'tall-oak'),
  plantOnGrass(29, 'pine-tree'),
  plantOnGrass(33, 'giant-tree'),
  plantOnGrass(37, 'bush'),
  plantOnGrass(45, 'small-tree'),
  plantOnGrass(48, 'pine-tree'),

  // Stream & mill
  onRow(55, GRASS_ROW, drawPebbles),
  plantOnGrass(59, 'bush'),
  plantOnGrass(86, 'tall-oak'),
  plantOn(92, 18, 'small-tree'),
  plantOnGrass(98, 'bush'),

  // Wheat field — sunflowers along the edge of the field.
  plantOnGrass(103, 'sunflower'),
  plantOnGrass(110, 'sunflower'),
  plantOnGrass(115, 'sunflower'),
  plantOnGrass(126, 'heather'),
  plantOnGrass(138, 'apple-tree'),
  plantOnGrass(144, 'sunflower'),

  // Cliff foot and crag
  onRow(150, GRASS_ROW, drawBoulder),
  plantOnGrass(157, 'pine-tree'),
  plantOnGrass(166, 'small-tree'),
  plantOn(178, 4, 'heather'),
  onRow(188, 4, drawPebbles),

  // The two glowcaps the crystal gallery's moths circle.
  plantOn(174, 35, 'glowcap'),
  plantOn(194, 35, 'glowcap'),

  // The underground, so that going down is never into an empty cave: every
  // few tiles of floor and of ceiling something that belongs to the stone
  // there — roots out of the earth, stalactites and stalagmites, crystal in
  // the cliff, cobwebs, sacks, bones and braziers in the cellars, the
  // miner's props of the Great Gallery. Placed by rule over the tilemap
  // (every few tiles, by a hash of the cell, clear of every landmark, cairn,
  // door and block) and written out here, so each one can be moved by hand.
  ...hangingFrom(hangingRoots, [
    [5, 40, 0],
    [11, 30, 0],
    [12, 23, 5],
    [15, 40, 2],
    [16, 31, 1],
    [18, 23, 3],
    [27, 40, 5],
    [28, 31, 0],
    [30, 27, 5],
    [32, 31, 3],
    [39, 40, 1],
    [46, 27, 3],
  ]),
  ...hangingFrom(stalactite, [
    [4, 77, 5],
    [6, 81, 5],
    [10, 77, 1],
    [12, 81, 5],
    [14, 85, 4],
    [18, 81, 3],
    [22, 85, 5],
    [24, 77, 0],
    [25, 60, 5],
    [26, 85, 2],
    [29, 60, 2],
    [34, 85, 1],
    [40, 85, 5],
    [42, 77, 1],
    [44, 81, 3],
    [46, 59, 5],
    [47, 46, 3],
    [48, 67, 0],
    [48, 73, 1],
    [51, 64, 5],
    [51, 76, 3],
    [52, 31, 1],
    [52, 37, 2],
    [52, 49, 2],
    [53, 70, 2],
    [54, 29, 2],
    [55, 52, 5],
    [63, 86, 4],
    [67, 40, 4],
    [67, 64, 3],
    [69, 48, 1],
    [71, 62, 2],
    [75, 40, 5],
    [75, 86, 1],
    [77, 64, 0],
    [79, 62, 5],
    [83, 48, 1],
    [83, 86, 4],
    [85, 40, 0],
    [89, 86, 2],
    [91, 40, 5],
    [91, 62, 0],
    [92, 25, 0],
    [93, 48, 4],
    [95, 86, 2],
    [96, 27, 5],
    [99, 40, 0],
    [99, 86, 4],
    [103, 86, 1],
    [112, 27, 3],
    [116, 27, 3],
    [126, 27, 1],
    [132, 27, 3],
    [136, 27, 2],
    [154, 59, 1],
    [157, 38, 3],
    [159, 48, 5],
    [164, 73, 3],
    [166, 33, 5],
    [166, 55, 3],
    [168, 49, 1],
    [168, 81, 5],
    [173, 84, 1],
    [174, 79, 1],
    [175, 74, 1],
    [185, 44, 5],
  ]),
  ...hangingFrom(hangingCrystal, [
    [153, 38, 0],
    [158, 53, 0],
    [160, 67, 4],
    [165, 86, 4],
    [168, 77, 0],
    [175, 86, 0],
    [177, 60, 0],
    [179, 70, 4],
    [187, 26, 0],
  ]),
  ...hangingFrom(cobweb, [
    [105, 36, 2],
    [109, 36, 1],
    [110, 79, 1],
    [112, 43, 3],
    [113, 36, 3],
    [115, 56, 4],
    [115, 86, 4],
    [117, 72, 0],
    [119, 36, 1],
    [119, 46, 0],
    [119, 56, 5],
    [121, 72, 4],
    [123, 86, 1],
    [127, 46, 3],
    [127, 72, 4],
    [129, 56, 5],
    [133, 36, 4],
    [133, 46, 3],
    [133, 72, 4],
    [139, 46, 0],
    [139, 56, 1],
    [139, 72, 5],
    [139, 86, 3],
    [141, 60, 4],
    [143, 36, 4],
    [143, 46, 3],
    [143, 56, 0],
    [143, 72, 4],
    [147, 46, 5],
    [149, 38, 4],
    [149, 86, 4],
  ]),
  ...standingOn(stalagmite, [
    [5, 56, 0],
    [14, 84, 0],
    [23, 84, 3],
    [25, 80, 3],
    [33, 88, 3],
    [45, 80, 0],
    [47, 54, 0],
    [47, 75, 3],
    [48, 33, 3],
    [51, 63, 3],
    [51, 75, 3],
    [52, 42, 3],
    [53, 51, 0],
    [54, 69, 3],
    [57, 59, 3],
    [64, 57, 0],
    [163, 76, 5],
    [193, 35, 5],
  ]),
  ...standingOn(pebbles, [
    [5, 88, 4],
    [10, 56, 4],
    [18, 33, 4],
    [20, 88, 4],
    [22, 27, 4],
    [28, 30, 0],
    [34, 30, 2],
    [37, 88, 4],
    [39, 30, 4],
    [46, 48, 1],
    [47, 84, 4],
    [48, 45, 1],
    [48, 60, 1],
    [48, 89, 4],
    [51, 89, 4],
    [52, 82, 4],
    [53, 28, 1],
    [54, 89, 5],
    [57, 34, 2],
    [69, 57, 4],
    [89, 89, 2],
    [102, 29, 4],
    [104, 89, 5],
    [105, 42, 1],
    [107, 75, 4],
    [111, 52, 4],
    [128, 89, 2],
    [137, 89, 0],
    [141, 59, 4],
    [144, 67, 4],
    [152, 42, 4],
    [158, 89, 2],
    [164, 89, 4],
    [167, 90, 2],
    [170, 51, 4],
    [190, 35, 4],
  ]),
  ...standingOn(crystalCluster, [
    [155, 42, 0],
    [158, 42, 1],
    [159, 45, 1],
    [164, 37, 0],
    [167, 78, 0],
    [169, 80, 1],
    [170, 90, 1],
    [175, 35, 0],
    [177, 73, 1],
    [188, 30, 0],
  ]),
  ...standingOn(bones, [
    [72, 89, 1],
    [86, 89, 1],
    [110, 81, 1],
    [111, 78, 1],
    [112, 29, 5],
    [118, 89, 1],
    [121, 42, 1],
    [125, 89, 1],
    [134, 52, 5],
    [134, 89, 1],
    [137, 81, 1],
    [145, 52, 1],
  ]),
  ...standingOn(sack, [
    [112, 67, 2],
    [114, 81, 0],
    [115, 52, 2],
    [124, 42, 0],
    [127, 67, 0],
    [138, 52, 0],
    [145, 42, 2],
    [146, 81, 2],
  ]),
  ...standingOn(brazier, [
    [112, 42, 3],
    [127, 81, 3],
    [131, 42, 3],
  ]),
  ...standingOn(mineProp, [
    [64, 89, 0],
    [76, 89, 0],
    [88, 89, 0],
    [112, 89, 0],
    [124, 89, 0],
    [136, 89, 0],
    [160, 89, 0],
  ]),
  ...plantsOn('mushroom', [
    [4, 26],
    [7, 80],
    [10, 26],
    [15, 33],
    [25, 28],
    [25, 33],
    [26, 88],
    [28, 56],
    [30, 33],
    [31, 30],
    [37, 56],
    [37, 80],
    [42, 56],
    [43, 88],
    [47, 66],
    [49, 80],
    [50, 54],
    [51, 69],
    [53, 48],
    [54, 75],
    [57, 31],
    [78, 57],
  ]),
  ...plantsOn('shelf-fungus', [[58, 28]]),
  ...plantsOn('glowcap', [
    [169, 76],
    [173, 73],
    [175, 90],
  ]),
  ...plantsOn('glow-moss', [
    [159, 66],
    [162, 42],
    [163, 54],
    [175, 85],
  ]),
];

// ---------------------------------------------------------------------------
// Doors and spawn points
//   default          - first arrival: on the forest edge's grass, two steps
//                      east of the starting cairn (1), so the cairn shows.
//   from-keep        - back out of the Old Keep: beside its door (23) at the
//                      foot of the well.
//   from-grotto      - back out of the grotto: beside the crack (43) at the
//                      west end of the Maze's bottom gallery.
//   from-observatory - back down the trail: on the crag (45).
// The spawn ids are the ones the keep, the grotto and the observatory have
// always targeted; only their coordinates moved.
// ---------------------------------------------------------------------------

// The Old Keep's door, on the dark-stone floor of the well's foot (row 30).
const KEEP_DOOR_X = 134 * T + 8;
const KEEP_DOOR_Y = 30 * T;

// The crack into the Glow Grotto, at the west end of the Maze's bottom
// gallery (floor at row 88, two tiles of headroom).
const GROTTO_CRACK_X = 9 * T;
const GROTTO_CRACK_Y = 88 * T;

// The hollow at the foot of the forest's tall oak (col 19): the way down its
// taproot to the grotto's daylight crack, the far end of the grotto's Roots.
const OAK_HOLLOW_X = 19 * T + 8;
const OAK_HOLLOW_Y = GRASS_ROW * T;

// The trail head up to the observatory, on the crag east of the secret
// chimney's mouth (col 191).
const TRAIL_GATE_X = 196 * T + 8;
const TRAIL_GATE_Y = 4 * T;

// Player AABB top-left standing on a row, in a column.
const standing = (col: number, row: number) => ({ x: col * T + 2, y: (row - 1) * T });

// ---------------------------------------------------------------------------
// What moves, and what keeps the player's place
// ---------------------------------------------------------------------------

// The cairns (checkpoints), by marker: each lit the first time the player
// walks past it, and the last one passed is where a bramble sends them back.
const CAIRNS: readonly (readonly [string, number, number])[] = [
  ['start', 9, GRASS_ROW], // 1, the starting cairn
  ['stream', 54, GRASS_ROW], // 11
  ['field', 101, GRASS_ROW], // 16
  ['cliff', 153, GRASS_ROW], // 24
  ['burrows', 16, 26], // 30
  ['root-hall', 14, 56], // 33
  ['maze', 40, 88], // 40
  ['cistern', 70, 66], // 50
  ['gold-cellar', 118, 42], // 52
  ['crypt', 118, 81], // 58
  ['gallery', 100, 89], // 64
];

// The mill wheel (13): its hub over the stream's east bank, a paddle's
// reach (48 px) above the water at its foot and below the mill's eaves at
// its top — a step off the top paddle onto the roof (row 12).
const MILL_WHEEL = { x: 73 * T, y: 17 * T, radius: 48 };

// The underground river (46), its two rows of water and the air over them,
// flowing east to the cascade into the cistern.
const RIVER_CURRENT = { area: { col: 58, row: 40, cols: 47, rows: 4 }, speed: 30 };

const MEADOW_SPAWNS: SpawnPoint[] = [
  { id: 'default', ...standing(11, GRASS_ROW) },
  // One column east of the door, clear of its prompt-triggering overlap only
  // in the sense that E is never auto-fired on arrival (Input clears
  // `pressed` at endFrame), so landing in its range just shows the prompt.
  { id: 'from-keep', x: KEEP_DOOR_X + 10, y: KEEP_DOOR_Y - T },
  { id: 'from-grotto', ...standing(11, 88) },
  { id: 'from-grotto-oak', ...standing(21, GRASS_ROW) },
  { id: 'from-observatory', ...standing(194, 4) },
];

export const meadowLevel: LevelSpec = {
  id: 'meadow',
  name: 'The Meadow',
  rows: MEADOW_ROWS,
  spawns: MEADOW_SPAWNS,
  defaultSpawnId: 'default',
  landmarks: MEADOW_LANDMARKS,
  decorations: MEADOW_DECORATIONS,
  parallax: 'meadow',
  backdrop: 'cave',
  // The rock backdrop starts at the grass row so holes in the ground reveal
  // rock from above, not cornflower sky.
  rockBgStartRow: GRASS_ROW,
  // The cave everywhere under the grass, and over it the materials of each
  // network: the Vaulted Cellars' brick in the dark of an interior, the
  // Heart of the Cliff's granite as a grotto — both stopping above the Great
  // Gallery (rows 86-88), one cave from end to end. Above the grass, the two
  // chimneys inside the cliff show rock behind them, not sky.
  backdropRegions: [
    { col: 0, row: GRASS_ROW, cols: 200, rows: 96 - GRASS_ROW },
    { col: 105, row: 31, cols: 46, rows: 55, backdrop: 'indoor-dark' },
    { col: 151, row: 24, cols: 49, rows: 62, backdrop: 'grotto' },
    { col: 158, row: 11, cols: 12, rows: 9 },
    { col: 189, row: 5, cols: 5, rows: 15 },
  ],
  currents: [RIVER_CURRENT],
  openSky: true,
  createEntities(ctx: InteractContext): readonly Entity[] {
    return [
      ...CAIRNS.map(
        ([id, col, row]) => new Cairn({ id, col, row, lit: ctx.worldState.get(cairnLitFlag('meadow', id)) }),
      ),
      new MillWheel(MILL_WHEEL),
      // The hay bales (17, 20), either side of the loft, and the barrels of
      // the barrel cellar (56): one on its floor west of the first block, one
      // in the pit beyond it.
      new PushBlock({ col: 104, row: GRASS_ROW, look: BLOCK_LOOK.hay }),
      new PushBlock({ col: 118, row: GRASS_ROW, look: BLOCK_LOOK.hay }),
      new PushBlock({ col: 121, row: 67, look: BLOCK_LOOK.barrel }),
      new PushBlock({ col: 130, row: 67, look: BLOCK_LOOK.barrel }),

      new Door({
        id: 'meadow-keep-door',
        x: KEEP_DOOR_X,
        y: KEEP_DOOR_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-meadow',
        promptLabel: 'enter',
      }),
      new Door({
        id: 'meadow-grotto-crack',
        x: GROTTO_CRACK_X,
        y: GROTTO_CRACK_Y,
        targetLevelId: 'glow-grotto',
        targetSpawnId: 'from-meadow',
        promptLabel: 'squeeze through',
        drawBody: drawGrottoCrack,
      }),
      new Door({
        id: 'meadow-oak-hollow',
        x: OAK_HOLLOW_X,
        y: OAK_HOLLOW_Y,
        targetLevelId: 'glow-grotto',
        targetSpawnId: 'from-meadow-oak',
        promptLabel: 'climb down',
        drawBody: drawOakHollow,
      }),
      new Door({
        id: 'meadow-trail-gate',
        x: TRAIL_GATE_X,
        y: TRAIL_GATE_Y,
        targetLevelId: 'cairn-observatory',
        targetSpawnId: 'from-meadow',
        promptLabel: 'climb the hill',
        drawBody: drawTrailGate,
      }),

      ...meadowCreatures(),
    ];
  },
};

// Every creature in the meadow. Bounds are centre-x in pixels, inset 4 px
// from the tile edges so a body never visibly hangs off the end of its run.
function meadowCreatures(): Entity[] {
  const span = (from: number, to: number) => ({ minX: from * T + 4, maxX: (to + 1) * T - 4 });
  return [
    // Rabbits on the forest and field grass. The first paces the starting
    // grass, a few steps from the spawn: the game's hello.
    new Rabbit({ x: 14 * T, y: GRASS_ROW * T, speed: 32, ...span(10, 23), facing: 1 }),
    new Rabbit({ x: 34 * T, y: GRASS_ROW * T, speed: 28, ...span(26, 38), facing: -1 }),
    new Rabbit({ x: 104 * T, y: GRASS_ROW * T, speed: 30, ...span(97, 109), facing: 1 }),
    new Rabbit({ x: 145 * T, y: GRASS_ROW * T, speed: 26, ...span(136, 152), facing: -1 }),

    // Birds at the canopy and the cliff heights, each low enough to cross a
    // player standing on a branch or the crag. Body Y is posY-3..posY.
    new Bird({ x: 20 * T, y: 11 * T - 4, speed: 60, ...span(1, 48), facing: 1 }),
    new Bird({ x: 30 * T, y: 3 * T - 4, speed: 54, ...span(14, 40), facing: -1 }),
    new Bird({ x: 170 * T, y: 10 * T - 4, speed: 58, ...span(155, 199), facing: 1 }),
    new Bird({ x: 185 * T, y: 4 * T - 4, speed: 52, ...span(172, 199), facing: -1 }),

    // The owl of the Owl's Roost, at the west end of the loft.
    new Owl({ x: 111 * T + 8, y: 16 * T }),

    // Fish: the deep lake under the stream, the Black Pool, the cistern.
    // Each swims the middle of a water row (y = row*16 + 11).
    new Fish({ x: 76 * T, y: 27 * T + 11, speed: 24, ...span(66, 88), facing: 1, color: DB32.tahitiGold }),
    new Fish({ x: 70 * T, y: 34 * T + 11, speed: 26, ...span(62, 80), facing: -1, color: DB32.goldenFizz }),
    new Fish({ x: 30 * T, y: 72 * T + 11, speed: 22, ...span(25, 39), facing: 1, color: DB32.clairvoyant }),
    new Fish({ x: 10 * T, y: 66 * T + 11, speed: 20, ...span(6, 11), facing: -1, color: DB32.tahitiGold }),
    new Fish({ x: 82 * T, y: 76 * T + 11, speed: 24, ...span(78, 85), facing: 1, color: DB32.goldenFizz }),
    new Fish({ x: 100 * T, y: 74 * T + 11, speed: 22, ...span(98, 104), facing: -1, color: DB32.clairvoyant }),

    // The Heart of the Cliff: glowfish in the Crystal Lake, moths round the
    // glowcaps of the crystal gallery, bats in the Bat Hall.
    new Glowfish({ x: 186 * T, y: 54 * T + 11, speed: 18, ...span(177, 197), facing: 1 }),
    new Glowfish({ x: 190 * T, y: 57 * T + 11, speed: 14, ...span(177, 197), facing: -1 }),
    new Moth({ x: 174 * T + 8, y: 35 * T - 22, rx: 10, ry: 4, period: 2.9 }),
    new Moth({ x: 194 * T + 8, y: 35 * T - 22, rx: 12, ry: 5, period: 3.3 }),
    new Bat({ x: 155 * T, y: 59 * T }),
    new Bat({ x: 172 * T, y: 59 * T }),
    new Bat({ x: 176 * T, y: 64 * T }),
    new Bat({ x: 160 * T, y: 67 * T }),
    new Spores({ x: 170 * T, y: 25 * T, width: 26 * T, height: 9 * T }),
    new Spores({ x: 159 * T, y: 44 * T, width: 13 * T, height: 14 * T }),
    new Kelp({ x: 180 * T + 8, y: 59 * T, height: 30 }),
    new Kelp({ x: 189 * T + 8, y: 59 * T, height: 42 }),
    new Kelp({ x: 196 * T + 8, y: 59 * T, height: 24 }),
    new Newt({ x: 170 * T, y: 90 * T, ...span(166, 178) }),
    new Newt({ x: 160 * T, y: 69 * T, ...span(157, 165) }),
    new Snail({ x: 184 * T, y: 35 * T, ...span(179, 190) }),

    // The Roots: earthworms and moles in the Burrows and the Maze, a mouse
    // on the Root Hall's floor, the hare of the Hare's Larder at home in it,
    // a snail in the Maze's bottom gallery, fireflies over the Root Hall's
    // thorns, newts on the Black Pool's shore, kelp and an eel in its water.
    new Earthworm({ x: 6 * T, y: 26 * T, ...span(2, 11) }),
    new Mole({ x: 34 * T, y: 30 * T, ...span(28, 37) }),
    new Hare({ x: 20 * T, y: 33 * T, ...span(14, 32) }),
    new Mole({ x: 36 * T, y: 56 * T, ...span(28, 44) }),
    new Mouse({ x: 12 * T, y: 56 * T, ...span(8, 19) }),
    new Fireflies({ x: 24 * T, y: 52 * T }),
    new Fireflies({ x: 36 * T, y: 44 * T }),
    new Snail({ x: 38 * T, y: 88 * T, ...span(33, 43) }),
    new Mole({ x: 44 * T, y: 80 * T, ...span(41, 45) }),
    new Earthworm({ x: 26 * T, y: 84 * T, ...span(23, 27) }),
    new Kelp({ x: 8 * T + 8, y: 74 * T, height: 36 }),
    new Kelp({ x: 18 * T + 8, y: 74 * T, height: 48 }),
    new Kelp({ x: 33 * T + 8, y: 74 * T, height: 28 }),
    new Eel({ x: 14 * T, y: 72 * T + 8, speed: 20, ...span(6, 21) }),

    // Under the stream: newts along the cavern lake, a mouse in Millstone
    // Hall, an eel in the river and another through the cistern's pools,
    // kelp on their beds, fireflies by the forgotten millstones.
    new Newt({ x: 100 * T, y: 29 * T, ...span(90, 121) }),
    new Mouse({ x: 75 * T, y: 57 * T, ...span(62, 87) }),
    new Fireflies({ x: 72 * T, y: 54 * T }),
    new Eel({ x: 80 * T, y: 43 * T + 8, speed: 26, ...span(63, 101) }),
    new Eel({ x: 70 * T, y: 78 * T + 8, speed: 18, ...span(58, 101) }),
    new Kelp({ x: 61 * T + 8, y: 81 * T, height: 40 }),
    new Kelp({ x: 72 * T + 8, y: 81 * T, height: 52 }),
    new Kelp({ x: 90 * T + 8, y: 81 * T, height: 34 }),

    // The Vaulted Cellars: mice in three of them, a snail in the ossuary.
    new Mouse({ x: 120 * T, y: 42 * T, ...span(110, 127) }),
    new Mouse({ x: 140 * T, y: 42 * T, ...span(133, 148) }),
    new Snail({ x: 136 * T, y: 52 * T, ...span(121, 145) }),
    new Mouse({ x: 124 * T, y: 81 * T, ...span(110, 139) }),

    // The Great Gallery: a mole, an earthworm, fireflies by the lantern.
    new Mole({ x: 100 * T, y: 89 * T, ...span(81, 119) }),
    new Earthworm({ x: 150 * T, y: 89 * T, ...span(134, 165) }),
    new Fireflies({ x: 146 * T, y: 86 * T }),

    // Spiders, let down from the higher ceilings everywhere under the grass.
    ...SPIDERS.map(([col, row, drop]) => new Spider({ x: col * T + 8, y: row * T, drop })),
  ];
}

// Where a spider hangs: the column, the row under the ceiling it hangs from,
// and how far it lets itself down, px.
const SPIDERS: readonly (readonly [number, number, number])[] = [
  [21, 40, 40],
  [44, 40, 40],
  [49, 55, 30],
  [54, 70, 40],
  [50, 81, 28],
  [62, 48, 40],
  [85, 48, 40],
  [82, 62, 30],
  [115, 46, 40],
  [138, 46, 40],
  [126, 56, 40],
  [116, 72, 40],
  [139, 72, 40],
  [135, 83, 36],
  [166, 38, 40],
  [191, 44, 40],
  [164, 55, 40],
];

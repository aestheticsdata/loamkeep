import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { CAIRN_LOOK, Cairn, cairnLitFlag } from '@entities/cairn';
import { CrystalGate, gateOpenFlag } from '@entities/crystal-gate';
import { CrystalSwitch, crystalLitFlag } from '@entities/crystal-switch';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity, InteractContext } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { Glowfish } from '@entities/glowfish';
import { Kelp } from '@entities/kelp';
import { Moth } from '@entities/moth';
import { Newt } from '@entities/newt';
import { type FloraId, PLANTS } from '@entities/plants';
import { SHUTTLE_LOOK, Shuttle } from '@entities/shuttle';
import { Snail } from '@entities/snail';
import { Spores } from '@entities/spores';
import { Updraft } from '@entities/updraft';
import type { LevelSpec, SpawnPoint, TileRect, WaterCurrent } from '@world/level';
import {
  barrow,
  crystalShards,
  daylightShaft,
  drawRoots,
  giantGlowcap,
  hangingShards,
  orePile,
  pitProp,
  rootlet,
} from '@world/levels/glow-grotto-decor';
import { GLOW_GROTTO_LANDMARKS } from '@world/levels/glow-grotto-landmarks';
import { GLOW_GROTTO_ROWS } from '@world/levels/glow-grotto-rows';
import type { Graphics } from 'pixi.js';

// The Glow Grotto — a whole underground country past the far end of the
// meadow's lower maze, lit only by what grows and swims in it.
//
// 300 wide × 124 tall, all of it under rock (the tilemap, and how it differs
// from design_handoff_level_02_glow_grotto_v2, is in glow-grotto-rows.ts; its
// landmarks in glow-grotto-landmarks.ts). The crack from the maze opens on the
// upper gallery (row 12), in the old grotto, top left (rows 0-89, cols 0-159):
//
//   The mushroom forest (rows 6-39, cols 20-58) — the gallery's shelf runs
//     out over it, and you drop off its end. Up again on the west by a chain
//     of puffballs (floor → row 33 → row 26 → row 19 → the shelf, each with a
//     column of air before the next ledge), or on the
//     east by a zigzag of ledges three rows apart to the top tunnel's lip.
//     The Mother Glowcap stands on the forest floor.
//   The top tunnel (rows 10-13, floor 14) — east from the forest to the echo
//     chamber, over the root shaft, whose ladder drops out of its floor at
//     col 63 between two lips.
//   The deep warrens — a root ladder from the forest floor (col 38) down
//     through W1 to W3; a crawlway one row high west from W1 to W2; a pool in
//     W3; and a tunnel east from W3 to the foot of the shaft and the lake.
//   The underground lake (rows 60-82) — two flooded arches to dive under,
//     an island, and the Drowned Lantern on another.
//   The echo chamber (rows 8-69, cols 121-156) — a ladder up its west wall,
//     then puffballs from ledge to ledge to the high shelf and the Spiral
//     Ring. The top tunnel comes in high on its west side.
//
// Then out of it, east and down:
//
//   The Crystal Caverns (cols 164-233, rows 6-48), east off the Spiral Ring's
//     shelf. Room A's three switch crystals, lit by touch, dissolve gate A
//     into Room B, whose ledges climb to the Singing Geode. A shaft from Room
//     A drops into the crystal pool; its three switches open gate B onto the
//     Wind Shaft.
//   The Wind Shaft (cols 234-245, rows 6-118) — an updraft up its middle is
//     the way up; every region east of the grotto lands on it.
//   The Roots of the Great Oak (cols 250-297, rows 4-44), off the shaft at
//     row 29: vines down to the floor, a way through the taproot's foot, the
//     Taproot under the daylight crack, and the crack up to the meadow.
//   The Abandoned Mine (cols 158-298, rows 52-118), down from the echo
//     chamber's floor: an entry hall, three galleries, a lift between them
//     and minecarts along them, the Ore Hall's scaffolds and the Blue Vein,
//     and the flooded mine under it all.
//   The Black Currents (cols 40-158, rows 91-118), down a water column from
//     the lake bed: an underground sea, three islands, a current east above
//     and one west below, the Sunken Bell on its bed, and a way east under
//     its wall into the flooded mine.
//
// Every jump is two rows up, or three with a column of air before the ledge
// and nothing overhead, or a puffball's eight. glow-grotto.test.ts walks it:
// every place is reachable from the crack, and the crack from every place.

const T = TILE_SIZE;
const GALLERY_Y = 12 * T;
const FOREST_Y = 40 * T;
const LAKE_SHORE_Y = 70 * T;
const ECHO_Y = 70 * T;

const RETURN_DOOR_X = 3 * T + 8;

// The daylight crack up to the meadow (cols 280-281, rows 0-3): its door on
// the side root under it (row 10), in the light that comes down it.
const OAK_DOOR_X = 281 * T;
const OAK_DOOR_Y = 10 * T;

// Player AABB top-left standing on a row, in a column.
const standing = (col: number, row: number) => ({ x: col * T + 2, y: (row - 1) * T });

const GLOW_GROTTO_SPAWNS: SpawnPoint[] = [
  // On the gallery, two tiles right of the crack.
  { id: 'from-meadow', x: 5 * T + 2, y: GALLERY_Y - T },
  // Under the daylight crack, on the side root beside the Taproot.
  { id: 'from-meadow-oak', ...standing(280, 10) },
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

// The meadow end of the daylight crack: a hollow between two roots at the
// foot of the tall oak, black inside, with a little cyan from far below. 12
// wide × 10 tall, base on y = 0. Exported for the meadow, as the crack is.
export function drawOakHollow(g: Graphics): void {
  g.rect(-6, -6, 12, 6).fill(DB32.oiledCedar);
  g.rect(-4, -9, 8, 3).fill(DB32.oiledCedar);
  g.rect(-6, -6, 1, 6).fill(DB32.rope);
  g.rect(-4, -9, 8, 1).fill(DB32.rope);
  g.rect(-3, -7, 6, 7).fill(DB32.black);
  g.rect(-2, -8, 4, 1).fill(DB32.black);
  g.rect(-1, -2, 2, 1).fill(DB32.venice);
  g.rect(0, -4, 1, 1).fill(DB32.viking);
  // The roots either side of it, running into the grass.
  g.rect(-9, -2, 3, 2).fill(DB32.oiledCedar);
  g.rect(6, -3, 3, 3).fill(DB32.oiledCedar);
  g.rect(-9, -2, 3, 1).fill(DB32.rope);
  g.rect(6, -3, 3, 1).fill(DB32.rope);
}

// What comes down the daylight crack from the meadow end of it: roots to climb
// by, hanging from the crack to the side root, and the day on them. 10 wide,
// base on y = 0 as every door's is.
function drawOakCrack(g: Graphics): void {
  drawGlow(g, { x: 0, y: -24, radius: 14, color: DB32.goldenFizz });
  for (const [x, top] of [
    [-4, -44],
    [-1, -52],
    [2, -40],
    [4, -48],
  ] as const) {
    g.rect(x, top, 1, -top).fill(DB32.rope);
    for (let y = top + 5; y < -2; y += 7) g.rect(x - 1, y, 3, 1).fill(DB32.twine);
  }
  g.rect(-5, -1, 11, 1).fill(DB32.eltGreen);
}

// ---------------------------------------------------------------------------
// What moves, what lights, and what keeps the player's place
// ---------------------------------------------------------------------------

// The glowcap lanterns (checkpoints), by marker: the grotto's cairns.
const LANTERNS: readonly (readonly [string, number, number])[] = [
  ['gallery', 7, 12], // 5
  ['caverns', 165, 21], // 7
  ['wind-shaft', 235, 21], // 18
  ['roots', 252, 45], // 19
  ['mine', 165, 70], // 24
  ['ore-hall', 255, 58], // 29
  // On the first island, which stands a row lower than the handoff's.
  ['black-currents', 63, 94], // 36
];

// The switch crystals (8-10, 13-15): the crystal tiles each one is, and the
// note it rings — a major chord a room, rising west to east.
interface SwitchPlace {
  id: string;
  area: TileRect;
  pitch: number;
}

export const GLOW_GROTTO_SWITCHES: readonly SwitchPlace[] = [
  { id: 'a1', area: { col: 168, row: 18, cols: 3, rows: 3 }, pitch: 523.25 },
  { id: 'a2', area: { col: 176, row: 16, cols: 3, rows: 5 }, pitch: 659.25 },
  { id: 'a3', area: { col: 184, row: 14, cols: 3, rows: 7 }, pitch: 783.99 },
  { id: 'b1', area: { col: 180, row: 39, cols: 4, rows: 1 }, pitch: 440 },
  { id: 'b2', area: { col: 196, row: 39, cols: 4, rows: 1 }, pitch: 554.37 },
  { id: 'b3', area: { col: 212, row: 39, cols: 4, rows: 1 }, pitch: 659.25 },
];

// The crystal gates (11, 16), and the switches that open each.
interface GatePlace {
  id: string;
  area: TileRect;
  switches: readonly string[];
}

export const GLOW_GROTTO_GATES: readonly GatePlace[] = [
  { id: 'gateA', area: { col: 191, row: 8, cols: 1, rows: 13 }, switches: ['a1', 'a2', 'a3'] },
  { id: 'gateB', area: { col: 229, row: 39, cols: 1, rows: 4 }, switches: ['b1', 'b2', 'b3'] },
];

// The Black Currents (33): east through the upper water, west through the
// lower, both about as fast as half a swimmer's stroke.
const CURRENTS: readonly WaterCurrent[] = [
  { area: { col: 40, row: 98, cols: 119, rows: 5 }, speed: 30 },
  { area: { col: 40, row: 110, cols: 119, rows: 5 }, speed: -30 },
];

// The mine's shuttles: the minecarts (25, 31) on the upper and lower
// galleries' rails, and the lift (26) in its shaft from the upper gallery to
// the lower, past the middle one.
const MINECART = { w: 2 * T, h: T, speed: 32, pause: 1 };

// ---------------------------------------------------------------------------
// Decorations
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

// The same prop at several spots, a variant each: [col, row] pairs, where row
// is the tile a standing prop stands on, or the one under a ceiling a
// hanging prop hangs from.
const props = (draw: (variant: number) => (g: Graphics) => void, spots: readonly (readonly [number, number])[]) =>
  spots.map(([col, row], i) => at(col, row, draw(i)));

const GLOW_GROTTO_DECORATIONS: DecorationSpec[] = [
  // The gallery.
  plant(7, 12, 'glowcap'),
  plant(9, 12, 'glow-moss'),
  plant(14, 12, 'shelf-fungus'),
  plant(18, 12, 'glowcap'),
  plant(26, 12, 'glow-moss'),
  plant(31, 12, 'glowcap'),
  // The forest: a wood of giant glowcaps, and the small ones under them.
  at(25, 40, giantGlowcap(40)),
  at(31, 40, giantGlowcap(52)),
  at(47, 38, giantGlowcap(36)),
  at(54, 40, giantGlowcap(46)),
  plant(23, 40, 'glow-moss'),
  plant(28, 40, 'glowcap'),
  plant(34, 40, 'glow-moss'),
  plant(36, 40, 'glowcap'),
  plant(45, 38, 'glowcap'),
  plant(50, 40, 'shelf-fungus'),
  plant(26, 33, 'glowcap'),
  plant(31, 26, 'glow-moss'),
  plant(38, 19, 'glowcap'),
  plant(52, 29, 'shelf-fungus'),
  plant(56, 20, 'glowcap'),
  // The top tunnel and the roots over the shaft.
  plant(70, 14, 'glow-moss'),
  plant(88, 14, 'glowcap'),
  plant(110, 14, 'glow-moss'),
  { x: 60 * T, y: 10 * T, draw: drawRoots },
  { x: 92 * T, y: 10 * T, draw: drawRoots },
  // The warrens.
  plant(28, 58, 'glowcap'),
  plant(42, 58, 'shelf-fungus'),
  plant(7, 58, 'glowcap'),
  plant(9, 58, 'glow-moss'),
  plant(25, 70, 'glowcap'),
  plant(40, 70, 'glow-moss'),
  plant(55, 70, 'glowcap'),
  // The lake's shores and island.
  plant(64, 70, 'glow-moss'),
  plant(77, 69, 'glowcap'),
  plant(96, 69, 'glow-moss'),
  plant(114, 70, 'glowcap'),
  plant(118, 70, 'shelf-fungus'),
  // The echo chamber.
  plant(125, 70, 'glowcap'),
  plant(136, 70, 'glow-moss'),
  plant(145, 70, 'glowcap'),
  plant(125, 40, 'glow-moss'),
  plant(131, 33, 'glowcap'),
  plant(137, 26, 'glow-moss'),
  plant(143, 19, 'glowcap'),
  plant(148, 13, 'glowcap'),
  plant(154, 13, 'glow-moss'),
  plant(142, 52, 'shelf-fungus'),
  plant(153, 55, 'glowcap'),

  // The Crystal Caverns: shards on the floors and the pool's columns, and
  // hanging from every roof.
  ...props(crystalShards, [
    [167, 21],
    [189, 21],
    [201, 21],
    [210, 21],
    [222, 21],
    [231, 21],
    [192, 43],
    [207, 43],
    [230, 43],
  ]),
  ...props(hangingShards, [
    [170, 8],
    [181, 8],
    [188, 8],
    [196, 6],
    [206, 6],
    [214, 6],
    [227, 6],
    [184, 34],
    [199, 34],
    [214, 34],
    [225, 34],
  ]),
  plant(164, 21, 'glow-moss'),
  plant(213, 11, 'glow-moss'),
  // The Roots: the daylight down the crack, rootlets under every side root,
  // roots through the roof, moss and fungus on the floor.
  at(281, 4, daylightShaft(6 * T)),
  ...props(rootlet, [
    [264, 15],
    [254, 31],
    [253, 39],
    [282, 11],
    [289, 21],
    [278, 28],
    [292, 34],
    [265, 25],
  ]),
  ...[252, 258, 263, 285, 291, 296].map((col) => ({ x: col * T + 8, y: 4 * T, draw: drawRoots })),
  plant(255, 45, 'mushroom'),
  plant(266, 45, 'glow-moss'),
  plant(276, 45, 'mushroom'),
  plant(281, 45, 'glow-moss'),
  plant(294, 45, 'shelf-fungus'),
  plant(256, 30, 'shelf-fungus'),
  plant(290, 20, 'mushroom'),
  // The mine: pit-props holding up every gallery, spoil, a barrow.
  ...[168, 178].map((col) => at(col, 70, pitProp(32))),
  ...[192, 200, 214, 226].map((col) => at(col, 62, pitProp(4 * T))),
  ...[165, 180, 200, 228].map((col) => at(col, 80, pitProp(4 * T))),
  ...[165, 180, 195, 215, 262, 290].map((col) => at(col, 100, pitProp(4 * T))),
  ...props(orePile, [
    [161, 70],
    [210, 80],
    [205, 100],
    [270, 100],
    [260, 66],
    [290, 66],
    [262, 74],
    [292, 82],
  ]),
  at(175, 70, barrow),
  at(254, 90, barrow),
  // The Black Currents' islands.
  plant(61, 94, 'glow-moss'),
  plant(65, 94, 'mushroom'),
  plant(111, 94, 'glowcap'),
  plant(115, 94, 'glow-moss'),
  plant(139, 94, 'glow-moss'),
  plant(143, 94, 'shelf-fungus'),
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
  // A back wall you can see, not a void: deep blue rock, grain and strata,
  // and cyan glints — the glowcaps' light caught in the stone.
  backdrop: 'grotto',
  rockBgStartRow: 0,
  currents: CURRENTS,
  openSky: false,
  createEntities(ctx: InteractContext): readonly Entity[] {
    const id = 'glow-grotto';
    return [
      new Door({
        id: 'grotto-return-door',
        x: RETURN_DOOR_X,
        y: GALLERY_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-grotto',
        promptLabel: 'leave',
        drawBody: drawGrottoCrack,
      }),
      new Door({
        id: 'grotto-oak-crack',
        x: OAK_DOOR_X,
        y: OAK_DOOR_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-grotto-oak',
        promptLabel: 'climb out',
        drawBody: drawOakCrack,
      }),
      ...LANTERNS.map(
        ([lantern, col, row]) =>
          new Cairn({
            id: lantern,
            col,
            row,
            look: CAIRN_LOOK.glowcap,
            lit: ctx.worldState.get(cairnLitFlag(id, lantern)),
          }),
      ),
      ...GLOW_GROTTO_SWITCHES.map(
        (s) => new CrystalSwitch({ ...s, lit: ctx.worldState.get(crystalLitFlag(id, s.id)) }),
      ),
      ...GLOW_GROTTO_GATES.map(
        (gate) => new CrystalGate({ ...gate, open: ctx.worldState.get(gateOpenFlag(id, gate.id)) }),
      ),
      // The updraft (17): up the Wind Shaft, and the stub of it under the
      // lower gallery's floor.
      new Updraft({ x: 238 * T, y: 12 * T, width: 4 * T, height: 84 * T }),
      new Updraft({ x: 238 * T, y: 101 * T, width: 4 * T, height: 3 * T }),
      new Shuttle({
        look: SHUTTLE_LOOK.minecart,
        from: { x: 183 * T, y: 61 * T },
        to: { x: 203 * T, y: 61 * T },
        ...MINECART,
      }),
      new Shuttle({
        look: SHUTTLE_LOOK.minecart,
        from: { x: 210 * T, y: 99 * T },
        to: { x: 297 * T, y: 99 * T },
        ...MINECART,
      }),
      new Shuttle({
        look: SHUTTLE_LOOK.lift,
        from: { x: 186 * T, y: 62 * T },
        to: { x: 186 * T, y: 100 * T },
        w: 3 * T,
        h: T,
        speed: 40,
        pause: 1.5,
      }),
      ...grottoCreatures(),
      ...newRegionCreatures(),
    ];
  },
};

// The old grotto's creatures, where they have always been.
function grottoCreatures(): Entity[] {
  return [
    // Moths round the glowcaps: low ones over the gallery and the forest
    // floor that a walker meets, higher ones over the giants.
    new Moth({ x: 7 * T + 8, y: GALLERY_Y - 12, rx: 10, ry: 4, period: 3.1 }),
    new Moth({ x: 28 * T + 8, y: FOREST_Y - 12, rx: 14, ry: 5, period: 3.4 }),
    new Moth({ x: 31 * T + 8, y: FOREST_Y - 60, rx: 22, ry: 8, period: 4.2 }),
    new Moth({ x: 54 * T + 8, y: FOREST_Y - 52, rx: 18, ry: 6, period: 3.7 }),
    new Moth({ x: 45 * T + 8, y: 38 * T - 12, rx: 10, ry: 4, period: 2.8 }),
    new Moth({ x: 88 * T + 8, y: 14 * T - 12, rx: 12, ry: 4, period: 3.0 }),
    new Moth({ x: 145 * T + 8, y: ECHO_Y - 12, rx: 14, ry: 5, period: 3.3 }),
    new Moth({ x: 148 * T + 8, y: 13 * T - 14, rx: 10, ry: 5, period: 2.6 }),
    // Snails on the ledges and in the warrens.
    new Snail({ x: 52 * T, y: 35 * T, minX: 51 * T + 4, maxX: 54 * T - 4 }),
    new Snail({ x: 56 * T, y: 26 * T, minX: 55 * T + 4, maxX: 58 * T - 4 }),
    new Snail({ x: 30 * T, y: 58 * T, minX: 27 * T, maxX: 37 * T }),
    new Snail({ x: 136 * T, y: 48 * T, minX: 135 * T + 4, maxX: 138 * T - 4 }),
    // Bats under the top tunnel's roof, the warrens' and the echo chamber's.
    new Bat({ x: 75 * T, y: 10 * T }),
    new Bat({ x: 104 * T, y: 10 * T }),
    new Bat({ x: 20 * T, y: 64 * T }),
    new Bat({ x: 33 * T, y: 52 * T }),
    new Bat({ x: 128 * T, y: 8 * T }),
    new Bat({ x: 136 * T, y: 8 * T }),
    new Bat({ x: 144 * T, y: 8 * T }),
    // Newts on the lake's shores, its island, and W3's pool.
    new Newt({ x: 116 * T, y: LAKE_SHORE_Y, minX: 112 * T + 4, maxX: 120 * T }),
    new Newt({ x: 77 * T, y: 69 * T, minX: 75 * T + 6, maxX: 80 * T - 6 }),
    new Newt({ x: 50 * T, y: LAKE_SHORE_Y, minX: 45 * T, maxX: 61 * T }),
    new Newt({ x: 28 * T, y: LAKE_SHORE_Y, minX: 23 * T, maxX: 37 * T }),
    new Newt({ x: 138 * T, y: ECHO_Y, minX: 135 * T, maxX: 142 * T }),
    // Spores rising through the big halls.
    new Spores({ x: 2 * T, y: 6 * T, width: 18 * T, height: 6 * T }),
    new Spores({ x: 20 * T, y: 6 * T, width: 39 * T, height: 34 * T }),
    new Spores({ x: 60 * T, y: 10 * T, width: 60 * T, height: 4 * T }),
    new Spores({ x: 26 * T, y: 52 * T, width: 19 * T, height: 6 * T }),
    new Spores({ x: 14 * T, y: 64 * T, width: 31 * T, height: 6 * T }),
    new Spores({ x: 64 * T, y: 60 * T, width: 57 * T, height: 10 * T }),
    new Spores({ x: 121 * T, y: 8 * T, width: 36 * T, height: 62 * T }),
    // Glowing kelp on the lake bed and in W3's pool.
    ...(
      [
        [67, 120],
        [69, 70],
        [72, 150],
        [74, 90],
        [81, 110],
        [83, 170],
        [88, 60],
        [90, 130],
        [99, 160],
        [104, 80],
        [107, 140],
        [110, 100],
      ] as const
    ).map(([col, height]) => new Kelp({ x: col * T + 8, y: 83 * T, height })),
    new Kelp({ x: 16 * T + 8, y: 75 * T, height: 50 }),
    new Kelp({ x: 19 * T + 8, y: 75 * T, height: 36 }),
    // Glowfish in the lake — between the islands, never through them — and
    // in W3's pool.
    new Glowfish({ x: 70 * T, y: 74 * T, speed: 18, minX: 66 * T + 6, maxX: 75 * T - 6 }),
    new Glowfish({ x: 88 * T, y: 78 * T, speed: 22, minX: 80 * T + 6, maxX: 92 * T - 6, facing: -1 }),
    new Glowfish({ x: 106 * T, y: 75 * T, speed: 16, minX: 103 * T + 6, maxX: 111 * T - 6 }),
    new Glowfish({ x: 104 * T, y: 80 * T, speed: 20, minX: 98 * T + 6, maxX: 111 * T - 6 }),
    new Glowfish({ x: 18 * T, y: 72 * T, speed: 12, minX: 15 * T + 6, maxX: 22 * T - 6 }),
  ];
}

// Bounds are centre-x in pixels, inset 4 px from the tile edges so a body
// never visibly hangs off the end of its run.
const span = (from: number, to: number) => ({ minX: from * T + 4, maxX: (to + 1) * T - 4 });

// The creatures past the three new openings.
function newRegionCreatures(): Entity[] {
  return [
    // The Crystal Caverns: moths round the crystal, bats under the roofs,
    // and fish and kelp in the gaps between the pool's columns.
    new Moth({ x: 176 * T, y: 12 * T, rx: 16, ry: 6, period: 3.6 }),
    new Moth({ x: 205 * T, y: 10 * T, rx: 20, ry: 6, period: 4.1 }),
    new Moth({ x: 225 * T, y: 15 * T, rx: 12, ry: 5, period: 3.2 }),
    new Moth({ x: 200 * T, y: 38 * T, rx: 24, ry: 4, period: 3.9 }),
    new Bat({ x: 180 * T, y: 8 * T }),
    new Bat({ x: 210 * T, y: 6 * T }),
    new Bat({ x: 205 * T, y: 34 * T }),
    new Glowfish({ x: 189 * T, y: 46 * T, speed: 12, ...span(188, 191) }),
    new Glowfish({ x: 209 * T, y: 47 * T, speed: 14, ...span(208, 211), facing: -1 }),
    ...[174, 189, 204, 219].map((col, i) => new Kelp({ x: col * T + 8, y: 49 * T, height: 30 + i * 8 })),
    // The Wind Shaft: spores on the air either side of the updraft.
    new Spores({ x: 234 * T, y: 6 * T, width: 12 * T, height: 90 * T }),
    // The Roots: moths in the day from the crack, bats in the roof.
    new Moth({ x: 258 * T, y: 20 * T, rx: 14, ry: 6, period: 3.4 }),
    new Moth({ x: 286 * T, y: 14 * T, rx: 18, ry: 6, period: 3.8 }),
    new Bat({ x: 262 * T, y: 4 * T }),
    new Bat({ x: 293 * T, y: 4 * T }),
    // The mine: bats in the galleries, snails on the Ore Hall's scaffolds.
    new Bat({ x: 170 * T, y: 56 * T }),
    new Bat({ x: 220 * T, y: 76 * T }),
    new Bat({ x: 270 * T, y: 52 * T }),
    new Snail({ x: 285 * T, y: 66 * T, ...span(280, 292) }),
    new Snail({ x: 255 * T, y: 74 * T, ...span(251, 268) }),
    new Snail({ x: 270 * T, y: 90 * T, ...span(262, 284) }),
    // The flooded mine, under it all.
    new Glowfish({ x: 190 * T, y: 112 * T, speed: 16, ...span(165, 213) }),
    new Glowfish({ x: 270 * T, y: 111 * T, speed: 18, ...span(252, 296), facing: -1 }),
    // The Black Currents: newts on the islands, fish and kelp in the sea.
    new Newt({ x: 63 * T, y: 94 * T, ...span(60, 66) }),
    new Newt({ x: 113 * T, y: 94 * T, ...span(110, 116) }),
    new Newt({ x: 141 * T, y: 94 * T, ...span(138, 144) }),
    new Glowfish({ x: 52 * T, y: 100 * T, speed: 20, ...span(41, 59) }),
    new Glowfish({ x: 95 * T, y: 104 * T, speed: 22, ...span(67, 109), facing: -1 }),
    new Glowfish({ x: 128 * T, y: 112 * T, speed: 18, ...span(117, 137) }),
    new Glowfish({ x: 150 * T, y: 99 * T, speed: 16, ...span(145, 158), facing: -1 }),
    ...[45, 52, 74, 95, 106, 124, 133, 150].map(
      (col, i) => new Kelp({ x: col * T + 8, y: 119 * T, height: 40 + ((i * 17) % 50) }),
    ),
  ];
}

import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { Bees } from '@entities/bees';
import { Bird } from '@entities/bird';
import { CAIRN_LOOK, Cairn, cairnLitFlag } from '@entities/cairn';
import { Clothesline } from '@entities/clothesline';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import { Embers } from '@entities/embers';
import type { Entity, InteractContext } from '@entities/entity';
import { FallingHazard, HAZARD_VARIANT } from '@entities/falling-hazard';
import { FallingLeaf } from '@entities/falling-leaf';
import { Fireflies } from '@entities/fireflies';
import { Fish } from '@entities/fish';
import { Frog } from '@entities/frog';
import { Hedgehog } from '@entities/hedgehog';
import { Hen } from '@entities/hen';
import { LEVER_LOOK, Lever, type LeverLook } from '@entities/lever';
import { MillWheel } from '@entities/mill-wheel';
import { Mouse } from '@entities/mouse';
import { type FloraId, PLANTS } from '@entities/plants';
import { Portcullis } from '@entities/portcullis';
import { PulsedUpdraft } from '@entities/pulsed-updraft';
import { Pumpkin } from '@entities/pumpkin';
import { BLOCK_LOOK, PushBlock } from '@entities/push-block';
import { Snail } from '@entities/snail';
import { Tank } from '@entities/tank';
import { WaspNest } from '@entities/wasp-nest';
import type { LevelSpec, SpawnPoint, TileRect, WaterCurrent } from '@world/level';
import { KITCHEN_GARDEN_LANDMARKS } from '@world/levels/kitchen-garden-landmarks';
import { KITCHEN_GARDEN_ROWS } from '@world/levels/kitchen-garden-rows';
import { hangingRoots } from '@world/levels/meadow-decor';
import { drawMoatGrate } from '@world/levels/old-keep';
import { HAZARD_LOOK, portcullisRows } from '@world/tilemap';
import type { Graphics } from 'pixi.js';

// The Kitchen Garden — the walled estate behind the keep, on an autumn
// evening, and everything the estate grew into over the wall and under the
// ground. The pumpkins live here. 340 wide × 150 tall (the rows, and how they
// differ from the handoff, are in kitchen-garden-rows.ts; the landmarks in
// kitchen-garden-landmarks.ts).
//
// Today's garden, west of the east wall (cols 0-169), as it always was —
// the ground is row 56:
//
//   The beds (cols 8-27) — raised beds, the pumpkins, the Sundial, and the
//     shed: up the compost bin (three high) onto its roof.
//   The greenhouse (cols 38-56) — a ladder up its west side through a hole
//     in its roof; staging inside two rows apart; the roof runs on east as a
//     vine-hung pergola to the first apple tree.
//   The orchard (cols 60-99) — apple tree A's branches, three rows apart on
//     two sides, climb from the ground to the pergola's end; tree B is low,
//     and its branch is the way over the sinkhole down to the Mole Warren.
//   The pond (cols 100-112) — frogs, fish, a flat stone in the middle.
//   The well (col 118) — a ladder down into the root cellar (rows 60-67):
//     shelves of jars, mice, the Seed Store; the hatch at col 148 back up,
//     and a trapdoor down to the Ice House.
//   The beehive meadow (cols 119-150) — hives, a scarecrow, and a puffball
//     that throws you up onto the hayrick.
//   The dovecote (cols 152-160) — doors east and west, a ladder up the
//     middle to the loft and the Dovecote landmark.
//   The east wall (cols 165-169) — a ladder up, and down its far side.
//
// Over the wall: the vineyard's terraces, climbed by their vines, the noria
// out of the millpond up to the pergola, the windpump, the wine cellar; the
// orangery, its staging over the cactus bed, its vent up to the cupola and
// the roof the clotheslines run down from; the boiler room under it, whose
// lever starts the vent; the yew maze and the estate well. Under it all: the
// Mole Warren and the culvert (and the grate to the keep's sewer), the frog
// grotto, the Ice House, the gear room, the pump house and its tank, the
// mushroom caves, the channel and its sluice, the badgers' sett, and the
// old aqueduct either side of the spring.
//
// kitchen-garden.test.ts walks it, the switches included: every place is
// reachable from the keep's door, and the door from every place.

const T = TILE_SIZE;
const GROUND_Y = 56 * T;
const BED_Y = 55 * T;
const CELLAR_Y = 68 * T;

const RETURN_DOOR_X = 5 * T;
// The middle of the shed's door, 29 px left of the shed's own middle
// (32 * T + 8), where drawShed used to draw it.
const SHED_DOOR_X = 30 * T + 11;
// The grate to the keep's sewer, in the culvert's west wall, on its walkway.
const MOAT_GRATE_X = 3 * T + 8;
const MOAT_GRATE_Y = 106 * T;

const KITCHEN_GARDEN_SPAWNS: SpawnPoint[] = [
  { id: 'from-keep', x: 7 * T + 2, y: GROUND_Y - T },
  { id: 'from-shed', x: SHED_DOOR_X - 6, y: GROUND_Y - T },
  // On the culvert's walkway, two tiles in from the grate the keep's sewer
  // comes out at.
  { id: 'from-keep-moat', x: 5 * T + 2, y: MOAT_GRATE_Y - T },
];

// ---------------------------------------------------------------------------
// What moves, what opens, and what keeps the player's place
// ---------------------------------------------------------------------------

// The pumpkin lanterns (checkpoints), by marker.
const LANTERNS: readonly (readonly [string, number, number])[] = [
  ['beds', 9, 56], // 6
  ['vineyard', 192, 53], // 10
  ['orangery', 240, 32], // 19
  ['boiler-room', 244, 71], // 27
  ['topiary', 302, 56], // 31
  ['well-chamber', 326, 83], // 35
  ['pump-house', 202, 100], // 39
  ['ice-house', 138, 94], // 44
  ['worm-hall', 74, 91], // 49
  ['culvert', 8, 106], // 55
  ['mushroom-caves', 240, 91], // 62
  ['west-aqueduct', 12, 141], // 72
  // On the walk, two tiles back from the bank it stood on, lowered to the
  // pool.
  ['spring', 148, 141], // 77
  ['east-aqueduct', 196, 141], // 84
];

// What the levers work (their switchIds, and the last part of their
// WorldState flags, `garden.<id>`), and the spring, which no lever works.
const SWITCH = {
  vents: 'vents',
  sluice: 'sluice',
  tank: 'tank',
  spring: 'spring',
} as const;

// The two pulsed updrafts: the orangery's vent (22), still until its lever
// is pulled, and the spring (76), blowing from the start.
const VENT_AREA: TileRect = { col: 264, row: 3, cols: 3, rows: 53 };
const SPRING_AREA: TileRect = { col: 168, row: 118, cols: 4, rows: 25 };

// The hot pipes in the boiler room (28), under their shimmer.
const HOT_PIPES: TileRect = { col: 252, row: 70, cols: 7, rows: 1 };

// The currents (38, 57, 75): all the water runs west to the moat, but for
// the east aqueduct's trough, which runs east to the walled-up arch.
const CURRENTS: readonly WaterCurrent[] = [
  { area: { col: 2, row: 111, cols: 69, rows: 6 }, speed: -30 },
  { area: { col: 70, row: 111, cols: 39, rows: 4 }, speed: -30 },
  { area: { col: 169, row: 109, cols: 169, rows: 4 }, speed: -30 },
  { area: { col: 8, row: 129, cols: 141, rows: 2 }, speed: -30 },
  { area: { col: 192, row: 129, cols: 141, rows: 2 }, speed: 30 },
];

// Where the underside of the ceiling over a tile is: the first solid tile
// up from it, in the rows.
function ceilingOver(col: number, row: number): number {
  let r = row;
  while (r > 0 && KITCHEN_GARDEN_ROWS[r - 1][col] === '.') r--;
  return r * T;
}

// The falling hazards: icicles over the Ice House's east tier (46), keystones
// in the aqueduct's arches by the markers (74, 83).
const ICICLES = [151, 155, 159, 162];
const KEYSTONES = [77, 82, 247, 253];

// A clothesline's tie, on its post over the tile the player stands on.
const tie = (col: number, row: number) => ({ x: col * T + 8, y: (row + 1) * T - 24 });

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

// Glass under a roof, `w` wide and `h` tall over its base: panes of faint
// glass between heather glazing bars every 32 px, three rows of them, and the
// odd white glint. The greenhouse's (304 x 224), and the orangery's, which is
// the same glass, scaled up to the whole hall.
function glassHouse(w: number, h: number): (g: Graphics) => void {
  return (g) => {
    g.rect(-w / 2, -h, w, h).fill({ color: DB32.lightSteel, alpha: 0.1 });
    for (let x = -w / 2; x <= w / 2; x += 32) g.rect(x, -h, 2, h).fill(DB32.heather);
    for (let y = -h; y < 0; y += Math.round(h / 3)) g.rect(-w / 2, y, w, 2).fill(DB32.heather);
    g.rect(-w / 2 + 2, -h + 2, 10, 60).fill({ color: DB32.white, alpha: 0.2 });
    g.rect(Math.round(w / 8), -Math.round((h * 5) / 8), 10, 50).fill({ color: DB32.white, alpha: 0.18 });
  };
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
  { x: 47 * T + 8, y: GROUND_Y, draw: glassHouse(304, 224), translucent: true },
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

  // The orangery's glass, wall to wall under its roof.
  { x: Math.round((237 * T + 298 * T) / 2), y: GROUND_Y, draw: glassHouse(61 * T, 48 * T), translucent: true },
  // The vineyard: the pergola's grapes, and what grows on the terraces.
  { x: 205 * T, y: 38 * T, draw: drawVines },
  plant(184, 53, 'sunflower'),
  plant(199, 50, 'squash'),
  plant(206, 47, 'bean-trellis'),
  plant(214, 41, 'squash'),
  plant(222, 37, 'sunflower'),
  // The orangery's floor and staging.
  plant(244, 56, 'squash'),
  plant(259, 56, 'sunflower'),
  plant(286, 56, 'bean-trellis'),
  plant(243, 53, 'squash'),
  // The mushroom caves and the warren.
  plant(242, 91, 'mushroom'),
  plant(254, 91, 'shelf-fungus'),
  plant(262, 91, 'mushroom'),
  plant(272, 99, 'mushroom'),
  ...[30, 38, 60].map((col) => at(col, 85, hangingRoots(col))),
  plant(80, 91, 'mushroom'),
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
  // Dark only where it is indoors: the root cellar, inside the dovecote, and
  // every room under the ground. The orangery is under glass instead (a
  // decoration), and the sky stays open over everything above the ground.
  backdrop: 'indoor-dark',
  rockBgStartRow: KITCHEN_GARDEN_ROWS.length,
  backdropRegions: [
    { col: 114, row: 56, cols: 37, rows: 12 },
    { col: 153, row: 18, cols: 7, rows: 38 },
    { col: 0, row: 57, cols: 340, rows: 93 },
  ],
  currents: CURRENTS,
  // Thorny roots underground, a cactus bed in the orangery, hot pipes in the
  // boiler room.
  hazardLooks: [
    { area: { col: 0, row: 0, cols: 340, rows: 150 }, look: HAZARD_LOOK.thornyRoots },
    { area: { col: 276, row: 55, cols: 4, rows: 1 }, look: HAZARD_LOOK.cactus },
    { area: HOT_PIPES, look: HAZARD_LOOK.hotPipes },
  ],
  openSky: true,
  createEntities(ctx: InteractContext): readonly Entity[] {
    const flag = (id: string) => `garden.${id}`;
    const lever = (id: string, at: readonly [number, number], look: LeverLook = LEVER_LOOK.lever) =>
      new Lever({
        id,
        x: at[0] * T + 8,
        y: at[1] * T,
        targets: [id],
        flag: flag(id),
        pulled: ctx.worldState.get(flag(id)),
        look,
      });
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
      // The grate (56) into the keep's sewer.
      new Door({
        id: 'garden-moat-grate',
        x: MOAT_GRATE_X,
        y: MOAT_GRATE_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-garden-moat',
        promptLabel: 'crawl through',
        drawBody: drawMoatGrate,
      }),
      ...LANTERNS.map(
        ([id, col, row]) =>
          new Cairn({
            id,
            col,
            row,
            look: CAIRN_LOOK.pumpkin,
            lit: ctx.worldState.get(cairnLitFlag('kitchen-garden', id)),
          }),
      ),
      // The noria (11), out of the millpond up to the pergola walk, and its
      // gear wheel (79) in the gear room.
      new MillWheel({ x: 185 * T, y: 47 * T, radius: 9 * T, paddles: 8 }),
      new MillWheel({ x: 182 * T, y: 93 * T, radius: 4 * T, period: 5 }),
      // The wine cellar's barrels (17) and the Ice House's blocks (45).
      new PushBlock({ col: 210, row: 67, look: BLOCK_LOOK.barrel }),
      new PushBlock({ col: 214, row: 67, look: BLOCK_LOOK.barrel }),
      new PushBlock({ col: 126, row: 94, look: BLOCK_LOOK.ice, slide: 2 }),
      new PushBlock({ col: 131, row: 94, look: BLOCK_LOOK.ice, slide: 2 }),
      // The vent, its lever (29), and the spring.
      new PulsedUpdraft({ id: SWITCH.vents, area: VENT_AREA, active: ctx.worldState.get(flag(SWITCH.vents)) }),
      new PulsedUpdraft({ id: SWITCH.spring, area: SPRING_AREA, active: true }),
      lever(SWITCH.vents, [283, 68]),
      // The sluice (37) and its lever in the coal store (36).
      new Portcullis({
        id: SWITCH.sluice,
        col: 250,
        row: 104,
        rows: portcullisRows(KITCHEN_GARDEN_ROWS, { col: 250, row: 104 }),
      }),
      lever(SWITCH.sluice, [292, 91]),
      // The tank (41) and its pump (40).
      new Tank({ id: SWITCH.tank, col: 214, cols: 9, low: 108, high: 78, full: false }),
      lever(SWITCH.tank, [207, 100], LEVER_LOOK.pump),
      // The clotheslines (69, 70).
      new Clothesline({ from: tie(237, 6), to: tie(228, 10) }),
      new Clothesline({ from: tie(219, 10), to: tie(161, 16) }),
      // The wasps' nest (15), under the pergola.
      new WaspNest({ x: 209 * T + 8, y: 42 * T + 8 }),
      // Icicles (46) and keystones (74, 83).
      ...ICICLES.map(
        (col) =>
          new FallingHazard({
            x: col * T + 8,
            y: ceilingOver(col, 83),
            variant: HAZARD_VARIANT.icicle,
            audio: ctx.audio,
          }),
      ),
      ...KEYSTONES.map(
        (col) => new FallingHazard({ x: col * T + 8, y: 132 * T, variant: HAZARD_VARIANT.keystone, audio: ctx.audio }),
      ),
      new Embers(HOT_PIPES),
      ...gardenCreatures(),
      ...newRegionCreatures(),
    ];
  },
};

// Today's garden's creatures, where they have always been.
function gardenCreatures(): Entity[] {
  return [
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
}

// Bounds are centre-x in pixels, inset 4 px from the tile edges so a body
// never visibly hangs off the end of its run.
const span = (from: number, to: number) => ({ minX: from * T + 4, maxX: (to + 1) * T - 4 });

// The creatures over the wall and under the ground.
function newRegionCreatures(): Entity[] {
  return [
    // Hens and a hedgehog on the terraces; bees round the wine press; birds
    // round the windpump.
    new Hen({ x: 198 * T, y: 50 * T, ...span(195, 203) }),
    new Hen({ x: 216 * T, y: 41 * T, ...span(213, 219) }),
    new Hedgehog({ x: 208 * T, y: 47 * T, ...span(205, 211) }),
    new Bees({ x: 233 * T, y: 32 * T - 18 }),
    new Bird({ x: 224 * T, y: 18 * T, speed: 36, ...span(205, 245), facing: 1 }),
    new Bird({ x: 230 * T, y: 8 * T, speed: 42, ...span(200, 250), facing: -1 }),
    // Snails on the orangery's staging.
    new Snail({ x: 243 * T, y: 53 * T, ...span(241, 245) }),
    new Snail({ x: 251 * T, y: 44 * T, ...span(249, 255) }),
    // Mice in the wine cellar, the gear room and the warren.
    new Mouse({ x: 205 * T, y: 67 * T, ...span(194, 222) }),
    new Mouse({ x: 180 * T, y: 101 * T, ...span(177, 183) }),
    new Mouse({ x: 50 * T, y: 91 * T, ...span(40, 60) }),
    // Frogs and fish in the frog grotto and the culvert.
    new Frog({ fromX: 79 * T, toX: 85 * T + 8, y: 104 * T }),
    new Frog({ fromX: 87 * T, toX: 91 * T + 8, y: 104 * T }),
    new Fish({ x: 85 * T, y: 106 * T + 11, speed: 16, ...span(76, 99), color: DB32.tahitiGold }),
    new Fish({ x: 30 * T, y: 112 * T + 11, speed: 20, ...span(3, 45), facing: -1, color: DB32.goldenFizz }),
    // Fish in the channel and the troughs.
    new Fish({ x: 280 * T, y: 110 * T + 11, speed: 22, ...span(262, 300), color: DB32.white }),
    new Fish({ x: 60 * T, y: 129 * T + 11, speed: 18, ...span(14, 140), facing: -1, color: DB32.tahitiGold }),
    new Fish({ x: 260 * T, y: 129 * T + 11, speed: 18, ...span(200, 330), color: DB32.goldenFizz }),
    // Fireflies in the mushroom caves.
    new Fireflies({ x: 250 * T, y: 88 * T }),
    new Fireflies({ x: 266 * T, y: 94 * T }),
    // Bats in the aqueduct's arches.
    new Bat({ x: 40 * T, y: 132 * T }),
    new Bat({ x: 110 * T, y: 132 * T }),
    new Bat({ x: 230 * T, y: 132 * T }),
    new Bat({ x: 300 * T, y: 132 * T }),
  ];
}

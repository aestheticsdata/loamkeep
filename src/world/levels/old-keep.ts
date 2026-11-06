import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { CAIRN_LOOK, Cairn, cairnLitFlag } from '@entities/cairn';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import { Embers } from '@entities/embers';
import type { Entity, InteractContext } from '@entities/entity';
import { FallingHazard, HAZARD_VARIANT } from '@entities/falling-hazard';
import { Fish } from '@entities/fish';
import { Lever } from '@entities/lever';
import { Moth } from '@entities/moth';
import { Mouse } from '@entities/mouse';
import { Portcullis } from '@entities/portcullis';
import { BLOCK_LOOK, PushBlock } from '@entities/push-block';
import { Snail } from '@entities/snail';
import { SwingingChandelier } from '@entities/swinging-chandelier';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint, TileRect } from '@world/level';
import { bones, brazier, cobweb, sack } from '@world/levels/meadow-decor';
import { OLD_KEEP_LANDMARKS } from '@world/levels/old-keep-landmarks';
import { OLD_KEEP_ROWS } from '@world/levels/old-keep-rows';
import { HAZARD_LOOK, portcullisRows } from '@world/tilemap';
import type { Graphics } from 'pixi.js';

// The Old Keep — a castle built on all four sides of the great hall it used
// to be, 200 wide × 90 tall (the rows, and what they are, are in
// old-keep-rows.ts; the landmarks in old-keep-landmarks.ts).
//
// The hall is where it always was to the player, at (+70, +30) in the map:
// THREE storeys — the upper floor (row 38) with the Stone Throne, the belfry
// door and the bookshelf into the library; the hidden passage between the
// floors (rows 42-43, floor 44) with the Masons' Niche; the lower floor
// (row 48) with the doors back to the meadow and out to the garden; and the
// basement (floor 52) under the hole at cols 106-107, with the door down to
// the crypt. The climb inside it is as it was: every jump ≤3 tiles up.
//
// Out of it now: west to the kitchens (the hearth's embers, the Bread Oven),
// the service stair up to the chapel — where the two chandeliers swing the
// player across to the Reliquary — and on to the ramparts; down the larder
// well past the Cook's Shelf to the sewers. East to the armoury's spikes, the
// treasury behind its portcullis (its lever is in the barracks over it, or
// round by the east tower stair), and the east tower's Signal Brazier. Up the
// central stair to the wall walk and the towers. Down the ladder at col 122
// to the dungeons, a lever in every cell opening the next gate out, and the
// oubliette's drop into the sewers, whose current runs west to the larder
// well and whose east end is the grate out to the garden's moat.
//
// old-keep.test.ts walks it, the chandeliers included: every place is
// reachable from the meadow's door, and the door from every place.

const T = TILE_SIZE;

// Where the hall's floors are now, and a spawn standing on them.
const UPPER_FLOOR_Y = 38 * T;
const LOWER_FLOOR_Y = 48 * T;
const BASEMENT_FLOOR_Y = 52 * T;
const SPAWN_ABOVE = T;

// The doors, by the middle of their tile (ids and targets unchanged; only
// their places moved with the hall).
const RETURN_DOOR_X = 73 * T + 8;
const DESCEND_DOOR_X = 78 * T + 8;
const BELFRY_DOOR_X = 74 * T + 8;
const GARDEN_DOOR_X = 96 * T + 8;
const BOOKSHELF_DOOR_X = 90 * T + 8;
// The grate out to the garden's moat, in the sewer's east wall, on the
// walkway (row 78).
const MOAT_GRATE_X = 183 * T + 8;
const MOAT_GRATE_Y = 78 * T;

// Spawns, beside the door each comes through:
//   'from-meadow'      - lower floor, near the return door.
//   'from-crypt'       - basement, near the descend door.
//   'from-belfry'      - upper floor, two tiles right of the belfry door.
//   'from-garden'      - lower floor, two tiles left of the garden door.
//   'from-library'     - upper floor, between the throne and the bookshelf.
//   'from-garden-moat' - the sewer walkway, two tiles in from the grate.
const OLD_KEEP_SPAWNS: SpawnPoint[] = [
  { id: 'from-meadow', x: 75 * T + 2, y: LOWER_FLOOR_Y - SPAWN_ABOVE },
  { id: 'from-crypt', x: 81 * T + 2, y: BASEMENT_FLOOR_Y - SPAWN_ABOVE },
  { id: 'from-belfry', x: 76 * T + 2, y: UPPER_FLOOR_Y - SPAWN_ABOVE },
  { id: 'from-garden', x: 94 * T + 2, y: LOWER_FLOOR_Y - SPAWN_ABOVE },
  { id: 'from-library', x: 87 * T + 2, y: UPPER_FLOOR_Y - SPAWN_ABOVE },
  { id: 'from-garden-moat', x: 181 * T + 2, y: MOAT_GRATE_Y - SPAWN_ABOVE },
];

// ---------------------------------------------------------------------------
// What moves, what opens, and what keeps the player's place
// ---------------------------------------------------------------------------

// The candles (checkpoints), by marker: dark until the player passes them.
const CANDLES: readonly (readonly [string, number, number])[] = [
  ['hall', 76, 48], // 10
  ['ramparts', 66, 12], // 11
  ['kitchens', 64, 48], // 18
  ['chapel', 47, 24], // 22
  ['armoury', 138, 48], // 27
  ['barracks', 142, 31], // 31
  ['dungeons', 126, 70], // 36
  ['sewers', 34, 78], // 40
];

// The portcullises, by their top tile: the treasury's (29), the seven cell
// gates (37) and the sewer's sluice (42).
const PORTCULLISES: readonly (readonly [string, number, number])[] = [
  ['treasury', 165, 34],
  ...[74, 84, 94, 104, 114, 134, 144].map((col) => [`cell${col}`, col, 66] as const),
  ['sluice', 170, 79],
];

// The levers, by the tile they stand on, and what each opens. The treasury's
// is in the barracks over it (30). In the dungeons, every lever opens the
// next gate out from the ladder at col 122, from inside the cell that gate
// shuts: west of the ladder each stands just east of its gate, east of it
// just west. The sluice's is on the sewer walkway east of it.
const LEVERS: readonly (readonly [string, number, number])[] = [
  ['treasury', 170, 31],
  ...[114, 104, 94, 84, 74].map((col) => [`cell${col}`, col + 1, 70] as const),
  ...[134, 144].map((col) => [`cell${col}`, col - 1, 70] as const),
  ['sluice', 175, 78],
];

// The loose stones (46-49), by the ceiling tile each hangs from.
const LOOSE_STONES: readonly (readonly [number, number])[] = [
  [100, 61],
  [128, 61],
  [60, 73],
  [140, 73],
];

// The chapel's chandeliers (23), A and B, hung through its ceiling (row 13)
// on six tiles of chain that bring their bodies to rows 19-20 — ±3.4 tiles
// either way at ±35° — swinging against each other: when A is furthest
// east, B is furthest west.
export const KEEP_CHANDELIERS = [
  { x: 22 * T + 8, y: 13 * T, chain: 6 * T, phase: 0 },
  { x: 32 * T + 8, y: 13 * T, chain: 6 * T, phase: Math.PI },
] as const;

// The hearth's embers (19).
const HEARTH: TileRect = { col: 21, row: 47, cols: 3, rows: 1 };

// The sewer's current (41): west, through the water under the walkways.
const SEWER_CURRENT = { area: { col: 20, row: 80, cols: 150, rows: 6 }, speed: -30 };

// ---------------------------------------------------------------------------
// Decorations
// ---------------------------------------------------------------------------

// A long burgundy banner hanging from an iron pole. 8 wide × 26 tall when
// fully drawn. Anchored at its BOTTOM tip (y=0) so the spec passes the
// world-Y of the lowest pixel — the pole sits 26 px above that.
//
// Visual brief: iron pole across the top, two flat hanging straps, then
// cloth in deep burgundy with a paler vertical band down the middle and a
// 3-tooth fringe at the bottom. Reads at game scale as "stately heraldic
// banner."
function drawBanner(g: Graphics): void {
  const iron = DB32.dimGray;
  const ironHi = DB32.heather;
  const cloth = DB32.clairvoyant; // deep red
  const clothHi = DB32.brown; // bright red highlight
  const clothShadow = DB32.loulou; // very dark plum
  const trim = DB32.goldenFizz; // gold trim

  // Iron pole across the very top — 8 wide × 1 tall.
  g.rect(-4, -26, 8, 1).fill(iron);
  g.rect(-4, -26, 8, 1).fill(ironHi); // (single bright top line, will be overwritten by content below)
  g.rect(-4, -25, 8, 1).fill(iron);

  // Two short iron straps connecting pole to cloth — 1 wide × 2 tall each.
  g.rect(-3, -24, 1, 2).fill(iron);
  g.rect(2, -24, 1, 2).fill(iron);

  // Cloth body — 6 wide × 20 tall.
  g.rect(-3, -22, 6, 20).fill(cloth);
  // Top highlight strip and shadow accents.
  g.rect(-3, -22, 6, 1).fill(clothShadow);
  g.rect(-3, -22, 1, 20).fill(clothShadow);
  g.rect(2, -22, 1, 20).fill(clothShadow);
  // Vertical highlight stripe down the middle — 1 px wide.
  g.rect(-1, -21, 1, 19).fill(clothHi);
  // Single gold trim emblem near the top of the cloth.
  g.rect(-1, -18, 2, 2).fill(trim);

  // Fringe at the bottom — 3 hanging teeth, each 2 wide × 2 tall.
  g.rect(-3, -2, 2, 2).fill(cloth);
  g.rect(0, -2, 1, 2).fill(cloth);
  g.rect(2, -2, 1, 2).fill(cloth);
  // Tooth shadows.
  g.rect(-3, -2, 1, 2).fill(clothShadow);
  g.rect(2, -2, 1, 2).fill(clothShadow);
}

// Tall wooden bookshelf — 14 wide × 22 tall. Three shelves of books in
// varied colours. Anchored at the foot (standard floor-stand). The wood
// frame matches the existing Hollow Tree's palette so castle furniture
// feels visually related to the outdoor wooden world.
function drawBookshelf(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const woodHi = DB32.rope;
  const woodShadow = DB32.valhalla;
  const cavity = DB32.valhalla;

  // Outer frame fill.
  g.rect(-7, -22, 14, 22).fill(wood);
  g.rect(-7, -22, 14, 1).fill(woodHi);
  g.rect(-7, -22, 1, 22).fill(woodShadow);
  g.rect(6, -22, 1, 22).fill(woodShadow);

  // Interior cavity — 10 wide × 18 tall, inset 2 px from the frame.
  g.rect(-5, -20, 10, 18).fill(cavity);

  // Three shelves at y=-8, y=-14 (creating a top, middle, bottom row of
  // books). Each shelf is a 1-px wood line across the cavity.
  g.rect(-5, -8, 10, 1).fill(wood);
  g.rect(-5, -14, 10, 1).fill(wood);

  // Books — varied 1-px-wide spines, varied heights, varied colours.
  // Top shelf (between y=-19 and y=-15, so 4 px tall):
  drawBookSpines(g, -5, -19, 10, [DB32.clairvoyant, DB32.eltGreen, DB32.tahitiGold, DB32.cornflower, DB32.brown]);
  // Middle shelf (y=-13 to y=-9, 4 tall):
  drawBookSpines(g, -5, -13, 10, [DB32.deepKoamaru, DB32.brown, DB32.dell, DB32.mandy, DB32.goldenFizz, DB32.venice]);
  // Bottom shelf (y=-7 to y=-3, 4 tall):
  drawBookSpines(g, -5, -7, 10, [DB32.rainforest, DB32.brown, DB32.eltGreen, DB32.cornflower]);

  // Bottom trim (just below the cavity — masks the wood floor edge).
  g.rect(-7, -2, 14, 1).fill(woodHi);
}

// Helper: fill a shelf with varied-height book spines starting at (x, y),
// across `width` px. Picks heights pseudo-randomly per spine from `palette`.
// Pure presentation — no logic depends on the colours so the array can be
// freely reordered.
function drawBookSpines(g: Graphics, x: number, y: number, width: number, palette: readonly number[]): void {
  // Simple hash so per-call book pattern stays stable across redraws.
  // (Decoration draws once at construction, so any deterministic pattern
  // works; this just keeps things reproducible if we ever redraw.)
  let cursor = x;
  let i = 0;
  while (cursor < x + width) {
    const colour = palette[i % palette.length];
    const w = 1 + ((i * 5) % 2); // alternate 1 px and 2 px wide spines
    if (cursor + w > x + width) break;
    const dropTop = (i * 7) % 3 === 0 ? 1 : 0; // tilt a few books down 1 px
    g.rect(cursor, y + dropTop, w, 4 - dropTop).fill(colour);
    // 1-px shadow line on the right edge of each book for separation.
    g.rect(cursor + w - 1, y + dropTop, 1, 4 - dropTop).fill(DB32.valhalla);
    cursor += w;
    i += 1;
  }
}

// The grate between the keep's sewer and the garden's culvert (exported: the
// garden's end of it is the same grate): the portcullis's bars, two tiles tall,
// set in the sewer's east wall over a black opening. 16 wide, base on y = 0.
export function drawMoatGrate(g: Graphics): void {
  g.rect(-8, -32, 16, 32).fill(DB32.black);
  g.rect(-8, -33, 16, 1).fill(DB32.dimGray);
  for (const bx of [-7, -1, 5]) {
    g.rect(bx, -32, 2, 32).fill(DB32.heather);
    g.rect(bx, -32, 1, 32).fill(DB32.lightSteel);
    g.rect(bx + 2, -32, 1, 32).fill(DB32.valhalla);
  }
  for (const y of [-26, -10]) {
    g.rect(-8, y, 16, 2).fill(DB32.dimGray);
    g.rect(-8, y, 16, 1).fill(DB32.heather);
  }
  g.rect(-6, -4, 1, 1).fill(DB32.venice);
  g.rect(2, -6, 1, 2).fill(DB32.venice);
}

// The flagstones over the oubliette, which are not there: two tiles of the
// dungeon's floor, drawn as it is drawn, one of them cracked across. A
// decoration, so the player falls straight through it.
function drawFalseFloor(g: Graphics): void {
  g.rect(0, 0, 32, 16).fill(DB32.heather);
  g.rect(0, 0, 32, 1).fill(DB32.lightSteel);
  g.rect(15, 0, 1, 16).fill(DB32.dimGray);
  g.rect(0, 8, 32, 1).fill(DB32.dimGray);
  for (const [x, y] of [
    [20, 2],
    [22, 3],
    [23, 4],
    [25, 5],
    [26, 6],
    [28, 7],
  ] as const) {
    g.rect(x, y, 2, 1).fill(DB32.valhalla);
  }
}

// A banner's bottom tip in a column, at the bottom of a row (it hangs 26 px
// up from there to its pole).
const hangFromCeiling = (col: number, bottomRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * T + 8,
  y: bottomRow * T,
  draw,
});

// A prop on a tile edge, in the middle of its column: a standing one on the
// top of the floor tile, a hanging one from the underside of a ceiling.
type PropSpot = readonly [number, number, number];
const props = (prop: (variant: number) => (g: Graphics) => void, spots: readonly PropSpot[]): DecorationSpec[] =>
  spots.map(([col, row, variant]) => ({ x: col * T + 8, y: row * T, draw: prop(variant) }));

const OLD_KEEP_DECORATIONS: DecorationSpec[] = [
  // The hall's banners: two in the upper room, from its ceiling, ending
  // above the upper floor (the east one moved a column off the stair cut
  // through that ceiling); two in the lower room, from the underside of the
  // passage's floor.
  hangFromCeiling(87, 35, drawBanner),
  hangFromCeiling(107, 35, drawBanner),
  hangFromCeiling(80, 47, drawBanner),
  hangFromCeiling(106, 47, drawBanner),
  // The chapel's and the barracks'.
  hangFromCeiling(14, 16, drawBanner),
  hangFromCeiling(40, 16, drawBanner),
  hangFromCeiling(137, 22, drawBanner),
  hangFromCeiling(174, 22, drawBanner),
  // The oubliette's false floor.
  { x: 97 * T, y: 70 * T, draw: drawFalseFloor },
  // Cobwebs in the chapel's vault, the larder, the cells and the sewer.
  ...props(cobweb, [
    [8, 14, 0],
    [46, 14, 1],
    [10, 52, 1],
    [26, 52, 0],
    [66, 62, 0],
    [90, 62, 1],
    [110, 62, 0],
    [140, 62, 1],
    [45, 74, 0],
    [110, 74, 1],
    [158, 74, 0],
  ]),
  // Bones in the cells.
  ...props(bones, [
    [79, 70, 0],
    [89, 70, 1],
    [109, 70, 0],
    [139, 70, 1],
  ]),
  // Sacks in the larder and the kitchens.
  ...props(sack, [
    [8, 61, 0],
    [24, 61, 1],
    [27, 61, 0],
    [42, 48, 1],
    [52, 48, 0],
  ]),
  // Braziers in the barracks and the armoury.
  ...props(
    () => brazier(),
    [
      [152, 31, 0],
      [162, 31, 0],
      [144, 48, 0],
      [178, 48, 0],
    ],
  ),
];

export const oldKeepLevel: LevelSpec = {
  id: 'old-keep',
  name: 'The Old Keep',
  rows: OLD_KEEP_ROWS,
  spawns: OLD_KEEP_SPAWNS,
  defaultSpawnId: 'from-meadow',
  landmarks: OLD_KEEP_LANDMARKS,
  decorations: OLD_KEEP_DECORATIONS,
  // The night over the ramparts; inside, the dark of an interior from the
  // wall walk down, and in the two towers that stand up over it.
  parallax: 'night',
  backdrop: 'indoor-dark',
  rockBgStartRow: 12,
  backdropRegions: [
    { col: 0, row: 12, cols: 200, rows: 78 },
    { col: 4, row: 4, cols: 8, rows: 8 },
    { col: 182, row: 5, cols: 14, rows: 7 },
  ],
  currents: [SEWER_CURRENT],
  // Iron spikes everywhere, and the hearth's embers.
  hazardLooks: [
    { area: { col: 0, row: 0, cols: 200, rows: 90 }, look: HAZARD_LOOK.spikes },
    { area: HEARTH, look: HAZARD_LOOK.embers },
  ],
  openSky: true,
  createEntities(ctx: InteractContext): readonly Entity[] {
    const lit = (id: string) => ctx.worldState.get(cairnLitFlag('old-keep', id));
    return [
      new Door({
        id: 'keep-return-door',
        x: RETURN_DOOR_X,
        y: LOWER_FLOOR_Y,
        targetLevelId: 'meadow',
        targetSpawnId: 'from-keep',
        promptLabel: 'leave',
      }),
      new Door({
        id: 'keep-descend-door',
        x: DESCEND_DOOR_X,
        y: BASEMENT_FLOOR_Y,
        targetLevelId: 'old-keep-crypt',
        targetSpawnId: 'from-keep',
        promptLabel: 'descend',
      }),
      new Door({
        id: 'keep-belfry-door',
        x: BELFRY_DOOR_X,
        y: UPPER_FLOOR_Y,
        targetLevelId: 'old-keep-belfry',
        targetSpawnId: 'from-keep',
        promptLabel: 'climb',
      }),
      new Door({
        id: 'keep-garden-door',
        x: GARDEN_DOOR_X,
        y: LOWER_FLOOR_Y,
        targetLevelId: 'kitchen-garden',
        targetSpawnId: 'from-keep',
        promptLabel: 'go outside',
      }),
      // The bookshelf on the upper floor, between the throne and the middle
      // gold column: it looks like furniture and is a door to the library.
      new Door({
        id: 'keep-bookshelf-door',
        x: BOOKSHELF_DOOR_X,
        y: UPPER_FLOOR_Y,
        targetLevelId: 'old-keep-library',
        targetSpawnId: 'from-keep',
        promptLabel: 'pull a book',
        drawBody: drawBookshelf,
      }),
      new Door({
        id: 'keep-moat-grate',
        x: MOAT_GRATE_X,
        y: MOAT_GRATE_Y,
        targetLevelId: 'kitchen-garden',
        targetSpawnId: 'from-keep-moat',
        promptLabel: 'crawl through',
        drawBody: drawMoatGrate,
      }),
      ...CANDLES.map(([id, col, row]) => new Cairn({ id, col, row, look: CAIRN_LOOK.candle, lit: lit(id) })),
      ...PORTCULLISES.map(
        ([id, col, row]) => new Portcullis({ id, col, row, rows: portcullisRows(OLD_KEEP_ROWS, { col, row }) }),
      ),
      ...LEVERS.map(
        ([id, col, row]) =>
          new Lever({
            id,
            x: col * T + 8,
            y: row * T,
            targets: [id],
            flag: `keep.${id}`,
            pulled: ctx.worldState.get(`keep.${id}`),
          }),
      ),
      ...LOOSE_STONES.map(
        ([col, row]) =>
          new FallingHazard({ x: col * T + 8, y: (row + 1) * T, variant: HAZARD_VARIANT.looseStone, audio: ctx.audio }),
      ),
      ...KEEP_CHANDELIERS.map((spec) => new SwingingChandelier(spec)),
      new Embers(HEARTH),
      // The larder's crates (25), on its floor west of the shelf.
      new PushBlock({ col: 12, row: 61, look: BLOCK_LOOK.crate }),
      new PushBlock({ col: 17, row: 61, look: BLOCK_LOOK.crate }),
      // The hall's candles, where they always stood: three on the lower
      // floor, two on the upper, two in the basement.
      ...[79, 91, 104].map((col) => new TallCandle(col * T + 8, LOWER_FLOOR_Y)),
      ...[81, 96].map((col) => new TallCandle(col * T + 8, UPPER_FLOOR_Y)),
      ...[84, 100].map((col) => new TallCandle(col * T + 8, BASEMENT_FLOOR_Y)),
      ...keepCreatures(),
    ];
  },
};

// Bounds are centre-x in pixels, inset 4 px from the tile edges so a body
// never visibly hangs off the end of its run.
const span = (from: number, to: number) => ({ minX: from * T + 4, maxX: (to + 1) * T - 4 });

function keepCreatures(): Entity[] {
  return [
    // Bats under the towers' roofs, the chapel's vault and the sewer's.
    new Bat({ x: 7 * T, y: 4 * T }),
    new Bat({ x: 186 * T, y: 5 * T }),
    new Bat({ x: 192 * T, y: 5 * T }),
    new Bat({ x: 44 * T, y: 14 * T }),
    new Bat({ x: 120 * T, y: 74 * T }),
    // Moths round the candles, and in the chapel.
    new Moth({ x: 47 * T + 8, y: 24 * T - 14, rx: 10, ry: 4, period: 3.1 }),
    new Moth({ x: 27 * T + 8, y: 18 * T, rx: 24, ry: 6, period: 4.2 }),
    new Moth({ x: 64 * T + 8, y: 48 * T - 14, rx: 10, ry: 4, period: 2.9 }),
    new Moth({ x: 76 * T + 8, y: 48 * T - 14, rx: 10, ry: 4, period: 3.4 }),
    // Mice in the larder, the dungeons and round the Rat King's Nest.
    new Mouse({ x: 18 * T, y: 61 * T, ...span(6, 29) }),
    new Mouse({ x: 80 * T, y: 70 * T, ...span(75, 83) }),
    new Mouse({ x: 128 * T, y: 70 * T, ...span(123, 133) }),
    new Mouse({ x: 152 * T, y: 78 * T, ...span(144, 165) }),
    // Snails on the larder floor and the sewer walkways.
    new Snail({ x: 36 * T, y: 61 * T, ...span(32, 40) }),
    new Snail({ x: 80 * T, y: 78 * T, ...span(65, 96) }),
    // Fish in the sewer water, against the current and with it.
    new Fish({ x: 50 * T, y: 82 * T + 11, speed: 22, ...span(21, 99), facing: 1, color: DB32.tahitiGold }),
    new Fish({ x: 130 * T, y: 84 * T + 11, speed: 18, ...span(101, 168), facing: -1, color: DB32.goldenFizz }),
  ];
}

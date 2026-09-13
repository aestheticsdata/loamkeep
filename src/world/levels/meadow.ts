import { DB32, SCREEN_WIDTH, TILE_SIZE } from '@constants';
import { Bird } from '@entities/bird';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { Fish } from '@entities/fish';
import type { LandmarkSpec } from '@entities/landmark';
import { type FloraId, PLANTS } from '@entities/plants';
import { Rabbit } from '@entities/rabbit';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// Meadow level — the outdoor starting biome.
//
// 60 wide × 32 tall (the player has manually extended the underground over
// time). Three surface zones plus a layered underground:
//   - Surface (rows 0-8): asymmetric platform layout (LEFT/MIDDLE/RIGHT), see
//     the column-by-column breakdown below.
//   - Upper cave (rows 13-17): wide cavern with a central lake.
//   - Lower cave (rows 19-31): dark stone maze + a deep water column on the
//     right, ending at the bottom-of-world floor.
//
// The castle door sits at the bottom of the right-side cliff-fall: the
// player leaps off the surface gap at col 47-55, falls through the open
// shaft at col 52, and lands directly on top of the door's floor tile (row
// 21). Deep enough to feel like "you've descended into another world"
// without requiring any new traversal mechanics — just gravity.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . sky / empty   G grass   D dirt   S stone   K dark stone   W water
const MEADOW_ROWS = [
  '............................................................', // 0
  '............................................................', // 1
  '............................................................', // 2
  '..........GGG..............................GGG..............', // 3
  '.............................GGG............................', // 4
  '...............................................GGG..........', // 5
  '.....GGG................GGGG................................', // 6
  '............................................................', // 7
  'GGGGGG..GGGGGGGGGGGG...GGGGGGGGGGGGGGGGGGG..GG..GGGGGGGGGGGG', // 8
  'DDDDDD..DDDDDDDDDDDD..DDDDDDDDDDDDDDDDDDDD..DDD..DDDDDDDDDDD', // 9
  'SSSSSS.SSSSSSSSSSSSS.SSSSSSSSSSSSSSSSSSSSS.SSS....SSSSSSSSSS', // 10
  'SSSSS...SSSSSSSSSSSS..SSSSSSSSSSSSSSSSSS...............SSSSS', // 11
  'SSSSSSS...SSSSSSSSS....SSSSSSSSSSSSSSSS........SSSSSSSSSSSSS', // 12
  'SSSSS....SSSSSSSSSSSS..SSSSSSSSSSSSSSSSSS....SSS..SSSSSSSSSS', // 13
  'SS........................................................SS', // 14
  'SS........SS................SS...........SSS..............SS', // 15
  'SS........................................................SS', // 16
  'SSSSSSSSSSSSSSWWWWWWWWWWWWWWWWWWSSSSSSSSSSSSSSS.........SSSS', // 17
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSS', // 18
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...KKKKKKK..KKKKKK', // 19
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...............KKKKKK', // 20
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWWWWWWKKKKKKKKK', // 21
  'KKKKKKKKKKKKKKKKKKKKKKKKKK..KKKKKKKKKKKKKKKWWWWWWKKKKKKKKKKK', // 22
  'KKKKKKKKKKKKKKKKKKKKKKKKKK...KKKKKKKKKKKKKKWWWWWWKKKKKKKKKKK', // 23
  'KKKKKKKKKKKK....KKKKKKKKK.........K...KKKKWWWWWWWWWKKKKKKKKK', // 24
  'KKKKKKKKKK.......KKKK......KKKKKKWWWWWWWWWWWWWWWKKKKKKKKKKKK', // 25
  'KKKKKKKKKK..KKK........KKKKKKKKKKKKKKKKKKWWWWWWWWKKKKKKKKKKK', // 26
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWWWWWWWWKKKKKKKKKK', // 27
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWWWWWWWWWWWWKKKKKKKKKKKK', // 28
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWWWWWWWWKKKKKKKKKKKKK', // 29
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', // 30
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', // 31
] as const;

// Row index of the main outdoor floor. Used to position the surface spawn.
const MEADOW_GRASS_ROW = 8;

// Standard ink color depending on discovered state for landmark bodies.
const inkFor = (discovered: boolean): number => (discovered ? DB32.opal : DB32.valhalla);

// ---------------------------------------------------------------------------
// Landmarks. Six total: five on the surface (spread across the asymmetric
// platform layout) plus one underground in the lake.
// ---------------------------------------------------------------------------

const MEADOW_LANDMARKS: LandmarkSpec[] = [
  // 1) Old Cairn — main floor far left, near spawn.
  {
    id: 'old-cairn',
    x: 2 * 16 + 8,
    y: MEADOW_GRASS_ROW * 16,
    name: 'Old Cairn',
    description:
      'A stack of stones, placed with care. Each one chosen, each one balanced. ' +
      'No one remembers who built them, or why.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      g.rect(-5, -3, 10, 3).fill(stone);
      g.rect(-5, -3, 10, 1).fill(stoneHi);
      g.rect(-5, -3, 1, 3).fill(ink);
      g.rect(4, -3, 1, 3).fill(ink);
      g.rect(-5, -1, 10, 1).fill(ink);
      g.rect(-3, -6, 6, 3).fill(stone);
      g.rect(-3, -6, 6, 1).fill(stoneHi);
      g.rect(-3, -6, 1, 3).fill(ink);
      g.rect(2, -6, 1, 3).fill(ink);
      g.rect(-2, -9, 4, 3).fill(stone);
      g.rect(-2, -9, 4, 1).fill(stoneHi);
      g.rect(-2, -9, 1, 3).fill(ink);
      g.rect(1, -9, 1, 3).fill(ink);
      g.rect(-1, -10, 2, 1).fill(stoneHi);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      g.rect(-22, 12, 44, 8).fill(stone).rect(-22, 12, 44, 1).fill(stoneHi);
      g.rect(-16, 0, 32, 12).fill(stone).rect(-16, 0, 32, 1).fill(stoneHi);
      g.rect(-12, -12, 24, 12).fill(stone).rect(-12, -12, 24, 1).fill(stoneHi);
      g.rect(-6, -22, 12, 10).fill(stoneHi);
      g.rect(-10, 4, 5, 1).fill(ink);
      g.rect(0, -6, 6, 1).fill(ink);
      g.rect(-5, 15, 8, 1).fill(ink);
    },
  },

  // 2) Stone Marker — LEFT zone, row 6 (cols 5-7).
  {
    id: 'stone-marker',
    x: 6 * 16 + 8,
    y: 6 * 16,
    name: 'Stone Marker',
    description: 'An old marker, carved with worn symbols. The carvings spiral upward — almost forming a face.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const fill = discovered ? DB32.dimGray : DB32.pancho;
      const baseFill = discovered ? DB32.opal : DB32.oiledCedar;
      g.rect(-3, -2, 6, 2).fill(baseFill);
      g.rect(-3, -2, 6, 1).fill(ink);
      g.rect(-2, -14, 4, 12).fill(fill);
      g.rect(-2, -14, 4, 1).fill(ink);
      g.rect(-2, -3, 4, 1).fill(ink);
      g.rect(-2, -14, 1, 12).fill(ink);
      g.rect(1, -14, 1, 12).fill(ink);
      g.rect(-3, -16, 6, 2).fill(fill);
      g.rect(-3, -16, 6, 1).fill(ink);
      g.rect(-3, -16, 1, 2).fill(ink);
      g.rect(2, -16, 1, 2).fill(ink);
      g.rect(-1, -11, 2, 1).fill(ink);
      g.rect(-1, -7, 2, 1).fill(ink);
    },
    drawSketch(g) {
      g.rect(-10, 16, 20, 4).fill(DB32.oiledCedar);
      g.rect(-7, -20, 14, 36).fill(DB32.heather);
      g.rect(-10, -24, 20, 4).fill(DB32.lightSteel);
      for (let i = 0; i < 4; i++) {
        g.rect(-4, -14 + i * 8, 8, 1).fill(DB32.dimGray);
      }
    },
  },

  // 3) Ruined Arch — LEFT zone, row 3 (cols 10-12). Reached via Stone Marker.
  {
    id: 'ruined-arch',
    x: 11 * 16 + 8,
    y: 3 * 16,
    name: 'Ruined Arch',
    description:
      "What's left of a doorway, half sunken into the soil. " +
      "The other half is gone. You can't tell what was once on the other side.",
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      g.rect(-5, -10, 2, 10).fill(stone);
      g.rect(-5, -10, 2, 1).fill(stoneHi);
      g.rect(-5, -10, 1, 10).fill(ink);
      g.rect(-4, -10, 1, 1).fill(ink);
      g.rect(-5, -1, 2, 1).fill(ink);
      g.rect(3, -10, 2, 10).fill(stone);
      g.rect(3, -10, 2, 1).fill(stoneHi);
      g.rect(4, -10, 1, 10).fill(ink);
      g.rect(3, -10, 1, 1).fill(ink);
      g.rect(3, -1, 2, 1).fill(ink);
      g.rect(-5, -12, 3, 2).fill(stone);
      g.rect(-5, -12, 3, 1).fill(stoneHi);
      g.rect(-5, -12, 1, 2).fill(ink);
      g.rect(2, -12, 3, 2).fill(stone);
      g.rect(2, -12, 3, 1).fill(stoneHi);
      g.rect(4, -12, 1, 2).fill(ink);
      g.rect(-1, -1, 2, 1).fill(stone);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      g.rect(-22, -16, 8, 36).fill(stone).rect(-22, -16, 8, 1).fill(stoneHi);
      g.rect(14, -16, 8, 36).fill(stone).rect(14, -16, 8, 1).fill(stoneHi);
      g.rect(-22, -22, 12, 6).fill(stone).rect(-22, -22, 12, 1).fill(stoneHi);
      g.rect(10, -22, 12, 6).fill(stone).rect(10, -22, 12, 1).fill(stoneHi);
      g.rect(-18, -10, 1, 12).fill(ink);
      g.rect(18, -8, 1, 14).fill(ink);
      g.rect(-8, 18, 4, 2).fill(stone);
      g.rect(2, 19, 5, 1).fill(stone);
    },
  },

  // 4) Hollow Tree — MIDDLE zone, row 6 (cols 24-27, 4 wide).
  {
    id: 'hollow-tree',
    x: 25 * 16 + 8,
    y: 6 * 16,
    name: 'Hollow Tree',
    description:
      'A trunk hollowed out by time. Inside, the air smells of old paper. ' +
      'Someone — or something — was here recently. Or perhaps very long ago.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const wood = discovered ? DB32.dimGray : DB32.oiledCedar;
      const woodHi = discovered ? DB32.heather : DB32.rope;
      const cavity = DB32.valhalla;
      g.rect(-4, -13, 8, 13).fill(wood);
      g.rect(-4, -13, 8, 1).fill(woodHi);
      g.rect(-4, -13, 1, 13).fill(ink);
      g.rect(3, -13, 1, 13).fill(ink);
      g.rect(-2, -9, 4, 5).fill(cavity);
      g.rect(-2, -9, 4, 1).fill(ink);
      g.rect(-2, -5, 4, 1).fill(ink);
      g.rect(-5, -2, 10, 2).fill(wood);
      g.rect(-5, -2, 10, 1).fill(ink);
      g.rect(-5, -2, 1, 2).fill(ink);
      g.rect(4, -2, 1, 2).fill(ink);
      g.rect(-3, -11, 1, 1).fill(ink);
      g.rect(2, -7, 1, 1).fill(ink);
    },
    drawSketch(g) {
      const wood = DB32.oiledCedar;
      const woodHi = DB32.rope;
      const cavity = DB32.valhalla;
      const ink = DB32.valhalla;
      g.rect(-14, -28, 28, 44).fill(wood);
      g.rect(-14, -28, 28, 2).fill(woodHi);
      g.rect(-20, 12, 40, 8).fill(wood);
      g.rect(-20, 12, 40, 2).fill(woodHi);
      g.rect(-8, -14, 16, 22).fill(cavity);
      g.rect(-8, -14, 16, 2).fill(ink);
      for (let i = 0; i < 4; i++) {
        g.rect(-12, -20 + i * 8, 4, 1).fill(ink);
        g.rect(8, -20 + i * 8, 4, 1).fill(ink);
      }
    },
  },

  // 5) Crystal Vein — RIGHT zone, row 3 (cols 43-45). Player jumps up-LEFT
  //    from row-6 platform (cols 47-49) to reach this.
  {
    id: 'crystal-vein',
    x: 44 * 16 + 8,
    y: 3 * 16,
    name: 'Crystal Vein',
    description:
      'A vein of pale blue crystal, breaking through the soil. They hum faintly when you stand close — ' +
      'just on the edge of being heard.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const cLight = discovered ? DB32.heather : DB32.viking;
      const cMid = discovered ? DB32.dimGray : DB32.cornflower;
      const cDark = discovered ? DB32.opal : DB32.venice;
      const baseStone = discovered ? DB32.dimGray : DB32.heather;
      g.rect(-4, -2, 8, 2).fill(baseStone);
      g.rect(-4, -2, 8, 1).fill(ink);
      g.rect(-1, -12, 2, 1).fill(cDark);
      g.rect(-1, -11, 2, 1).fill(cMid);
      g.rect(-2, -10, 4, 6).fill(cLight);
      g.rect(-2, -10, 1, 6).fill(cMid);
      g.rect(1, -10, 1, 6).fill(cMid);
      g.rect(-2, -4, 4, 1).fill(cMid);
      g.rect(2, -6, 1, 1).fill(cDark);
      g.rect(2, -5, 2, 3).fill(cLight);
      g.rect(2, -5, 2, 1).fill(cMid);
      g.rect(-4, -4, 1, 1).fill(cMid);
      g.rect(-4, -3, 2, 1).fill(cLight);
    },
    drawSketch(g) {
      const cLight = DB32.viking;
      const cMid = DB32.cornflower;
      const cDark = DB32.venice;
      const baseStone = DB32.heather;
      const ink = DB32.valhalla;
      g.rect(-22, 12, 44, 8).fill(baseStone);
      g.rect(-22, 12, 44, 1).fill(DB32.lightSteel);
      g.rect(-22, 19, 44, 1).fill(ink);
      g.rect(-4, -24, 8, 4).fill(cDark);
      g.rect(-8, -20, 16, 8).fill(cMid);
      g.rect(-10, -12, 20, 20).fill(cLight);
      g.rect(-10, -12, 20, 1).fill(DB32.white);
      g.rect(-2, -22, 1, 28).fill(cMid);
      g.rect(2, -22, 1, 28).fill(cDark);
      g.rect(10, -8, 5, 5).fill(cDark);
      g.rect(8, -3, 9, 14).fill(cLight);
      g.rect(8, -3, 9, 1).fill(DB32.white);
    },
  },

  // 6) Sunken Stone — UNDERGROUND, sitting on the cavern floor in the lake.
  //    Row 18 col 23 (under the water at row 17 cols 14-31). The first
  //    landmark the player can only reach by going DOWN.
  {
    id: 'sunken-stone',
    x: 23 * 16 + 8,
    y: 18 * 16,
    name: 'Sunken Stone',
    description:
      'A worn obelisk standing knee-deep in still water. Its surface is covered in tiny scratches — ' +
      'too regular to be erosion, too faint to read.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.lightSteel;
      const stoneHi = discovered ? DB32.heather : DB32.white;
      // Tall narrow obelisk poking out of the water.
      g.rect(-2, -14, 4, 14).fill(stone);
      g.rect(-2, -14, 4, 1).fill(stoneHi);
      g.rect(-2, -14, 1, 14).fill(ink);
      g.rect(1, -14, 1, 14).fill(ink);
      // Tip taper (1px narrower at top).
      g.rect(-1, -16, 2, 2).fill(stone);
      g.rect(-1, -16, 2, 1).fill(stoneHi);
      // Faint scratch marks.
      g.rect(-1, -11, 2, 1).fill(ink);
      g.rect(-1, -7, 2, 1).fill(ink);
      g.rect(-1, -4, 2, 1).fill(ink);
    },
    drawSketch(g) {
      const stone = DB32.lightSteel;
      const stoneHi = DB32.white;
      const ink = DB32.valhalla;
      const water = DB32.venice;
      // Tall obelisk.
      g.rect(-8, -28, 16, 44).fill(stone);
      g.rect(-8, -28, 16, 2).fill(stoneHi);
      g.rect(-4, -34, 8, 6).fill(stone);
      g.rect(-4, -34, 8, 2).fill(stoneHi);
      // Water at its base.
      g.rect(-24, 16, 48, 6).fill(water);
      g.rect(-24, 16, 48, 1).fill(DB32.cornflower);
      // Scratch marks all along the obelisk.
      for (let i = 0; i < 6; i++) {
        g.rect(-4, -22 + i * 6, 8, 1).fill(ink);
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Decoration drawing functions. All draw at origin (0, 0) with the visible
// base on the y=0 line, extending upward into negative y.
//
// Only the stones are still drawn here. Everything that grows moved to
// @entities/plants once the flora sketchbook needed to draw it too — these
// two have no page, and a book called FLORA holding gravel would be worse
// than a shorter book.
// ---------------------------------------------------------------------------

function drawBoulder(g: import('pixi.js').Graphics): void {
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

function drawPebbles(g: import('pixi.js').Graphics): void {
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
const onGrass = (col: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: MEADOW_GRASS_ROW * TILE_SIZE,
  draw,
});

const inCavern = (col: number, row: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * TILE_SIZE + 8,
  y: row * TILE_SIZE,
  draw,
});

const plantOnGrass = (col: number, species: FloraId): DecorationSpec => ({
  ...onGrass(col, PLANTS[species].draw),
  species,
});

const plantInCavern = (col: number, row: number, species: FloraId): DecorationSpec => ({
  ...inCavern(col, row, PLANTS[species].draw),
  species,
});

const MEADOW_DECORATIONS: DecorationSpec[] = [
  // Surface — left half
  plantOnGrass(14, 'small-tree'),
  plantOnGrass(16, 'bush'),
  plantOnGrass(18, 'giant-tree'),

  // Surface — middle
  plantOnGrass(28, 'tall-oak'),
  plantOnGrass(33, 'bush'),
  onGrass(36, drawBoulder),

  // Surface — right half
  plantOnGrass(39, 'giant-tree'),
  plantOnGrass(45, 'pine-tree'),
  plantOnGrass(48, 'small-tree'),
  plantOnGrass(53, 'tall-oak'),
  onGrass(57, drawPebbles),

  // Underground — mushrooms on the stone parts of the cavern floor
  plantInCavern(3, 17, 'mushroom'),
  plantInCavern(8, 17, 'mushroom'),
  inCavern(11, 17, drawPebbles),
  plantInCavern(35, 17, 'mushroom'),
  inCavern(40, 17, drawPebbles),
  plantInCavern(45, 17, 'mushroom'),
];

// ---------------------------------------------------------------------------
// Spawn points
//   default   - first arrival at the level (centred horizontally on the
//               first screen, standing on the main grass floor).
//   from-keep - where the player materialises when returning from the
//               Old Keep through the underground door. Same x/y as the door
//               so it feels like stepping out where they stepped in.
// ---------------------------------------------------------------------------

// World-space spawn coords. Player AABB top-left, not feet centre.
const MEADOW_SPAWN_X = SCREEN_WIDTH / 2 - 6;
const MEADOW_SPAWN_Y = MEADOW_GRASS_ROW * TILE_SIZE - 16;

// Underground castle door — sits on the K floor at row 21 col 52. The player
// reaches it by walking off the right-side surface cliff (the col 47-55 gap
// at row 17), falling straight through the open shaft at col 52, and landing
// on the door's floor tile. No new mechanic required — gravity is the
// traversal puzzle here.
const KEEP_DOOR_COL = 52;
const KEEP_DOOR_ROW = 21;
const KEEP_DOOR_X = KEEP_DOOR_COL * TILE_SIZE + 8;
const KEEP_DOOR_Y = KEEP_DOOR_ROW * TILE_SIZE;

const MEADOW_SPAWNS: SpawnPoint[] = [
  { id: 'default', x: MEADOW_SPAWN_X, y: MEADOW_SPAWN_Y },
  // 10 px to the RIGHT of the door (one column over, into the open cavern
  // at col 53 rows 17-20). Three reasons for the right rather than the left:
  //   (1) The left side (col 51) has a K stone overhang at row 19 — the
  //       player would land with a stone block right above their head, no
  //       room to jump.
  //   (2) Col 53 has four full tiles of open headroom (rows 17-20), so the
  //       player can leap immediately if they want.
  //   (3) Press-E doesn't auto-fire on transition (Input clears `pressed`
  //       at endFrame), so being in range of the door on spawn just shows
  //       the prompt — no risk of instant re-entry loop.
  { id: 'from-keep', x: KEEP_DOOR_X + 10, y: KEEP_DOOR_Y - 16 },
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
  // The rock backdrop starts at the grass row so cave openings in the main
  // floor reveal rock from above, not cornflower sky.
  rockBgStartRow: MEADOW_GRASS_ROW,
  // ctx is unused for now — Door's `interact` receives it at runtime from
  // Game. Phase 2 entities (Lever, Switch) will likely want it here so they
  // can read WorldState flags at construction time to draw in the right
  // initial pose.
  createEntities(): readonly Entity[] {
    // Player-spawn platform — grass at row 8 cols 8-19. The rabbit paces
    // back and forth along it. Bounds are passed in pixels: tile-aligned
    // edges, with a 4-px inset on each side so the rabbit's body never
    // visibly hangs off the platform edge.
    const SPAWN_PLATFORM_LEFT_X = 8 * TILE_SIZE + 4;
    const SPAWN_PLATFORM_RIGHT_X = 20 * TILE_SIZE - 4;
    const RABBIT_FOOT_Y = MEADOW_GRASS_ROW * TILE_SIZE;

    // DEEP underground lake — the multi-row water column on the right
    // side of the underground (rows 21-29). NOT the shallow cavern pool
    // at row 17 that the player wades through.
    //
    // The water shape narrows and widens by row, so each fish has its
    // own minX/maxX matched to the row it swims in. All three are
    // anchored to their row centre (y = row*16 + 11) so the body fits
    // comfortably inside the 16-px-tall water tile.

    return [
      new Door({
        id: 'meadow-keep-door',
        x: KEEP_DOOR_X,
        y: KEEP_DOOR_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-meadow',
        promptLabel: 'enter',
      }),

      // Rabbit on the player's spawn platform. Walks at 32 px/s — slow
      // enough to feel like nibbling progress, not racing.
      new Rabbit({
        x: 12 * TILE_SIZE,
        y: RABBIT_FOOT_Y,
        speed: 32,
        minX: SPAWN_PLATFORM_LEFT_X,
        maxX: SPAWN_PLATFORM_RIGHT_X,
        facing: 1,
      }),

      // Second rabbit on the LARGEST surface platform (grass cols 23-41,
      // 19 tiles wide — the wide middle band). Starts on the right side
      // facing left so the two rabbits don't immediately look like
      // copies of each other.
      new Rabbit({
        x: 36 * TILE_SIZE,
        y: RABBIT_FOOT_Y,
        speed: 28,
        minX: 23 * TILE_SIZE + 4,
        maxX: 42 * TILE_SIZE - 4,
        facing: -1,
      }),

      // Two birds flying back and forth across the FULL width of the
      // level, at altitudes the player can actually CROSS by standing
      // on specific platforms. (Earlier altitudes were so high above
      // the surface that the player could never reach a bird, so the
      // greeting popup was effectively unreachable.)
      //
      // Bird 1 — at the FIRST grass PLATFORM (row 6: cols 5-7 on the
      // left of spawn, cols 24-27 on the right). NOT the ground; the
      // player has to jump up onto one of those small platforms to
      // cross this bird. Body Y range = posY − 3 to posY = 85..88,
      // player's AABB standing on row 6 is y=80..96 — overlap.
      new Bird({
        x: 8 * TILE_SIZE,
        y: 88,
        speed: 60,
        minX: 1 * TILE_SIZE,
        maxX: 59 * TILE_SIZE,
        facing: 1,
      }),
      // Bird 2 — at the HIGHEST grass platform (row 3, cols 10-12 and
      // 43-45). Body Y 39..42, player's AABB on row 3 is y=32..48.
      // Player has to climb all the way up to meet this one.
      new Bird({
        x: 42 * TILE_SIZE,
        y: 42,
        speed: 54,
        minX: 1 * TILE_SIZE,
        maxX: 59 * TILE_SIZE,
        facing: -1,
      }),

      // Fish near the top of the deep lake — row 22 (water cols 43-48,
      // 6 wide). Short swim range; reads as a fish hovering near the
      // shaft mouth.
      new Fish({
        x: 46 * TILE_SIZE,
        y: 22 * TILE_SIZE + 11,
        speed: 22,
        minX: 43 * TILE_SIZE + 4,
        maxX: 49 * TILE_SIZE - 4,
        facing: 1,
        color: DB32.tahitiGold,
      }),
      // Fish in the middle of the lake — row 25 (water cols 33-47,
      // 15 wide — the widest band). Longest cruise.
      new Fish({
        x: 40 * TILE_SIZE,
        y: 25 * TILE_SIZE + 11,
        speed: 26,
        minX: 33 * TILE_SIZE + 4,
        maxX: 48 * TILE_SIZE - 4,
        facing: -1,
        color: DB32.goldenFizz,
      }),
      // Fish near the bottom — row 28 (water cols 34-47, 14 wide).
      new Fish({
        x: 41 * TILE_SIZE,
        y: 28 * TILE_SIZE + 11,
        speed: 30,
        minX: 34 * TILE_SIZE + 4,
        maxX: 48 * TILE_SIZE - 4,
        facing: 1,
        color: DB32.clairvoyant,
      }),
    ];
  },
};

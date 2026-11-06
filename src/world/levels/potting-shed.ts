import { TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { Bird } from '@entities/bird';
import { Bookworm } from '@entities/bookworm';
import { CAIRN_LOOK, Cairn, cairnLitFlag } from '@entities/cairn';
import { Cat } from '@entities/cat';
import { Clothesline } from '@entities/clothesline';
import { CrystalGate, GATE_LOOK, gateOpenFlag } from '@entities/crystal-gate';
import { CRYSTAL_LOOK, CrystalSwitch, crystalLitFlag } from '@entities/crystal-switch';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import { Earthworm } from '@entities/earthworm';
import { Embers } from '@entities/embers';
import type { Entity, InteractContext } from '@entities/entity';
import { FallingHazard, HAZARD_VARIANT, type HazardVariant } from '@entities/falling-hazard';
import type { LandmarkSpec } from '@entities/landmark';
import { Lever } from '@entities/lever';
import { MillWheel, WHEEL_LOOK } from '@entities/mill-wheel';
import { Mole } from '@entities/mole';
import { Moth } from '@entities/moth';
import { Mouse } from '@entities/mouse';
import { PORTCULLIS_LOOK, Portcullis } from '@entities/portcullis';
import { PulsedUpdraft } from '@entities/pulsed-updraft';
import { BLOCK_LOOK, PushBlock } from '@entities/push-block';
import { SHUTTLE_LOOK, Shuttle } from '@entities/shuttle';
import { Spider } from '@entities/spider';
import { SwingingChandelier } from '@entities/swinging-chandelier';
import { UPDRAFT_LOOK } from '@entities/updraft';
import type { ClassicRecorder } from '@hd/classic-recorder';
import { propHd } from '@hd/critter-hd';
import { LIT_RAMP } from '@hd/palette';
import {
  type LevelLighting,
  type LevelSpec,
  type LightSource,
  type LitRoom,
  ROOM_BACKDROP,
  type SpawnPoint,
  type TileRect,
} from '@world/level';
import {
  drawAppleCrate,
  drawBed,
  drawBoiler,
  drawCandle,
  drawCatalogueSketch,
  drawClockSketch,
  drawDesk,
  drawDrawerCabinet,
  drawDressForm,
  drawDumbwaiter,
  drawDumbwaiterSketch,
  drawGrandfatherClock,
  drawHangingLamp,
  drawHerbs,
  drawJars,
  drawKitchenTable,
  drawLavender,
  drawOnions,
  drawPipes,
  drawPots,
  drawPottingBench,
  drawRake,
  drawRockingHorse,
  drawRootMap,
  drawRootMapSketch,
  drawRoots,
  drawSeedCatalogue,
  drawShedDoorInside,
  drawShedWindow,
  drawSheetedTrunk,
  drawSkylight,
  drawSmallWindow,
  drawStove,
  drawTrunk,
  drawWindowSketch,
  drawWrongSizeWindow,
} from '@world/levels/potting-shed-art';
import { POTTING_SHED_NEW_LANDMARKS } from '@world/levels/potting-shed-landmarks';
import { POTTING_SHED_ROWS } from '@world/levels/potting-shed-rows';
import { HAZARD_LOOK, type HazardRegion, portcullisRows } from '@world/tilemap';
import type { Graphics } from 'pixi.js';

// The Potting Shed, inside (LOA-48, rebuilt in LOA-57). From the garden it is
// seven tiles of shed. Inside it is a house that cannot fit, and goes on and
// on: 340 wide × 172 tall (the rows, and how they differ from the handoff,
// are in potting-shed-rows.ts; the new landmarks in
// potting-shed-landmarks.ts). The first room is exactly the shed you
// expected — bench, pots, rake, the window with the pot in it — and the
// camera holds still on it; the doorway beyond opens on a hall forty-six
// tiles wide.
//
// Today's house (cols 0-119, rows 24-111), as it was, 24 rows down — the
// ground floor walks on row 74, the shed's own floor:
//
//   The attic (rows 29-46) — trunks, dust sheets, a rocking horse, beams up
//     to the skylight, and now a ladder through it to the roof.
//   Floor 2 (48-55) — the drying loft, and the narrow landing.
//   Floor 1 (57-64) — the lumber room, the library and its Seed Catalogue,
//     the sewing room.
//   The ground floor (66-73) — the shed, the seed hall, the kitchen, the
//     pantry.
//   The spine (40-82) — the stairwell, and the dumbwaiter's shaft to the box
//     room, linen cupboard, boot room and coal hole, whose east walls now
//     open on the east wing.
//   The basement (75-82) and the tunnels (84-104) — and from the west
//     tunnel a shaft down to Mole City, and the dumbwaiter's ladder on down
//     to the Seed Vault.
//
// Around it: the roof under the night sky (rows 0-23) with the weathervane,
// the pigeon loft, the roof tank and the kite strings; the east wing's seven
// storeys (cols 118-250), with the flue up through them from the laundry to
// the roof; the clock tower (cols 251-299) and its belvedere; the back wing
// round its lift (cols 300-339); and under it all the pipeworks and coal
// bunker, the Seed Vault, Mole City, the Sunken Rooms, the Foundations, the
// Taproot and the Apple Roots.
//
// potting-shed.test.ts walks it, the switches included: every place it can
// be stood in is reachable from the shed door, and the door from every one.
//

const T = TILE_SIZE;
// The ground floor's walking line, and the shed door on it.
const GROUND_Y = 74 * T;
const DOOR_X = 7 * T + 8;

// Where the player stands, by tile.
const standAt = (id: string, [col, row]: readonly [number, number]): SpawnPoint => ({ id, x: col * T + 2, y: row * T });

// The Corridor of Doors (48): seven of its eight doors open somewhere else in
// the house — each a shortcut to a place a walk also reaches — and the
// eighth on bricks (49, a landmark, not a door).
const CORRIDOR_DOORS: readonly (readonly [string, number, readonly [number, number]])[] = [
  ['in-studio', 170, [124, 28]],
  ['in-vault', 180, [62, 134]], // on the floor, west of the drawer cabinet
  ['in-orchard-roots', 190, [194, 169]],
  ['in-belvedere', 200, [270, 1]],
  ['in-sunken-parlour', 210, [50, 148]], // on the slumped floor
  ['in-bell-board', 220, [322, 28]],
  ['in-mole-city', 230, [14, 120]],
];
const CORRIDOR_Y = 65 * T;

const POTTING_SHED_SPAWNS: SpawnPoint[] = [
  { id: 'from-garden', x: 8 * T + 2, y: GROUND_Y - T },
  ...CORRIDOR_DOORS.map(([id, , at]) => standAt(id, at)),
];

// The lamps (checkpoints), by marker: the floor tile each stands on.
const LAMPS: readonly (readonly [string, number, number])[] = [
  ['shed', 11, 74], // 7
  ['roof', 126, 18], // 15, on the roof walk over the marker
  ['studio', 124, 29], // 20
  ['orrery', 212, 38], // 26
  ['nursery', 123, 47], // 29, beside the ladder's hole
  ['gallery', 126, 56], // 39
  ['laundry', 128, 65], // 44
  ['corridor', 166, 65], // 47
  ['front-hall', 210, 74], // 55
  ['furnace-room', 126, 83], // 57
  ['gear-loft', 255, 26], // 61, on the floor's end
  ['pendulum-hall', 258, 74], // 66
  ['back-wing-upper', 310, 29], // 70
  ['back-wing-lower', 310, 110], // 73
  ['pipeworks', 126, 111], // 77
  ['vault', 62, 135], // 81
  ['mole-city', 12, 121], // 85
  ['sunken-rooms', 8, 150], // 88
  ['foundations', 126, 141], // 93
  ['taproot', 150, 160], // 97
  ['apple-roots', 195, 170], // 98
];

// What the levers and the piano keys work (their switchIds, and the last
// part of their WorldState flags, `shed.<id>`).
const SWITCH = {
  flue: 'flue',
  vents: 'vents',
  vault: 'vault',
  curtain: 'curtain',
} as const;

// The flue (17), from the laundry up to the roof, and the stub of it in the
// scullery below; the pipeworks' four vents (78).
const FLUE: readonly TileRect[] = [
  { col: 157, row: 12, cols: 3, rows: 53 },
  { col: 157, row: 71, cols: 3, rows: 3 },
];
const VENTS: readonly TileRect[] = [152, 174, 212, 229].map((col) => ({ col, row: 89, cols: 2, rows: 22 }));

// The piano keys (36), C, E and G, and the curtain (37) they draw aside.
const KEYS: readonly (readonly [string, number, number])[] = [
  ['key-c', 214, 523.25],
  ['key-e', 226, 659.25],
  ['key-g', 236, 783.99],
];
const CURTAIN: TileRect = { col: 243, row: 42, cols: 1, rows: 5 };

// The back lift (69) stops at every storey of the back wing: the rows its
// riders stand on.
const BACK_LIFT_STOPS = [28, 37, 55, 64, 73, 82, 94, 109, 123, 140, 149, 160, 170];

// A clothesline's tie, on its post over the tile the player stands on.
const tie = (col: number, row: number) => ({ x: col * T + 8, y: (row + 1) * T - 24 });

// Where the hazards are drawn as something other than thorns: the jacks on
// the nursery floor, the scullery's mousetraps, the furnace's grate.
const HAZARD_LOOKS: readonly HazardRegion[] = [
  { area: { col: 0, row: 84, cols: 340, rows: 88 }, look: HAZARD_LOOK.thornyRoots },
  { area: { col: 118, row: 39, cols: 38, rows: 9 }, look: HAZARD_LOOK.jacks },
  { area: { col: 118, row: 66, cols: 43, rows: 9 }, look: HAZARD_LOOK.mousetraps },
  { area: { col: 180, row: 82, cols: 17, rows: 1 }, look: HAZARD_LOOK.furnaceGrate },
];

// ---------------------------------------------------------------------------
// Rooms and light. Each room's back wall and its own light (0.62 is a room
// as drawn; the deeper, the darker), and the lamps, candles, stove, boiler
// and windows that light them.
// ---------------------------------------------------------------------------

const room = (r: LitRoom): LitRoom => r;
const B = ROOM_BACKDROP;

// The back wing's floors, top to bottom: the wing's roof first.
const BACK_WING_FLOORS = [20, 29, 38, 56, 65, 74, 83, 96, 111, 125, 142, 151, 162, 171];

const POTTING_SHED_ROOMS: LitRoom[] = [
  room({
    id: 'shed',
    name: 'The Shed',
    backdrop: B.shed,
    col: 6,
    row: 68,
    cols: 7,
    rows: 6,
    ambient: 0.72,
    holdsCamera: true,
  }),
  room({ id: 'hall', name: 'Seed Hall', backdrop: B.drawers, col: 14, row: 57, cols: 46, rows: 17, ambient: 0.66 }),
  room({ id: 'lumber', name: 'Lumber Room', backdrop: B.rafters, col: 3, row: 59, cols: 10, rows: 6, ambient: 0.34 }),
  room({ id: 'kitchen', name: 'Kitchen', backdrop: B.kitchen, col: 61, row: 66, cols: 24, rows: 8, ambient: 0.58 }),
  room({ id: 'pantry', name: 'Pantry', backdrop: B.kitchen, col: 86, row: 68, cols: 12, rows: 6, ambient: 0.42 }),
  room({ id: 'library', name: 'Library', backdrop: B.wallGreen, col: 61, row: 57, cols: 24, rows: 8, ambient: 0.54 }),
  room({ id: 'sewing', name: 'Sewing Room', backdrop: B.wallRose, col: 86, row: 57, cols: 12, rows: 8, ambient: 0.5 }),
  room({ id: 'loft', name: 'Drying Loft', backdrop: B.rafters, col: 14, row: 48, cols: 46, rows: 8, ambient: 0.52 }),
  room({
    id: 'landing',
    name: 'Narrow Landing',
    backdrop: B.wallGreen,
    col: 61,
    row: 52,
    cols: 37,
    rows: 4,
    ambient: 0.44,
  }),
  // Up to the roof's underside: the ladder to the skylight climbs through it.
  room({ id: 'attic', name: 'The Attic', backdrop: B.rafters, col: 14, row: 24, cols: 71, rows: 23, ambient: 0.32 }),
  room({
    id: 'bedroom',
    name: 'Eaves Bedroom',
    backdrop: B.wallRose,
    col: 86,
    row: 38,
    cols: 12,
    rows: 9,
    ambient: 0.4,
  }),
  room({ id: 'stairs', name: 'The Stairwell', backdrop: B.shed, col: 99, row: 40, cols: 8, rows: 43, ambient: 0.38 }),
  room({ id: 'shaft', name: 'Dumbwaiter', backdrop: B.shed, col: 108, row: 48, cols: 1, rows: 35, ambient: 0.3 }),
  room({ id: 'box', name: 'Box Room', backdrop: B.rafters, col: 110, row: 50, cols: 8, rows: 6, ambient: 0.3 }),
  room({
    id: 'linen',
    name: 'Linen Cupboard',
    backdrop: B.wallRose,
    col: 110,
    row: 59,
    cols: 8,
    rows: 6,
    ambient: 0.32,
  }),
  room({ id: 'boot', name: 'Boot Room', backdrop: B.shed, col: 110, row: 68, cols: 8, rows: 6, ambient: 0.34 }),
  room({ id: 'apple', name: 'Apple Store', backdrop: B.brick, col: 14, row: 76, cols: 27, rows: 7, ambient: 0.3 }),
  room({
    id: 'cellar',
    name: 'Preserves Cellar',
    backdrop: B.brick,
    col: 42,
    row: 76,
    cols: 29,
    rows: 7,
    ambient: 0.28,
  }),
  room({ id: 'boiler', name: 'Boiler Room', backdrop: B.brick, col: 72, row: 75, cols: 26, rows: 8, ambient: 0.32 }),
  room({ id: 'coal', name: 'Coal Hole', backdrop: B.brick, col: 110, row: 77, cols: 8, rows: 6, ambient: 0.2 }),
  // The mole's chamber opens up off the west tunnel: listed first, it owns
  // the stretch of tunnel under it, so walking in lights the whole chamber.
  room({ id: 'mole', name: "Mole's Chamber", backdrop: B.earth, col: 40, row: 84, cols: 15, rows: 6, ambient: 0.25 }),
  room({
    id: 'tunnel-west',
    name: 'West Tunnel',
    backdrop: B.earth,
    col: 16,
    row: 87,
    cols: 43,
    rows: 3,
    ambient: 0.22,
  }),
  room({
    id: 'tunnel-east',
    name: 'East Tunnel',
    backdrop: B.earth,
    col: 56,
    row: 87,
    cols: 41,
    rows: 3,
    ambient: 0.2,
  }),
  room({ id: 'pool', name: 'The Still Pool', backdrop: B.pool, col: 60, row: 92, cols: 19, rows: 7, ambient: 0.17 }),
  room({ id: 'deep', name: 'Deep Tunnel', backdrop: B.earth, col: 79, row: 102, cols: 29, rows: 3, ambient: 0.14 }),
  room({ id: 'roots', name: 'Root Chamber', backdrop: B.earth, col: 108, row: 98, cols: 10, rows: 7, ambient: 0.15 }),

  // The shaft from the west tunnel down to Mole City.
  room({ id: 'shaft-down', name: 'The Shaft', backdrop: B.earth, col: 14, row: 90, cols: 9, rows: 22, ambient: 0.2 }),

  // The east wing, a storey at a time (floors at rows 29, 38, 47, 56, 65, 74
  // and 83, each room down to its own floor), west of the flue, the flue,
  // then east of it. The flue is listed first: it owns its column through
  // every storey, and the doorways it crosses.
  room({ id: 'flue', name: 'The Flue', backdrop: B.brick, col: 156, row: 20, cols: 5, rows: 45, ambient: 0.3 }),
  room({ id: 'studio', name: 'The Studio', backdrop: B.rafters, col: 118, row: 21, cols: 38, rows: 9, ambient: 0.6 }),
  room({ id: 'loft', name: 'The Loft', backdrop: B.rafters, col: 161, row: 21, cols: 47, rows: 9, ambient: 0.52 }),
  room({
    id: 'orrery',
    name: 'The Orrery',
    backdrop: B.wallGreen,
    col: 208,
    row: 21,
    cols: 43,
    rows: 18,
    ambient: 0.5,
  }),
  room({
    id: 'bathroom',
    name: 'The Bathroom',
    backdrop: B.wallGreen,
    col: 118,
    row: 30,
    cols: 38,
    rows: 9,
    ambient: 0.56,
  }),
  room({
    id: 'tank-room',
    name: 'The Tank Room',
    backdrop: B.shed,
    col: 161,
    row: 30,
    cols: 47,
    rows: 9,
    ambient: 0.5,
  }),
  room({
    id: 'nursery',
    name: 'The Nursery',
    backdrop: B.wallRose,
    col: 118,
    row: 39,
    cols: 38,
    rows: 9,
    ambient: 0.58,
  }),
  room({
    id: 'dollhouse',
    name: 'The Dollhouse Room',
    backdrop: B.wallRose,
    col: 161,
    row: 39,
    cols: 47,
    rows: 18,
    ambient: 0.54,
  }),
  room({
    id: 'music',
    name: 'The Music Room',
    backdrop: B.wallGreen,
    col: 208,
    row: 39,
    cols: 43,
    rows: 9,
    ambient: 0.54,
  }),
  room({
    id: 'gallery',
    name: 'The Long Gallery',
    backdrop: B.wallGreen,
    col: 118,
    row: 48,
    cols: 38,
    rows: 9,
    ambient: 0.56,
  }),
  room({
    id: 'clocks',
    name: 'The Room of Clocks',
    backdrop: B.wallRose,
    col: 208,
    row: 48,
    cols: 43,
    rows: 9,
    ambient: 0.5,
  }),
  room({
    id: 'laundry',
    name: 'The Laundry',
    backdrop: B.kitchen,
    col: 118,
    row: 57,
    cols: 38,
    rows: 9,
    ambient: 0.56,
  }),
  room({
    id: 'corridor',
    name: 'The Corridor of Doors',
    backdrop: B.wallGreen,
    col: 161,
    row: 57,
    cols: 90,
    rows: 9,
    ambient: 0.5,
  }),
  room({
    id: 'scullery',
    name: 'The Scullery',
    backdrop: B.kitchen,
    col: 118,
    row: 66,
    cols: 43,
    rows: 9,
    ambient: 0.54,
  }),
  room({ id: 'workshop', name: 'The Workshop', backdrop: B.shed, col: 161, row: 66, cols: 47, rows: 9, ambient: 0.52 }),
  room({
    id: 'front-hall',
    name: 'The Front Hall',
    backdrop: B.wallGreen,
    col: 208,
    row: 66,
    cols: 43,
    rows: 9,
    ambient: 0.6,
  }),
  room({
    id: 'furnace',
    name: 'The Furnace Room',
    backdrop: B.brick,
    col: 118,
    row: 75,
    cols: 133,
    rows: 9,
    ambient: 0.5,
  }),

  // The clock tower, from the dial down to the weight pit.
  room({
    id: 'clock-face',
    name: 'The Clock Face',
    backdrop: B.brick,
    col: 251,
    row: 4,
    cols: 49,
    rows: 10,
    ambient: 0.42,
  }),
  room({
    id: 'gear-loft',
    name: 'The Gear Loft',
    backdrop: B.brick,
    col: 251,
    row: 14,
    cols: 49,
    rows: 13,
    ambient: 0.4,
  }),
  room({
    id: 'escapement',
    name: 'The Escapement',
    backdrop: B.brick,
    col: 251,
    row: 27,
    cols: 49,
    rows: 12,
    ambient: 0.4,
  }),
  room({
    id: 'weights',
    name: 'The Weights Shaft',
    backdrop: B.brick,
    col: 251,
    row: 39,
    cols: 49,
    rows: 18,
    ambient: 0.36,
  }),
  room({
    id: 'pendulum-hall',
    name: 'The Pendulum Hall',
    backdrop: B.brick,
    col: 251,
    row: 57,
    cols: 49,
    rows: 18,
    ambient: 0.4,
  }),
  room({
    id: 'weight-pit',
    name: 'The Weight Pit',
    backdrop: B.brick,
    col: 251,
    row: 75,
    cols: 49,
    rows: 9,
    ambient: 0.36,
  }),

  // The back wing: thirteen rooms stacked along the lift, each down to its
  // floor.
  ...BACK_WING_FLOORS.slice(1).map((floor, i) => {
    const top = BACK_WING_FLOORS[i] + 1;
    const backdrop = i % 2 ? B.wallRose : B.wallGreen;
    return room({
      id: `back-${i + 1}`,
      name: 'The Back Wing',
      backdrop,
      col: 300,
      row: top,
      cols: 40,
      rows: floor - top + 1,
      ambient: 0.35,
    });
  }),

  // Under it all.
  room({
    id: 'pipeworks',
    name: 'The Pipeworks',
    backdrop: B.brick,
    col: 122,
    row: 84,
    cols: 134,
    rows: 29,
    ambient: 0.3,
  }),
  room({
    id: 'coal-bunker',
    name: 'The Coal Bunker',
    backdrop: B.brick,
    col: 256,
    row: 84,
    cols: 44,
    rows: 29,
    ambient: 0.24,
  }),
  room({
    id: 'vault',
    name: 'The Seed Vault',
    backdrop: B.brick,
    col: 58,
    row: 105,
    cols: 62,
    rows: 37,
    ambient: 0.22,
  }),
  room({ id: 'mole-city', name: 'Mole City', backdrop: B.earth, col: 4, row: 112, cols: 54, rows: 30, ambient: 0.22 }),
  room({
    id: 'foundations',
    name: 'The Foundations',
    backdrop: B.earth,
    col: 120,
    row: 113,
    cols: 180,
    rows: 29,
    ambient: 0.2,
  }),
  room({
    id: 'sunken-parlour',
    name: 'The Sunken Parlour',
    backdrop: B.wallGreen,
    col: 4,
    row: 142,
    cols: 133,
    rows: 10,
    ambient: 0.22,
  }),
  room({
    id: 'sunken-rooms',
    name: 'The Sunken Rooms',
    backdrop: B.wallRose,
    col: 4,
    row: 152,
    cols: 133,
    rows: 10,
    ambient: 0.2,
  }),
  room({
    id: 'buried-nursery',
    name: 'The Buried Nursery',
    backdrop: B.wallRose,
    col: 4,
    row: 162,
    cols: 133,
    rows: 10,
    ambient: 0.18,
  }),
  room({
    id: 'taproot',
    name: 'The Taproot',
    backdrop: B.earth,
    col: 137,
    row: 142,
    cols: 48,
    rows: 30,
    ambient: 0.16,
  }),
  room({
    id: 'apple-roots',
    name: 'The Apple Roots',
    backdrop: B.earth,
    col: 185,
    row: 142,
    cols: 115,
    rows: 30,
    ambient: 0.2,
  }),

  // The pigeon loft on the roof, and the roof itself, under the sky: listed
  // last, it has whatever of its rows the rooms above have not.
  room({
    id: 'pigeon-loft',
    name: 'The Pigeon Loft',
    backdrop: B.rafters,
    col: 163,
    row: 4,
    cols: 31,
    rows: 16,
    ambient: 0.5,
  }),
  room({
    id: 'roof',
    name: 'The Roof',
    backdrop: B.sky,
    col: 0,
    row: 0,
    cols: 340,
    rows: 24,
    ambient: 0.62,
    outdoors: true,
  }),
];

// In tiles. A lamp is warm: a lamp, a candle, the stove, the boiler. A pane
// is cool: a window, the skylight, the pool's own shine.
const lamp = (x: number, y: number, radius: number, strength: number): LightSource => ({
  x,
  y,
  radius,
  strength,
  warm: true,
});
const pane = (x: number, y: number, radius: number, strength: number): LightSource => ({
  x,
  y,
  radius,
  strength,
  warm: false,
});

const POTTING_SHED_LIGHTS: LightSource[] = [
  // The pool's own faint shine, and the shed's window.
  pane(69, 97, 6, 0.28),
  pane(10.6, 70, 4, 0.35),
  // The seed hall's four lamps, the stove, the kitchen candle, the pantry's.
  lamp(19.5, 58.4, 6, 0.5),
  lamp(31.5, 58.4, 6, 0.5),
  lamp(45.5, 58.4, 6, 0.5),
  lamp(56.5, 58.4, 6, 0.5),
  lamp(66.5, 71.6, 6.5, 0.5),
  lamp(80.5, 71.5, 3, 0.35),
  lamp(96.5, 72.4, 3.5, 0.4),
  // The library's desk lamp and the sewing room's lamp.
  lamp(78, 62.6, 5, 0.55),
  lamp(93.5, 58.4, 5, 0.5),
  // The drying loft's windows, the landing's candles.
  pane(27.5, 50.6, 4.5, 0.4),
  pane(50.5, 50.6, 4.5, 0.4),
  lamp(70.5, 54.4, 3.5, 0.4),
  lamp(90.5, 54.4, 3.5, 0.4),
  // The attic's skylight, the bedroom's candle, a candle on every landing.
  pane(50.5, 33, 7, 0.5),
  lamp(87.5, 45.4, 3, 0.4),
  lamp(104.5, 45.4, 3, 0.35),
  lamp(104.5, 54.4, 3, 0.35),
  lamp(104.5, 63.4, 3, 0.35),
  lamp(104.5, 72.4, 3, 0.35),
  // The apple store's lamp, the cellar's candle, the boiler, the mole's lamp.
  lamp(26.5, 77.4, 5, 0.45),
  lamp(56.5, 77.4, 4, 0.45),
  lamp(82, 80.5, 7, 0.6),
  lamp(47.5, 85.4, 5, 0.45),
  // The Wrong-Size Window.
  pane(94.5, 44, 5, 0.55),
  // A lamp at every checkpoint (dark until it is lit), the furnace, the
  // clock's dial, the well's lamp far down.
  ...LAMPS.map(([id, col, row]) => ({ ...lamp(col + 0.5, row - 1.5, 4, 0.45), lamp: id })),
  lamp(188, 79, 9, 0.65),
  pane(253, 9, 6, 0.45),
  lamp(333, 95, 3, 0.35),
];

const POTTING_SHED_LIGHTING: LevelLighting = { rooms: POTTING_SHED_ROOMS, lights: POTTING_SHED_LIGHTS };

// ---------------------------------------------------------------------------
// Furniture. Placed by tile: the base on the top of row `row`, or — for what
// hangs — the ceiling on the bottom of row `row - 1`.
// ---------------------------------------------------------------------------

// The house's props in HD: the prop recipe along the lit ramp.
const houseProp = (recorded: ClassicRecorder) => propHd(recorded, LIT_RAMP);

const at = (draw: (g: Graphics) => void, col: number, row: number): DecorationSpec => ({
  x: Math.round(col * T + 8),
  y: Math.round(row * T),
  draw,
  hd: houseProp,
});

const POTTING_SHED_DECORATIONS: DecorationSpec[] = [
  // The shed.
  at(drawShedWindow, 10.6, 71.6),
  at(drawPottingBench, 10, 74),
  at(drawPots, 7.4, 74),
  at(drawRake, 12.4, 74),
  // The seed hall.
  ...[19, 31, 45, 56].map((col) => at(drawHangingLamp, col, 57)),
  at(drawDrawerCabinet, 26, 74),
  at(drawDrawerCabinet, 54, 74),
  at(drawPots, 47, 74),
  // The kitchen and the pantry.
  at(drawStove, 66, 74),
  at(drawHerbs, 63, 66),
  at(drawOnions, 71, 66),
  at(drawKitchenTable, 79, 74),
  at(drawCandle, 80, 73.25),
  at(drawJars, 78.5, 70),
  at(drawJars, 90, 72),
  at(drawJars, 94, 72),
  at(drawAppleCrate, 88, 74),
  at(drawCandle, 96, 74),
  // The library and the sewing room.
  at(drawDesk, 77, 65),
  at(drawDressForm, 89, 65),
  at(drawHangingLamp, 93, 57),
  at(drawTrunk, 95, 65),
  // The drying loft.
  at(drawLavender, 17, 48),
  at(drawHerbs, 21, 48),
  at(drawOnions, 25, 48),
  at(drawLavender, 29, 48),
  at(drawHerbs, 34, 48),
  at(drawOnions, 44, 48),
  at(drawLavender, 48, 48),
  at(drawHerbs, 52, 48),
  at(drawLavender, 56, 48),
  at(drawSmallWindow, 27, 51.6),
  at(drawSmallWindow, 50, 51.6),
  // The landing.
  at(drawCandle, 70, 56),
  at(drawTrunk, 77, 56),
  at(drawCandle, 90, 56),
  at(drawPots, 84, 56),
  // The attic and the eaves bedroom.
  at(drawTrunk, 24, 47),
  at(drawSheetedTrunk, 31, 47),
  at(drawRockingHorse, 37, 47),
  at(drawSheetedTrunk, 62, 47),
  at(drawTrunk, 70, 47),
  at(drawSkylight, 50, 31.6),
  at(drawBed, 90, 47),
  at(drawCandle, 87, 47),
  // A candle on every landing of the stairwell; the box room and linen cupboard.
  ...[47, 56, 65, 74].map((row) => at(drawCandle, 104, row)),
  at(drawTrunk, 113, 65),
  at(drawSheetedTrunk, 113, 56),
  // The basement.
  at(drawAppleCrate, 114, 83),
  ...[17, 21, 33, 37].map((col) => at(drawAppleCrate, col, 83)),
  at(drawHangingLamp, 26, 76),
  at(drawJars, 49, 79),
  at(drawJars, 61, 79),
  at(drawJars, 55, 83),
  at(drawCandle, 64, 79),
  at(drawBoiler, 82, 83),
  at(drawPipes, 78, 75),
  at(drawPipes, 90, 75),
  // The tunnels: roots through the ceiling, and the mole's lamp.
  ...[24, 31, 36, 58, 66, 86].map((col) => at(drawRoots, col, 87)),
  at(drawRoots, 44, 84),
  at(drawRoots, 51, 84),
  at(drawHangingLamp, 47, 84),
  ...[84, 92, 100, 105].map((col) => at(drawRoots, col, 102)),
  ...[110, 113, 116].map((col) => at(drawRoots, col, 98)),

  // The roof walk: pots by the lamp.
  at(drawPots, 138, 18),
  // The studio and the loft under the east wing's roof.
  at(drawDesk, 134, 29),
  at(drawDressForm, 147, 29),
  at(drawSheetedTrunk, 152, 29),
  at(drawSmallWindow, 144, 25.6),
  at(drawHangingLamp, 150, 21),
  at(drawTrunk, 170, 29),
  at(drawTrunk, 176, 29),
  at(drawSheetedTrunk, 184, 29),
  at(drawLavender, 172, 21),
  at(drawHerbs, 180, 21),
  at(drawOnions, 188, 21),
  at(drawSmallWindow, 190, 25.6),
  // The bathroom's lamp over the bath and its jars on the shelf; the tank
  // room's pipes.
  at(drawHangingLamp, 138, 30),
  at(drawJars, 150, 35),
  at(drawPipes, 185, 30),
  at(drawPipes, 200, 30),
  // The nursery: a bed, a rocking horse, a lamp.
  at(drawBed, 148, 47),
  at(drawRockingHorse, 142, 47),
  at(drawHangingLamp, 126, 39),
  // The music room's lamps.
  at(drawHangingLamp, 222, 39),
  at(drawHangingLamp, 232, 39),
  // The gallery's trunks.
  at(drawTrunk, 134, 56),
  at(drawSheetedTrunk, 154, 56),
  // The Room of Clocks: more clocks, all stopped.
  ...[219, 238, 249].map((col) => at(drawGrandfatherClock, col, 56)),
  // The laundry's drying herbs and its table.
  at(drawHerbs, 137, 57),
  at(drawLavender, 143, 57),
  at(drawKitchenTable, 135, 65),
  // The corridor's lamps, between the doors.
  ...[175, 195, 215, 237].map((col) => at(drawHangingLamp, col, 57)),
  // The scullery's jars and herbs.
  at(drawJars, 152, 74),
  at(drawHerbs, 140, 66),
  // The workshop's bench, crate and rake.
  at(drawPottingBench, 200, 74),
  at(drawAppleCrate, 172, 74),
  at(drawRake, 175, 74),
  // The front hall's lamps and windows.
  at(drawHangingLamp, 220, 66),
  at(drawHangingLamp, 240, 66),
  at(drawSmallWindow, 214, 69.6),
  at(drawSmallWindow, 246, 69.6),
  // The furnace room's pipes.
  at(drawPipes, 140, 75),
  at(drawPipes, 220, 75),
  // The back wing: a bed, trunks, a desk, lamps.
  at(drawBed, 325, 38),
  at(drawTrunk, 315, 56),
  at(drawDesk, 330, 65),
  at(drawSheetedTrunk, 315, 74),
  at(drawHangingLamp, 315, 30),
  at(drawHangingLamp, 330, 30),
  // The pipeworks' pipes, the vault's lamps.
  ...[140, 192, 244].map((col) => at(drawPipes, col, 88)),
  at(drawHangingLamp, 75, 116),
  at(drawHangingLamp, 95, 116),
  // Roots through every ceiling under the ground.
  ...[40, 50].map((col) => at(drawRoots, col, 116)),
  ...[150, 175, 230, 280].map((col) => at(drawRoots, col, 116)),
  ...[200, 215, 250, 260, 280].map((col) => at(drawRoots, col, 148)),
  // The sunken rooms: the parlour's trunk and desk, the buried nursery's
  // toys put away.
  at(drawSheetedTrunk, 20, 150),
  at(drawDesk, 104, 150),
  at(drawRockingHorse, 49, 169),
  at(drawTrunk, 55, 170),
];

// ---------------------------------------------------------------------------
// Landmarks. The spiral of the Sundial and the Seed Store runs through four
// of them.
// ---------------------------------------------------------------------------

const POTTING_SHED_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'grandfather-clock',
    x: 43 * T + 8,
    y: GROUND_Y,
    name: 'Grandfather Clock',
    description:
      'A tall clock in the seed hall, ticking politely. Its hands do not go round the dial: they wind inward, ' +
      'a little further every hour, toward the middle.',
    drawBody: drawGrandfatherClock,
    drawSketch: drawClockSketch,
  },
  {
    id: 'seed-catalogue',
    x: 71 * T + 8,
    y: 65 * T,
    name: 'Seed Catalogue',
    description:
      'Every seed the garden has ever grown, drawn and named in a careful hand. The last page has a packet ' +
      'glued in, labelled only with the spiral, and it is full.',
    drawBody: drawSeedCatalogue,
    drawSketch: drawCatalogueSketch,
  },
  {
    id: 'wrong-size-window',
    x: 94 * T + 8,
    y: 47 * T,
    name: 'Wrong-Size Window',
    description:
      "The shed's little window, the one with the pot in it. From the garden it is the size of a tea tray. " +
      'From up here it is the size of a door, and the pot is the same pot.',
    drawBody: drawWrongSizeWindow,
    drawSketch: drawWindowSketch,
  },
  {
    id: 'dumbwaiter',
    x: 112 * T + 8,
    y: GROUND_Y,
    name: 'Dumbwaiter',
    description:
      'A box on a rope, for sending things between floors. There is a cup of tea in it, still warm, and no ' +
      'one to say who it was sent to.',
    drawBody: drawDumbwaiter,
    drawSketch: drawDumbwaiterSketch,
  },
  {
    id: 'root-map',
    x: 113 * T + 8,
    y: 105 * T,
    name: 'Root Map',
    description:
      'At the end of the last tunnel the roots of the garden come through the wall, and someone has labelled ' +
      'them: pear, bean, sunflower, well. Followed far enough, they all turn the same way.',
    drawBody: drawRootMap,
    drawSketch: drawRootMapSketch,
  },
];

export const pottingShedLevel: LevelSpec = {
  id: 'potting-shed',
  name: 'The Potting Shed',
  rows: POTTING_SHED_ROWS,
  spawns: POTTING_SHED_SPAWNS,
  defaultSpawnId: 'from-garden',
  landmarks: [...POTTING_SHED_LANDMARKS, ...POTTING_SHED_NEW_LANDMARKS],
  decorations: POTTING_SHED_DECORATIONS,
  parallax: 'night',
  // Classic draws the house as any dark interior, under the night sky over
  // the roof; HD gives each room its own back wall and light (lighting
  // above), and the roof none.
  backdrop: 'indoor-dark',
  rockBgStartRow: 0,
  backdropRegions: [
    { col: 0, row: 24, cols: 340, rows: 148 },
    { col: 118, row: 21, cols: 222, rows: 3 },
    { col: 163, row: 6, cols: 31, rows: 14 },
    { col: 254, row: 4, cols: 42, rows: 17 },
  ],
  hazardLooks: HAZARD_LOOKS,
  openSky: true,
  lighting: POTTING_SHED_LIGHTING,
  createEntities(ctx: InteractContext): readonly Entity[] {
    const flag = (id: string) => `shed.${id}`;
    const lever = (id: string, at: readonly [number, number]) =>
      new Lever({
        id,
        x: at[0] * T + 8,
        y: at[1] * T,
        targets: [id],
        flag: flag(id),
        pulled: ctx.worldState.get(flag(id)),
      });
    const sootDraft = (id: string, area: TileRect) =>
      new PulsedUpdraft({ id, area, active: ctx.worldState.get(flag(id)), look: UPDRAFT_LOOK.soot });
    const falling = (variant: HazardVariant, [col, ceiling]: readonly [number, number]) =>
      new FallingHazard({ x: col * T + 8, y: (ceiling + 1) * T, variant, audio: ctx.audio });
    return [
      new Door({
        id: 'shed-return-door',
        x: DOOR_X,
        y: GROUND_Y,
        targetLevelId: 'kitchen-garden',
        targetSpawnId: 'from-shed',
        promptLabel: 'go out',
        drawBody: drawShedDoorInside,
      }),
      ...CORRIDOR_DOORS.map(
        ([id, col], i) =>
          new Door({
            id: `door-${i + 1}`,
            x: col * T + 8,
            y: CORRIDOR_Y,
            targetLevelId: 'potting-shed',
            targetSpawnId: id,
            promptLabel: 'open',
          }),
      ),
      ...LAMPS.map(
        ([id, col, row]) =>
          new Cairn({
            id,
            col,
            row,
            look: CAIRN_LOOK.lamp,
            lit: ctx.worldState.get(cairnLitFlag('potting-shed', id)),
          }),
      ),
      // The flue and its damper lever in the laundry (45); the vents and the
      // valve lever (79); the vault grate and its lever on the last drawer
      // cabinet (83).
      ...FLUE.map((area) => sootDraft(SWITCH.flue, area)),
      lever(SWITCH.flue, [150, 65]),
      ...VENTS.map((area) => sootDraft(SWITCH.vents, area)),
      lever(SWITCH.vents, [246, 95]),
      new Portcullis({
        id: SWITCH.vault,
        col: 111,
        row: 130,
        rows: portcullisRows(POTTING_SHED_ROWS, { col: 111, row: 130 }),
        look: PORTCULLIS_LOOK.grate,
      }),
      lever(SWITCH.vault, [106, 130]),
      // The piano keys and the curtain.
      ...KEYS.map(
        ([id, col, pitch]) =>
          new CrystalSwitch({
            id,
            area: { col, row: 46, cols: 2, rows: 1 },
            pitch,
            lit: ctx.worldState.get(crystalLitFlag('potting-shed', id)),
            look: CRYSTAL_LOOK.pianoKey,
          }),
      ),
      new CrystalGate({
        id: SWITCH.curtain,
        area: CURTAIN,
        switches: KEYS.map(([id]) => id),
        open: ctx.worldState.get(gateOpenFlag('potting-shed', SWITCH.curtain)),
        look: GATE_LOOK.curtain,
      }),
      // The orrery's arms (27) and the tower's gears (63).
      new MillWheel({ x: 229 * T + 8, y: 30 * T + 8, radius: 7 * T, period: 12, look: WHEEL_LOOK.orrery }),
      new MillWheel({ x: 280 * T + 8, y: 18 * T + 8, radius: 4 * T, period: 8, look: WHEEL_LOOK.gear }),
      // The clock pendulums (42) over the hole in the Room of Clocks' floor,
      // and the great pendulum (65).
      ...[225, 233].map(
        (col, i) =>
          new SwingingChandelier({
            x: col * T + 8,
            y: 47 * T + 8,
            chain: 5 * T,
            phase: i * Math.PI,
            period: 1.2,
            amplitude: (30 * Math.PI) / 180,
          }),
      ),
      new SwingingChandelier({
        x: 275 * T + 8,
        y: 57 * T,
        chain: 10 * T,
        phase: 0,
        period: 2,
        amplitude: (25 * Math.PI) / 180,
      }),
      // The toy train (30) along the nursery shelf, the back lift (69) and
      // the clock weights (64).
      new Shuttle({
        look: SHUTTLE_LOOK.minecart,
        from: { x: 128 * T, y: 42 * T },
        to: { x: 153 * T, y: 42 * T },
        w: 2 * T,
        h: T,
        speed: 30,
        pause: 1,
      }),
      new Shuttle({
        look: SHUTTLE_LOOK.lift,
        from: { x: 301 * T, y: (BACK_LIFT_STOPS[0] + 1) * T },
        to: { x: 301 * T, y: (BACK_LIFT_STOPS[BACK_LIFT_STOPS.length - 1] + 1) * T },
        w: 3 * T,
        h: T,
        speed: 40,
        pause: 1.5,
        stops: BACK_LIFT_STOPS.map((row) => (row - BACK_LIFT_STOPS[0]) * T),
      }),
      new Shuttle({
        look: SHUTTLE_LOOK.lift,
        from: { x: 286 * T, y: 38 * T },
        to: { x: 286 * T, y: 73 * T },
        w: 3 * T,
        h: T,
        speed: 30,
        pause: 1.5,
      }),
      // The toy blocks (31) and the workshop's crates (53).
      new PushBlock({ col: 132, row: 46, look: BLOCK_LOOK.crate }),
      new PushBlock({ col: 186, row: 73, look: BLOCK_LOOK.crate }),
      new PushBlock({ col: 190, row: 73, look: BLOCK_LOOK.crate }),
      // The kite strings (19), from the belvedere to the pigeon loft's roof
      // and on to the chimney; the laundry lines (46).
      new Clothesline({ from: tie(258, 1), to: tie(194, 3) }),
      new Clothesline({ from: tie(163, 3), to: tie(93, 16) }),
      new Clothesline({ from: tie(133, 58), to: tie(126, 61) }),
      new Clothesline({ from: tie(135, 58), to: tie(147, 61) }),
      // Picture frames (40), loose plaster (50), earth clods (95).
      ...[130, 140, 150].map((col) => falling(HAZARD_VARIANT.frame, [col, 47])),
      ...[190, 220].map((col) => falling(HAZARD_VARIANT.plaster, [col, 56])),
      ...[200, 260].map((col) => falling(HAZARD_VARIANT.clod, [col, 115])),
      new Embers({ col: 184, row: 82, cols: 9, rows: 1 }),
      ...houseCreatures(),
      ...newWingCreatures(),
    ];
  },
};

// Today's house's creatures, where they have always been.
function houseCreatures(): Entity[] {
  return [
    // The cat asleep by the stove; mice in the pantry and the apple store.
    new Cat({ x: 70 * T + 8, y: GROUND_Y }),
    new Mouse({ x: 92 * T + 8, y: GROUND_Y, minX: 87 * T, maxX: 96 * T }),
    new Mouse({ x: 24 * T + 8, y: 83 * T, minX: 15 * T, maxX: 29 * T }),
    // The bookworm on top of the library's tall bookcase.
    new Bookworm({ x: 67 * T, y: 61 * T, minX: 66 * T + 3, maxX: 68 * T - 3 }),
    // Moths round the attic's skylight.
    new Moth({ x: 50 * T + 8, y: 36 * T, rx: 3 * T, ry: 1.4 * T, period: 7 }),
    new Moth({ x: 51 * T + 8, y: 37 * T, rx: 2.2 * T, ry: T, period: 5.5 }),
    // A spider in the attic rafters, and one in the west tunnel's roof.
    new Spider({ x: 72 * T + 8, y: 38 * T, drop: 4 * T }),
    new Spider({ x: 28 * T + 8, y: 87 * T, drop: 19 }),
    // The mole in its chamber; earthworms along the tunnels and at the pool.
    new Mole({ x: 46 * T + 8, y: 90 * T, minX: 41 * T, maxX: 53 * T }),
    new Earthworm({ x: 70 * T + 8, y: 90 * T, minX: 64 * T, maxX: 78 * T }),
    new Earthworm({ x: 92 * T + 8, y: 105 * T, minX: 82 * T, maxX: 104 * T }),
    new Earthworm({ x: 61 * T + 8, y: 99 * T, minX: 60 * T + 3, maxX: 62 * T + 6 }),
  ];
}

// Bounds are centre-x in pixels, inset 4 px from the tile edges so a body
// never visibly hangs off the end of its run.
const span = (from: number, to: number) => ({ minX: from * T + 4, maxX: (to + 1) * T - 4 });

// The creatures of the new wings, the roof and the ground under it all.
function newWingCreatures(): Entity[] {
  return [
    // Birds over the roof, bats round the tower, moths round the roof lamp.
    new Bird({ x: 60 * T, y: 6 * T, speed: 36, ...span(10, 150), facing: 1 }),
    new Bird({ x: 200 * T, y: 1 * T, speed: 42, ...span(120, 250), facing: -1 }),
    new Bat({ x: 300 * T, y: 8 * T }),
    new Bat({ x: 262 * T, y: 30 * T }),
    new Moth({ x: 126 * T + 8, y: 17 * T, rx: 2 * T, ry: T, period: 6 }),
    // The cat asleep in the Front Hall.
    new Cat({ x: 224 * T + 8, y: 74 * T }),
    // Mice in the scullery, the workshop and the vault.
    new Mouse({ x: 145 * T, y: 74 * T, ...span(138, 154) }),
    new Mouse({ x: 175 * T, y: 74 * T, ...span(166, 183) }),
    new Mouse({ x: 90 * T, y: 135 * T, ...span(66, 100) }),
    // Bookworms on the drawer cabinets.
    new Bookworm({ x: 78 * T, y: 120 * T, ...span(76, 80) }),
    new Bookworm({ x: 90 * T, y: 123 * T, ...span(88, 91) }),
    // Spiders in the tower and the gallery.
    new Spider({ x: 140 * T + 8, y: 48 * T, drop: 3 * T }),
    new Spider({ x: 262 * T + 8, y: 57 * T, drop: 5 * T }),
    // Moles and earthworms in Mole City, the foundations and the roots.
    new Mole({ x: 18 * T, y: 136 * T, ...span(14, 34) }),
    new Mole({ x: 160 * T, y: 141 * T, ...span(150, 170) }),
    new Earthworm({ x: 45 * T, y: 124 * T, ...span(40, 54) }),
    new Earthworm({ x: 230 * T, y: 170 * T, ...span(215, 245) }),
  ];
}

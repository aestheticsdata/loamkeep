import { TILE_SIZE } from '@constants';
import { Bookworm } from '@entities/bookworm';
import { Cat } from '@entities/cat';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import { Earthworm } from '@entities/earthworm';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { Mole } from '@entities/mole';
import { Moth } from '@entities/moth';
import { Mouse } from '@entities/mouse';
import { Spider } from '@entities/spider';
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
import type { Graphics } from 'pixi.js';

// The Potting Shed, inside (LOA-48). From the garden it is seven tiles of
// shed. Inside it is a whole house that cannot fit: an attic under a stepped
// roof, two upper floors, the ground floor, a basement, and tunnels running
// on under the garden. The first room is exactly the shed you expected —
// bench, pots, rake, the window with the pot in it — and the camera holds
// still on it; the doorway beyond opens on a hall forty-six tiles wide.
//
// 120 wide × 88 tall; the ground floor walks on row 50, the shed's own floor.
// Top to bottom:
//
//   The attic (rows 5-22) — trunks, dust sheets, a rocking horse, beams up
//     to the skylight and its moths; the eaves bedroom and the Wrong-Size
//     Window off it to the east.
//   Floor 2 (24-31) — the drying loft, herbs and onions from the rafters,
//     and the narrow landing.
//   Floor 1 (33-40) — the lumber room off the hall's west gallery, the
//     library and its Seed Catalogue, the sewing room.
//   The ground floor (42-49) — the shed, the seed hall (galleries, a stair,
//     the Grandfather Clock), the kitchen with its stove and sleeping cat,
//     the pantry.
//   The spine (16-58) — the stairwell, a landing on every floor, and the
//     dumbwaiter's shaft to the box room, linen cupboard, boot room (the
//     Dumbwaiter) and coal hole.
//   The basement (51-58) — apple store (a trapdoor from the hall),
//     preserves cellar, boiler room.
//   The tunnels (60-80) — west and east, the mole's chamber, a hole down to
//     the still pool, the deep tunnel and, at its end, the Root Map.
//
// At least two ways between every pair of floors; the hole at col 62 into
// the pool and the long ladder at col 79 back up make a loop. Every jump is
// two rows, with at most three columns of drift. Checked by the reachability
// test beside this file: every place a room can be stood in is reachable from
// the shed door, and the door from every one of them.
//
// Generated from the room list in design_handoff_potting_shed/prototype/
// shed-map.js; edit the rooms there and re-export.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . air   j plank wall   f floorboards   T timber   L bookcase   H ladder
//   W water   K dark stone   e packed earth   r root earth
const POTTING_SHED_ROWS = [
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  0
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  1
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  2
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  3
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  4
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.....jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  5  The Attic
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.........jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  6
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj...............jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  7
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj...................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  8
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.......................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', //  9
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.............................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', // 10
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.................................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', // 11
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.......................................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', // 12
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjj...........................................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', // 13
  'jjjjjjjjjjjjjjjjjjjjjjjjjjj...............................................jjjjjjjjjjjj...jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', // 14  Eaves Bedroom
  'jjjjjjjjjjjjjjjjjjjjjjjj.....................................................jjjjjjjjj......jjjjjjjjjjjjjjjjjjjjjjjjjjjj', // 15
  'jjjjjjjjjjjjjjjjjjjjjj.........................................................jjjjjjj.........jjjj.H......jjjjjjjjjjjjj', // 16  The Stairwell
  'jjjjjjjjjjjjjjjjjjj...........................TTTTTTTTT...........................jjjj............j.H......jjjjjjjjjjjjj', // 17
  'jjjjjjjjjjjjjjjjj...................................................................jj............j.H......jjjjjjjjjjjjj', // 18
  'jjjjjjjjjjjjjjj............................TT........................................j............j.H......jjjjjjjjjjjjj', // 19
  'jjjjjjjjjjjjjj.......................................................................j............j.H......jjjjjjjjjjjjj', // 20
  'jjjjjjjjjjjjjj..........................TT..........................................................H......jjjjjjjjjjjjj', // 21
  'jjjjjjjjjjjjjj......................................................................................H......jjjjjjjjjjjjj', // 22
  'jjjjjjjjjjjjjjffffffffffffffffffffffffffHffffffffffffffffffffffffffffffffffffffffffffffffffffffffffTHTTTTTTjjjjjjjjjjjjj', // 23
  'jjjjjjjjjjjjjj..........................H...................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.H......jHjjjjjjjjjjj', // 24  Drying Loft, Dumbwaiter
  'jjjjjjjjjjjjjj..........................H...................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.H......jHjjjjjjjjjjj', // 25
  'jjjjjjjjjjjjjj..........................H...................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.H......jHj........jj', // 26  Box Room
  'jjjjjjjjjjjjjj..........................H...................jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.H......jHj........jj', // 27
  'jjjjjjjjjjjjjj..........................H...................j.....................................j.H......jHj........jj', // 28  Narrow Landing
  'jjjjjjjjjjjjjj..........................H...................j.....................................j.H......jHj........jj', // 29
  'jjjjjjjjjjjjjj..........................H...........................................................H.......H.........jj', // 30
  'jjjjjjjjjjjjjj..........................H...........................................................H.......H.........jj', // 31
  'jjjjjjjjjjjjjjffHfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffHffffffffffffffffTHTTTTTTfHfffffffffjj', // 32
  'jjjjjjjjjjjjjj..H...........................................j.....................H..j............j.H......jHjjjjjjjjjjj', // 33  Seed Hall, Library, Sewing Room
  'jjjjjjjjjjjjjj..H...........................................j.....................H..j............j.H......jHjjjjjjjjjjj', // 34
  'jjj..........j..H...........................................j.....................H..j............j.H......jHj........jj', // 35  Lumber Room, Linen Cupboard
  'jjj..........j..H...........................................j.....................H..j............j.H......jHj........jj', // 36
  'jjj..........j..H...........................................j.....LL..............H..j............j.H......jHj........jj', // 37
  'jjj..........j..H...........................................j.....LL..............H..j............j.H......jHj........jj', // 38
  'jjj.............H..............................................LL.LL..............H.................H.......H.........jj', // 39
  'jjj.............H..............................................LL.LL..............H.................H.......H.........jj', // 40
  'jjjfffffffffffTTTTTTTTT...........................HTTTTTTTTTfffjjfjjffffffHffffffffffffffffffffffffTHTTTTTTfHfffffffffjj', // 41
  'jjjjjjjjjjjjjj..........TT........................H.........j.............H..........jjjjjjjjjjjjjj.H......jHjjjjjjjjjjj', // 42  Kitchen
  'jjjjjjjjjjjjjj............TT......................H.........j.............H..........jjjjjjjjjjjjjj.H......jHjjjjjjjjjjj', // 43
  'jjjjjj.......j..............TT....................H.........j.............H..........j............j.H......jHj........jj', // 44  The Shed, Pantry, Boot Room
  'jjjjjj.......j................TT..................H.........j.............H..........j............j.H......jHj........jj', // 45
  'jjjjjj.......j..................TT................H.........j.............H.TTTTT....j............j.H......jHj........jj', // 46
  'jjjjjj.......j....................TT..............H.........j.............H..........j............j.H......jHj........jj', // 47
  'jjjjjj..............................TT............H.......................H.............TTTTTTTT....H.......H.........jj', // 48
  'jjjjjj............................................H.......................H.........................H.......H.........jj', // 49
  'ffffffffffffffffffffffffffffffHffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffTHTTTTTTfHfffffffffff', // 50
  'eeeeeeeeeeeeeKKKKKKKKKKKKKKKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..........................K.H......KHKKKKKKKKKKe', // 51  Boiler Room
  'eeeeeeeeeeeeeK...........................K.............................K..........................K.H......KHKKKKKKKKKKe', // 52  Apple Store, Preserves Cellar
  'eeeeeeeeeeeeeK...........................K.............................K..........................K.H......KHK........Ke', // 53  Coal Hole
  'eeeeeeeeeeeeeK...........................K.............................K..........................K.H......KHK........Ke', // 54
  'eeeeeeeeeeeeeK...........................K....TTTTTTT.....TTTTTTT......K..........................K.H......KHK........Ke', // 55
  'eeeeeeeeeeeeeK...........................K.............................K..........................K.H......KHK........Ke', // 56
  'eeeeeeeeeeeeeK..............................T...........T...........................................H.......H.........Ke', // 57
  'eeeeeeeeeeeeeK......................................................................................H.......H.........Ke', // 58
  'eeeeeeeeeeeeeKKKKKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKe', // 59
  'eeeeeeeeeeeeeeeeeeeeHeeeeeeeeeeeeeeeeeee...............eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeHeeeeeeeeeeeeeeeeeeeeeeeeeee', // 60  Mole's Chamber
  'eeeeeeeeeeeeeeeeeeeeHeeeeeeeeeeeeeeeeeee...............eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeHeeeeeeeeeeeeeeeeeeeeeeeeeee', // 61
  'eeeeeeeeeeeeeeeerrTrHrrrrrrTrrrrrrrrTrrr...............rrrrrrrrTrrrrrrrrTrrrrrrrrTrrrrrrrrTrHrrrreeeeeeeeeeeeeeeeeeeeeee', // 62
  'eeeeeeeeeeeeeeee....H.......................................................................H....eeeeeeeeeeeeeeeeeeeeeee', // 63  West Tunnel, East Tunnel
  'eeeeeeeeeeeeeeee....H.......................................................................H....eeeeeeeeeeeeeeeeeeeeeee', // 64
  'eeeeeeeeeeeeeeee....H.......................................................................H....eeeeeeeeeeeeeeeeeeeeeee', // 65
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.eeeeeeeeeeeeeeeeHeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 66
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeerr.TrrrrrrrrTrrrrrrHeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 67
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................Heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 68  The Still Pool
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................Heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 69
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................Heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 70
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................Heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 71
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................Heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 72
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................HeeeeeeeeeeeeeeeeeeeeeeeeeeeeTrrrrrrrrTee', // 73
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...................Heeeeeeeeeeeeeeeeeeeeeeeeeeee..........ee', // 74  Root Chamber
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeWWWWWWWWWWWWWeeeHeeeeeeeeeeeeeeeeeeeeeeeeeeee..........ee', // 75
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeWWWWWWWWWWWWWeeeHeeeeeeeeeeeeeeeeeeeeeeeeeeee..........ee', // 76
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeWWWWWWWWWWWWWeeeHrTrrrrrrrrTrrrrrrrrTrrrrrrrr..........ee', // 77
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeH......................................ee', // 78  Deep Tunnel
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeH......................................ee', // 79
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeH......................................ee', // 80
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 81
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 82
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 83
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 84
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 85
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 86
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // 87
] as const;

const T = TILE_SIZE;
// The ground floor's walking line, and the shed door on it.
const GROUND_Y = 50 * T;
const DOOR_X = 7 * T + 8;

const POTTING_SHED_SPAWNS: SpawnPoint[] = [{ id: 'from-garden', x: 8 * T + 2, y: GROUND_Y - T }];

// ---------------------------------------------------------------------------
// Rooms and light. Each room's back wall and its own light (0.62 is a room
// as drawn; the deeper, the darker), and the lamps, candles, stove, boiler
// and windows that light them.
// ---------------------------------------------------------------------------

const room = (r: LitRoom): LitRoom => r;
const B = ROOM_BACKDROP;

const POTTING_SHED_ROOMS: LitRoom[] = [
  room({
    id: 'shed',
    name: 'The Shed',
    backdrop: B.shed,
    col: 6,
    row: 44,
    cols: 7,
    rows: 6,
    ambient: 0.72,
    holdsCamera: true,
  }),
  room({ id: 'hall', name: 'Seed Hall', backdrop: B.drawers, col: 14, row: 33, cols: 46, rows: 17, ambient: 0.66 }),
  room({ id: 'lumber', name: 'Lumber Room', backdrop: B.rafters, col: 3, row: 35, cols: 10, rows: 6, ambient: 0.34 }),
  room({ id: 'kitchen', name: 'Kitchen', backdrop: B.kitchen, col: 61, row: 42, cols: 24, rows: 8, ambient: 0.58 }),
  room({ id: 'pantry', name: 'Pantry', backdrop: B.kitchen, col: 86, row: 44, cols: 12, rows: 6, ambient: 0.42 }),
  room({ id: 'library', name: 'Library', backdrop: B.wallGreen, col: 61, row: 33, cols: 24, rows: 8, ambient: 0.54 }),
  room({ id: 'sewing', name: 'Sewing Room', backdrop: B.wallRose, col: 86, row: 33, cols: 12, rows: 8, ambient: 0.5 }),
  room({ id: 'loft', name: 'Drying Loft', backdrop: B.rafters, col: 14, row: 24, cols: 46, rows: 8, ambient: 0.52 }),
  room({
    id: 'landing',
    name: 'Narrow Landing',
    backdrop: B.wallGreen,
    col: 61,
    row: 28,
    cols: 37,
    rows: 4,
    ambient: 0.44,
  }),
  room({ id: 'attic', name: 'The Attic', backdrop: B.rafters, col: 14, row: 5, cols: 71, rows: 18, ambient: 0.32 }),
  room({
    id: 'bedroom',
    name: 'Eaves Bedroom',
    backdrop: B.wallRose,
    col: 86,
    row: 14,
    cols: 12,
    rows: 9,
    ambient: 0.4,
  }),
  room({ id: 'stairs', name: 'The Stairwell', backdrop: B.shed, col: 99, row: 16, cols: 8, rows: 43, ambient: 0.38 }),
  room({ id: 'shaft', name: 'Dumbwaiter', backdrop: B.shed, col: 108, row: 24, cols: 1, rows: 35, ambient: 0.3 }),
  room({ id: 'box', name: 'Box Room', backdrop: B.rafters, col: 110, row: 26, cols: 8, rows: 6, ambient: 0.3 }),
  room({
    id: 'linen',
    name: 'Linen Cupboard',
    backdrop: B.wallRose,
    col: 110,
    row: 35,
    cols: 8,
    rows: 6,
    ambient: 0.32,
  }),
  room({ id: 'boot', name: 'Boot Room', backdrop: B.shed, col: 110, row: 44, cols: 8, rows: 6, ambient: 0.34 }),
  room({ id: 'apple', name: 'Apple Store', backdrop: B.brick, col: 14, row: 52, cols: 27, rows: 7, ambient: 0.3 }),
  room({
    id: 'cellar',
    name: 'Preserves Cellar',
    backdrop: B.brick,
    col: 42,
    row: 52,
    cols: 29,
    rows: 7,
    ambient: 0.28,
  }),
  room({ id: 'boiler', name: 'Boiler Room', backdrop: B.brick, col: 72, row: 51, cols: 26, rows: 8, ambient: 0.32 }),
  room({ id: 'coal', name: 'Coal Hole', backdrop: B.brick, col: 110, row: 53, cols: 8, rows: 6, ambient: 0.2 }),
  // The mole's chamber opens up off the west tunnel: listed first, it owns
  // the stretch of tunnel under it, so walking in lights the whole chamber.
  room({ id: 'mole', name: "Mole's Chamber", backdrop: B.earth, col: 40, row: 60, cols: 15, rows: 6, ambient: 0.25 }),
  room({
    id: 'tunnel-west',
    name: 'West Tunnel',
    backdrop: B.earth,
    col: 16,
    row: 63,
    cols: 43,
    rows: 3,
    ambient: 0.22,
  }),
  room({
    id: 'tunnel-east',
    name: 'East Tunnel',
    backdrop: B.earth,
    col: 56,
    row: 63,
    cols: 41,
    rows: 3,
    ambient: 0.2,
  }),
  room({ id: 'pool', name: 'The Still Pool', backdrop: B.pool, col: 60, row: 68, cols: 19, rows: 7, ambient: 0.17 }),
  room({ id: 'deep', name: 'Deep Tunnel', backdrop: B.earth, col: 79, row: 78, cols: 29, rows: 3, ambient: 0.14 }),
  room({ id: 'roots', name: 'Root Chamber', backdrop: B.earth, col: 108, row: 74, cols: 10, rows: 7, ambient: 0.15 }),
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
  pane(69, 73, 6, 0.28),
  pane(10.6, 46, 4, 0.35),
  // The seed hall's four lamps, the stove, the kitchen candle, the pantry's.
  lamp(19.5, 34.4, 6, 0.5),
  lamp(31.5, 34.4, 6, 0.5),
  lamp(45.5, 34.4, 6, 0.5),
  lamp(56.5, 34.4, 6, 0.5),
  lamp(66.5, 47.6, 6.5, 0.5),
  lamp(80.5, 47.5, 3, 0.35),
  lamp(96.5, 48.4, 3.5, 0.4),
  // The library's desk lamp and the sewing room's lamp.
  lamp(78, 38.6, 5, 0.55),
  lamp(93.5, 34.4, 5, 0.5),
  // The drying loft's windows, the landing's candles.
  pane(27.5, 26.6, 4.5, 0.4),
  pane(50.5, 26.6, 4.5, 0.4),
  lamp(70.5, 30.4, 3.5, 0.4),
  lamp(90.5, 30.4, 3.5, 0.4),
  // The attic's skylight, the bedroom's candle, a candle on every landing.
  pane(50.5, 9, 7, 0.5),
  lamp(87.5, 21.4, 3, 0.4),
  lamp(104.5, 21.4, 3, 0.35),
  lamp(104.5, 30.4, 3, 0.35),
  lamp(104.5, 39.4, 3, 0.35),
  lamp(104.5, 48.4, 3, 0.35),
  // The apple store's lamp, the cellar's candle, the boiler, the mole's lamp.
  lamp(26.5, 53.4, 5, 0.45),
  lamp(56.5, 53.4, 4, 0.45),
  lamp(82, 56.5, 7, 0.6),
  lamp(47.5, 61.4, 5, 0.45),
  // The Wrong-Size Window.
  pane(94.5, 20, 5, 0.55),
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
  at(drawShedWindow, 10.6, 47.6),
  at(drawPottingBench, 10, 50),
  at(drawPots, 7.4, 50),
  at(drawRake, 12.4, 50),
  // The seed hall.
  ...[19, 31, 45, 56].map((col) => at(drawHangingLamp, col, 33)),
  at(drawDrawerCabinet, 26, 50),
  at(drawDrawerCabinet, 54, 50),
  at(drawPots, 47, 50),
  // The kitchen and the pantry.
  at(drawStove, 66, 50),
  at(drawHerbs, 63, 42),
  at(drawOnions, 71, 42),
  at(drawKitchenTable, 79, 50),
  at(drawCandle, 80, 49.25),
  at(drawJars, 78.5, 46),
  at(drawJars, 90, 48),
  at(drawJars, 94, 48),
  at(drawAppleCrate, 88, 50),
  at(drawCandle, 96, 50),
  // The library and the sewing room.
  at(drawDesk, 77, 41),
  at(drawDressForm, 89, 41),
  at(drawHangingLamp, 93, 33),
  at(drawTrunk, 95, 41),
  // The drying loft.
  at(drawLavender, 17, 24),
  at(drawHerbs, 21, 24),
  at(drawOnions, 25, 24),
  at(drawLavender, 29, 24),
  at(drawHerbs, 34, 24),
  at(drawOnions, 44, 24),
  at(drawLavender, 48, 24),
  at(drawHerbs, 52, 24),
  at(drawLavender, 56, 24),
  at(drawSmallWindow, 27, 27.6),
  at(drawSmallWindow, 50, 27.6),
  // The landing.
  at(drawCandle, 70, 32),
  at(drawTrunk, 77, 32),
  at(drawCandle, 90, 32),
  at(drawPots, 84, 32),
  // The attic and the eaves bedroom.
  at(drawTrunk, 24, 23),
  at(drawSheetedTrunk, 31, 23),
  at(drawRockingHorse, 37, 23),
  at(drawSheetedTrunk, 62, 23),
  at(drawTrunk, 70, 23),
  at(drawSkylight, 50, 7.6),
  at(drawBed, 90, 23),
  at(drawCandle, 87, 23),
  // A candle on every landing of the stairwell; the box room and linen cupboard.
  ...[23, 32, 41, 50].map((row) => at(drawCandle, 104, row)),
  at(drawTrunk, 113, 41),
  at(drawSheetedTrunk, 113, 32),
  // The basement.
  at(drawAppleCrate, 114, 59),
  ...[17, 21, 33, 37].map((col) => at(drawAppleCrate, col, 59)),
  at(drawHangingLamp, 26, 52),
  at(drawJars, 49, 55),
  at(drawJars, 61, 55),
  at(drawJars, 55, 59),
  at(drawCandle, 56, 55),
  at(drawBoiler, 82, 59),
  at(drawPipes, 78, 51),
  at(drawPipes, 90, 51),
  // The tunnels: roots through the ceiling, and the mole's lamp.
  ...[24, 31, 36, 58, 66, 86].map((col) => at(drawRoots, col, 63)),
  at(drawRoots, 44, 60),
  at(drawRoots, 51, 60),
  at(drawHangingLamp, 47, 60),
  ...[84, 92, 100, 105].map((col) => at(drawRoots, col, 78)),
  ...[110, 113, 116].map((col) => at(drawRoots, col, 74)),
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
    y: 41 * T,
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
    y: 23 * T,
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
    y: 81 * T,
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
  landmarks: POTTING_SHED_LANDMARKS,
  decorations: POTTING_SHED_DECORATIONS,
  parallax: 'keep',
  // Classic draws the house as any dark interior; HD gives each room its own
  // back wall and light (lighting below).
  backdrop: 'indoor-dark',
  rockBgStartRow: 0,
  openSky: false,
  lighting: POTTING_SHED_LIGHTING,
  createEntities(): readonly Entity[] {
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
      // The cat asleep by the stove; mice in the pantry and the apple store.
      new Cat({ x: 70 * T + 8, y: GROUND_Y }),
      new Mouse({ x: 92 * T + 8, y: GROUND_Y, minX: 87 * T, maxX: 96 * T }),
      new Mouse({ x: 24 * T + 8, y: 59 * T, minX: 15 * T, maxX: 29 * T }),
      // The bookworm on top of the library's tall bookcase.
      new Bookworm({ x: 67 * T, y: 37 * T, minX: 66 * T + 3, maxX: 68 * T - 3 }),
      // Moths round the attic's skylight.
      new Moth({ x: 50 * T + 8, y: 12 * T, rx: 3 * T, ry: 1.4 * T, period: 7 }),
      new Moth({ x: 51 * T + 8, y: 13 * T, rx: 2.2 * T, ry: T, period: 5.5 }),
      // A spider in the attic rafters, and one in the west tunnel's roof.
      new Spider({ x: 72 * T + 8, y: 14 * T, drop: 4 * T }),
      new Spider({ x: 28 * T + 8, y: 63 * T, drop: 19 }),
      // The mole in its chamber; earthworms along the tunnels and at the pool.
      new Mole({ x: 46 * T + 8, y: 66 * T, minX: 41 * T, maxX: 53 * T }),
      new Earthworm({ x: 70 * T + 8, y: 66 * T, minX: 64 * T, maxX: 78 * T }),
      new Earthworm({ x: 92 * T + 8, y: 81 * T, minX: 82 * T, maxX: 104 * T }),
      new Earthworm({ x: 61 * T + 8, y: 75 * T, minX: 60 * T + 3, maxX: 62 * T + 6 }),
    ];
  },
};

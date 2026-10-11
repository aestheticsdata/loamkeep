import { DB32, TILE_SIZE } from '@constants';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LevelSpec, SpawnPoint } from '@world/level';
// + the new entities / draw functions listed in README.md (Spider, Mole, Earthworm; P.* props; landmark bodies & sketches)

// The Potting Shed, inside (LOA-48). 120 wide x 88 tall; the ground floor walks on row 50,
// the shed's own floor. Generated from the room list in shed-map.js: edit the rooms there and re-export.
//
// Legend: . air  j plank wall (NEW)  f floorboards (NEW)  T timber  L bookcase  H ladder  W water
//         K dark stone  e packed earth (NEW)  r root earth (NEW)
//
// Checked with a tile-level port of the movement rules (walk, 2-row jumps with 3-col drift,
// ladders with the exit pop, swimming): all 806 standing cells inside rooms are reachable
// from the shed door, and the door from every one of them.
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
export const POTTING_SHED_SPAWNS: SpawnPoint[] = [
  { id: "from-garden", x: 8 * T + 2, y: 49 * T },
  { id: "tunnels", x: 22 * T + 2, y: 65 * T },
];

// Backdrop regions: the room list itself. kind = the backdrop recipe (README §3). amb = the room's ambient light (README §4).
export const POTTING_SHED_ROOMS = [
  { id: "shed", name: "The Shed", kind: "shed", col: 6, row: 44, cols: 7, rows: 6, amb: 0.72 },
  { id: "hall", name: "Seed Hall", kind: "drawers", col: 14, row: 33, cols: 46, rows: 17, amb: 0.66 },
  { id: "lumber", name: "Lumber Room", kind: "rafters", col: 3, row: 35, cols: 10, rows: 6, amb: 0.34 },
  { id: "kitchen", name: "Kitchen", kind: "kitchen", col: 61, row: 42, cols: 24, rows: 8, amb: 0.58 },
  { id: "pantry", name: "Pantry", kind: "kitchen", col: 86, row: 44, cols: 12, rows: 6, amb: 0.42 },
  { id: "library", name: "Library", kind: "wallGreen", col: 61, row: 33, cols: 24, rows: 8, amb: 0.54 },
  { id: "sewing", name: "Sewing Room", kind: "wallRose", col: 86, row: 33, cols: 12, rows: 8, amb: 0.5 },
  { id: "loft", name: "Drying Loft", kind: "rafters", col: 14, row: 24, cols: 46, rows: 8, amb: 0.52 },
  { id: "landing", name: "Narrow Landing", kind: "wallGreen", col: 61, row: 28, cols: 37, rows: 4, amb: 0.44 },
  { id: "attic", name: "The Attic", kind: "rafters", col: 14, row: 5, cols: 71, rows: 18, amb: 0.32 },
  { id: "bedroom", name: "Eaves Bedroom", kind: "wallRose", col: 86, row: 14, cols: 12, rows: 9, amb: 0.4 },
  { id: "stairs", name: "The Stairwell", kind: "shed", col: 99, row: 16, cols: 8, rows: 43, amb: 0.38 },
  { id: "shaft", name: "Dumbwaiter", kind: "shed", col: 108, row: 24, cols: 1, rows: 35, amb: 0.3 },
  { id: "box", name: "Box Room", kind: "rafters", col: 110, row: 26, cols: 8, rows: 6, amb: 0.3 },
  { id: "linen", name: "Linen Cupboard", kind: "wallRose", col: 110, row: 35, cols: 8, rows: 6, amb: 0.32 },
  { id: "boot", name: "Boot Room", kind: "shed", col: 110, row: 44, cols: 8, rows: 6, amb: 0.34 },
  { id: "apple", name: "Apple Store", kind: "brick", col: 14, row: 52, cols: 27, rows: 7, amb: 0.3 },
  { id: "cellar", name: "Preserves Cellar", kind: "brick", col: 42, row: 52, cols: 29, rows: 7, amb: 0.28 },
  { id: "boiler", name: "Boiler Room", kind: "brick", col: 72, row: 51, cols: 26, rows: 8, amb: 0.32 },
  { id: "coal", name: "Coal Hole", kind: "brick", col: 110, row: 53, cols: 8, rows: 6, amb: 0.2 },
  { id: "tunW", name: "West Tunnel", kind: "earth", col: 16, row: 63, cols: 43, rows: 3, amb: 0.22 },
  { id: "mole", name: "Mole's Chamber", kind: "earth", col: 40, row: 60, cols: 15, rows: 6, amb: 0.25 },
  { id: "tunE", name: "East Tunnel", kind: "earth", col: 56, row: 63, cols: 41, rows: 3, amb: 0.2 },
  { id: "pool", name: "The Still Pool", kind: "cave", col: 60, row: 68, cols: 19, rows: 7, amb: 0.17 },
  { id: "deep", name: "Deep Tunnel", kind: "earth", col: 79, row: 78, cols: 29, rows: 3, amb: 0.14 },
  { id: "roots", name: "Root Chamber", kind: "earth", col: 108, row: 74, cols: 10, rows: 7, amb: 0.15 },
] as const;

// Light sources, in tiles. warm = lamp/stove/candle (glow pixels on the backdrop); cool = window/skylight.
export const POTTING_SHED_LIGHTS = [
  { x: 69, y: 73, r: 6, warm: false, str: 0.28 },
  { x: 10.6, y: 46, r: 4, warm: false, str: 0.35 },
  { x: 19.5, y: 34.4, r: 6, warm: true, str: 0.5 },
  { x: 31.5, y: 34.4, r: 6, warm: true, str: 0.5 },
  { x: 45.5, y: 34.4, r: 6, warm: true, str: 0.5 },
  { x: 56.5, y: 34.4, r: 6, warm: true, str: 0.5 },
  { x: 66.5, y: 47.6, r: 6.5, warm: true, str: 0.5 },
  { x: 80.5, y: 47.5, r: 3, warm: true, str: 0.35 },
  { x: 96.5, y: 48.4, r: 3.5, warm: true, str: 0.4 },
  { x: 78, y: 38.6, r: 5, warm: true, str: 0.55 },
  { x: 93.5, y: 34.4, r: 5, warm: true, str: 0.5 },
  { x: 27.5, y: 26.6, r: 4.5, warm: false, str: 0.4 },
  { x: 50.5, y: 26.6, r: 4.5, warm: false, str: 0.4 },
  { x: 70.5, y: 30.4, r: 3.5, warm: true, str: 0.4 },
  { x: 90.5, y: 30.4, r: 3.5, warm: true, str: 0.4 },
  { x: 50.5, y: 9, r: 7, warm: false, str: 0.5 },
  { x: 87.5, y: 21.4, r: 3, warm: true, str: 0.4 },
  { x: 104.5, y: 21.4, r: 3, warm: true, str: 0.35 },
  { x: 104.5, y: 30.4, r: 3, warm: true, str: 0.35 },
  { x: 104.5, y: 39.4, r: 3, warm: true, str: 0.35 },
  { x: 104.5, y: 48.4, r: 3, warm: true, str: 0.35 },
  { x: 26.5, y: 53.4, r: 5, warm: true, str: 0.45 },
  { x: 56.5, y: 53.4, r: 4, warm: true, str: 0.45 },
  { x: 82, y: 56.5, r: 7, warm: true, str: 0.6 },
  { x: 47.5, y: 61.4, r: 5, warm: true, str: 0.45 },
  { x: 94.5, y: 20, r: 5, warm: false, str: 0.55 },
] as const;

// Decorations: base at (col*T+8, row*T); hang = anchored at the ceiling, drawn downward.
export const POTTING_SHED_DECORATIONS = [
  { draw: "shedWindow", x: 10.6 * T + 8, y: 47.6 * T },
  { draw: "pottingBench", x: 10 * T + 8, y: 50 * T },
  { draw: "pots", x: 7.4 * T + 8, y: 50 * T },
  { draw: "rake", x: 12.4 * T + 8, y: 50 * T },
  { draw: "shedDoor", x: 7 * T + 8, y: 50 * T },
  { draw: "lampHang", x: 19 * T + 8, y: 33 * T, hang: true },
  { draw: "lampHang", x: 31 * T + 8, y: 33 * T, hang: true },
  { draw: "lampHang", x: 45 * T + 8, y: 33 * T, hang: true },
  { draw: "lampHang", x: 56 * T + 8, y: 33 * T, hang: true },
  { draw: "drawerCabinet", x: 26 * T + 8, y: 50 * T },
  { draw: "drawerCabinet", x: 54 * T + 8, y: 50 * T },
  { draw: "pots", x: 47 * T + 8, y: 50 * T },
  { draw: "stove", x: 66 * T + 8, y: 50 * T },
  { draw: "herbs", x: 63 * T + 8, y: 42 * T, hang: true },
  { draw: "onions", x: 71 * T + 8, y: 42 * T, hang: true },
  { draw: "kitchenTable", x: 79 * T + 8, y: 50 * T },
  { draw: "candle", x: 80 * T + 8, y: 48.2 * T },
  { draw: "jars", x: 78.5 * T + 8, y: 46 * T },
  { draw: "jars", x: 90 * T + 8, y: 48 * T },
  { draw: "jars", x: 94 * T + 8, y: 48 * T },
  { draw: "appleCrate", x: 88 * T + 8, y: 50 * T },
  { draw: "candle", x: 96 * T + 8, y: 50 * T },
  { draw: "desk", x: 77 * T + 8, y: 41 * T },
  { draw: "dressForm", x: 89 * T + 8, y: 41 * T },
  { draw: "lampHang", x: 93 * T + 8, y: 33 * T, hang: true },
  { draw: "trunk", x: 95 * T + 8, y: 41 * T },
  { draw: "lavender", x: 17 * T + 8, y: 24 * T, hang: true },
  { draw: "herbs", x: 21 * T + 8, y: 24 * T, hang: true },
  { draw: "onions", x: 25 * T + 8, y: 24 * T, hang: true },
  { draw: "lavender", x: 29 * T + 8, y: 24 * T, hang: true },
  { draw: "herbs", x: 34 * T + 8, y: 24 * T, hang: true },
  { draw: "onions", x: 44 * T + 8, y: 24 * T, hang: true },
  { draw: "lavender", x: 48 * T + 8, y: 24 * T, hang: true },
  { draw: "herbs", x: 52 * T + 8, y: 24 * T, hang: true },
  { draw: "lavender", x: 56 * T + 8, y: 24 * T, hang: true },
  { draw: "smallWindow", x: 27 * T + 8, y: 27.6 * T },
  { draw: "smallWindow", x: 50 * T + 8, y: 27.6 * T },
  { draw: "candle", x: 70 * T + 8, y: 32 * T },
  { draw: "trunk", x: 77 * T + 8, y: 32 * T },
  { draw: "candle", x: 90 * T + 8, y: 32 * T },
  { draw: "pots", x: 84 * T + 8, y: 32 * T },
  { draw: "trunk", x: 24 * T + 8, y: 23 * T },
  { draw: "sheetedTrunk", x: 31 * T + 8, y: 23 * T },
  { draw: "rockingHorse", x: 37 * T + 8, y: 23 * T },
  { draw: "sheetedTrunk", x: 62 * T + 8, y: 23 * T },
  { draw: "trunk", x: 70 * T + 8, y: 23 * T },
  { draw: "skylight", x: 50 * T + 8, y: 7.6 * T },
  { draw: "bed", x: 90 * T + 8, y: 23 * T },
  { draw: "candle", x: 87 * T + 8, y: 23 * T },
  { draw: "candle", x: 104 * T + 8, y: 23 * T },
  { draw: "candle", x: 104 * T + 8, y: 32 * T },
  { draw: "candle", x: 104 * T + 8, y: 41 * T },
  { draw: "candle", x: 104 * T + 8, y: 50 * T },
  { draw: "trunk", x: 113 * T + 8, y: 41 * T },
  { draw: "sheetedTrunk", x: 113 * T + 8, y: 32 * T },
  { draw: "appleCrate", x: 114 * T + 8, y: 59 * T },
  { draw: "appleCrate", x: 17 * T + 8, y: 59 * T },
  { draw: "appleCrate", x: 21 * T + 8, y: 59 * T },
  { draw: "appleCrate", x: 33 * T + 8, y: 59 * T },
  { draw: "appleCrate", x: 37 * T + 8, y: 59 * T },
  { draw: "lampHang", x: 26 * T + 8, y: 52 * T, hang: true },
  { draw: "jars", x: 49 * T + 8, y: 55 * T },
  { draw: "jars", x: 61 * T + 8, y: 55 * T },
  { draw: "jars", x: 55 * T + 8, y: 59 * T },
  { draw: "candle", x: 56 * T + 8, y: 55 * T },
  { draw: "boiler", x: 82 * T + 8, y: 59 * T },
  { draw: "pipes", x: 78 * T + 8, y: 51 * T, hang: true },
  { draw: "pipes", x: 90 * T + 8, y: 51 * T, hang: true },
  { draw: "roots", x: 24 * T + 8, y: 63 * T, hang: true },
  { draw: "roots", x: 31 * T + 8, y: 63 * T, hang: true },
  { draw: "roots", x: 36 * T + 8, y: 63 * T, hang: true },
  { draw: "roots", x: 58 * T + 8, y: 63 * T, hang: true },
  { draw: "roots", x: 66 * T + 8, y: 63 * T, hang: true },
  { draw: "roots", x: 86 * T + 8, y: 63 * T, hang: true },
  { draw: "roots", x: 44 * T + 8, y: 60 * T, hang: true },
  { draw: "roots", x: 51 * T + 8, y: 60 * T, hang: true },
  { draw: "lampHang", x: 47 * T + 8, y: 60 * T, hang: true },
  { draw: "roots", x: 84 * T + 8, y: 78 * T, hang: true },
  { draw: "roots", x: 92 * T + 8, y: 78 * T, hang: true },
  { draw: "roots", x: 100 * T + 8, y: 78 * T, hang: true },
  { draw: "roots", x: 105 * T + 8, y: 78 * T, hang: true },
  { draw: "roots", x: 110 * T + 8, y: 74 * T, hang: true },
  { draw: "roots", x: 113 * T + 8, y: 74 * T, hang: true },
  { draw: "roots", x: 116 * T + 8, y: 74 * T, hang: true },
] as const;

export const POTTING_SHED_CREATURES = [
  { kind: "cat", x: 70 * T + 8, y: 50 * T },
  { kind: "mouse", x: 92 * T + 8, y: 50 * T, minX: 87 * T, maxX: 96 * T },
  { kind: "bookworm", x: 66.5 * T + 8, y: 37 * T, minX: 66.2 * T, maxX: 67.8 * T },
  { kind: "moth", x: 50 * T + 8, y: 12 * T, rx: 3 * T, ry: 1.4 * T },
  { kind: "moth", x: 51 * T + 8, y: 13 * T, rx: 2.2 * T, ry: 1 * T },
  { kind: "spider", x: 72 * T + 8, y: 14 * T, threadTiles: 4 },
  { kind: "mouse", x: 24 * T + 8, y: 59 * T, minX: 15 * T, maxX: 29 * T },
  { kind: "mole", x: 46 * T + 8, y: 66 * T, minX: 41 * T, maxX: 53 * T },
  { kind: "spider", x: 28 * T + 8, y: 63 * T, threadTiles: 1.2 },
  { kind: "worm", x: 70 * T + 8, y: 66 * T, minX: 64 * T, maxX: 78 * T },
  { kind: "worm", x: 92 * T + 8, y: 81 * T, minX: 82 * T, maxX: 104 * T },
  { kind: "worm", x: 63 * T + 8, y: 75 * T, minX: 60.2 * T, maxX: 62.4 * T },
] as const;

export const POTTING_SHED_LANDMARKS = [
  {
    id: "grandfather-clock",
    x: 43 * T + 8,
    y: 50 * T,
    name: "Grandfather Clock",
    description:
      "A tall clock in the seed hall, ticking politely. Its hands do not go round the dial: they wind inward, a little further every hour, toward the middle.",
    drawBody: "grandfatherClock",
    drawSketch: "clockSketch",
  },
  {
    id: "seed-catalogue",
    x: 71 * T + 8,
    y: 41 * T,
    name: "Seed Catalogue",
    description:
      "Every seed the garden has ever grown, drawn and named in a careful hand. The last page has a packet glued in, labelled only with the spiral, and it is full.",
    drawBody: "seedCatalogue",
    drawSketch: "catalogueSketch",
  },
  {
    id: "wrong-size-window",
    x: 94 * T + 8,
    y: 23 * T,
    name: "Wrong-Size Window",
    description:
      "The shed's little window, the one with the pot in it. From the garden it is the size of a tea tray. From up here it is the size of a door, and the pot is the same pot.",
    drawBody: "wrongWindow",
    drawSketch: "windowSketch",
  },
  {
    id: "dumbwaiter",
    x: 112 * T + 8,
    y: 50 * T,
    name: "Dumbwaiter",
    description:
      "A box on a rope, for sending things between floors. There is a cup of tea in it, still warm, and no one to say who it was sent to.",
    drawBody: "dumbwaiter",
    drawSketch: "dumbwaiterSketch",
  },
  {
    id: "root-map",
    x: 113 * T + 8,
    y: 81 * T,
    name: "Root Map",
    description:
      "At the end of the last tunnel the roots of the garden come through the wall, and someone has labelled them: pear, bean, sunflower, well. Followed far enough, they all turn the same way.",
    drawBody: "rootMap",
    drawSketch: "rootMapSketch",
  },
] as const;

export const pottingShedLevel: Partial<LevelSpec> = {
  id: 'potting-shed',
  name: 'The Potting Shed',
  rows: POTTING_SHED_ROWS,
  spawns: POTTING_SHED_SPAWNS,
  defaultSpawnId: 'from-garden',
  backdrop: 'indoor-dark',
  rockBgStartRow: POTTING_SHED_ROWS.length,
  createEntities(): readonly Entity[] {
    return [
      new Door({ id: "shed-return-door", x: 7 * T + 8, y: 50 * T, targetLevelId: "kitchen-garden", targetSpawnId: "from-shed", promptLabel: "go out" }),
      // …creatures from POTTING_SHED_CREATURES
    ];
  },
};
// In kitchen-garden.ts: a Door at the shed (x: 30 * T + 8, y: GROUND_Y, targetLevelId: 'potting-shed',
// targetSpawnId: 'from-garden', promptLabel: 'go in'), and a spawn { id: 'from-shed', x: 30 * T + 2, y: GROUND_Y - T }.

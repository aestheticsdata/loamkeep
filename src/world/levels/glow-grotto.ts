import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { Glowfish } from '@entities/glowfish';
import { Kelp } from '@entities/kelp';
import type { LandmarkSpec } from '@entities/landmark';
import { Moth } from '@entities/moth';
import { Newt } from '@entities/newt';
import { type FloraId, PLANTS } from '@entities/plants';
import { Snail } from '@entities/snail';
import { Spores } from '@entities/spores';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Glow Grotto — a whole underground country past the far end of the
// meadow's lower maze, lit only by what grows and swims in it.
//
// 160 wide × 90 tall, all of it under rock. The crack from the maze opens on
// the upper gallery (row 12), and from there:
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
// Every jump is two rows up, or three with a column of air before the ledge
// and nothing overhead, or a puffball's eight. Checked with a port of the
// player's physics: every place is reachable from the crack, and the crack
// from every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   R GrottoRock   W Water   H ladder (roots)   U puffball
const GLOW_GROTTO_ROWS = [
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  0
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  1
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  2
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  3
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  4
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  5
  'RR.........................................................RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  6  the upper gallery (rows 6-11, cols 2-19) and the mushroom forest (rows 6-39, cols 20-58)
  'RR.........................................................RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', //  7
  'RR.........................................................RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...R......R......R...........R...R..RRR', //  8  the echo chamber (rows 8-69, cols 121-156), stalactites from its roof
  'RR.........................................................RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...R......R......R...........R...R..RRR', //  9
  'RR..........................................................................................................................R......R......R...........R...R..RRR', // 10  the top tunnel (rows 10-13, floor 14) east to the echo chamber
  'RR..........................................................................................................................R.............R...............R..RRR', // 11
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........................................................................................R.............R..................RRR', // 12  GALLERY FLOOR and its shelf out over the forest (cols 2-33)
  'RRRRRRRRRRRRRRRRRRRR..........................................R.R...........................................................R......................RRRRRRRRR.RRR', // 13  lips either side of the shaft (cols 62, 64)
  'RRRRRRRRRRRRRRRRRRRR...................................RRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR................................RRR', // 14  the root shaft's ladder drops out of the tunnel floor at col 63
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 15
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 16
  'RRRRRRRRRRRRRRRRRRRR...............................RRR.....RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 17
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 18
  'RRRRRRRRRRRRRRRRRRRR................URRRR..................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................RRRRU...........RRR', // 19  L3 (cols 36-40), puffball at 36
  'RRRRRRRRRRRRRRRRRRRR...................................RRR.RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 20
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 21
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 22
  'RRRRRRRRRRRRRRRRRRRR...............................RRR.....RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 23
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 24
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 25
  'RRRRRRRRRRRRRRRRRRRR..........RRRRU....................RRR.RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..............RRRRU.................RRR', // 26  L2 (cols 30-34), puffball at 34
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 27
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 28
  'RRRRRRRRRRRRRRRRRRRR...............................RRR.....RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 29
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 30
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 31
  'RRRRRRRRRRRRRRRRRRRR...................................RRR.RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 32
  'RRRRRRRRRRRRRRRRRRRR....RRRRU..............................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR........RRRRU.......................RRR', // 33  L1 (cols 24-28), puffball at 28
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 34
  'RRRRRRRRRRRRRRRRRRRR...............................RRR.....RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 35  east zigzag: ledges at cols 51-53 and 55-57, three rows apart, up to the lip at row 14
  'RRRRRRRRRRRRRRRRRRRR.......................................RRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 36
  'RRRRRRRRRRRRRRRRRRRR...........................................H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 37
  'RRRRRRRRRRRRRRRRRRRR........................RRRRRR.............H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 38
  'RRRRRRRRRRRRRRRRRRRR........................RRRRRR.............H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....................................RRR', // 39
  'RRRRRRRRRRRRRRRRRRRRRRURRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.HRRRRU.............................RRR', // 40  FOREST FLOOR — puffball at col 22, the root ladder at col 38 — echo ledge (123-127)
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 41
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 42
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 43
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 44
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 45
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 46
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 47
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H............RRR...................RRR', // 48
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 49
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 50
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 51
  'RRRRR.......RRRRRRRRRRRRRR...................RRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H.................RRRRRRR..........RRR', // 52  W1 (rows 52-57) and W2 (cols 5-11); the crawlway at row 57
  'RRRRR.......RRRRRRRRRRRRRR...................RRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 53
  'RRRRR.......RRRRRRRRRRRRRR...................RRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H..................................RRR', // 54
  'RRRRR.......RRRRRRRRRRRRRR...................RRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H...........................RRRRRRRRRR', // 55
  'RRRRR.......RRRRRRRRRRRRRR...................RRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H...........................RRRRRRRRRR', // 56
  'RRRRR........................................RRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H...........................RRRRRRRRRR', // 57
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H...........................RRRRRRRRRR', // 58
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.H...........................RRRRRRRRRR', // 59
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 60  the lake (air rows 60-69) and its two flooded arches
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 61
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 62
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRHRRRRRRRRRRRRRRRRRRRRRRR.H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 63
  'RRRRRRRRRRRRRR...............................RRRRRRRRRRRRRRRRR.H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 64  W3 (rows 64-69, cols 14-44) and the tunnel east (rows 66-69)
  'RRRRRRRRRRRRRR...............................RRRRRRRRRRRRRRRRR.H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 65
  'RRRRRRRRRRRRRR.................................................H....................RRR.............RRR...................H...........................RRRRRRRRRR', // 66
  'RRRRRRRRRRRRRR.................................................H....................RRR.............RRR...................H...........R...............RRRRRRRRRR', // 67
  'RRRRRRRRRRRRRR.................................................H....................RRR.............RRR...................H...R.......R........R......RRRRRRRRRR', // 68
  'RRRRRRRRRRRRRR.................................................H...........RRRRR....RRR.....RRRRRR..RRR...................H...R.......R........R......RRRRRRRRRR', // 69  the islands (cols 75-79, 92-97), one row above the water
  'RRRRRRRRRRRRRRRWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWRRRWWWWWRRRRRRWWRRRWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 70  WATER LINE — W3's pool (cols 15-21), the lake (cols 66-111), the echo chamber floor
  'RRRRRRRRRRRRRRRWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWRRRWWWWWRRRRRRWWRRRWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 71
  'RRRRRRRRRRRRRRRWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWRRRWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 72
  'RRRRRRRRRRRRRRRWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWRRRWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 73
  'RRRRRRRRRRRRRRRWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 74
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 75
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 76
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 77
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 78
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 79
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 80
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 81
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRWWWWWWWWWRRRRRWWWWWWWWWWWWRRRRRRWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 82
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 83
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 84
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 85
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 86
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 87
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 88
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', // 89
] as const;

const T = TILE_SIZE;
const GALLERY_Y = 12 * T;
const FOREST_Y = 40 * T;
const LAKE_SHORE_Y = 70 * T;
const ECHO_Y = 70 * T;

const RETURN_DOOR_X = 3 * T + 8;

const GLOW_GROTTO_SPAWNS: SpawnPoint[] = [
  // On the gallery, two tiles right of the crack.
  { id: 'from-meadow', x: 5 * T + 2, y: GALLERY_Y - T },
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

// A giant glowcap, the forest's trees: a pale trunk as tall as two or three
// players and a broad cyan cap with a halo. Height is in pixels; the cap
// widens with it. Base on y = 0.
function giantGlowcap(height: number): (g: Graphics) => void {
  return (g) => {
    const capW = Math.round(height * 0.8);
    drawGlow(g, { x: 0, y: -height, radius: Math.round(height * 0.9), color: DB32.viking });
    g.rect(-2, -height + 4, 4, height - 4).fill(DB32.lightSteel);
    g.rect(-2, -height + 4, 1, height - 4).fill(DB32.white);
    g.rect(1, -height + 4, 1, height - 4).fill(DB32.heather);
    g.rect(-3, -2, 6, 2).fill(DB32.lightSteel);
    g.rect(-capW / 2, -height, capW, 4).fill(DB32.viking);
    g.rect(-capW / 2 + 2, -height - 2, capW - 4, 2).fill(DB32.viking);
    g.rect(-capW / 2 + 5, -height - 3, capW - 10, 1).fill(DB32.lightSteel);
    g.rect(-capW / 2, -height + 4, capW, 1).fill(DB32.venice);
    g.rect(-capW / 4, -height - 2, 2, 1).fill(DB32.white);
  };
}

// Hanging roots, down from a ceiling: a few strands of uneven length. Anchor
// is the ceiling's underside; the roots hang into positive y.
function drawRoots(g: Graphics): void {
  for (const [x, len] of [
    [-5, 10],
    [-2, 16],
    [1, 7],
    [4, 13],
  ] as const) {
    g.rect(x, 0, 1, len).fill(DB32.rope);
    g.rect(x - 1, len - 2, 1, 2).fill(DB32.rope);
  }
}

// ---------------------------------------------------------------------------
// Landmarks — the Mother Glowcap in the forest, the Drowned Lantern on its
// island, and the Spiral Ring on the echo chamber's high shelf.
// ---------------------------------------------------------------------------

// Glowcaps planted along a square spiral, outside in, seen edge-on: a row of
// caps of falling height with a gap where the coil turns.
const RING_CAPS: readonly (readonly [number, number])[] = [
  [-12, 7],
  [-8, 5],
  [-4, 8],
  [0, 4],
  [4, 6],
  [8, 9],
  [12, 5],
];

const GLOW_GROTTO_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'mother-glowcap',
    x: 42 * T,
    y: FOREST_Y,
    name: 'Mother Glowcap',
    description:
      'The oldest thing in the grotto, by the size of it: a glowcap taller than a house, its cap as wide as a ' +
      'room, its light enough to read by from across the forest. Every other glowcap down here is turned ' +
      'a little toward it.',
    drawBody(g) {
      giantGlowcap(64)(g);
      // Spores drifting down from the gills, and a ring of small caps round its foot.
      for (const [x, y] of [
        [-14, -50],
        [9, -44],
        [-6, -36],
        [17, -30],
      ] as const) {
        g.rect(x, y, 1, 1).fill(DB32.viking);
      }
      for (const x of [-12, -8, 7, 11]) {
        g.rect(x, -3, 1, 3).fill(DB32.lightSteel);
        g.rect(x - 1, -4, 3, 1).fill(DB32.viking);
      }
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: -18, radius: 30, color: DB32.viking });
      g.rect(-4, -14, 8, 34).fill(DB32.lightSteel);
      g.rect(-4, -14, 2, 34).fill(DB32.white);
      g.rect(-28, -24, 56, 10).fill(DB32.viking);
      g.rect(-22, -30, 44, 6).fill(DB32.viking);
      g.rect(-14, -33, 28, 3).fill(DB32.lightSteel);
      g.rect(-28, -14, 56, 2).fill(DB32.venice);
      for (let x = -24; x <= 24; x += 4) g.rect(x, -12, 1, 2).fill(DB32.venice);
      g.rect(-10, 18, 20, 2).fill(DB32.dell);
    },
  },
  {
    id: 'drowned-lantern',
    x: 94 * T + 8,
    y: 69 * T,
    name: 'Drowned Lantern',
    description:
      'An iron lantern standing on the island in the middle of the lake, its glass green with age and the ' +
      'candle inside long gone — and still it gives off a little light, the cyan of the glowcaps, as if ' +
      'it had been filled with them. Somebody rowed it out here. There is no boat.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -8, radius: 12, color: DB32.viking });
      g.rect(-3, -2, 6, 2).fill(DB32.dimGray);
      g.rect(-3, -12, 6, 10).fill(DB32.dimGray);
      g.rect(-2, -11, 4, 8).fill(DB32.eltGreen);
      g.rect(-1, -9, 2, 4).fill(DB32.viking);
      g.rect(0, -8, 1, 1).fill(DB32.white);
      g.rect(-2, -14, 4, 2).fill(DB32.dimGray);
      g.rect(-1, -16, 2, 2).fill(DB32.dimGray);
      g.rect(-1, -17, 2, 1).fill(DB32.heather);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 26, color: DB32.viking });
      g.rect(-12, 16, 24, 6).fill(DB32.dimGray);
      g.rect(-12, -20, 24, 36).fill(DB32.dimGray);
      g.rect(-8, -16, 16, 28).fill(DB32.eltGreen);
      g.rect(-4, -8, 8, 14).fill(DB32.viking);
      g.rect(-1, -4, 2, 4).fill(DB32.white);
      g.rect(-8, -28, 16, 8).fill(DB32.dimGray);
      g.rect(-3, -34, 6, 6).fill(DB32.dimGray);
      g.rect(-1, -16, 2, 28).fill(DB32.dimGray);
    },
  },
  {
    id: 'spiral-ring',
    x: 151 * T,
    y: 13 * T,
    name: 'Spiral Ring',
    description:
      'Glowcaps growing in a coil on the highest shelf of the echo chamber — too even to be chance. Walk round ' +
      'it and it is the spiral again, the one on the Marker and the Throne, drawn here in light by something ' +
      'that was never told it.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -6, radius: 18, color: DB32.viking });
      g.rect(-14, -1, 28, 1).fill(DB32.dell);
      for (const [x, h] of RING_CAPS) {
        g.rect(x, -h + 2, 1, h - 2).fill(DB32.lightSteel);
        g.rect(x - 1, -h, 3, 2).fill(DB32.viking);
        g.rect(x, -h, 1, 1).fill(DB32.white);
      }
    },
    drawSketch(g) {
      // The ring from above: a square spiral of caps, outside in.
      const cap = (x: number, y: number): void => {
        drawGlow(g, { x, y, radius: 5, color: DB32.viking });
        g.rect(x - 2, y - 2, 4, 4).fill(DB32.viking);
        g.rect(x - 1, y - 1, 1, 1).fill(DB32.white);
      };
      for (let i = -24; i <= 24; i += 8) cap(i, -24);
      for (let i = -16; i <= 24; i += 8) cap(24, i);
      for (let i = 16; i >= -24; i -= 8) cap(i, 24);
      for (let i = 16; i >= -8; i -= 8) cap(-24, i);
      for (let i = -16; i <= 8; i += 8) cap(i, -8);
      cap(8, 0);
      cap(8, 8);
      cap(0, 8);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations — giant glowcaps, the grotto's flora, hanging roots.
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
  openSky: false,
  createEntities(): readonly Entity[] {
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
  },
};

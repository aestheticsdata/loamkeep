import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import { Crab } from '@entities/crab';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import { Eel } from '@entities/eel';
import type { Entity } from '@entities/entity';
import { Frog } from '@entities/frog';
import { Glowfish } from '@entities/glowfish';
import { Kelp } from '@entities/kelp';
import type { LandmarkSpec } from '@entities/landmark';
import { Newt } from '@entities/newt';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Flooded Cistern — the vaulted reservoir under the crypt, most of it
// water.
//
// 150 wide × 80 tall; the water line in the great hall is row 44.
//
//   The landing (floor 12) — the stair back up to the ossuary, and a stair of
//     its own down, two rows a step, to the aqueduct bridge (row 26).
//   The great hall (cols 29-100) — the bridge across it, one pair of planks
//     missing over a stump island; under the bridge, water to row 69 and a
//     forest of columns: full ones to dive under, two broken off above the
//     water to swim beneath. Ladders (cols 37, 91) climb from the water back
//     up through the bridge. The Drowned Statue stands on the bottom.
//   The pump room (cols 101-134, floor 44) — dry: the bridge runs into it as
//     a gallery with a ladder down; the Sluice Wheel; a puffball up onto the
//     gear platform.
//   The drain (rows 71-73) — flooded, from the hall floor east under the
//     pump room to the shrine's pocket, where the Dry Shrine stands on the one
//     dry shelf; a ladder climbs from the pocket back to the pump room.
//
// There is no breath to run out of: no fail states, here as anywhere. Every
// climb is a ladder, two rows a step, a puffball, or the pop out of the water
// onto a ledge one row above it. Checked with a port of the player's physics:
// every place is reachable from the stair, and the stair from every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   c CryptBrick   v CryptFloor   W Water   T timber   H ladder
//   U puffball
const FLOODED_CISTERN_ROWS = [
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', //  0
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', //  1
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', //  2
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', //  3
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', //  4
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', //  5
  'cc...................................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', //  6  the landing (rows 6-11) and the great hall's vault
  'cc...................................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', //  7
  'cc...................................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', //  8
  'cc...................................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', //  9
  'cc...................................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 10
  'cc...................................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 11
  'ccvvvvvvvvvvvvv......................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 12  THE LANDING (cols 2-14), the stair down starts at col 15
  'ccccccccccccccc......................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 13
  'cccccccccccccccvv....................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 14
  'ccccccccccccccccc....................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 15
  'cccccccccccccccccvv..................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 16
  'ccccccccccccccccccc..................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 17
  'cccccccccccccccccccvv................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 18
  'ccccccccccccccccccccc................................................................................ccccccccccccccccccccccccccccccccccccccccccccccccc', // 19
  'cccccccccccccccccccccvv................................................................................................................ccccccccccccccc', // 20  the pump room (rows 20-43, cols 101-134)
  'ccccccccccccccccccccccc................................................................................................................ccccccccccccccc', // 21
  'cccccccccccccccccccccccvv..............................................................................................................ccccccccccccccc', // 22
  'ccccccccccccccccccccccccc..............................................................................................................ccccccccccccccc', // 23
  'cccccccccccccccccccccccccvv............................................................................................................ccccccccccccccc', // 24
  'ccccccccccccccccccccccccccc.........v.v...................................................v.v..........................................ccccccccccccccc', // 25
  'cccccccccccccccccccccccccccvvTTTTTTTTHTTTTTTTTTTTTTTTTTTTTTTTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTHTTTTTTTTTTTTTTTTTTTH.......................ccccccccccccccc', // 26  THE AQUEDUCT BRIDGE (cols 29-100, planks missing at 64-65), the pump room's gallery (101-110)
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 27  columns under the bridge: full (cols 34, 54, 74, 94), broken off above the water (44, 84)
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 28
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 29
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 30
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 31
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 32
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 33
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 34
  'ccccccccccccccccccccccccccccc.....cc.H......cc........cc..................cc........cc.....H..cc...............H.......................ccccccccccccccc', // 35
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H......TTTTT............ccccccccccccccc', // 36  the gear platform (cols 118-122)
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H.......................ccccccccccccccc', // 37
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H.......................ccccccccccccccc', // 38
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H.......................ccccccccccccccc', // 39
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H.......................ccccccccccccccc', // 40
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H.......................ccccccccccccccc', // 41
  'ccccccccccccccccccccccccccccc.....cc.H................cc..................cc...............H..cc...............H.......................ccccccccccccccc', // 42
  'ccccccccccccccccccccccccccccc.....cc.H................cc......vvvvvv......cc...............H..cc...............H...................v.v.ccccccccccccccc', // 43  the stump island (cols 62-67), one row above the water
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWvvvvvvvvvvvvvvvUvvvvvvvvvvvvvvvHvvccccccccccccccc', // 44  WATER LINE — the hall (cols 29-100); the pump room floor (101-134), its puffball at 116
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 45
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 46
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 47
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 48
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 49
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 50
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 51
  'cccccccccccccccccccccccccccccWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWWccccccWWWWWWccWWWWWWWWWWWWWWWWWWccWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 52
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 53
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 54
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc.....cccccccccccccc', // 55
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 56  the shrine pocket (rows 56-63, cols 136-148) and the shaft down to it (cols 131-135)
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 57
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 58
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 59
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 60
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 61
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc..................c', // 62
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccc............vvvvvvc', // 63  the shrine shelf (cols 143-148)
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 64
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 65
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 66
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 67
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 68
  'cccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 69
  'cccccccccccccccccccccccccccccvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvWWWWvcccccccccccccccccccccccccccccccccccWWWWWWWccccccc', // 70  the hall floor, open to the drain at cols 96-99
  'ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 71  the flooded drain (rows 71-73) east to the pocket
  'ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 72
  'ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWccccccc', // 73
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 74
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 75
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 76
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 77
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 78
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 79
] as const;

const T = TILE_SIZE;
const LANDING_Y = 12 * T;
const BRIDGE_Y = 26 * T;
const PUMP_Y = 44 * T;
const HALL_FLOOR_Y = 70 * T;
const SHELF_Y = 63 * T;

const RETURN_DOOR_X = 3 * T + 8;

const FLOODED_CISTERN_SPAWNS: SpawnPoint[] = [
  // On the landing, two tiles right of the stair.
  { id: 'from-crypt', x: 5 * T + 2, y: LANDING_Y - T },
];

// ---------------------------------------------------------------------------
// Landmarks — the Drowned Statue on the hall's floor, the Sluice Wheel in the
// pump room, the Dry Shrine in its pocket.
// ---------------------------------------------------------------------------

// A niche in the back wall, 14 wide × 20 tall, with a lit candle stub inside
// and coins on its sill. Anchored at the sill.
function drawShrine(g: Graphics): void {
  const stone = DB32.dimGray;
  const stoneHi = DB32.heather;
  g.rect(-7, -18, 14, 18).fill(stone);
  g.rect(-5, -20, 10, 2).fill(stone);
  g.rect(-3, -21, 6, 1).fill(stone);
  g.rect(-7, -18, 14, 1).fill(stoneHi);
  g.rect(-4, -16, 8, 14).fill(DB32.black);
  g.rect(-3, -18, 6, 2).fill(DB32.black);
  g.rect(-1, -5, 2, 3).fill(DB32.pancho);
  g.rect(-1, -7, 1, 2).fill(DB32.goldenFizz);
  g.rect(0, -8, 1, 1).fill(DB32.tahitiGold);
  g.rect(-6, -1, 2, 1).fill(DB32.eltGreen);
  g.rect(-3, -1, 1, 1).fill(DB32.goldenFizz);
  g.rect(4, -1, 2, 1).fill(DB32.eltGreen);
  g.rect(-2, -20, 4, 1).fill(DB32.opal);
  g.rect(-2, -20, 1, 2).fill(DB32.opal);
  g.rect(1, -20, 1, 2).fill(DB32.opal);
}

const FLOODED_CISTERN_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'drowned-statue',
    x: 80 * T,
    y: HALL_FLOOR_Y,
    name: 'Drowned Statue',
    description:
      'A stone figure on the floor of the cistern, under all that water: a hooded walker, one hand raised to ' +
      'shade its eyes, looking up through the dark at something overhead. On its plinth, worn almost away, the ' +
      'spiral — and the hood is the same as yours.',
    drawBody(g) {
      const stone = DB32.dimGray;
      const stoneHi = DB32.heather;
      g.rect(-8, -4, 16, 4).fill(stone);
      g.rect(-8, -4, 16, 1).fill(stoneHi);
      g.rect(-2, -3, 4, 1).fill(DB32.opal);
      g.rect(-5, -20, 10, 16).fill(stone);
      g.rect(-4, -26, 8, 6).fill(stone);
      g.rect(-3, -25, 6, 4).fill(DB32.opal);
      g.rect(-5, -20, 1, 16).fill(stoneHi);
      g.rect(4, -28, 2, 10).fill(stone);
      g.rect(2, -28, 4, 2).fill(stone);
      g.rect(-3, -12, 1, 6).fill(DB32.eltGreen);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      g.rect(-22, 18, 44, 10).fill(DB32.dimGray);
      g.rect(-14, -20, 28, 38).fill(stone);
      g.rect(-10, -36, 20, 16).fill(stone);
      g.rect(-7, -33, 14, 10).fill(DB32.dimGray);
      g.rect(10, -40, 6, 26).fill(stone);
      g.rect(4, -42, 12, 4).fill(stone);
      g.rect(-6, 21, 12, 2).fill(DB32.valhalla);
      g.rect(-6, 21, 2, 5).fill(DB32.valhalla);
      g.rect(-6, 24, 9, 2).fill(DB32.valhalla);
    },
  },
  {
    id: 'sluice-wheel',
    x: 124 * T,
    y: PUMP_Y,
    name: 'Sluice Wheel',
    description:
      'A great iron wheel in the pump room, for opening the sluices that once let the cistern fill and drain. ' +
      "It has not turned in a lifetime. Chalked on the wall beside it, a tally of the water's height, year by " +
      'year, rising — and the last mark, recent, in a different hand.',
    drawBody(g) {
      const iron = DB32.verdigris;
      const ironHi = DB32.topaz;
      g.rect(-2, -16, 4, 16).fill(iron);
      for (let dy = -13; dy <= 13; dy++) {
        const half = Math.round(Math.sqrt(169 - dy * dy));
        g.rect(-half, -26 + dy, 1, 1).fill(iron);
        g.rect(half, -26 + dy, 1, 1).fill(iron);
      }
      g.rect(-13, -27, 26, 2).fill(iron);
      g.rect(-1, -39, 2, 26).fill(iron);
      g.rect(-3, -28, 6, 6).fill(ironHi);
      for (let i = 0; i < 5; i++) g.rect(16, -10 - i * 5, 4, 1).fill(DB32.lightSteel);
      g.rect(16, -36, 6, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      const iron = DB32.verdigris;
      for (let dy = -28; dy <= 28; dy++) {
        const half = Math.round(Math.sqrt(784 - dy * dy));
        g.rect(-half, dy, 2, 1).fill(iron);
        g.rect(half - 1, dy, 2, 1).fill(iron);
      }
      g.rect(-28, -1, 56, 3).fill(iron);
      g.rect(-1, -28, 3, 56).fill(iron);
      g.rect(-20, -20, 40, 2).fill(iron);
      g.rect(-6, -6, 12, 12).fill(DB32.topaz);
    },
  },
  {
    id: 'dry-shrine',
    x: 145 * T + 8,
    y: SHELF_Y,
    name: 'Dry Shrine',
    description:
      'The one dry stone past the steps, and someone made it a shrine: a niche in the wall, a stub of candle that ' +
      'is somehow still lit, a scatter of coins gone green. Over the niche, worn by the damp almost smooth, ' +
      'the spiral.',
    drawBody(g) {
      drawShrine(g);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      g.rect(-20, -22, 40, 42).fill(stone);
      g.rect(-14, -30, 28, 8).fill(stone);
      g.rect(-8, -34, 16, 4).fill(stone);
      g.rect(-20, -22, 40, 2).fill(stoneHi);
      g.rect(-12, -18, 24, 34).fill(DB32.black);
      g.rect(-8, -24, 16, 6).fill(DB32.black);
      g.rect(-3, 4, 6, 12).fill(DB32.pancho);
      g.rect(-1, -4, 2, 8).fill(DB32.goldenFizz);
      g.rect(-1, 0, 2, 3).fill(DB32.tahitiGold);
      for (const x of [-18, -12, 8, 14]) g.rect(x, 18, 4, 2).fill(DB32.eltGreen);
      g.rect(-6, -32, 12, 1).fill(ink);
      g.rect(-6, -32, 1, 5).fill(ink);
      g.rect(5, -32, 1, 5).fill(ink);
      g.rect(-6, -28, 12, 1).fill(ink);
      g.rect(-2, -30, 3, 1).fill(ink);
    },
  },
];

// ---------------------------------------------------------------------------
// Decorations.
// ---------------------------------------------------------------------------

// The stair down from the ossuary: a stone arch over steps into the dark,
// the way back up. 14 wide × 22 tall, base on y = 0, as every door is.
function drawStairUp(g: Graphics): void {
  g.rect(-7, -20, 14, 20).fill(DB32.dimGray);
  g.rect(-5, -22, 10, 2).fill(DB32.dimGray);
  g.rect(-5, -19, 10, 19).fill(DB32.black);
  g.rect(-3, -21, 6, 2).fill(DB32.black);
  for (let i = 0; i < 4; i++) g.rect(-4 + i, -4 - i * 4, 8 - i, 1).fill(DB32.heather);
}

// A chain hanging from the vault, 1 wide, its links catching the light.
function drawChain(g: Graphics): void {
  for (let y = 0; y < 90; y += 4) {
    g.rect(0, y, 1, 3).fill(DB32.dimGray);
    g.rect(-1, y + 2, 3, 1).fill(DB32.heather);
  }
}

// The pump room's machinery: a big toothed gear and pipes, 60 wide × 70 tall,
// base on the floor.
function drawGears(g: Graphics): void {
  for (let dy = -18; dy <= 18; dy++) {
    const half = Math.round(Math.sqrt(324 - dy * dy));
    g.rect(-half - 12, -40 + dy, half * 2 + 1, 1).fill(DB32.opal);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.rect(Math.round(Math.cos(a) * 20) - 14, -40 + Math.round(Math.sin(a) * 20) - 2, 4, 4).fill(DB32.opal);
  }
  g.rect(-15, -43, 6, 6).fill(DB32.verdigris);
  g.rect(8, -70, 6, 70).fill(DB32.verdigris);
  g.rect(8, -70, 2, 70).fill(DB32.topaz);
  g.rect(8, -24, 22, 6).fill(DB32.verdigris);
  g.rect(24, -24, 6, 24).fill(DB32.verdigris);
}

// A brass gauge on the wall: a dial, its needle pinned at full.
function drawGauge(g: Graphics): void {
  for (let dy = -6; dy <= 6; dy++) {
    const half = Math.round(Math.sqrt(36 - dy * dy));
    g.rect(-half, -30 + dy, half * 2 + 1, 1).fill(DB32.rainforest);
  }
  for (let dy = -4; dy <= 4; dy++) {
    const half = Math.round(Math.sqrt(16 - dy * dy));
    g.rect(-half, -30 + dy, half * 2 + 1, 1).fill(DB32.pancho);
  }
  g.rect(0, -33, 1, 3).fill(DB32.clairvoyant);
  g.rect(1, -34, 1, 1).fill(DB32.clairvoyant);
}

const at = (col: number, surfaceRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * T + 8,
  y: surfaceRow * T,
  draw,
});

const FLOODED_CISTERN_DECORATIONS: DecorationSpec[] = [
  // Chains down from the vault into the hall.
  ...[40, 50, 70, 88].map((col) => ({ x: col * T + 8, y: 6 * T, draw: drawChain })),
  // The pump room.
  at(108, 44, drawGears),
  at(128, 44, drawGauge),
];

export const floodedCisternLevel: LevelSpec = {
  id: 'flooded-cistern',
  name: 'The Flooded Cistern',
  rows: FLOODED_CISTERN_ROWS,
  spawns: FLOODED_CISTERN_SPAWNS,
  defaultSpawnId: 'from-crypt',
  landmarks: FLOODED_CISTERN_LANDMARKS,
  decorations: FLOODED_CISTERN_DECORATIONS,
  parallax: 'keep',
  // A back wall of big damp blocks, not a void.
  backdrop: 'masonry',
  rockBgStartRow: 0,
  openSky: false,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'cistern-return-door',
        x: RETURN_DOOR_X,
        y: LANDING_Y,
        targetLevelId: 'old-keep-crypt',
        targetSpawnId: 'from-cistern',
        promptLabel: 'ascend',
        drawBody: drawStairUp,
      }),
      // Light: candles on the landing, the bridge, the pump room, the shelf.
      new TallCandle(8 * T + 8, LANDING_Y),
      new TallCandle(13 * T + 8, LANDING_Y),
      new TallCandle(49 * T + 8, BRIDGE_Y),
      new TallCandle(80 * T + 8, BRIDGE_Y),
      new TallCandle(104 * T + 8, PUMP_Y),
      new TallCandle(132 * T + 8, PUMP_Y),
      new TallCandle(147 * T + 8, SHELF_Y),
      // Glowfish and eels in the hall and the drain; kelp on the bottom.
      new Glowfish({ x: 40 * T, y: 50 * T, speed: 18, minX: 29 * T + 6, maxX: 34 * T - 6 }),
      new Glowfish({ x: 70 * T, y: 48 * T, speed: 14, minX: 68 * T + 6, maxX: 74 * T - 6 }),
      new Glowfish({ x: 98 * T, y: 47 * T, speed: 12, minX: 96 * T + 6, maxX: 100 * T + 8 }),
      new Glowfish({ x: 140 * T, y: 68 * T, speed: 16, minX: 136 * T + 6, maxX: 143 * T - 6 }),
      new Glowfish({ x: 115 * T, y: 72 * T, speed: 20, minX: 101 * T, maxX: 135 * T }),
      new Eel({ x: 60 * T, y: 60 * T, speed: 16, minX: 30 * T, maxX: 61 * T }),
      new Eel({ x: 85 * T, y: 64 * T, speed: 20, minX: 68 * T, maxX: 99 * T }),
      new Eel({ x: 50 * T, y: 67 * T, speed: 12, minX: 36 * T, maxX: 60 * T }),
      ...[31, 39, 47, 58, 71, 77, 86, 92].map(
        (col, i) => new Kelp({ x: col * T + 8, y: HALL_FLOOR_Y, height: 60 + ((i * 37) % 120) }),
      ),
      // Crabs on the stump island, the pump room floor, the shrine shelf.
      new Crab({ x: 64 * T, y: 43 * T, minX: 62 * T + 6, maxX: 68 * T - 6 }),
      new Crab({ x: 116 * T, y: PUMP_Y, minX: 112 * T, maxX: 122 * T }),
      new Crab({ x: 145 * T, y: SHELF_Y, minX: 143 * T + 6, maxX: 149 * T - 6 }),
      // A frog on the stump, a newt on the stair's foot and the gear platform.
      new Frog({ fromX: 63 * T, toX: 67 * T, y: 43 * T }),
      new Newt({ x: 25 * T, y: 24 * T, minX: 25 * T, maxX: 26 * T + 8 }),
      new Newt({ x: 120 * T, y: 36 * T, minX: 118 * T + 6, maxX: 123 * T - 6 }),
      // Bats under the vault.
      new Bat({ x: 45 * T, y: 6 * T }),
      new Bat({ x: 66 * T, y: 6 * T }),
      new Bat({ x: 94 * T, y: 6 * T }),
      new Bat({ x: 118 * T, y: 20 * T }),
    ];
  },
};

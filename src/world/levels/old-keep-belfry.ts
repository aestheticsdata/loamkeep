import { DB32, TILE_SIZE } from '@constants';
import { Bat } from '@entities/bat';
import type { DecorationSpec } from '@entities/decoration';
import { Door } from '@entities/door';
import type { Entity } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import { Owl } from '@entities/owl';
import { Pigeon } from '@entities/pigeon';
import { Spider } from '@entities/spider';
import { TallCandle } from '@entities/tall-candle';
import type { LevelSpec, SpawnPoint } from '@world/level';
import type { Graphics } from 'pixi.js';

// The Belfry — the keep's bell tower, climbed inside and out, at night.
//
// 90 wide × 120 tall. The tower stands on the keep (its roof walk is row 100,
// either side) with walls two tiles thick (cols 29-30, 59-60):
//
//   The ground floor (row 115) — the door back down into the keep; two
//     ladders up to the first floor (row 100), whose windows open on the
//     keep's roof walk both sides.
//   Up inside — a zigzag of ledges from the first floor to the clock room
//     (floor 85, the Tower Clock); a ladder to floor 70; a ladder to the bell
//     chamber (floor 55, the Silent Bell on its beam); a ladder to the loft
//     (floor 40), with a gap in its floor to drop onto the bell's beam.
//   Up outside — from the west roof walk, ledges up the west face to a
//     balcony and a window back in on floor 70; from the clock room's window,
//     ledges up the east face past the bell chamber's and the loft's windows
//     to the top of the wall, and from there up the stepped spire to the
//     Weathervane. The outside is the only way to the top.
//
// Every jump is two rows up, or three with a column of air before the ledge
// and nothing overhead. Checked with a port of the player's physics: every
// place is reachable from the door, and the door from every place.
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   B CastleBrick   F CastleFloor   T Timber   H ladder
const OLD_KEEP_BELFRY_ROWS = [
  '..........................................................................................', //  0
  '..........................................................................................', //  1
  '..........................................................................................', //  2
  '..........................................................................................', //  3
  '..........................................................................................', //  4
  '..........................................................................................', //  5
  '............................................BB............................................', //  6  the spire's peak (cols 44-45) — the Weathervane
  '...........................................BBBB...........................................', //  7
  '..........................................BBBBBB..........................................', //  8
  '.........................................BBBBBBBB.........................................', //  9
  '........................................BBBBBBBBBB........................................', // 10
  '.......................................BBBBBBBBBBBB.......................................', // 11
  '......................................BBBBBBBBBBBBBB......................................', // 12
  '.....................................BBBBBBBBBBBBBBBB.....................................', // 13
  '....................................BBBBBBBBBBBBBBBBBB....................................', // 14
  '...................................BBBBBBBBBBBBBBBBBBBB...................................', // 15
  '..................................BBBBBBBBBBBBBBBBBBBBBB..................................', // 16
  '.................................BBBBBBBBBBBBBBBBBBBBBBBB.................................', // 17
  '................................BBBBBBBBBBBBBBBBBBBBBBBBBB................................', // 18
  '...............................BBBBBBBBBBBBBBBBBBBBBBBBBBBB...............................', // 19  the spire, stepped, on the tower's roof base
  '.............................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............................', // 20  the roof base, and the top of the tower wall (cols 59-60) at the east face's last ledge
  '.............................BB............................BB.............................', // 21
  '.............................BB............................BBBBB..........................', // 22
  '.............................BB............................BB.............................', // 23
  '.............................BB............................BB.............................', // 24
  '.............................BB............................BB.....BBB.....................', // 25
  '.............................BB............................BB.............................', // 26
  '.............................BB............................BB.............................', // 27
  '.............................BB............................BBBBB..........................', // 28
  '.............................BB............................BB.............................', // 29
  '.............................BB............................BB.............................', // 30
  '.............................BB............................BB.....BBB.....................', // 31
  '.............................BB............................BB.............................', // 32
  '.............................BB............................BB.............................', // 33
  '.............................BB............................BBBBB..........................', // 34
  '.............................BB............................BB.............................', // 35
  '.............................BB............................BB.............................', // 36
  '.............................BB...................................BBB.....................', // 37  the loft's window onto the east face (rows 37-39)
  '.............................BB...........................................................', // 38
  '.............................BBT.T........................................................', // 39
  '.............................BBTHTTTTTTTTTTTTTT..TTTTTTTTTTBBBBB..........................', // 40  THE LOFT FLOOR, its ladder hole at col 32 and a gap over the bell beam (cols 47-48)
  '.............................BB.H..........................BB.............................', // 41
  '.............................BB.H..........................BB.............................', // 42
  '.............................BB.H..........................BB.....BBB.....................', // 43
  '.............................BB.H.........TTTTTTTT.........BB.............................', // 44  the bell's beam (cols 42-49)
  '.............................BB.H..........................BB.............................', // 45
  '.............................BB.H..........................BBBBB..........................', // 46
  '.............................BB.H..........................BB.............................', // 47
  '.............................BB.H..........................BB.............................', // 48
  '.............................BB.H..........................BB.....BBB.....................', // 49
  '.............................BB.H..........................BB.............................', // 50
  '.............................BB.H..........................BB.............................', // 51
  '.............................BB.H............................BBB..........................', // 52  the bell chamber's window onto the east face (rows 52-54)
  '.............................BB.H.........................................................', // 53
  '.............................BB.H.T.T.....................................................', // 54
  '.............................BBTTTTHTTTTTTTTTTTTTTTTTTTTTTTBB.....BBB.....................', // 55  THE BELL CHAMBER FLOOR, its ladder hole at col 35
  '.............................BB....H.......................BB.............................', // 56
  '.............................BB....H.......................BB.............................', // 57
  '.............................BB....H.......................BBBBB..........................', // 58
  '.............................BB....H.......................BB.............................', // 59
  '.............................BB....H.......................BB.............................', // 60
  '.............................BB....H.......................BB.....BBB.....................', // 61
  '.............................BB....H.......................BB.............................', // 62
  '.............................BB....H.......................BB.............................', // 63
  '.............................BB....H.......................BBBBB..........................', // 64
  '.............................BB....H.......................BB.............................', // 65
  '.............................BB....H.......................BB.............................', // 66
  '...................................H.......................BB.....BBB.....................', // 67  floor 70's west window onto the balcony (rows 67-69)
  '...................................H.......................BB.............................', // 68
  '...................................H...................T.T.BB.............................', // 69
  '..........................BBBBBTTTTTTTTTTTTTTTTTTTTTTTTTHTTBBBBB..........................', // 70  FLOOR 70, its ladder hole at col 56; the west balcony (cols 26-28)
  '.............................BB.........................H..BB.............................', // 71
  '.............................BB.........................H..BB.............................', // 72
  '......................BBB....BB.........................H..BB.....BBB.....................', // 73
  '.............................BB.........................H..BB.............................', // 74
  '.............................BB.........................H..BB.............................', // 75
  '..........................BBBBB.........................H..BBBBB..........................', // 76
  '.............................BB.........................H..BB.............................', // 77
  '.............................BB.........................H..BB.............................', // 78
  '......................BBB....BB.........................H..BB.....BBB.....................', // 79
  '.............................BB.........................H..BB.............................', // 80
  '.............................BB.........................H..BB.............................', // 81
  '..........................BBBBB.........................H....BBB..........................', // 82  the clock room's window onto the east face (rows 82-84)
  '.............................BB.........................H.................................', // 83
  '.............................BB.........................H.................................', // 84
  '......................BBB....BB..........TTTTTTTTTTTTTTTTTTBBBBBBBBBB.....................', // 85  THE CLOCK ROOM FLOOR (cols 41-58); the east sill (cols 61-68)
  '.............................BB............................BB.............................', // 86
  '.............................BB............................BB.............................', // 87
  '..........................BBBBB......TTT...................BB.............................', // 88  the inside zigzag (cols 32-34 and 37-39), rows 88-97
  '.............................BB............................BB.............................', // 89
  '.............................BB............................BB.............................', // 90
  '......................BBB....BB.TTT........................BB.............................', // 91
  '.............................BB............................BB.............................', // 92
  '.............................BB............................BB.............................', // 93
  '..........................BBBBB......TTT...................BB.............................', // 94
  '.............................BB............................BB.............................', // 95
  '.............................BB............................BB.............................', // 96
  '......................BBB.......TTT.......................................................', // 97  windows onto the keep's roof walk both sides (rows 97-99)
  '..........................................................................................', // 98
  '..BB....BB....BB.....................T.T.............T.T..................BB....BB....BB..', // 99
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBTTTTTTTHTTTTTTTTTTTTTTTHTTTTBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // 100  THE FIRST FLOOR (inside) and the keep's roof walk (outside)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 101
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 102
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 103
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 104
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 105
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 106
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 107
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 108
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 109
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 110
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 111
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 112
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 113
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......H...............H....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 114
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 115  THE GROUND FLOOR, two ladders up (cols 38, 54)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 116
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 117
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 118
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 119
] as const;

const T = TILE_SIZE;
const GROUND_Y = 115 * T;
const FIRST_Y = 100 * T;
const CLOCK_Y = 85 * T;
const FLOOR70_Y = 70 * T;
const CHAMBER_Y = 55 * T;
const LOFT_Y = 40 * T;

const RETURN_DOOR_X = 33 * T + 8;

const OLD_KEEP_BELFRY_SPAWNS: SpawnPoint[] = [
  // Two tiles right of the door, clear of its interaction zone.
  { id: 'from-keep', x: 35 * T + 2, y: GROUND_Y - T },
];

// ---------------------------------------------------------------------------
// Landmarks — the Tower Clock, the Silent Bell, the Weathervane.
// ---------------------------------------------------------------------------

// How far the underside of the bell's beam is above the chamber floor, and
// how far the bell's headstock hangs below it, in pixels — low enough to be
// seen from the floor.
const BELL_HANG = 160;
const BELL_DROP = 40;

// The bell on two iron straps from its beam, drawn BELL_DROP lower than
// drawBell expects, its rope reaching down toward the floor.
function drawHungBell(g: Graphics): void {
  g.rect(-7, -BELL_HANG, 2, BELL_HANG - 80 - BELL_DROP).fill(DB32.dimGray);
  g.rect(5, -BELL_HANG, 2, BELL_HANG - 80 - BELL_DROP).fill(DB32.dimGray);
  g.setTransform(1, 0, 0, 1, 0, -BELL_DROP);
  drawBell(g);
  g.resetTransform();
}

const OLD_KEEP_BELFRY_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'tower-clock',
    x: 50 * T,
    y: CLOCK_Y,
    name: 'Tower Clock',
    description:
      "The clockwork behind the tower's face: wheels within wheels, a pendulum as long as you are tall, all of " +
      'it oiled and all of it stopped. The hands outside stand at a minute to midnight, and someone has wedged ' +
      'the escapement with a carved wooden spiral, so that they will stay there.',
    drawBody(g) {
      const iron = DB32.verdigris;
      const brass = DB32.rainforest;
      g.rect(-14, -36, 28, 32).fill(DB32.oiledCedar);
      g.rect(-14, -36, 28, 2).fill(DB32.rope);
      for (const [x, y, r] of [
        [-6, -26, 6],
        [6, -20, 5],
        [-4, -12, 4],
      ] as const) {
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.round(Math.sqrt(r * r - dy * dy));
          g.rect(x - half, y + dy, half * 2 + 1, 1).fill(brass);
        }
        g.rect(x - 1, y - 1, 2, 2).fill(iron);
      }
      g.rect(-1, -4, 2, 4).fill(iron);
      g.rect(-3, -2, 6, 2).fill(brass);
      g.rect(2, -10, 3, 3).fill(DB32.twine);
    },
    drawSketch(g) {
      for (let dy = -28; dy <= 28; dy++) {
        const half = Math.round(Math.sqrt(784 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(DB32.pancho);
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.rect(Math.round(Math.cos(a) * 23) - 1, Math.round(Math.sin(a) * 23) - 1, 2, 2).fill(DB32.valhalla);
      }
      g.rect(-1, -20, 2, 20).fill(DB32.valhalla);
      g.rect(-1, -16, 2, 16).fill(DB32.valhalla);
      g.rect(-2, -2, 4, 4).fill(DB32.rainforest);
    },
  },
  {
    id: 'silent-bell',
    x: 45 * T + 8,
    y: CHAMBER_Y,
    name: 'Silent Bell',
    description:
      'A bronze bell as tall as you are, hung where the whole valley could have heard it. Its clapper has been ' +
      'bound fast with rope — many turns, knotted with care — so that it can never ring. ' +
      'Cast into its waist, where a maker would put their name: the spiral.',
    drawBody(g) {
      drawHungBell(g);
    },
    drawSketch(g) {
      const bronze = DB32.rainforest;
      const bronzeHi = DB32.twine;
      const shadow = DB32.stinger;
      // Yoke.
      g.rect(-22, -40, 44, 6).fill(DB32.oiledCedar);
      g.rect(-22, -40, 44, 2).fill(DB32.rope);
      // Bell: crown, shoulder, waist widening to the lip.
      g.rect(-6, -34, 12, 4).fill(bronze);
      g.rect(-14, -30, 28, 4).fill(bronze);
      for (let i = 0; i < 9; i++) {
        const half = 16 + Math.floor(i / 2);
        g.rect(-half, -26 + i * 4, half * 2, 4).fill(bronze);
      }
      g.rect(-24, 10, 48, 5).fill(bronze);
      g.rect(-24, 14, 48, 2).fill(shadow);
      g.rect(-12, -28, 4, 32).fill(bronzeHi);
      g.rect(14, -26, 3, 36).fill(shadow);
      // The spiral on the waist, cast in relief: lighter bronze, not gold.
      g.rect(-8, -16, 16, 2).fill(bronzeHi);
      g.rect(-8, -16, 2, 14).fill(bronzeHi);
      g.rect(-8, -4, 14, 2).fill(bronzeHi);
      g.rect(4, -12, 2, 10).fill(bronzeHi);
      g.rect(-4, -12, 10, 2).fill(bronzeHi);
      g.rect(-4, -12, 2, 5).fill(bronzeHi);
      g.rect(-8, -2, 14, 1).fill(shadow);
      // Clapper, and the rope wound round it.
      g.rect(-3, 16, 6, 10).fill(DB32.valhalla);
      for (let i = 0; i < 4; i++) {
        g.rect(-5, 17 + i * 2, 10, 1).fill(DB32.twine);
      }
      g.rect(-1, 26, 2, 10).fill(DB32.twine);
    },
  },
  {
    id: 'weathervane',
    x: 44 * T + 8,
    y: 6 * T,
    name: 'Weathervane',
    description:
      'On the very tip of the spire, an iron cockerel on a spindle. It does not point into the wind. It turns, ' +
      'slowly, all night, one full turn for every turn of the stars overhead — and its tail feathers are ' +
      'wrought into a spiral.',
    drawBody(g) {
      const iron = DB32.dimGray;
      g.rect(-1, -26, 2, 26).fill(iron);
      g.rect(-6, -10, 12, 1).fill(iron);
      g.rect(-7, -10, 1, 1).fill(DB32.heather);
      g.rect(6, -10, 1, 1).fill(DB32.heather);
      g.rect(-5, -24, 8, 5).fill(iron);
      g.rect(3, -27, 3, 4).fill(iron);
      g.rect(5, -26, 1, 1).fill(DB32.clairvoyant);
      g.rect(-8, -26, 3, 3).fill(iron);
      g.rect(-7, -25, 1, 1).fill(DB32.heather);
      g.rect(-2, -19, 1, 1).fill(DB32.heather);
    },
    drawSketch(g) {
      const iron = DB32.dimGray;
      g.rect(-2, -10, 4, 40).fill(iron);
      g.rect(-20, -16, 32, 16).fill(iron);
      g.rect(10, -26, 10, 12).fill(iron);
      g.rect(17, -22, 3, 3).fill(DB32.clairvoyant);
      g.rect(-30, -24, 12, 2).fill(iron);
      g.rect(-30, -24, 2, 10).fill(iron);
      g.rect(-30, -16, 9, 2).fill(iron);
      g.rect(-23, -20, 2, 6).fill(iron);
    },
  },
];

function drawBell(g: Graphics): void {
  const wood = DB32.oiledCedar;
  const bronze = DB32.rainforest;
  const bronzeHi = DB32.twine;
  const shadow = DB32.stinger;
  const rope = DB32.twine;

  // Headstock under the beam, and the crown that hangs from it.
  g.rect(-8, -80, 16, 3).fill(wood);
  g.rect(-8, -78, 16, 1).fill(DB32.valhalla);
  g.rect(-2, -77, 4, 2).fill(bronze);
  // Shoulder, waist and lip — widening downwards a pixel a side every few rows.
  g.rect(-5, -75, 10, 2).fill(bronze);
  for (let i = 0; i < 14; i++) {
    const half = 6 + Math.floor(i / 4);
    g.rect(-half, -73 + i, half * 2, 1).fill(bronze);
  }
  g.rect(-10, -59, 20, 3).fill(bronze);
  g.rect(-10, -57, 20, 1).fill(shadow);
  // Light from the left, shade on the right.
  g.rect(-4, -74, 1, 14).fill(bronzeHi);
  g.rect(6, -70, 1, 11).fill(shadow);
  // The spiral, small, cast in relief on the waist.
  g.rect(-2, -69, 5, 1).fill(bronzeHi);
  g.rect(-2, -69, 1, 4).fill(bronzeHi);
  g.rect(-2, -65, 4, 1).fill(bronzeHi);
  g.rect(2, -67, 1, 2).fill(bronzeHi);
  g.rect(0, -67, 2, 1).fill(bronzeHi);
  // Clapper under the lip, wound with rope.
  g.rect(-1, -56, 2, 4).fill(DB32.valhalla);
  g.rect(-2, -55, 4, 1).fill(rope);
  g.rect(-2, -53, 4, 1).fill(rope);
  // The rope down to the sally — red, cream and green bands, the grip a
  // ringer would pull — and its tail.
  g.rect(0, -52, 1, 28).fill(rope);
  const bands = [DB32.clairvoyant, DB32.pancho, DB32.eltGreen, DB32.pancho, DB32.clairvoyant];
  bands.forEach((band, i) => {
    g.rect(-1, -24 + i * 2, 3, 2).fill(band);
  });
  g.rect(0, -14, 1, 8).fill(rope);
}

// ---------------------------------------------------------------------------
// Decorations.
// ---------------------------------------------------------------------------

// A narrow arched slit, 6 wide × 20 tall, anchored at its sill. Night-blue
// inside with one star, and moonlight on the sill.
function drawSlitWindow(g: Graphics): void {
  const stone = DB32.dimGray;
  g.rect(-3, -20, 6, 20).fill(stone);
  g.rect(-2, -21, 4, 1).fill(stone);
  g.rect(-1, -19, 2, 17).fill(DB32.valhalla);
  g.rect(-1, -10, 2, 8).fill(DB32.deepKoamaru);
  g.rect(0, -15, 1, 1).fill(DB32.white);
  g.rect(-3, -1, 6, 1).fill(DB32.lightSteel);
}

// A stone gargoyle crouched on a ledge, looking out, 12 wide × 12 tall.
function drawGargoyle(g: Graphics): void {
  const stone = DB32.dimGray;
  g.rect(-5, -7, 9, 7).fill(stone);
  g.rect(2, -11, 5, 5).fill(stone);
  g.rect(-6, -9, 3, 3).fill(stone);
  g.rect(5, -10, 1, 1).fill(DB32.goldenFizz);
  g.rect(6, -8, 2, 1).fill(DB32.valhalla);
  g.rect(-5, -7, 1, 7).fill(DB32.heather);
}

// The clock's face on the back wall of the clock room, 48 across.
function drawClockFace(g: Graphics): void {
  for (let dy = -24; dy <= 24; dy++) {
    const half = Math.round(Math.sqrt(576 - dy * dy));
    g.rect(-half, -60 + dy, half * 2 + 1, 1).fill(DB32.pancho);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.rect(Math.round(Math.cos(a) * 20) - 1, -60 + Math.round(Math.sin(a) * 20) - 1, 2, 2).fill(DB32.valhalla);
  }
  g.rect(-1, -78, 2, 18).fill(DB32.valhalla);
  g.rect(-1, -74, 2, 14).fill(DB32.valhalla);
  g.rect(-2, -62, 4, 4).fill(DB32.rainforest);
}

// Two small bells on a bar, beside the great one.
function drawSmallBells(g: Graphics): void {
  g.rect(-14, -64, 28, 2).fill(DB32.oiledCedar);
  for (const x of [-9, 7]) {
    g.rect(x - 4, -60, 8, 7).fill(DB32.rainforest);
    g.rect(x - 5, -54, 10, 2).fill(DB32.rainforest);
    g.rect(x - 3, -59, 1, 5).fill(DB32.twine);
    g.rect(x, -62, 1, 2).fill(DB32.oiledCedar);
  }
}

const at = (col: number, surfaceRow: number, draw: (g: Graphics) => void): DecorationSpec => ({
  x: col * T + 8,
  y: surfaceRow * T,
  draw,
});

const OLD_KEEP_BELFRY_DECORATIONS: DecorationSpec[] = [
  at(45, 115, drawSlitWindow),
  at(33, 97, drawSlitWindow),
  at(50, 97, drawSlitWindow),
  at(44, 85, drawClockFace),
  at(40, 67, drawSlitWindow),
  at(52, 67, drawSlitWindow),
  at(53, 55, drawSmallBells),
  at(40, 37, drawSlitWindow),
  at(55, 37, drawSlitWindow),
  // Gargoyles on the outside ledges.
  at(23, 91, drawGargoyle),
  at(27, 82, drawGargoyle),
  at(67, 73, drawGargoyle),
  at(62, 58, drawGargoyle),
  at(67, 43, drawGargoyle),
  at(62, 28, drawGargoyle),
];

export const oldKeepBelfryLevel: LevelSpec = {
  id: 'old-keep-belfry',
  name: 'The Belfry',
  rows: OLD_KEEP_BELFRY_ROWS,
  spawns: OLD_KEEP_BELFRY_SPAWNS,
  defaultSpawnId: 'from-keep',
  landmarks: OLD_KEEP_BELFRY_LANDMARKS,
  decorations: OLD_KEEP_BELFRY_DECORATIONS,
  parallax: 'night',
  // Masonry inside the tower; outside, the night sky.
  backdrop: 'masonry',
  rockBgStartRow: OLD_KEEP_BELFRY_ROWS.length,
  backdropRegions: [{ col: 31, row: 21, cols: 28, rows: 95 }],
  openSky: true,
  createEntities(): readonly Entity[] {
    return [
      new Door({
        id: 'belfry-return-door',
        x: RETURN_DOOR_X,
        y: GROUND_Y,
        targetLevelId: 'old-keep',
        targetSpawnId: 'from-belfry',
        promptLabel: 'go down',
      }),
      new TallCandle(40 * T + 8, GROUND_Y),
      new TallCandle(57 * T + 8, FIRST_Y),
      new TallCandle(42 * T + 8, CLOCK_Y),
      new TallCandle(33 * T + 8, FLOOR70_Y),
      new TallCandle(38 * T + 8, CHAMBER_Y),
      new TallCandle(52 * T + 8, LOFT_Y),
      // Owls: on the bell's beam, in the loft, on the west balcony, on the spire.
      new Owl({ x: 43 * T + 8, y: 44 * T }),
      new Owl({ x: 36 * T + 8, y: LOFT_Y }),
      new Owl({ x: 27 * T + 8, y: FLOOR70_Y }),
      new Owl({ x: 40 * T + 8, y: 11 * T }),
      // Pigeons on the roof walks and the ledges.
      new Pigeon({ x: 10 * T, y: FIRST_Y, minX: 3 * T, maxX: 20 * T }),
      new Pigeon({ x: 78 * T, y: FIRST_Y, minX: 70 * T, maxX: 86 * T }),
      new Pigeon({ x: 64 * T, y: 85 * T, minX: 62 * T, maxX: 68 * T }),
      new Pigeon({ x: 67 * T, y: 49 * T, minX: 66 * T + 4, maxX: 69 * T - 4 }),
      // Spiders on threads from the ceilings of the clock room and the loft.
      new Spider({ x: 47 * T, y: 71 * T }),
      new Spider({ x: 55 * T, y: 71 * T }),
      new Spider({ x: 50 * T, y: 21 * T }),
      // Bats under the loft's roof and the bell chamber's.
      new Bat({ x: 40 * T, y: 21 * T }),
      new Bat({ x: 54 * T, y: 21 * T }),
      new Bat({ x: 50 * T, y: 41 * T }),
    ];
  },
};

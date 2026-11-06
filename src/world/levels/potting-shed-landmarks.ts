import { DB32, TILE_SIZE } from '@constants';
import { drawGlow } from '@entities/glow';
import type { LandmarkSpec } from '@entities/landmark';
import type { Vec2 } from '@types';
import type { Graphics } from 'pixi.js';

// The Potting Shed's new landmarks: the thirty-two the v2 handoff adds over
// the old house, through the east wing, the clock tower and the back wing,
// and on down under the garden. Each stands where its marker is on the
// handoff's map
// (design_handoff_level_05_potting_shed_v2/level-05-potting-shed-v2-markers.json):
// x is the middle of the marker's column, y the top of the tile it stands on.
// Four markers sat on water, a ladder hole or mid-air; they stand on the
// nearest floor instead, each noted where it is.
//
// The house's own landmarks (the Grandfather Clock and the rest) keep their
// art in potting-shed-art.ts; these follow its look — oiled cedar, pancho
// dials, the spiral in valhalla — with its two private helpers mirrored below.

const T = TILE_SIZE;

// A landmark's base at the middle of a column, on a row's top edge.
const at = (col: number, row: number) => ({ x: col * T + 8, y: row * T });

// A disc of radius r, row by row.
function disc(g: Graphics, centre: Vec2, r: number, color: number): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    g.rect(centre.x - half, centre.y + dy, half * 2 + 1, 1).fill(color);
  }
}

// The spiral that runs through the house's landmarks, square-cornered and
// winding inward, `step` px between its turns: 13 px across at step 2.
const SPIRAL = [
  [-3, -3],
  [3, -3],
  [3, 3],
  [-2, 3],
  [-2, -2],
  [2, -2],
  [2, 2],
  [-1, 2],
  [-1, -1],
  [1, -1],
] as const;

function spiral(g: Graphics, centre: Vec2, step: number): void {
  const pen = Math.max(1, step >> 1);
  for (let i = 0; i + 1 < SPIRAL.length; i++) {
    const ax = centre.x + SPIRAL[i][0] * step;
    const ay = centre.y + SPIRAL[i][1] * step;
    const bx = centre.x + SPIRAL[i + 1][0] * step;
    const by = centre.y + SPIRAL[i + 1][1] * step;
    g.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + pen, Math.abs(by - ay) + pen).fill(DB32.valhalla);
  }
}

// A clock dial stopped at the house's one minute: the hour hand on twelve,
// the minute hand at twenty past. Every stopped clock in the house shows it.
function stoppedDial(g: Graphics, centre: Vec2, r: number): void {
  const pen = r >= 10 ? 2 : 1;
  disc(g, centre, r, DB32.pancho);
  const hour = Math.round(r * 0.55);
  g.rect(centre.x, centre.y - hour, pen, hour + 1).fill(DB32.valhalla);
  const minute = Math.round(r * 0.75);
  for (let i = 0; i <= minute; i++) {
    g.rect(centre.x + i, centre.y + Math.round(i * 0.58), pen, pen).fill(DB32.valhalla);
  }
}

export const POTTING_SHED_NEW_LANDMARKS: LandmarkSpec[] = [
  // ---------------------------------------------------------------- the roof

  // 16) The Weathervane — on the ridge of the old house's roof.
  {
    id: 'weathervane',
    ...at(60, 14),
    name: 'The Weathervane',
    description: 'A copper hare running after a copper moon. It turns, but never quite catches it.',
    drawBody(g) {
      g.rect(0, -14, 1, 14).fill(DB32.dimGray);
      g.rect(-4, -9, 9, 1).fill(DB32.dimGray);
      g.rect(-5, -10, 1, 3).fill(DB32.dimGray);
      g.rect(5, -10, 1, 3).fill(DB32.dimGray);
      g.rect(-7, -15, 16, 1).fill(DB32.dimGray);
      // The hare, mid-leap, and the moon a hand ahead of it.
      g.rect(-6, -19, 7, 3).fill(DB32.tahitiGold);
      g.rect(-6, -19, 7, 1).fill(DB32.twine);
      g.rect(1, -21, 3, 3).fill(DB32.tahitiGold);
      g.rect(2, -25, 1, 4).fill(DB32.tahitiGold);
      g.rect(3, -24, 1, 3).fill(DB32.rope);
      g.rect(-8, -17, 2, 1).fill(DB32.tahitiGold);
      g.rect(0, -16, 2, 1).fill(DB32.tahitiGold);
      g.rect(-7, -20, 1, 1).fill(DB32.pancho);
      g.rect(3, -20, 1, 1).fill(DB32.valhalla);
      g.rect(-3, -17, 1, 1).fill(DB32.eltGreen);
      disc(g, { x: 8, y: -22 }, 2, DB32.tahitiGold);
      g.rect(9, -23, 1, 2).fill(DB32.rope);
    },
    drawSketch(g) {
      g.rect(-1, -2, 3, 32).fill(DB32.dimGray);
      g.rect(-14, 10, 30, 2).fill(DB32.dimGray);
      g.rect(-16, 6, 2, 8).fill(DB32.dimGray);
      g.rect(16, 6, 2, 8).fill(DB32.dimGray);
      g.rect(-28, -2, 58, 2).fill(DB32.dimGray);
      // The hare, stretched out in its leap.
      g.rect(-24, -14, 22, 8).fill(DB32.tahitiGold);
      g.rect(-24, -14, 22, 2).fill(DB32.twine);
      g.rect(-2, -18, 8, 8).fill(DB32.tahitiGold);
      g.rect(1, -30, 3, 12).fill(DB32.tahitiGold);
      g.rect(5, -28, 2, 10).fill(DB32.rope);
      g.rect(-30, -8, 8, 3).fill(DB32.tahitiGold);
      g.rect(-6, -6, 8, 3).fill(DB32.tahitiGold);
      g.rect(-28, -16, 4, 4).fill(DB32.pancho);
      g.rect(3, -15, 2, 2).fill(DB32.valhalla);
      g.rect(-16, -10, 4, 2).fill(DB32.eltGreen);
      g.rect(-8, -12, 2, 2).fill(DB32.eltGreen);
      // The moon, always that hand ahead.
      disc(g, { x: 22, y: -20 }, 7, DB32.tahitiGold);
      disc(g, { x: 25, y: -22 }, 5, DB32.rope);
      g.rect(17, -24, 2, 2).fill(DB32.twine);
    },
  },
  // 18) The Rain Gauge — on the parapet of the east wing's flat roof.
  {
    id: 'rain-gauge',
    ...at(204, 15),
    name: 'The Rain Gauge',
    description: 'Full to the brim, though the sky is clear and has been for weeks.',
    drawBody(g) {
      g.rect(-1, -9, 2, 9).fill(DB32.rope);
      g.rect(-3, -1, 6, 1).fill(DB32.oiledCedar);
      g.rect(-2, -20, 4, 11).fill(DB32.lightSteel);
      g.rect(-1, -19, 2, 10).fill(DB32.cornflower);
      g.rect(-1, -19, 2, 1).fill(DB32.viking);
      for (const y of [-17, -14, -11]) g.rect(-2, y, 1, 1).fill(DB32.valhalla);
      g.rect(-4, -21, 8, 1).fill(DB32.heather);
      g.rect(-3, -22, 6, 1).fill(DB32.heather);
    },
    drawSketch(g) {
      g.rect(-3, 10, 6, 20).fill(DB32.rope);
      g.rect(-12, 28, 24, 2).fill(DB32.oiledCedar);
      g.rect(-9, -24, 18, 34).fill(DB32.lightSteel);
      g.rect(-6, -22, 12, 30).fill(DB32.cornflower);
      g.rect(-6, -22, 12, 2).fill(DB32.viking);
      g.rect(-5, -18, 2, 22).fill(DB32.royalBlue);
      for (let y = -18; y <= 6; y += 6) g.rect(-9, y, 4, 1).fill(DB32.valhalla);
      g.rect(-16, -28, 32, 3).fill(DB32.heather);
      g.rect(-12, -25, 24, 2).fill(DB32.heather);
      // Full to the lip, and not a cloud in it.
      g.rect(-1, -31, 2, 2).fill(DB32.viking);
      disc(g, { x: 22, y: -22 }, 4, DB32.goldenFizz);
    },
  },
  // 100) The Pigeons' Board — in the pigeon loft, on the roof walk.
  {
    id: 'pigeons-board',
    ...at(178, 20),
    name: "The Pigeons' Board",
    description:
      "Every pigeon's name in chalk, and a tick beside each one for coming home. One name has no tick yet, " +
      'and the chalk beside it is new.',
    drawBody(g) {
      g.rect(-9, -8, 1, 8).fill(DB32.rope);
      g.rect(8, -8, 1, 8).fill(DB32.rope);
      g.rect(-10, -24, 20, 16).fill(DB32.rope);
      g.rect(-9, -23, 18, 14).fill(DB32.valhalla);
      for (const [y, w] of [
        [-21, 7],
        [-18, 9],
        [-15, 6],
      ] as const) {
        g.rect(-7, y, w, 1).fill(DB32.heather);
        g.rect(5, y, 1, 1).fill(DB32.heather);
        g.rect(6, y - 1, 1, 1).fill(DB32.heather);
      }
      // The last name, freshly chalked, and no tick.
      g.rect(-7, -12, 8, 1).fill(DB32.white);
      g.rect(-2, -25, 4, 1).fill(DB32.white);
    },
    drawSketch(g) {
      g.rect(-30, -28, 60, 50).fill(DB32.rope);
      g.rect(-27, -25, 54, 44).fill(DB32.valhalla);
      g.rect(-24, 22, 3, 8).fill(DB32.rope);
      g.rect(21, 22, 3, 8).fill(DB32.rope);
      for (const [y, w] of [
        [-20, 22],
        [-12, 28],
        [-4, 18],
        [4, 24],
      ] as const) {
        g.rect(-22, y, w, 2).fill(DB32.heather);
        g.rect(14, y, 2, 2).fill(DB32.heather);
        g.rect(16, y + 2, 2, 2).fill(DB32.heather);
        g.rect(18, y - 2, 2, 4).fill(DB32.heather);
        g.rect(20, y - 4, 2, 2).fill(DB32.heather);
      }
      g.rect(-22, 12, 26, 2).fill(DB32.white);
      g.rect(14, 12, 6, 1).fill(DB32.topaz);
    },
  },

  // ---------------------------------------------------------------- the east wing

  // 21) The Unfinished Painting — on its easel in the studio.
  {
    id: 'unfinished-painting',
    ...at(140, 29),
    name: 'The Unfinished Painting',
    description:
      'The house from the garden: seven tiles of shed, a window with a pot in it. The painter has started on ' +
      'a second window, much too big, and stopped.',
    drawBody(g) {
      g.rect(-7, -12, 1, 12).fill(DB32.rope);
      g.rect(6, -12, 1, 12).fill(DB32.rope);
      g.rect(0, -28, 1, 28).fill(DB32.oiledCedar);
      g.rect(-9, -13, 18, 1).fill(DB32.oiledCedar);
      g.rect(-8, -27, 16, 14).fill(DB32.pancho);
      g.rect(-8, -16, 16, 3).fill(DB32.dell);
      // The shed, its window, its pot.
      g.rect(-6, -22, 6, 6).fill(DB32.rope);
      g.rect(-7, -23, 8, 1).fill(DB32.oiledCedar);
      g.rect(-4, -21, 2, 2).fill(DB32.twine);
      g.rect(-4, -20, 1, 1).fill(DB32.tahitiGold);
      // The second window, two strokes of it.
      g.rect(2, -25, 5, 1).fill(DB32.valhalla);
      g.rect(2, -25, 1, 6).fill(DB32.valhalla);
    },
    drawSketch(g) {
      g.rect(-28, -26, 56, 44).fill(DB32.oiledCedar);
      g.rect(-25, -23, 50, 38).fill(DB32.pancho);
      g.rect(-25, 5, 50, 10).fill(DB32.dell);
      g.rect(-25, 5, 50, 2).fill(DB32.christi);
      g.rect(-19, -9, 16, 14).fill(DB32.rope);
      g.rect(-21, -11, 20, 3).fill(DB32.oiledCedar);
      g.rect(-15, -5, 6, 6).fill(DB32.twine);
      g.rect(-13, -2, 3, 3).fill(DB32.tahitiGold);
      g.rect(-12, -4, 1, 2).fill(DB32.dell);
      g.rect(2, -18, 20, 2).fill(DB32.valhalla);
      g.rect(2, -18, 2, 16).fill(DB32.valhalla);
      g.rect(12, -18, 1, 6).fill(DB32.valhalla);
      // The brush, laid down across the frame.
      g.rect(10, 20, 18, 2).fill(DB32.rope);
      g.rect(6, 19, 4, 4).fill(DB32.valhalla);
      g.rect(-28, 18, 56, 3).fill(DB32.oiledCedar);
    },
  },
  // 23) The Clawfoot Bath — in the bathroom, under the towel shelf.
  {
    id: 'clawfoot-bath',
    ...at(149, 38),
    name: 'The Clawfoot Bath',
    description: 'Run, and still warm. A rubber duck floats in it, facing the door.',
    drawBody(g) {
      g.rect(-8, -2, 2, 2).fill(DB32.twine);
      g.rect(6, -2, 2, 2).fill(DB32.twine);
      g.rect(-9, -9, 18, 7).fill(DB32.white);
      g.rect(-9, -3, 18, 1).fill(DB32.lightSteel);
      g.rect(-10, -10, 20, 1).fill(DB32.lightSteel);
      g.rect(-8, -9, 16, 1).fill(DB32.cornflower);
      g.rect(-3, -11, 3, 2).fill(DB32.goldenFizz);
      g.rect(-4, -11, 1, 1).fill(DB32.tahitiGold);
      g.rect(-2, -12, 2, 1).fill(DB32.goldenFizz);
      g.rect(-2, -12, 1, 1).fill(DB32.valhalla);
      g.rect(5, -14, 1, 2).fill(DB32.lightSteel);
      g.rect(7, -16, 1, 2).fill(DB32.lightSteel);
    },
    drawSketch(g) {
      for (const x of [-22, 18]) {
        g.rect(x, 16, 4, 6).fill(DB32.twine);
        g.rect(x - 1, 20, 6, 2).fill(DB32.rope);
      }
      g.rect(-26, -4, 52, 22).fill(DB32.white);
      g.rect(-26, 14, 52, 4).fill(DB32.lightSteel);
      g.rect(-28, -6, 56, 3).fill(DB32.lightSteel);
      g.rect(-24, -3, 48, 4).fill(DB32.cornflower);
      g.rect(-24, -3, 48, 1).fill(DB32.viking);
      // The duck, turned to the door.
      g.rect(-10, -10, 10, 7).fill(DB32.goldenFizz);
      g.rect(-12, -16, 6, 6).fill(DB32.goldenFizz);
      g.rect(-15, -13, 3, 2).fill(DB32.tahitiGold);
      g.rect(-10, -15, 1, 1).fill(DB32.valhalla);
      for (const [x, y] of [
        [12, -14],
        [16, -22],
        [10, -28],
      ] as const) {
        g.rect(x, y, 2, 5).fill(DB32.lightSteel);
      }
    },
  },
  // 25) The Paper Boats — on the loft floor, in a fleet.
  {
    id: 'paper-boats',
    ...at(196, 29),
    name: 'The Paper Boats',
    description: 'A fleet of them, folded from seed-catalogue pages, waiting for the tank to overflow.',
    drawBody(g) {
      for (const [x, tall] of [
        [-9, 4],
        [-2, 5],
        [5, 4],
      ] as const) {
        g.rect(x - 2, -2, 6, 2).fill(DB32.pancho);
        g.rect(x - 1, -1, 4, 1).fill(DB32.twine);
        g.rect(x, -2 - tall, 2, tall).fill(DB32.pancho);
        g.rect(x + 1, -2 - tall, 1, tall).fill(DB32.white);
      }
      g.rect(-2, -5, 1, 1).fill(DB32.dell);
    },
    drawSketch(g) {
      for (const [x, y] of [
        [-16, -14],
        [12, -10],
        [-6, 12],
        [20, 16],
      ] as const) {
        g.rect(x - 10, y, 20, 3).fill(DB32.pancho);
        g.rect(x - 8, y + 3, 16, 3).fill(DB32.twine);
        g.rect(x - 2, y - 12, 4, 12).fill(DB32.pancho);
        g.rect(x, y - 12, 2, 12).fill(DB32.white);
        g.rect(x - 6, y - 6, 4, 6).fill(DB32.pancho);
        g.rect(x + 2, y - 6, 4, 6).fill(DB32.white);
      }
      // A bean, drawn and named on the hull of one.
      g.rect(-10, 15, 3, 2).fill(DB32.dell);
      g.rect(-6, 16, 6, 1).fill(DB32.topaz);
      g.rect(-28, 28, 56, 1).fill(DB32.cornflower);
    },
  },
  // 28) The Orrery — its model on a pedestal, under the great turning arms.
  {
    id: 'orrery',
    ...at(229, 38),
    name: 'The Orrery',
    description: 'Brass planets around a brass sun. One small planet has a tiny house on it, and a tinier shed.',
    drawBody(g) {
      g.rect(-5, -2, 10, 2).fill(DB32.oiledCedar);
      g.rect(-1, -14, 2, 12).fill(DB32.rainforest);
      disc(g, { x: 0, y: -18 }, 3, DB32.goldenFizz);
      g.rect(-1, -19, 1, 1).fill(DB32.white);
      g.rect(-11, -18, 22, 1).fill(DB32.rainforest);
      g.rect(0, -27, 1, 18).fill(DB32.rainforest);
      disc(g, { x: -11, y: -18 }, 1, DB32.tahitiGold);
      disc(g, { x: 11, y: -18 }, 2, DB32.twine);
      disc(g, { x: 0, y: -27 }, 1, DB32.rope);
      // The small planet, with its house.
      disc(g, { x: 0, y: -9 }, 2, DB32.christi);
      g.rect(-1, -13, 2, 2).fill(DB32.pancho);
    },
    drawSketch(g) {
      for (let a = 0; a < 24; a++) {
        const t = (a / 24) * Math.PI * 2;
        g.rect(Math.round(Math.cos(t) * 26), Math.round(Math.sin(t) * 26), 1, 1).fill(DB32.rainforest);
        if (a % 2 === 0) {
          g.rect(Math.round(Math.cos(t) * 15), Math.round(Math.sin(t) * 15), 1, 1).fill(DB32.rainforest);
        }
      }
      disc(g, { x: 0, y: 0 }, 7, DB32.goldenFizz);
      disc(g, { x: -2, y: -2 }, 2, DB32.white);
      g.rect(-26, -1, 52, 2).fill(DB32.rainforest);
      disc(g, { x: -15, y: 0 }, 3, DB32.tahitiGold);
      disc(g, { x: 26, y: 0 }, 4, DB32.twine);
      g.rect(-1, -26, 2, 26).fill(DB32.rainforest);
      disc(g, { x: 0, y: -26 }, 3, DB32.rope);
      // The small planet, a house on it and a tinier shed beside.
      g.rect(-1, 0, 2, 18).fill(DB32.rainforest);
      disc(g, { x: 0, y: 21 }, 5, DB32.christi);
      g.rect(-4, 12, 5, 4).fill(DB32.pancho);
      g.rect(-5, 11, 7, 1).fill(DB32.clairvoyant);
      g.rect(3, 14, 2, 2).fill(DB32.rope);
    },
  },
  // 33) The Tin Soldiers' Fort — on the nursery shelf, by the window.
  {
    id: 'tin-soldiers-fort',
    ...at(152, 43),
    name: "The Tin Soldiers' Fort",
    description: 'Every soldier faces outward, on guard. One has turned round to watch the window.',
    drawBody(g) {
      g.rect(-9, -7, 18, 7).fill(DB32.topaz);
      g.rect(-9, -7, 18, 1).fill(DB32.heather);
      for (const x of [-9, -5, -1, 3, 7]) g.rect(x, -9, 2, 2).fill(DB32.topaz);
      g.rect(-2, -4, 4, 4).fill(DB32.valhalla);
      // The soldiers on the wall: faces out on either side, and one turned.
      for (const [x, face] of [
        [-8, -1],
        [-4, -1],
        [4, 1],
        [8, 1],
      ] as const) {
        g.rect(x, -12, 1, 3).fill(DB32.clairvoyant);
        g.rect(x, -13, 1, 1).fill(DB32.valhalla);
        g.rect(x + face, -12, 1, 1).fill(DB32.pancho);
      }
      g.rect(0, -12, 1, 3).fill(DB32.venice);
      g.rect(0, -13, 1, 1).fill(DB32.valhalla);
      g.rect(1, -12, 1, 1).fill(DB32.pancho);
    },
    drawSketch(g) {
      g.rect(-30, -4, 60, 30).fill(DB32.topaz);
      g.rect(-30, -4, 60, 3).fill(DB32.heather);
      for (let x = -30; x < 30; x += 12) g.rect(x, -10, 6, 6).fill(DB32.topaz);
      g.rect(-6, 10, 12, 16).fill(DB32.valhalla);
      for (const [x, face] of [
        [-24, -1],
        [-14, -1],
        [10, 1],
        [20, 1],
      ] as const) {
        g.rect(x, -24, 4, 14).fill(DB32.clairvoyant);
        g.rect(x, -28, 4, 4).fill(DB32.pancho);
        g.rect(x, -30, 4, 2).fill(DB32.valhalla);
        g.rect(face < 0 ? x - 2 : x + 4, -26, 2, 1).fill(DB32.pancho);
        g.rect(face < 0 ? x : x + 3, -26, 1, 1).fill(DB32.valhalla);
      }
      // The one who turned, his back to us, looking at the window.
      g.rect(-2, -24, 4, 14).fill(DB32.venice);
      g.rect(-2, -28, 4, 4).fill(DB32.oiledCedar);
      g.rect(-2, -30, 4, 2).fill(DB32.valhalla);
    },
  },
  // 34) The Dollhouse — in the dollhouse room, under the high shelf.
  {
    id: 'dollhouse',
    ...at(182, 56),
    name: 'The Dollhouse',
    description: 'Four storeys of tiny rooms, each one exactly like a room in this house, down to the jars.',
    drawBody(g) {
      g.rect(-10, -24, 20, 24).fill(DB32.oiledCedar);
      for (let s = 0; s < 4; s++) {
        const y = -23 + s * 6;
        g.rect(-9, y, 8, 5).fill(s % 2 === 0 ? DB32.dell : DB32.loulou);
        g.rect(1, y, 8, 5).fill(s % 2 === 0 ? DB32.loulou : DB32.dell);
      }
      // A jar shelf, a clock, a bath, a bed: rooms you have been in.
      for (const x of [-8, -6, -4]) g.rect(x, -14, 1, 2).fill(DB32.viking);
      g.rect(5, -22, 2, 4).fill(DB32.rope);
      g.rect(5, -21, 1, 1).fill(DB32.pancho);
      g.rect(-7, -3, 4, 2).fill(DB32.white);
      g.rect(3, -9, 5, 2).fill(DB32.twine);
      g.rect(-12, -29, 24, 1).fill(DB32.clairvoyant);
      g.rect(-9, -28, 18, 1).fill(DB32.clairvoyant);
      g.rect(-6, -27, 12, 2).fill(DB32.clairvoyant);
      g.rect(-11, -25, 22, 1).fill(DB32.rope);
    },
    drawSketch(g) {
      g.rect(-26, -20, 52, 48).fill(DB32.oiledCedar);
      for (let s = 0; s < 4; s++) {
        const y = -18 + s * 12;
        g.rect(-24, y, 23, 10).fill(s % 2 === 0 ? DB32.dell : DB32.loulou);
        g.rect(1, y, 23, 10).fill(s % 2 === 0 ? DB32.loulou : DB32.dell);
      }
      for (const x of [-21, -17, -13, -9]) {
        g.rect(x, -1, 2, 4).fill(DB32.viking);
        g.rect(x, -2, 2, 1).fill(DB32.rope);
      }
      g.rect(-22, 3, 16, 1).fill(DB32.rope);
      g.rect(10, -18, 6, 10).fill(DB32.rope);
      disc(g, { x: 13, y: -15 }, 2, DB32.pancho);
      g.rect(-20, 20, 12, 5).fill(DB32.white);
      g.rect(6, 8, 14, 4).fill(DB32.twine);
      g.rect(6, 7, 3, 2).fill(DB32.white);
      // The roof, and the tiny shed waiting in the top room.
      for (let i = 0; i < 10; i++) g.rect(-28 + i * 3, -21 - i, 56 - i * 6, 1).fill(DB32.clairvoyant);
      g.rect(-28, -21, 56, 1).fill(DB32.rope);
    },
  },
  // 35) The Tiny Shed — in the top room of the dollhouse's shelf.
  {
    id: 'tiny-shed',
    ...at(190, 44),
    name: 'The Tiny Shed',
    description:
      'A model of the potting shed, the size of a matchbox. The door is open a crack, and there is light inside.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -3, radius: 5, color: DB32.goldenFizz });
      g.rect(-3, -5, 6, 5).fill(DB32.rope);
      g.rect(-4, -6, 8, 1).fill(DB32.oiledCedar);
      g.rect(-3, -7, 6, 1).fill(DB32.oiledCedar);
      g.rect(0, -4, 1, 4).fill(DB32.goldenFizz);
      g.rect(-2, -4, 1, 1).fill(DB32.twine);
    },
    drawSketch(g) {
      drawGlow(g, { x: 4, y: 8, radius: 26, color: DB32.goldenFizz });
      g.rect(-22, -8, 44, 32).fill(DB32.rope);
      for (let i = 0; i < 8; i++) g.rect(-26 + i * 3, -9 - i * 2, 52 - i * 6, 2).fill(DB32.oiledCedar);
      g.rect(-16, -2, 10, 10).fill(DB32.twine);
      g.rect(-16, 3, 10, 1).fill(DB32.oiledCedar);
      g.rect(-12, 4, 4, 4).fill(DB32.tahitiGold);
      // The door, ajar, and the light in the crack.
      g.rect(2, 0, 14, 24).fill(DB32.oiledCedar);
      g.rect(2, 0, 3, 24).fill(DB32.goldenFizz);
      g.rect(3, 4, 1, 16).fill(DB32.white);
      g.rect(12, 12, 2, 2).fill(DB32.goldenFizz);
      g.rect(-26, 24, 52, 2).fill(DB32.oiledCedar);
    },
  },
  // 38) The Music Box — in the alcove behind the velvet curtain.
  {
    id: 'music-box',
    ...at(247, 47),
    name: 'The Music Box',
    description:
      'It plays three notes and stops, the same three you just played, as if it had been waiting to hear them.',
    drawBody(g) {
      g.rect(-6, -6, 12, 6).fill(DB32.oiledCedar);
      g.rect(-6, -6, 12, 1).fill(DB32.rope);
      g.rect(-5, -13, 10, 7).fill(DB32.oiledCedar);
      g.rect(-4, -12, 8, 5).fill(DB32.clairvoyant);
      g.rect(-4, -5, 6, 2).fill(DB32.goldenFizz);
      for (const x of [-3, -1, 1]) g.rect(x, -5, 1, 1).fill(DB32.rainforest);
      g.rect(3, -5, 2, 2).fill(DB32.heather);
      // Three notes, rising.
      g.rect(-6, -17, 1, 3).fill(DB32.valhalla);
      g.rect(-7, -15, 1, 1).fill(DB32.valhalla);
      g.rect(-1, -19, 1, 3).fill(DB32.valhalla);
      g.rect(-2, -17, 1, 1).fill(DB32.valhalla);
      g.rect(4, -21, 1, 3).fill(DB32.valhalla);
      g.rect(3, -19, 1, 1).fill(DB32.valhalla);
    },
    drawSketch(g) {
      g.rect(-26, 4, 52, 22).fill(DB32.oiledCedar);
      g.rect(-26, 4, 52, 3).fill(DB32.rope);
      g.rect(-24, -16, 48, 20).fill(DB32.oiledCedar);
      g.rect(-21, -13, 42, 14).fill(DB32.clairvoyant);
      spiral(g, { x: 0, y: -6 }, 2);
      g.rect(-20, 10, 28, 8).fill(DB32.goldenFizz);
      for (let x = -18; x < 8; x += 4) g.rect(x, 12, 1, 2).fill(DB32.rainforest);
      for (let x = 10; x < 22; x += 2) g.rect(x, 10, 1, 10).fill(DB32.heather);
      for (const [x, y] of [
        [-20, -22],
        [-2, -25],
        [16, -28],
      ] as const) {
        disc(g, { x, y }, 2, DB32.valhalla);
        g.rect(x + 2, y - 6, 1, 6).fill(DB32.valhalla);
      }
    },
  },
  // 41) The Family Portrait — leaning against the Long Gallery's wall.
  {
    id: 'family-portrait',
    ...at(146, 56),
    name: 'The Family Portrait',
    description: 'Everyone in it has their back to the painter. They are all looking at a small shed.',
    drawBody(g) {
      g.rect(-11, -24, 22, 24).fill(DB32.tahitiGold);
      g.rect(-11, -24, 22, 1).fill(DB32.goldenFizz);
      g.rect(-9, -22, 18, 20).fill(DB32.deepKoamaru);
      g.rect(-9, -9, 18, 7).fill(DB32.dell);
      g.rect(-1, -12, 3, 3).fill(DB32.rope);
      g.rect(-2, -13, 5, 1).fill(DB32.oiledCedar);
      // Five backs, tallest to smallest.
      for (const [x, top] of [
        [-8, -12],
        [-5, -14],
        [3, -13],
        [6, -10],
        [-3, -8],
      ] as const) {
        g.rect(x, top + 2, 3, -top - 4).fill(DB32.valhalla);
        g.rect(x, top, 3, 2).fill(DB32.oiledCedar);
      }
    },
    drawSketch(g) {
      g.rect(-30, -30, 60, 60).fill(DB32.tahitiGold);
      g.rect(-30, -30, 60, 2).fill(DB32.goldenFizz);
      g.rect(-26, -26, 52, 52).fill(DB32.deepKoamaru);
      g.rect(-26, 0, 52, 26).fill(DB32.dell);
      g.rect(-26, 0, 52, 2).fill(DB32.christi);
      g.rect(-3, -8, 7, 8).fill(DB32.rope);
      g.rect(-5, -10, 11, 2).fill(DB32.oiledCedar);
      g.rect(0, -5, 2, 2).fill(DB32.goldenFizz);
      for (const [x, top, w] of [
        [-24, -6, 9],
        [-14, -12, 9],
        [-4, 6, 7],
        [6, -10, 9],
        [16, 0, 7],
      ] as const) {
        g.rect(x, top + 6, w, 26 - top - 6).fill(DB32.valhalla);
        g.rect(x + 1, top, w - 2, 6).fill(DB32.oiledCedar);
      }
    },
  },
  // 43) The Stopped Clocks — along the Room of Clocks' floor, under the shelf.
  {
    id: 'stopped-clocks',
    ...at(244, 56),
    name: 'The Stopped Clocks',
    description:
      'Dozens of clocks, every one stopped at the same minute. The Grandfather Clock downstairs is still going.',
    drawBody(g) {
      // A short longcase, cut from the Grandfather Clock's cloth.
      g.rect(-12, -26, 8, 26).fill(DB32.oiledCedar);
      g.rect(-12, -26, 1, 26).fill(DB32.rope);
      stoppedDial(g, { x: -8, y: -21 }, 3);
      g.rect(-9, -14, 2, 9).fill(DB32.valhalla);
      g.rect(-9, -7, 2, 2).fill(DB32.rainforest);
      // A mantel clock and a carriage clock, stopped the same.
      g.rect(-2, -10, 9, 10).fill(DB32.rope);
      g.rect(-1, -12, 7, 2).fill(DB32.rope);
      stoppedDial(g, { x: 2, y: -6 }, 3);
      g.rect(8, -6, 5, 6).fill(DB32.rainforest);
      g.rect(9, -5, 3, 3).fill(DB32.pancho);
      g.rect(10, -5, 1, 2).fill(DB32.valhalla);
      g.rect(9, -8, 3, 2).fill(DB32.rainforest);
    },
    drawSketch(g) {
      g.rect(-30, -30, 18, 60).fill(DB32.oiledCedar);
      g.rect(-30, -30, 2, 60).fill(DB32.rope);
      stoppedDial(g, { x: -21, y: -19 }, 7);
      g.rect(-24, -6, 6, 26).fill(DB32.valhalla);
      disc(g, { x: -21, y: 16 }, 2, DB32.rainforest);
      g.rect(-8, 2, 22, 28).fill(DB32.rope);
      g.rect(-6, -2, 18, 4).fill(DB32.rope);
      stoppedDial(g, { x: 3, y: 14 }, 8);
      g.rect(18, 12, 12, 18).fill(DB32.rainforest);
      g.rect(20, 8, 8, 4).fill(DB32.rainforest);
      stoppedDial(g, { x: 24, y: 20 }, 4);
      // Small dials hung above, every one at the same minute.
      for (const [x, y] of [
        [-2, -22],
        [16, -12],
        [22, -26],
      ] as const) {
        disc(g, { x, y }, 6, DB32.rope);
        stoppedDial(g, { x, y }, 4);
      }
    },
  },
  // 49) The Door That Opens on a Wall — the corridor's eighth door, at its
  // far end. Drawn as the door's frame standing open on the bricks; the
  // Door entity at the same column is the one that knocks.
  {
    id: 'door-that-opens-on-a-wall',
    ...at(240, 65),
    name: 'The Door That Opens on a Wall',
    description: "Bricks, neatly laid, right behind the door. Someone has written on them in chalk: 'not yet'.",
    drawBody(g) {
      g.rect(-7, -28, 14, 28).fill(DB32.oiledCedar);
      g.rect(-6, -27, 12, 27).fill(DB32.clairvoyant);
      for (let y = -27; y < 0; y += 3) {
        g.rect(-6, y, 12, 1).fill(DB32.loulou);
        for (let x = -6 + ((y / 3) & 1) * 2; x < 6; x += 4) g.rect(x, y + 1, 1, 2).fill(DB32.loulou);
      }
      g.rect(-4, -16, 3, 1).fill(DB32.lightSteel);
      g.rect(0, -17, 4, 1).fill(DB32.lightSteel);
      // The door itself, swung wide against the corridor.
      g.rect(7, -28, 3, 28).fill(DB32.rope);
      g.rect(8, -15, 1, 2).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      g.rect(-24, -32, 40, 64).fill(DB32.oiledCedar);
      g.rect(-20, -28, 32, 60).fill(DB32.clairvoyant);
      for (let y = -28; y < 32; y += 6) {
        g.rect(-20, y, 32, 1).fill(DB32.loulou);
        for (let x = -20 + ((y / 6) & 1) * 5; x < 12; x += 10) g.rect(x, y + 1, 1, 5).fill(DB32.loulou);
      }
      // 'not yet', in a chalk hand.
      g.rect(-16, -4, 2, 6).fill(DB32.lightSteel);
      g.rect(-14, -4, 3, 1).fill(DB32.lightSteel);
      g.rect(-11, -4, 1, 6).fill(DB32.lightSteel);
      g.rect(-8, -2, 4, 4).fill(DB32.lightSteel);
      g.rect(-7, -1, 2, 2).fill(DB32.clairvoyant);
      g.rect(-2, -6, 1, 8).fill(DB32.lightSteel);
      g.rect(-3, -4, 3, 1).fill(DB32.lightSteel);
      g.rect(-12, 6, 1, 4).fill(DB32.lightSteel);
      g.rect(-10, 6, 1, 8).fill(DB32.lightSteel);
      g.rect(-12, 9, 3, 1).fill(DB32.lightSteel);
      g.rect(-6, 6, 4, 4).fill(DB32.lightSteel);
      g.rect(-5, 7, 3, 1).fill(DB32.clairvoyant);
      g.rect(2, 4, 1, 8).fill(DB32.lightSteel);
      g.rect(1, 6, 3, 1).fill(DB32.lightSteel);
      g.rect(16, -30, 10, 62).fill(DB32.rope);
      g.rect(18, -2, 3, 4).fill(DB32.goldenFizz);
    },
  },
  // 52) The Overflowing Sink — at the scullery basin. The marker (col 133)
  // sits on the basin's water; the tap stands on its west rim (col 130),
  // reaching out over it.
  {
    id: 'overflowing-sink',
    ...at(130, 71),
    name: 'The Overflowing Sink',
    description: 'The tap drips into a sink that is always just full and never spills.',
    drawBody(g) {
      g.rect(-1, -14, 2, 14).fill(DB32.heather);
      g.rect(-1, -14, 1, 14).fill(DB32.lightSteel);
      g.rect(-1, -16, 12, 2).fill(DB32.heather);
      g.rect(-1, -16, 12, 1).fill(DB32.lightSteel);
      g.rect(9, -14, 2, 2).fill(DB32.heather);
      g.rect(-3, -18, 6, 2).fill(DB32.clairvoyant);
      g.rect(9, -10, 1, 2).fill(DB32.viking);
      g.rect(9, -5, 1, 1).fill(DB32.viking);
      g.rect(6, -1, 7, 1).fill(DB32.viking);
    },
    drawSketch(g) {
      g.rect(-30, 4, 60, 22).fill(DB32.heather);
      g.rect(-30, 4, 60, 2).fill(DB32.lightSteel);
      g.rect(-26, 6, 52, 16).fill(DB32.white);
      g.rect(-26, 6, 52, 2).fill(DB32.cornflower);
      g.rect(-26, 7, 52, 1).fill(DB32.viking);
      g.rect(-22, -28, 4, 34).fill(DB32.heather);
      g.rect(-22, -28, 26, 4).fill(DB32.heather);
      g.rect(-22, -28, 26, 1).fill(DB32.lightSteel);
      g.rect(0, -24, 4, 4).fill(DB32.heather);
      g.rect(-26, -32, 12, 4).fill(DB32.clairvoyant);
      // One drop on its way, one ring where the last one went.
      g.rect(1, -14, 2, 4).fill(DB32.viking);
      g.rect(1, -4, 2, 2).fill(DB32.viking);
      g.rect(-6, 5, 16, 1).fill(DB32.viking);
    },
  },
  // 54) The Half-Made Chair — on the workshop bench.
  {
    id: 'half-made-chair',
    ...at(181, 71),
    name: 'The Half-Made Chair',
    description: 'Three legs and a seat. The fourth leg is on the bench, carved, waiting.',
    drawBody(g) {
      g.rect(-6, -6, 1, 6).fill(DB32.rope);
      g.rect(-2, -6, 1, 6).fill(DB32.rope);
      g.rect(-7, -7, 7, 1).fill(DB32.twine);
      g.rect(-6, -15, 1, 8).fill(DB32.rope);
      g.rect(-2, -15, 1, 8).fill(DB32.rope);
      g.rect(-6, -13, 5, 1).fill(DB32.rope);
      g.rect(-6, -10, 5, 1).fill(DB32.rope);
      // The fourth leg, lying by.
      g.rect(2, -1, 6, 1).fill(DB32.twine);
      g.rect(3, -2, 1, 1).fill(DB32.rope);
      g.rect(6, -2, 1, 1).fill(DB32.rope);
      g.rect(8, -2, 2, 2).fill(DB32.heather);
    },
    drawSketch(g) {
      g.rect(-24, -2, 3, 26).fill(DB32.rope);
      g.rect(-6, -2, 3, 26).fill(DB32.rope);
      g.rect(-14, -2, 3, 20).fill(DB32.oiledCedar);
      g.rect(-28, -6, 30, 5).fill(DB32.twine);
      g.rect(-28, -6, 30, 1).fill(DB32.pancho);
      g.rect(-24, -32, 3, 26).fill(DB32.rope);
      g.rect(-6, -32, 3, 26).fill(DB32.rope);
      for (const y of [-28, -20, -12]) g.rect(-24, y, 21, 2).fill(DB32.rope);
      // The fourth leg on the bench, its turnings done.
      g.rect(6, 20, 24, 4).fill(DB32.twine);
      for (const x of [9, 15, 21]) g.rect(x, 19, 2, 6).fill(DB32.rope);
      g.rect(4, 26, 28, 3).fill(DB32.oiledCedar);
      g.rect(18, 12, 10, 2).fill(DB32.heather);
      g.rect(14, 11, 4, 4).fill(DB32.rope);
    },
  },
  // 56) The Front Door — at the back of the Front Hall.
  {
    id: 'front-door',
    ...at(232, 74),
    name: 'The Front Door',
    description:
      "The house's grand front door, with knocker and letterbox. Open it, and there is only brick. This house " +
      "has never had a front door: only the shed's.",
    drawBody(g) {
      g.rect(-11, -36, 22, 36).fill(DB32.topaz);
      g.rect(-11, -36, 22, 1).fill(DB32.heather);
      for (let i = 0; i < 4; i++) g.rect(-9 + i * 2, -40 + i, 18 - i * 4, 1).fill(DB32.topaz);
      g.rect(-8, -32, 16, 32).fill(DB32.oiledCedar);
      g.rect(-8, -32, 16, 1).fill(DB32.rope);
      g.rect(0, -32, 1, 32).fill(DB32.loulou);
      for (const [x, y] of [
        [-6, -29],
        [2, -29],
        [-6, -14],
        [2, -14],
      ] as const) {
        g.rect(x, y, 4, 10).fill(DB32.rope);
      }
      disc(g, { x: 0, y: -21 }, 2, DB32.goldenFizz);
      g.rect(0, -21, 1, 1).fill(DB32.oiledCedar);
      g.rect(-3, -9, 6, 1).fill(DB32.goldenFizz);
      g.rect(-10, -1, 20, 1).fill(DB32.heather);
    },
    drawSketch(g) {
      g.rect(-28, -26, 56, 58).fill(DB32.topaz);
      for (let i = 0; i < 6; i++) g.rect(-24 + i * 4, -27 - i, 48 - i * 8, 1).fill(DB32.topaz);
      g.rect(-20, -22, 40, 54).fill(DB32.oiledCedar);
      g.rect(-20, -22, 40, 2).fill(DB32.rope);
      g.rect(-1, -22, 2, 54).fill(DB32.loulou);
      for (const [x, y] of [
        [-16, -16],
        [4, -16],
        [-16, 12],
        [4, 12],
      ] as const) {
        g.rect(x, y, 12, 16).fill(DB32.rope);
      }
      disc(g, { x: 0, y: -2 }, 5, DB32.goldenFizz);
      disc(g, { x: 0, y: -2 }, 3, DB32.oiledCedar);
      g.rect(-1, -10, 2, 4).fill(DB32.goldenFizz);
      g.rect(-8, 6, 16, 3).fill(DB32.goldenFizz);
      g.rect(-7, 7, 14, 1).fill(DB32.valhalla);
    },
  },
  // 59) The Furnace — on the furnace room's hearth, under the floor above.
  {
    id: 'furnace',
    ...at(188, 77),
    name: 'The Furnace',
    description: 'It roars and gives off a gentle heat. Nobody feeds it. On its door, in iron, the spiral.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -4, radius: 14, color: DB32.tahitiGold });
      g.rect(-11, -22, 22, 22).fill(DB32.dimGray);
      g.rect(-11, -22, 22, 1).fill(DB32.heather);
      g.rect(-3, -30, 6, 8).fill(DB32.dimGray);
      g.rect(-3, -30, 1, 8).fill(DB32.heather);
      g.rect(-8, -19, 16, 14).fill(DB32.opal);
      spiral(g, { x: 0, y: -12 }, 2);
      g.rect(-8, -4, 16, 3).fill(DB32.brown);
      for (const x of [-7, -3, 1, 5]) g.rect(x, -4, 2, 1).fill(DB32.tahitiGold);
      g.rect(-2, -3, 3, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 16, radius: 34, color: DB32.tahitiGold });
      g.rect(-28, -22, 56, 52).fill(DB32.dimGray);
      g.rect(-28, -22, 56, 2).fill(DB32.heather);
      g.rect(-8, -34, 16, 12).fill(DB32.dimGray);
      g.rect(-8, -34, 2, 12).fill(DB32.heather);
      g.rect(-20, -16, 40, 30).fill(DB32.opal);
      g.rect(-20, -16, 40, 2).fill(DB32.topaz);
      spiral(g, { x: 0, y: -1 }, 4);
      g.rect(16, -4, 4, 6).fill(DB32.heather);
      g.rect(-20, 18, 40, 8).fill(DB32.brown);
      for (let x = -18; x < 20; x += 6) g.rect(x, 18, 3, 3).fill(DB32.tahitiGold);
      g.rect(-6, 20, 10, 3).fill(DB32.goldenFizz);
    },
  },

  // ---------------------------------------------------------------- the clock tower

  // 62) The Clock Face — the great dial, from behind, in the top room.
  {
    id: 'clock-face',
    ...at(275, 13),
    name: 'The Clock Face',
    description: 'The great dial seen from behind: the numbers reversed, the hands winding inward.',
    drawBody(g) {
      g.rect(-1, -6, 2, 6).fill(DB32.dimGray);
      g.rect(-6, -2, 12, 2).fill(DB32.dimGray);
      disc(g, { x: 0, y: -22 }, 16, DB32.rainforest);
      disc(g, { x: 0, y: -22 }, 14, DB32.pancho);
      // The numerals, back to front, as dark marks round the rim.
      for (let h = 0; h < 12; h++) {
        const t = (h / 12) * Math.PI * 2;
        g.rect(Math.round(Math.sin(t) * 12) - 1, Math.round(-Math.cos(t) * 12) - 23, 2, 2).fill(DB32.rope);
      }
      spiral(g, { x: 0, y: -22 }, 2);
      disc(g, { x: 0, y: -22 }, 1, DB32.dimGray);
    },
    drawSketch(g) {
      disc(g, { x: 0, y: 0 }, 30, DB32.rainforest);
      disc(g, { x: 0, y: 0 }, 27, DB32.pancho);
      // XII, I, II ... mirrored, as the dial reads from inside the tower.
      for (let h = 0; h < 12; h++) {
        const t = -(h / 12) * Math.PI * 2;
        const x = Math.round(Math.sin(t) * 22);
        const y = Math.round(-Math.cos(t) * 22);
        g.rect(x - 2, y - 2, 1, 5).fill(DB32.rope);
        if (h % 3 === 0) g.rect(x, y - 2, 1, 5).fill(DB32.rope);
        g.rect(x - 2, y - 2, 3, 1).fill(DB32.rope);
      }
      spiral(g, { x: 0, y: 0 }, 5);
      disc(g, { x: 0, y: 0 }, 2, DB32.dimGray);
    },
  },
  // 68) The Belvedere — on the very top of the clock tower.
  {
    id: 'belvedere',
    ...at(275, 2),
    name: 'The Belvedere',
    description:
      "From here you can see the whole garden, the keep, and — very small — the shed's roof, which should be " +
      'right beneath you.',
    drawBody(g) {
      g.rect(-12, -8, 24, 1).fill(DB32.heather);
      for (const x of [-12, -6, 0, 6, 11]) g.rect(x, -8, 1, 8).fill(DB32.heather);
      // A brass spyglass on its tripod, tipped down at the garden.
      g.rect(-2, -14, 1, 6).fill(DB32.rope);
      g.rect(2, -14, 1, 6).fill(DB32.rope);
      g.rect(0, -15, 1, 7).fill(DB32.rope);
      g.rect(-5, -19, 4, 2).fill(DB32.rainforest);
      g.rect(-1, -18, 4, 2).fill(DB32.rainforest);
      g.rect(3, -17, 3, 2).fill(DB32.goldenFizz);
      g.rect(6, -16, 1, 2).fill(DB32.white);
    },
    drawSketch(g) {
      disc(g, { x: 0, y: 0 }, 30, DB32.rainforest);
      disc(g, { x: 0, y: 0 }, 27, DB32.cornflower);
      for (let dy = -4; dy <= 27; dy++) {
        const half = Math.round(Math.sqrt(27 * 27 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(dy < 8 ? DB32.christi : DB32.dell);
      }
      // The keep on the horizon, and the garden wall.
      g.rect(-20, -14, 8, 10).fill(DB32.topaz);
      g.rect(-22, -16, 2, 2).fill(DB32.topaz);
      g.rect(-16, -18, 2, 4).fill(DB32.topaz);
      g.rect(-12, -16, 2, 2).fill(DB32.topaz);
      g.rect(-26, 4, 52, 2).fill(DB32.clairvoyant);
      g.rect(10, -6, 2, 10).fill(DB32.rope);
      disc(g, { x: 11, y: -8 }, 3, DB32.eltGreen);
      // The shed's roof, small, straight down.
      g.rect(-3, 18, 6, 3).fill(DB32.oiledCedar);
      g.rect(-2, 17, 4, 1).fill(DB32.oiledCedar);
      g.rect(-3, 21, 6, 2).fill(DB32.rope);
    },
  },

  // ---------------------------------------------------------------- the back wing

  // 71) The Bell Board — in the Bell Board Room, between its bell-pulls.
  {
    id: 'bell-board',
    ...at(322, 29),
    name: 'The Bell Board',
    description:
      'A bell for every room, labelled in brass: Studio, Orrery, Tiny Shed... and dozens more for rooms no ' +
      'one has found.',
    drawBody(g) {
      g.rect(-8, -6, 16, 6).fill(DB32.rope);
      g.rect(-8, -6, 16, 1).fill(DB32.twine);
      g.rect(-10, -26, 20, 18).fill(DB32.oiledCedar);
      g.rect(-10, -26, 20, 1).fill(DB32.rope);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const x = -8 + c * 5;
          const y = -24 + r * 5;
          g.rect(x, y, 2, 2).fill(DB32.goldenFizz);
          g.rect(x - 1, y + 3, 4, 1).fill(r === 0 && c < 3 ? DB32.pancho : DB32.loulou);
        }
      }
    },
    drawSketch(g) {
      g.rect(-30, -30, 60, 60).fill(DB32.oiledCedar);
      g.rect(-30, -30, 60, 3).fill(DB32.rope);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const x = -22 + c * 11;
          const y = -20 + r * 11;
          disc(g, { x, y }, 3, DB32.goldenFizz);
          g.rect(x, y - 5, 1, 2).fill(DB32.rainforest);
          g.rect(x - 4, y + 4, 9, 2).fill(DB32.loulou);
        }
      }
      // Three labels with names on them; the rest blank, waiting.
      for (const c of [0, 1, 2]) {
        g.rect(-26 + c * 11, -16, 9, 2).fill(DB32.goldenFizz);
        g.rect(-25 + c * 11, -16, 5, 1).fill(DB32.valhalla);
      }
    },
  },
  // 72) The Housekeeper's Keys — on their hook in the back wing.
  {
    id: 'housekeepers-keys',
    ...at(322, 65),
    name: "The Housekeeper's Keys",
    description: 'A ring of keys, one for each door in the corridor. The last key is not a key at all: it is a seed.',
    drawBody(g) {
      g.rect(-4, -2, 8, 2).fill(DB32.oiledCedar);
      g.rect(0, -24, 1, 22).fill(DB32.rope);
      g.rect(0, -24, 4, 1).fill(DB32.rope);
      g.rect(3, -23, 1, 2).fill(DB32.dimGray);
      // The ring, and seven keys and a seed hanging from it.
      for (let a = 0; a < 16; a++) {
        const t = (a / 16) * Math.PI * 2;
        g.rect(3 + Math.round(Math.cos(t) * 3), -18 + Math.round(Math.sin(t) * 3), 1, 1).fill(DB32.heather);
      }
      for (const [x, len] of [
        [-1, 5],
        [1, 6],
        [3, 7],
        [5, 6],
        [7, 5],
      ] as const) {
        g.rect(x, -15, 1, len).fill(DB32.goldenFizz);
        g.rect(x, -16 + len, 1, 1).fill(DB32.rainforest);
      }
      g.rect(8, -14, 2, 3).fill(DB32.rope);
      g.rect(9, -13, 1, 1).fill(DB32.dell);
    },
    drawSketch(g) {
      for (let a = 0; a < 48; a++) {
        const t = (a / 48) * Math.PI * 2;
        g.rect(Math.round(Math.cos(t) * 12) - 1, -16 + Math.round(Math.sin(t) * 12) - 1, 3, 3).fill(DB32.heather);
      }
      g.rect(-1, -32, 3, 8).fill(DB32.dimGray);
      // Seven keys for seven doors.
      for (let i = 0; i < 7; i++) {
        const x = -24 + i * 7;
        const len = 20 + (i % 3) * 4;
        disc(g, { x: x + 1, y: -2 }, 3, DB32.goldenFizz);
        disc(g, { x: x + 1, y: -2 }, 1, DB32.valhalla);
        g.rect(x, 0, 2, len).fill(DB32.goldenFizz);
        g.rect(x + 2, len - 4, 3, 2).fill(DB32.goldenFizz);
        g.rect(x + 2, len, 2, 2).fill(DB32.goldenFizz);
      }
      // The eighth: a seed.
      disc(g, { x: 25, y: 8 }, 5, DB32.rope);
      g.rect(23, 4, 2, 8).fill(DB32.twine);
      g.rect(25, 0, 1, 3).fill(DB32.dell);
      g.rect(24, 0, 1, 1).fill(DB32.christi);
    },
  },
  // 74) The Old Well — in the well room. The marker (col 333) is over the
  // well water; the windlass stands on its west lip (col 329), its bucket
  // rope hanging out over the water.
  {
    id: 'old-well',
    ...at(329, 92),
    name: 'The Old Well',
    description: 'The water is perfectly still, and there is a lamp lit somewhere far down in it.',
    drawBody(g) {
      g.rect(-6, -5, 12, 5).fill(DB32.heather);
      g.rect(-6, -5, 12, 1).fill(DB32.lightSteel);
      g.rect(-2, -3, 1, 3).fill(DB32.topaz);
      g.rect(2, -5, 1, 2).fill(DB32.topaz);
      g.rect(-4, -20, 2, 15).fill(DB32.oiledCedar);
      g.rect(4, -20, 2, 15).fill(DB32.oiledCedar);
      g.rect(-5, -21, 12, 1).fill(DB32.rope);
      g.rect(-2, -16, 13, 2).fill(DB32.rope);
      g.rect(-6, -17, 2, 1).fill(DB32.rope);
      g.rect(10, -14, 1, 8).fill(DB32.twine);
      g.rect(8, -6, 5, 4).fill(DB32.rainforest);
      g.rect(8, -6, 5, 1).fill(DB32.heather);
    },
    drawSketch(g) {
      disc(g, { x: 0, y: 0 }, 30, DB32.heather);
      for (let a = 0; a < 12; a++) {
        const t = (a / 12) * Math.PI * 2;
        g.rect(Math.round(Math.cos(t) * 26), Math.round(Math.sin(t) * 26), 2, 3).fill(DB32.topaz);
      }
      disc(g, { x: 0, y: 0 }, 22, DB32.deepKoamaru);
      disc(g, { x: 0, y: 0 }, 16, DB32.valhalla);
      // Far down, the lamp.
      drawGlow(g, { x: 3, y: 4, radius: 10, color: DB32.goldenFizz });
      g.rect(2, 2, 3, 4).fill(DB32.goldenFizz);
      g.rect(3, 3, 1, 2).fill(DB32.white);
      g.rect(1, 1, 5, 1).fill(DB32.rainforest);
      g.rect(-14, -9, 6, 1).fill(DB32.venice);
    },
  },
  // 76) The Hearthstone — at the very bottom of the back wing.
  {
    id: 'hearthstone',
    ...at(320, 171),
    name: 'The Hearthstone',
    description: 'A warm flat stone. Everything in the house seems to lean very slightly toward it.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -2, radius: 12, color: DB32.tahitiGold });
      g.rect(-10, -3, 20, 3).fill(DB32.heather);
      g.rect(-9, -4, 18, 1).fill(DB32.lightSteel);
      g.rect(-7, -2, 3, 1).fill(DB32.topaz);
      g.rect(3, -2, 4, 1).fill(DB32.topaz);
      g.rect(-1, -3, 2, 1).fill(DB32.twine);
    },
    drawSketch(g) {
      // The floorboards round it, every one leaning in.
      for (const [x, lean] of [
        [-28, 3],
        [-18, 2],
        [16, -2],
        [26, -3],
      ] as const) {
        for (let y = -30; y < 0; y += 2) g.rect(x + Math.round(((y + 30) / 30) * lean), y, 2, 2).fill(DB32.rope);
      }
      drawGlow(g, { x: 0, y: 8, radius: 30, color: DB32.tahitiGold });
      for (let dy = 0; dy <= 14; dy++) {
        const half = Math.round(Math.sqrt(Math.max(0, 28 * 28 - ((dy - 7) * 4) ** 2)));
        g.rect(-half, dy, half * 2, 1).fill(DB32.heather);
      }
      g.rect(-24, 1, 48, 2).fill(DB32.lightSteel);
      g.rect(-14, 8, 8, 2).fill(DB32.topaz);
      g.rect(8, 10, 10, 2).fill(DB32.topaz);
      g.rect(-3, 4, 6, 2).fill(DB32.twine);
    },
  },

  // ---------------------------------------------------------------- the pipeworks and the vault

  // 80) The Pressure Gauge — on a pipe platform in the pipeworks.
  {
    id: 'pressure-gauge',
    ...at(200, 95),
    name: 'The Pressure Gauge',
    description:
      'The needle does not point to a number. It points to a little drawing of the spiral, and trembles there.',
    drawBody(g) {
      g.rect(-1, -8, 3, 8).fill(DB32.dimGray);
      g.rect(-2, -2, 5, 2).fill(DB32.dimGray);
      disc(g, { x: 0, y: -14 }, 6, DB32.rainforest);
      disc(g, { x: 0, y: -14 }, 5, DB32.lightSteel);
      for (const [x, y] of [
        [-4, -15],
        [-3, -18],
        [0, -19],
        [-4, -12],
      ] as const) {
        g.rect(x, y, 1, 1).fill(DB32.topaz);
      }
      // The spiral mark at three o'clock, the needle on it.
      g.rect(2, -16, 3, 1).fill(DB32.valhalla);
      g.rect(4, -16, 1, 3).fill(DB32.valhalla);
      g.rect(2, -14, 2, 1).fill(DB32.valhalla);
      g.rect(-1, -14, 4, 1).fill(DB32.clairvoyant);
      g.rect(0, -14, 1, 1).fill(DB32.valhalla);
    },
    drawSketch(g) {
      g.rect(-4, 22, 8, 10).fill(DB32.dimGray);
      disc(g, { x: 0, y: 0 }, 28, DB32.rainforest);
      disc(g, { x: 0, y: 0 }, 24, DB32.lightSteel);
      for (let a = 0; a < 9; a++) {
        const t = Math.PI * 0.75 + (a / 8) * Math.PI * 0.9;
        g.rect(Math.round(Math.cos(t) * 20) - 1, Math.round(Math.sin(t) * 20) - 1, 2, 2).fill(DB32.topaz);
      }
      spiral(g, { x: 13, y: -1 }, 2);
      // The needle, and the tremble at its tip.
      g.rect(-2, -1, 7, 2).fill(DB32.clairvoyant);
      disc(g, { x: 0, y: 0 }, 3, DB32.valhalla);
      g.rect(5, -5, 1, 2).fill(DB32.clairvoyant);
      g.rect(5, 3, 1, 2).fill(DB32.clairvoyant);
    },
  },
  // 84) The Last Drawer — beyond the vault grate.
  {
    id: 'last-drawer',
    ...at(116, 135),
    name: 'The Last Drawer',
    description:
      "The twin of the Seed Store's locked drawer, and this one opens. Inside, a single seed, and a label in " +
      "the careful hand: 'for the garden after this one'.",
    drawBody(g) {
      g.rect(-8, -14, 16, 14).fill(DB32.oiledCedar);
      g.rect(-8, -14, 16, 1).fill(DB32.rope);
      for (const y of [-12, -8]) {
        g.rect(-6, y, 12, 3).fill(DB32.rope);
        g.rect(-1, y + 1, 2, 1).fill(DB32.goldenFizz);
      }
      // The bottom drawer, pulled out, a seed in it.
      g.rect(-7, -4, 18, 4).fill(DB32.rope);
      g.rect(-6, -4, 16, 1).fill(DB32.valhalla);
      g.rect(3, -5, 2, 2).fill(DB32.twine);
      g.rect(-5, -2, 4, 1).fill(DB32.pancho);
    },
    drawSketch(g) {
      g.rect(-30, -30, 44, 58).fill(DB32.oiledCedar);
      for (const y of [-26, -12]) {
        g.rect(-27, y, 38, 11).fill(DB32.rope);
        g.rect(-10, y + 4, 4, 2).fill(DB32.goldenFizz);
      }
      g.rect(-20, 4, 50, 22).fill(DB32.rope);
      g.rect(-17, 4, 44, 6).fill(DB32.valhalla);
      disc(g, { x: 10, y: 4 }, 4, DB32.twine);
      g.rect(9, 1, 2, 2).fill(DB32.pancho);
      // The label, in the careful hand.
      g.rect(-14, 14, 26, 8).fill(DB32.pancho);
      for (const [x, w] of [
        [-12, 9],
        [-1, 6],
        [6, 4],
      ] as const) {
        g.rect(x, 17, w, 1).fill(DB32.valhalla);
      }
      g.rect(-12, 19, 14, 1).fill(DB32.valhalla);
    },
  },

  // ---------------------------------------------------------------- under the garden

  // 86) The Mole Mayor's Spectacles — in Mole City's great chamber. The
  // marker (col 44) is the ladder's hole through the chamber floor; they
  // lie on the floor three columns east (col 47), clear of the hole.
  {
    id: 'mole-mayors-spectacles',
    ...at(47, 125),
    name: "The Mole Mayor's Spectacles",
    description: 'A pair of spectacles as big as a cartwheel, polished, laid on a cushion of moss.',
    drawBody(g) {
      g.rect(-14, -3, 28, 3).fill(DB32.dell);
      g.rect(-13, -4, 26, 1).fill(DB32.christi);
      for (const cx of [-7, 7]) {
        disc(g, { x: cx, y: -10 }, 6, DB32.rainforest);
        disc(g, { x: cx, y: -10 }, 5, DB32.lightSteel);
        g.rect(cx - 3, -13, 2, 2).fill(DB32.white);
      }
      g.rect(-1, -12, 2, 1).fill(DB32.rainforest);
    },
    drawSketch(g) {
      for (let dy = 14; dy <= 26; dy++) {
        const half = Math.round(30 - (dy - 14) * 0.6);
        g.rect(-half, dy, half * 2, 1).fill(dy < 17 ? DB32.christi : DB32.dell);
      }
      for (const cx of [-15, 15]) {
        disc(g, { x: cx, y: 0 }, 14, DB32.rainforest);
        disc(g, { x: cx, y: 0 }, 11, DB32.lightSteel);
        g.rect(cx - 7, -7, 4, 4).fill(DB32.white);
        g.rect(cx - 3, -3, 2, 2).fill(DB32.white);
      }
      g.rect(-3, -3, 6, 3).fill(DB32.rainforest);
      g.rect(-30, -2, 2, 6).fill(DB32.rainforest);
      g.rect(28, -2, 2, 6).fill(DB32.rainforest);
    },
  },
  // 89) The Sunken Parlour Clock — in the slumped parlour. The marker (row
  // 148) hangs in the air over the dip in the floor; it stands on the floor
  // two rows down (row 150).
  {
    id: 'sunken-parlour-clock',
    ...at(72, 150),
    name: 'The Sunken Parlour Clock',
    description: 'Stopped at the same minute as all the clocks upstairs.',
    drawBody(g) {
      g.rect(-6, -6, 1, 6).fill(DB32.oiledCedar);
      g.rect(5, -5, 1, 5).fill(DB32.oiledCedar);
      g.rect(-7, -7, 14, 2).fill(DB32.rope);
      g.rect(-5, -19, 10, 12).fill(DB32.oiledCedar);
      g.rect(-5, -19, 10, 1).fill(DB32.rope);
      g.rect(-3, -21, 6, 2).fill(DB32.oiledCedar);
      stoppedDial(g, { x: 0, y: -14 }, 3);
      g.rect(-4, -9, 1, 1).fill(DB32.eltGreen);
    },
    drawSketch(g) {
      g.rect(-24, 18, 48, 4).fill(DB32.rope);
      g.rect(-20, 22, 3, 8).fill(DB32.oiledCedar);
      g.rect(17, 22, 3, 6).fill(DB32.oiledCedar);
      g.rect(-18, -22, 36, 40).fill(DB32.oiledCedar);
      g.rect(-18, -22, 36, 2).fill(DB32.rope);
      g.rect(-10, -28, 20, 6).fill(DB32.oiledCedar);
      stoppedDial(g, { x: 0, y: -2 }, 12);
      // Damp in the case, and a root through the back.
      g.rect(-16, 10, 6, 6).fill(DB32.eltGreen);
      g.rect(18, -16, 10, 2).fill(DB32.rainforest);
      g.rect(26, -14, 2, 10).fill(DB32.rainforest);
    },
  },
  // 90) The Buried Nursery — in the lowest sunken room, against its east wall.
  {
    id: 'buried-nursery',
    ...at(30, 170),
    name: 'The Buried Nursery',
    description: 'Toys, neatly put away, under a ceiling of roots.',
    drawBody(g) {
      g.rect(-18, -8, 12, 8).fill(DB32.rope);
      g.rect(-18, -8, 12, 1).fill(DB32.twine);
      g.rect(-13, -6, 2, 1).fill(DB32.goldenFizz);
      g.rect(-4, -4, 4, 4).fill(DB32.clairvoyant);
      g.rect(-4, -8, 4, 4).fill(DB32.venice);
      g.rect(-3, -7, 1, 1).fill(DB32.lightSteel);
      disc(g, { x: 4, y: -3 }, 2, DB32.goldenFizz);
      g.rect(-16, -12, 3, 4).fill(DB32.pancho);
      g.rect(-16, -14, 3, 2).fill(DB32.oiledCedar);
    },
    drawSketch(g) {
      // The roots overhead.
      g.rect(-30, -30, 60, 4).fill(DB32.oiledCedar);
      for (const [x, len] of [
        [-24, 10],
        [-12, 16],
        [2, 8],
        [14, 14],
        [24, 6],
      ] as const) {
        g.rect(x, -26, 2, len).fill(DB32.rainforest);
        g.rect(x + 2, -26 + len - 4, 2, 4).fill(DB32.rainforest);
      }
      g.rect(-30, 0, 60, 3).fill(DB32.rope);
      g.rect(-26, -10, 8, 10).fill(DB32.pancho);
      g.rect(-26, -14, 8, 4).fill(DB32.oiledCedar);
      g.rect(-24, -8, 1, 1).fill(DB32.valhalla);
      g.rect(-21, -8, 1, 1).fill(DB32.valhalla);
      for (const [x, color] of [
        [-12, DB32.clairvoyant],
        [-4, DB32.venice],
        [4, DB32.goldenFizz],
      ] as const) {
        g.rect(x, -8, 7, 8).fill(color);
      }
      disc(g, { x: 20, y: -6 }, 6, DB32.clairvoyant);
      g.rect(18, -12, 2, 12).fill(DB32.white);
      g.rect(-28, 4, 56, 22).fill(DB32.rope);
      g.rect(-28, 4, 56, 2).fill(DB32.twine);
      g.rect(-4, 12, 8, 3).fill(DB32.goldenFizz);
    },
  },
  // 94) The Lowest Beam — on the foundations' lower beam.
  {
    id: 'lowest-beam',
    ...at(250, 124),
    name: 'The Lowest Beam',
    description: 'Carved into it, very small: the date the house was planted.',
    drawBody(g) {
      g.rect(-6, -10, 12, 10).fill(DB32.oiledCedar);
      g.rect(-6, -10, 12, 1).fill(DB32.rope);
      g.rect(-4, -7, 8, 4).fill(DB32.rope);
      for (const x of [-3, -1, 1, 3]) g.rect(x, -6, 1, 2).fill(DB32.valhalla);
      g.rect(-1, -3, 1, 1).fill(DB32.dell);
    },
    drawSketch(g) {
      g.rect(-32, -20, 64, 40).fill(DB32.oiledCedar);
      for (const y of [-16, -6, 8, 15]) g.rect(-32, y, 64, 1).fill(DB32.loulou);
      g.rect(-22, -8, 44, 16).fill(DB32.rope);
      // The date, in four small marks, and the seed it began as.
      for (const x of [-18, -10, -2, 6]) {
        g.rect(x, -4, 1, 8).fill(DB32.valhalla);
        g.rect(x, -4, 4, 1).fill(DB32.valhalla);
        g.rect(x + 3, -4, 1, 4).fill(DB32.valhalla);
        g.rect(x, 0, 4, 1).fill(DB32.valhalla);
      }
      disc(g, { x: 16, y: 1 }, 2, DB32.valhalla);
      g.rect(16, -5, 1, 4).fill(DB32.dell);
    },
  },
  // 96) The First Seed — at the bottom of the Taproot.
  {
    id: 'first-seed',
    ...at(164, 171),
    name: 'The First Seed',
    description: 'Split open, enormous, with the house growing out of it.',
    drawBody(g) {
      disc(g, { x: -5, y: -6 }, 5, DB32.rope);
      disc(g, { x: 3, y: -6 }, 5, DB32.rope);
      g.rect(-2, -9, 3, 9).fill(DB32.pancho);
      g.rect(-1, -24, 2, 14).fill(DB32.dell);
      g.rect(-5, -18, 4, 1).fill(DB32.christi);
      // The house, the size of a thumb, on the shoot.
      g.rect(-3, -29, 6, 5).fill(DB32.pancho);
      g.rect(-4, -30, 8, 1).fill(DB32.clairvoyant);
      g.rect(-2, -31, 4, 1).fill(DB32.clairvoyant);
      g.rect(-1, -27, 1, 1).fill(DB32.goldenFizz);
      g.rect(1, -27, 1, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      disc(g, { x: -12, y: 14 }, 14, DB32.rope);
      disc(g, { x: 12, y: 14 }, 14, DB32.rope);
      g.rect(-6, 4, 12, 24).fill(DB32.pancho);
      g.rect(-2, -10, 4, 24).fill(DB32.dell);
      g.rect(-14, -4, 12, 3).fill(DB32.christi);
      g.rect(2, 2, 10, 3).fill(DB32.christi);
      g.rect(-12, -26, 24, 16).fill(DB32.pancho);
      for (let i = 0; i < 6; i++) g.rect(-14 + i * 2, -27 - i, 28 - i * 4, 1).fill(DB32.clairvoyant);
      for (const [x, y] of [
        [-8, -22],
        [4, -22],
        [-8, -16],
        [4, -16],
      ] as const) {
        g.rect(x, y, 4, 3).fill(DB32.goldenFizz);
      }
      g.rect(-2, -16, 4, 6).fill(DB32.oiledCedar);
    },
  },
  // 99) The Apple Roots — on the lower root ledge, under the apple trees.
  {
    id: 'apple-roots',
    ...at(240, 170),
    name: 'The Apple Roots',
    description:
      'Each root is labelled with a little tag, like the Root Map: this one goes to the old tree by the pond.',
    drawBody(g) {
      g.rect(-10, -3, 20, 2).fill(DB32.rope);
      g.rect(-6, -6, 2, 3).fill(DB32.rope);
      g.rect(4, -8, 2, 5).fill(DB32.rope);
      g.rect(-10, -1, 3, 1).fill(DB32.rope);
      // The tag on its string.
      g.rect(0, -5, 1, 2).fill(DB32.twine);
      g.rect(-2, -9, 5, 4).fill(DB32.pancho);
      g.rect(-1, -7, 3, 1).fill(DB32.cornflower);
    },
    drawSketch(g) {
      for (const [y, x0, w] of [
        [-20, -30, 50],
        [-4, -24, 54],
        [14, -30, 44],
      ] as const) {
        g.rect(x0, y, w, 4).fill(DB32.rope);
        g.rect(x0, y, w, 1).fill(DB32.twine);
      }
      g.rect(-10, -20, 4, 20).fill(DB32.rope);
      g.rect(14, -4, 4, 22).fill(DB32.rope);
      // The tag: the old tree, and the pond beside it.
      g.rect(2, 0, 1, 6).fill(DB32.twine);
      g.rect(-8, 6, 22, 16).fill(DB32.pancho);
      g.rect(-8, 6, 22, 1).fill(DB32.twine);
      g.rect(-2, 10, 2, 8).fill(DB32.rope);
      disc(g, { x: -1, y: 10 }, 3, DB32.dell);
      g.rect(4, 16, 8, 3).fill(DB32.cornflower);
    },
  },
];

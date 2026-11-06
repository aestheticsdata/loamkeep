import { DB32, TILE_SIZE } from '@constants';
import { drawGlow } from '@entities/glow';
import type { LandmarkSpec } from '@entities/landmark';

// The Kitchen Garden's landmarks: the three today's garden has, where they
// always were, and the eighteen the v2 handoff adds over the wall and under
// the ground. Each stands where its marker is on the handoff's map
// (design_handoff_level_04_kitchen_garden_v2/level-04-kitchen-garden-v2-markers.json):
// x is the middle of the marker's column, y the top of the tile it stands on.

const T = TILE_SIZE;

// A landmark's base at the middle of a column, on a row's top edge.
const at = (col: number, row: number) => ({ x: col * T + 8, y: row * T });

export const KITCHEN_GARDEN_LANDMARKS: LandmarkSpec[] = [
  {
    id: 'sundial',
    ...at(16, 56),
    name: 'Sundial',
    description:
      'A stone dial on a column, its bronze blade casting a long evening shadow. The hour lines are wrong: ' +
      'they do not fan out, they wind inward, round and round to the foot of the blade. Whatever it tells, ' +
      'it is not the time of day.',
    drawBody(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      g.rect(-5, -2, 10, 2).fill(stone);
      g.rect(-5, -2, 10, 1).fill(stoneHi);
      g.rect(-2, -10, 4, 8).fill(stone);
      g.rect(-2, -10, 1, 8).fill(stoneHi);
      g.rect(-7, -12, 14, 2).fill(stone);
      g.rect(-7, -12, 14, 1).fill(stoneHi);
      for (const x of [-6, -4, -1, 2, 5]) g.rect(x, -11, 1, 1).fill(ink);
      g.rect(0, -16, 1, 4).fill(DB32.rainforest);
      g.rect(-1, -15, 1, 3).fill(DB32.rainforest);
      g.rect(-7, -12, 6, 1).fill(DB32.verdigris);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const ink = DB32.valhalla;
      for (let dy = -26; dy <= 26; dy++) {
        const half = Math.round(Math.sqrt(26 * 26 - dy * dy));
        g.rect(-half, dy, half * 2 + 1, 1).fill(stone);
      }
      g.rect(-20, -20, 40, 2).fill(ink);
      g.rect(18, -20, 2, 36).fill(ink);
      g.rect(-16, 14, 36, 2).fill(ink);
      g.rect(-16, -12, 2, 28).fill(ink);
      g.rect(-16, -12, 28, 2).fill(ink);
      g.rect(10, -12, 2, 20).fill(ink);
      g.rect(-8, 6, 20, 2).fill(ink);
      g.rect(-8, -4, 2, 12).fill(ink);
      g.rect(-8, -4, 12, 2).fill(ink);
      g.rect(0, -6, 3, 10).fill(DB32.rainforest);
      g.rect(-24, 0, 24, 2).fill(DB32.verdigris);
    },
  },
  {
    id: 'seed-store',
    x: 142 * T,
    y: 68 * T,
    name: 'Seed Store',
    description:
      'A cabinet of tiny drawers in the root cellar, each labelled in a careful hand: bean, squash, sunflower, ' +
      'apple pip. The mice have been into every one but a single drawer at the bottom, labelled only with the ' +
      'spiral, which is locked and smells faintly of rain.',
    drawBody(g) {
      const wood = DB32.oiledCedar;
      g.rect(-10, -22, 20, 22).fill(wood);
      g.rect(-10, -22, 20, 1).fill(DB32.rope);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          g.rect(-8 + col * 6, -20 + row * 5, 5, 4).fill(DB32.rope);
          g.rect(-6 + col * 6, -18 + row * 5, 1, 1).fill(DB32.goldenFizz);
        }
      }
      // The locked drawer, with its spiral.
      g.rect(-8, -3, 16, 3).fill(DB32.valhalla);
      g.rect(-2, -2, 4, 1).fill(DB32.goldenFizz);
      g.rect(-2, -3, 1, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      g.rect(-26, -30, 52, 56).fill(DB32.oiledCedar);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          g.rect(-23 + col * 16, -27 + row * 12, 14, 10).fill(DB32.rope);
          g.rect(-17 + col * 16, -23 + row * 12, 2, 2).fill(DB32.goldenFizz);
        }
      }
      g.rect(-23, 22, 46, 8).fill(DB32.valhalla);
      g.rect(-6, 24, 12, 1).fill(DB32.goldenFizz);
      g.rect(-6, 24, 1, 4).fill(DB32.goldenFizz);
      g.rect(-6, 27, 9, 1).fill(DB32.goldenFizz);
      g.rect(2, 25, 1, 2).fill(DB32.goldenFizz);
    },
  },
  {
    id: 'dovecote',
    x: 154 * T,
    y: 24 * T,
    name: 'Dovecote',
    description:
      'The loft at the top of the tower, lined to the roof with nesting boxes, every one of them empty and ' +
      'swept clean. The doves left all at once, by the look of it, and someone has kept the place ready for ' +
      'them ever since.',
    drawBody(g) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = -12 + col * 9;
          const y = -22 + row * 7;
          g.rect(x, y, 8, 6).fill(DB32.twine);
          g.rect(x + 2, y + 2, 4, 4).fill(DB32.valhalla);
        }
      }
      g.rect(-12, -1, 26, 1).fill(DB32.rope);
      g.rect(9, -4, 3, 3).fill(DB32.white);
    },
    drawSketch(g) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = -28 + col * 15;
          const y = -28 + row * 14;
          g.rect(x, y, 13, 12).fill(DB32.twine);
          g.rect(x + 3, y + 4, 7, 8).fill(DB32.valhalla);
        }
      }
      g.rect(14, 22, 4, 3).fill(DB32.white);
      g.rect(18, 20, 2, 2).fill(DB32.white);
    },
  },

  // 14) Wine Press — on the plateau at the top of the terraces.
  {
    id: 'wine-press',
    ...at(233, 32),
    name: 'Wine Press',
    description:
      'A great wooden screw over a slatted basket, stained purple to the height of a hand. The last pressing ' +
      'dried in the bottom of it years ago, and the wasps still come for the smell.',
    drawBody(g) {
      g.rect(-8, -2, 16, 2).fill(DB32.oiledCedar);
      g.rect(-6, -10, 12, 8).fill(DB32.rope);
      for (let x = -6; x < 6; x += 3) g.rect(x, -10, 1, 8).fill(DB32.oiledCedar);
      g.rect(-6, -5, 12, 3).fill(DB32.smokeyAsh);
      g.rect(-1, -20, 2, 10).fill(DB32.dimGray);
      for (let y = -19; y < -10; y += 2) g.rect(-1, y, 2, 1).fill(DB32.heather);
      g.rect(-7, -21, 14, 2).fill(DB32.oiledCedar);
      g.rect(-7, -21, 14, 1).fill(DB32.rope);
    },
    drawSketch(g) {
      g.rect(-28, 16, 56, 6).fill(DB32.oiledCedar);
      g.rect(-22, -6, 44, 22).fill(DB32.rope);
      for (let x = -22; x < 22; x += 6) g.rect(x, -6, 2, 22).fill(DB32.oiledCedar);
      g.rect(-22, 6, 44, 10).fill(DB32.smokeyAsh);
      g.rect(-3, -34, 6, 28).fill(DB32.dimGray);
      for (let y = -32; y < -6; y += 4) g.rect(-3, y, 6, 1).fill(DB32.heather);
      g.rect(-26, -38, 52, 6).fill(DB32.oiledCedar);
    },
  },
  // 18) The Vintner's Last Bottle — on the wine cellar's shelf, reached off
  //     a barrel.
  {
    id: 'vintners-last-bottle',
    ...at(229, 63),
    name: "The Vintner's Last Bottle",
    description:
      'One bottle left on a shelf meant for hundreds, its label in faded ink: the year, and underneath it, ' +
      "'not until the spiral-keeper comes home'. The cork has never been drawn.",
    drawBody(g) {
      g.rect(-2, -10, 4, 10).fill(DB32.eltGreen);
      g.rect(-1, -14, 2, 4).fill(DB32.eltGreen);
      g.rect(-1, -15, 2, 1).fill(DB32.rope);
      g.rect(-2, -7, 4, 3).fill(DB32.pancho);
      g.rect(-2, -10, 1, 10).fill(DB32.christi);
      g.rect(-6, -1, 12, 1).fill(DB32.oiledCedar);
    },
    drawSketch(g) {
      g.rect(-10, -14, 20, 38).fill(DB32.eltGreen);
      g.rect(-5, -32, 10, 18).fill(DB32.eltGreen);
      g.rect(-5, -36, 10, 4).fill(DB32.rope);
      g.rect(-10, -2, 20, 14).fill(DB32.pancho);
      g.rect(-6, 2, 12, 1).fill(DB32.valhalla);
      g.rect(-6, 6, 8, 1).fill(DB32.valhalla);
      g.rect(-10, -14, 3, 38).fill(DB32.christi);
    },
  },
  // 20) The Old Orange Tree — on the orangery's floor, under the glass.
  {
    id: 'old-orange-tree',
    ...at(252, 56),
    name: 'The Old Orange Tree',
    description:
      'An orange tree in a tub, older than the orangery built round it, its trunk as twisted as rope. It still ' +
      'fruits, a few oranges a year, and someone still picks them: there are never any on the floor.',
    drawBody(g) {
      g.rect(-6, -6, 12, 6).fill(DB32.oiledCedar);
      g.rect(-6, -6, 12, 1).fill(DB32.rope);
      g.rect(-1, -20, 2, 14).fill(DB32.rope);
      g.rect(0, -16, 1, 4).fill(DB32.oiledCedar);
      g.rect(-9, -30, 18, 10).fill(DB32.dell);
      g.rect(-7, -33, 14, 3).fill(DB32.dell);
      g.rect(-6, -32, 6, 2).fill(DB32.christi);
      for (const [x, y] of [
        [-6, -24],
        [3, -28],
        [5, -22],
        [-2, -27],
      ] as const) {
        g.rect(x, y, 2, 2).fill(DB32.tahitiGold);
      }
    },
    drawSketch(g) {
      g.rect(-16, 14, 32, 10).fill(DB32.oiledCedar);
      g.rect(-3, -10, 6, 24).fill(DB32.rope);
      g.rect(-28, -36, 56, 28).fill(DB32.dell);
      g.rect(-20, -40, 40, 4).fill(DB32.dell);
      g.rect(-22, -34, 16, 6).fill(DB32.christi);
      for (const [x, y] of [
        [-18, -22],
        [8, -30],
        [14, -16],
        [-4, -26],
        [20, -26],
      ] as const) {
        g.rect(x, y, 6, 6).fill(DB32.tahitiGold);
        g.rect(x, y, 2, 2).fill(DB32.goldenFizz);
      }
    },
  },
  // 23) Night-Blooming Cereus — on the cupola's ledge, at the top of the
  //     vent.
  {
    id: 'night-blooming-cereus',
    ...at(269, 5),
    name: 'Night-Blooming Cereus',
    description:
      'A cactus that looks dead eleven months of the year and flowers for one night of the twelfth: a white ' +
      'bloom as big as a plate, open now, smelling of vanilla. Somebody built a cupola so it would have the moon.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -9, radius: 9, color: DB32.white });
      g.rect(-4, -3, 8, 3).fill(DB32.oiledCedar);
      g.rect(-1, -8, 2, 5).fill(DB32.dell);
      g.rect(-4, -12, 8, 4).fill(DB32.white);
      g.rect(-2, -14, 4, 2).fill(DB32.white);
      g.rect(-1, -11, 2, 2).fill(DB32.goldenFizz);
      g.rect(-5, -10, 1, 1).fill(DB32.lightSteel);
      g.rect(4, -10, 1, 1).fill(DB32.lightSteel);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: -6, radius: 30, color: DB32.white });
      g.rect(-12, 14, 24, 10).fill(DB32.oiledCedar);
      g.rect(-3, -2, 6, 16).fill(DB32.dell);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.rect(Math.round(Math.cos(a) * 16) - 4, Math.round(Math.sin(a) * 10) - 10, 8, 6).fill(DB32.white);
      }
      g.rect(-4, -14, 8, 8).fill(DB32.goldenFizz);
    },
  },
  // 25) Head Gardener's Straw Hat — on the orangery's top shelf, by the
  //     climbing plant.
  {
    id: 'head-gardeners-straw-hat',
    ...at(296, 13),
    name: "Head Gardener's Straw Hat",
    description:
      'A wide straw hat hung on a nail as high up the orangery as a ladder goes, a sprig of rosemary still in ' +
      'the band. Whoever wore it climbed up here to put it out of reach, and never came back for it.',
    drawBody(g) {
      g.rect(0, -12, 1, 2).fill(DB32.dimGray);
      g.rect(-7, -6, 14, 2).fill(DB32.twine);
      g.rect(-4, -10, 8, 4).fill(DB32.twine);
      g.rect(-4, -10, 8, 1).fill(DB32.pancho);
      g.rect(-4, -7, 8, 1).fill(DB32.clairvoyant);
      g.rect(2, -9, 1, 2).fill(DB32.dell);
      g.rect(-7, -4, 14, 1).fill(DB32.rope);
    },
    drawSketch(g) {
      g.rect(-34, 8, 68, 8).fill(DB32.twine);
      g.rect(-18, -14, 36, 22).fill(DB32.twine);
      g.rect(-18, -14, 36, 3).fill(DB32.pancho);
      g.rect(-18, 2, 36, 5).fill(DB32.clairvoyant);
      for (let x = -32; x < 32; x += 6) g.rect(x, 10, 3, 1).fill(DB32.rope);
      g.rect(8, -6, 2, 10).fill(DB32.dell);
      g.rect(10, -8, 4, 2).fill(DB32.eltGreen);
    },
  },
  // 30) The Great Boiler — in the boiler room under the orangery.
  {
    id: 'great-boiler',
    ...at(270, 71),
    name: 'The Great Boiler',
    description:
      'A copper boiler the size of a carriage, its gauges all at zero and its firebox warm to the touch. It ' +
      'kept the orangery in summer all winter long. The coal is laid ready, and the matches are on the shelf.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -5, radius: 10, color: DB32.tahitiGold });
      g.rect(-12, -22, 24, 20).fill(DB32.rainforest);
      g.rect(-10, -24, 20, 2).fill(DB32.rainforest);
      g.rect(-12, -22, 2, 20).fill(DB32.tahitiGold);
      for (const y of [-18, -10]) g.rect(-12, y, 24, 1).fill(DB32.stinger);
      g.rect(-4, -7, 8, 5).fill(DB32.valhalla);
      g.rect(-3, -5, 6, 2).fill(DB32.brown);
      g.rect(4, -20, 4, 4).fill(DB32.lightSteel);
      g.rect(5, -19, 2, 1).fill(DB32.valhalla);
      g.rect(-2, -30, 3, 6).fill(DB32.dimGray);
      g.rect(-12, -2, 24, 2).fill(DB32.dimGray);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 12, radius: 24, color: DB32.tahitiGold });
      g.rect(-32, -24, 64, 44).fill(DB32.rainforest);
      g.rect(-32, -24, 6, 44).fill(DB32.tahitiGold);
      for (const y of [-12, 4]) g.rect(-32, y, 64, 2).fill(DB32.stinger);
      g.rect(-10, 6, 20, 12).fill(DB32.valhalla);
      g.rect(-8, 10, 16, 6).fill(DB32.brown);
      g.rect(10, -20, 14, 14).fill(DB32.lightSteel);
      g.rect(16, -14, 6, 2).fill(DB32.valhalla);
      g.rect(-6, -40, 10, 16).fill(DB32.dimGray);
    },
  },
  // 33) Topiary Peacock — on top of the yew maze.
  {
    id: 'topiary-peacock',
    ...at(318, 26),
    name: 'Topiary Peacock',
    description:
      'A peacock clipped out of the yew on top of the maze, its tail fanned wide. The tail has been clipped ' +
      'recently, and carefully, into the spiral; the rest of the hedge has not been touched in years.',
    drawBody(g) {
      g.rect(-10, -16, 20, 12).fill(DB32.dell);
      g.rect(-8, -19, 16, 3).fill(DB32.dell);
      g.rect(-6, -11, 4, 1).fill(DB32.christi);
      g.rect(-6, -11, 1, 4).fill(DB32.christi);
      g.rect(-3, -9, 2, 1).fill(DB32.christi);
      g.rect(3, -14, 3, 12).fill(DB32.eltGreen);
      g.rect(5, -18, 2, 4).fill(DB32.eltGreen);
      g.rect(6, -19, 2, 1).fill(DB32.rainforest);
      g.rect(-4, -4, 9, 4).fill(DB32.dell);
    },
    drawSketch(g) {
      for (let dy = -30; dy <= 4; dy++) {
        const half = Math.round(Math.sqrt(Math.max(0, 34 * 34 - (dy + 4) * (dy + 4))) * 0.9);
        g.rect(-half, dy, half * 2, 1).fill(DB32.dell);
      }
      g.rect(-16, -12, 22, 2).fill(DB32.christi);
      g.rect(-16, -12, 2, 16).fill(DB32.christi);
      g.rect(4, -12, 2, 12).fill(DB32.christi);
      g.rect(-8, 2, 14, 2).fill(DB32.christi);
      g.rect(10, -10, 8, 32).fill(DB32.eltGreen);
      g.rect(14, -22, 6, 12).fill(DB32.eltGreen);
      g.rect(-10, 16, 22, 8).fill(DB32.dell);
    },
  },
  // 42) The Gardener's Ledger — in the room off the tank's west gap, reached
  //     by swimming up the filled tank.
  {
    id: 'gardeners-ledger',
    ...at(204, 84),
    name: "The Gardener's Ledger",
    description:
      'A ledger on a high desk, the last page filled in a careful hand: rainfall, frost, the pump worked so ' +
      'many times a day, the tank full. Then three lines on their own: the spiral is in the garden too. ' +
      'Look under the water. Look under the wall.',
    drawBody(g) {
      g.rect(-6, -10, 1, 10).fill(DB32.oiledCedar);
      g.rect(5, -10, 1, 10).fill(DB32.oiledCedar);
      g.rect(-7, -12, 14, 2).fill(DB32.oiledCedar);
      g.rect(-7, -12, 14, 1).fill(DB32.rope);
      g.rect(-5, -15, 10, 3).fill(DB32.clairvoyant);
      g.rect(-4, -15, 8, 2).fill(DB32.pancho);
      g.rect(0, -15, 1, 2).fill(DB32.rope);
      g.rect(-3, -14, 2, 1).fill(DB32.valhalla);
    },
    drawSketch(g) {
      g.rect(-32, -22, 64, 44).fill(DB32.pancho);
      g.rect(-1, -22, 2, 44).fill(DB32.rope);
      for (let y = -16; y < 18; y += 4) {
        g.rect(-28, y, 22 - ((y * 7) & 7), 1).fill(DB32.valhalla);
        g.rect(4, y, 20 - ((y * 5) & 7), 1).fill(DB32.valhalla);
      }
      g.rect(10, 10, 8, 1).fill(DB32.valhalla);
      g.rect(10, 10, 1, 6).fill(DB32.valhalla);
      g.rect(17, 10, 1, 6).fill(DB32.valhalla);
      g.rect(10, 16, 8, 1).fill(DB32.valhalla);
    },
  },
  // 47) The Frozen Swan — on its ledge in the Ice House, off an ice block.
  {
    id: 'frozen-swan',
    ...at(111, 90),
    name: 'The Frozen Swan',
    description:
      'A swan carved out of a single block of ice for a feast nobody remembers, and kept ever since in the ' +
      'cold. It has not melted a drop. Its neck is bent the way a swan bends it to sleep.',
    drawBody(g) {
      g.rect(-7, -6, 12, 6).fill(DB32.lightSteel);
      g.rect(-8, -4, 2, 3).fill(DB32.lightSteel);
      g.rect(3, -13, 2, 8).fill(DB32.lightSteel);
      g.rect(1, -14, 3, 2).fill(DB32.lightSteel);
      g.rect(0, -13, 1, 1).fill(DB32.cornflower);
      g.rect(-7, -6, 12, 1).fill(DB32.white);
      g.rect(3, -13, 1, 8).fill(DB32.white);
      g.rect(-5, -3, 6, 1).fill(DB32.cornflower);
    },
    drawSketch(g) {
      g.rect(-28, -2, 44, 22).fill(DB32.lightSteel);
      g.rect(-34, 4, 8, 12).fill(DB32.lightSteel);
      g.rect(10, -34, 8, 36).fill(DB32.lightSteel);
      g.rect(2, -38, 14, 8).fill(DB32.lightSteel);
      g.rect(-2, -34, 4, 4).fill(DB32.cornflower);
      g.rect(-28, -2, 44, 3).fill(DB32.white);
      g.rect(10, -34, 3, 36).fill(DB32.white);
      g.rect(-20, 8, 26, 2).fill(DB32.cornflower);
      g.rect(-14, 14, 20, 2).fill(DB32.cornflower);
    },
  },
  // 51) The Hoard of Lost Things — in the moles' ramped burrows.
  {
    id: 'hoard-of-lost-things',
    ...at(46, 85),
    name: 'The Hoard of Lost Things',
    description:
      'Buttons, a thimble, a bent spoon, a key to nothing in the garden: everything the garden has lost, ' +
      'sorted by colour into little heaps by the moles, who would very much like you not to touch any of it.',
    drawBody(g) {
      g.rect(-8, -2, 16, 2).fill(DB32.loulou);
      for (const [x, y, c] of [
        [-7, -4, DB32.brown],
        [-4, -3, DB32.cornflower],
        [-1, -4, DB32.goldenFizz],
        [3, -3, DB32.christi],
        [5, -5, DB32.mandy],
      ] as const) {
        g.rect(x, y, 2, 2).fill(c);
      }
      g.rect(-2, -8, 3, 4).fill(DB32.heather);
      g.rect(2, -7, 4, 1).fill(DB32.goldenFizz);
      g.rect(5, -8, 1, 3).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      g.rect(-36, 14, 72, 8).fill(DB32.loulou);
      for (const [x, y, c] of [
        [-30, 4, DB32.brown],
        [-18, 8, DB32.cornflower],
        [-6, 2, DB32.goldenFizz],
        [8, 8, DB32.christi],
        [20, 4, DB32.mandy],
      ] as const) {
        g.rect(x, y, 10, 10).fill(c);
        g.rect(x + 3, y + 3, 2, 2).fill(DB32.valhalla);
        g.rect(x + 6, y + 6, 2, 2).fill(DB32.valhalla);
      }
      g.rect(-8, -22, 12, 18).fill(DB32.heather);
      for (let y = -20; y < -6; y += 3) g.rect(-6, y, 8, 1).fill(DB32.dimGray);
      g.rect(12, -18, 18, 3).fill(DB32.goldenFizz);
      g.rect(26, -22, 6, 10).fill(DB32.goldenFizz);
    },
  },
  // 58) The Old Carp — on the bed of the culvert.
  {
    id: 'old-carp',
    ...at(40, 117),
    name: 'The Old Carp',
    description:
      'A carp as long as your arm lying on the bed of the culvert, too old to bother swimming away. Its scales ' +
      'have gone the colour of brass. It has been here longer than the keep, the moles say.',
    drawBody(g) {
      g.rect(-8, -6, 14, 5).fill(DB32.rainforest);
      g.rect(-6, -7, 10, 1).fill(DB32.rainforest);
      g.rect(6, -6, 3, 5).fill(DB32.stinger);
      g.rect(9, -7, 2, 2).fill(DB32.stinger);
      g.rect(9, -2, 2, 2).fill(DB32.stinger);
      g.rect(-6, -5, 1, 1).fill(DB32.white);
      for (let x = -4; x < 6; x += 2) g.rect(x, -4, 1, 1).fill(DB32.tahitiGold);
      g.rect(-8, -1, 18, 1).fill(DB32.opal);
    },
    drawSketch(g) {
      g.rect(-28, -12, 44, 22).fill(DB32.rainforest);
      g.rect(-22, -16, 32, 4).fill(DB32.rainforest);
      g.rect(16, -10, 10, 18).fill(DB32.stinger);
      g.rect(24, -16, 8, 8).fill(DB32.stinger);
      g.rect(24, 4, 8, 8).fill(DB32.stinger);
      g.rect(-22, -6, 4, 4).fill(DB32.white);
      for (let x = -14; x < 14; x += 6) for (let y = -8; y < 6; y += 6) g.rect(x, y, 3, 3).fill(DB32.tahitiGold);
      g.rect(-30, 0, 4, 2).fill(DB32.stinger);
    },
  },
  // 59) The Great Vat — on top of the vats in the wine cellar.
  {
    id: 'great-vat',
    ...at(183, 69),
    name: 'The Great Vat',
    description:
      'The biggest of the fermenting vats, its hoops rusted and its staves swollen tight. Knock on it and it ' +
      'is full. Nobody has opened it in a hundred years, and the smell coming off it is of plums.',
    drawBody(g) {
      g.rect(-7, -6, 14, 6).fill(DB32.oiledCedar);
      g.rect(-7, -6, 14, 1).fill(DB32.rope);
      g.rect(-7, -3, 14, 1).fill(DB32.dimGray);
      g.rect(-2, -9, 4, 3).fill(DB32.oiledCedar);
      g.rect(-1, -10, 2, 1).fill(DB32.smokeyAsh);
      g.rect(-7, -1, 14, 1).fill(DB32.loulou);
    },
    drawSketch(g) {
      g.rect(-30, -26, 60, 50).fill(DB32.oiledCedar);
      for (let x = -26; x < 30; x += 8) g.rect(x, -26, 2, 50).fill(DB32.loulou);
      for (const y of [-20, 0, 18]) g.rect(-32, y, 64, 4).fill(DB32.dimGray);
      g.rect(-4, -36, 8, 10).fill(DB32.oiledCedar);
      g.rect(-2, -38, 4, 2).fill(DB32.smokeyAsh);
      g.rect(-30, -26, 4, 50).fill(DB32.rope);
    },
  },
  // 60) Old Toad's Stone — over the frog grotto's pool.
  {
    id: 'old-toads-stone',
    ...at(89, 98),
    name: "Old Toad's Stone",
    description:
      'A flat stone over the pool the frogs live in, worn into a hollow the exact shape of a toad. The toad who made it is ' +
      'not on it. The frogs leave it empty, and do not say why.',
    drawBody(g) {
      g.rect(-8, -3, 16, 3).fill(DB32.topaz);
      g.rect(-8, -3, 16, 1).fill(DB32.heather);
      g.rect(-3, -3, 6, 1).fill(DB32.dimGray);
      g.rect(-2, -2, 4, 1).fill(DB32.dimGray);
      g.rect(5, -5, 2, 2).fill(DB32.eltGreen);
    },
    drawSketch(g) {
      g.rect(-34, 4, 68, 14).fill(DB32.topaz);
      g.rect(-34, 4, 68, 3).fill(DB32.heather);
      g.rect(-14, 4, 28, 6).fill(DB32.dimGray);
      g.rect(-10, 10, 20, 3).fill(DB32.dimGray);
      g.rect(-18, 2, 6, 4).fill(DB32.dimGray);
      g.rect(12, 2, 6, 4).fill(DB32.dimGray);
      g.rect(22, -4, 8, 8).fill(DB32.eltGreen);
    },
  },
  // 63) The Giant Morel — in the mushroom caves.
  {
    id: 'giant-morel',
    ...at(248, 84),
    name: 'The Giant Morel',
    description:
      'A morel mushroom taller than you are, honeycombed and brown, growing out of a crack in the cave floor. ' +
      'The cook would have given anything for it. It is not on any of the menus, so nobody ever found it.',
    drawBody(g) {
      g.rect(-2, -8, 4, 8).fill(DB32.pancho);
      g.rect(-2, -8, 1, 8).fill(DB32.twine);
      g.rect(-5, -22, 10, 14).fill(DB32.rope);
      g.rect(-4, -25, 8, 3).fill(DB32.rope);
      g.rect(-2, -26, 4, 1).fill(DB32.rope);
      for (let y = -23; y < -8; y += 3) {
        for (let x = -4 + ((y / 3) & 1); x < 5; x += 3) g.rect(x, y, 2, 2).fill(DB32.oiledCedar);
      }
    },
    drawSketch(g) {
      g.rect(-8, 0, 16, 24).fill(DB32.pancho);
      g.rect(-18, -38, 36, 40).fill(DB32.rope);
      g.rect(-12, -44, 24, 6).fill(DB32.rope);
      for (let y = -36; y < 0; y += 7) {
        for (let x = -16 + ((y / 7) & 1) * 3; x < 16; x += 7) g.rect(x, y, 5, 5).fill(DB32.oiledCedar);
      }
    },
  },
  // 65) The Sleeping Badger — in the sett's chamber, under the maze.
  {
    id: 'sleeping-badger',
    ...at(312, 89),
    name: 'The Sleeping Badger',
    description:
      'A badger asleep in a nest of last autumn leaves, snoring very slightly. It has slept through the ' +
      'moles, the frogs, the pump and you. Better not to be the one who wakes it.',
    drawBody(g) {
      g.rect(-9, -2, 18, 2).fill(DB32.rainforest);
      g.rect(-7, -6, 13, 4).fill(DB32.dimGray);
      g.rect(-6, -7, 10, 1).fill(DB32.dimGray);
      g.rect(5, -5, 4, 3).fill(DB32.white);
      g.rect(6, -5, 1, 3).fill(DB32.black);
      g.rect(8, -3, 1, 1).fill(DB32.black);
      g.rect(-6, -6, 9, 1).fill(DB32.heather);
      g.rect(-2, -10, 1, 1).fill(DB32.lightSteel);
      g.rect(0, -12, 2, 1).fill(DB32.lightSteel);
    },
    drawSketch(g) {
      g.rect(-34, 12, 68, 10).fill(DB32.rainforest);
      g.rect(-28, -8, 46, 20).fill(DB32.dimGray);
      g.rect(-24, -12, 38, 4).fill(DB32.dimGray);
      g.rect(14, -6, 16, 14).fill(DB32.white);
      g.rect(18, -6, 4, 14).fill(DB32.black);
      g.rect(28, 2, 3, 3).fill(DB32.black);
      g.rect(-24, -10, 34, 3).fill(DB32.heather);
      g.rect(-8, -26, 4, 2).fill(DB32.lightSteel);
      g.rect(0, -32, 6, 2).fill(DB32.lightSteel);
    },
  },
  // 71) The Weathercock — on top of the windpump.
  {
    id: 'weathercock',
    ...at(225, 11),
    name: 'The Weathercock',
    description:
      'A tin cockerel on a spike at the top of the windpump, turned by every wind there is. It always points ' +
      'at the keep, whichever way the wind blows. Someone welded it there.',
    drawBody(g) {
      g.rect(0, -16, 1, 16).fill(DB32.dimGray);
      g.rect(-4, -18, 8, 1).fill(DB32.dimGray);
      g.rect(-3, -24, 7, 5).fill(DB32.tahitiGold);
      g.rect(3, -27, 2, 3).fill(DB32.tahitiGold);
      g.rect(4, -28, 1, 1).fill(DB32.clairvoyant);
      g.rect(-5, -27, 3, 4).fill(DB32.tahitiGold);
      g.rect(-3, -24, 7, 1).fill(DB32.goldenFizz);
    },
    drawSketch(g) {
      g.rect(-2, -10, 4, 34).fill(DB32.dimGray);
      g.rect(-24, -12, 48, 2).fill(DB32.dimGray);
      g.rect(-14, -32, 28, 20).fill(DB32.tahitiGold);
      g.rect(10, -42, 8, 12).fill(DB32.tahitiGold);
      g.rect(14, -46, 4, 4).fill(DB32.clairvoyant);
      g.rect(-24, -42, 12, 16).fill(DB32.tahitiGold);
      g.rect(-14, -32, 28, 3).fill(DB32.goldenFizz);
      g.rect(14, -38, 2, 2).fill(DB32.valhalla);
    },
  },
  // 78) The Spring Stone — beside the spring, on its stone.
  {
    id: 'spring-stone',
    ...at(176, 141),
    name: 'The Spring Stone',
    description:
      'Where the water comes up: a round stone, worn by it into a basin, the spring welling up through the ' +
      'middle in pulses as steady as breathing. The aqueducts on either side were built to carry this.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -4, radius: 9, color: DB32.cornflower });
      g.rect(-7, -4, 14, 4).fill(DB32.heather);
      g.rect(-7, -4, 14, 1).fill(DB32.lightSteel);
      g.rect(-4, -4, 8, 2).fill(DB32.cornflower);
      g.rect(-1, -6, 2, 2).fill(DB32.lightSteel);
      g.rect(0, -8, 1, 2).fill(DB32.white);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 30, color: DB32.cornflower });
      for (let dy = -6; dy <= 18; dy++) {
        const half = Math.round(Math.sqrt(Math.max(0, 30 * 30 - ((dy - 6) * 2.5) ** 2)));
        g.rect(-half, dy, half * 2, 1).fill(DB32.heather);
      }
      g.rect(-20, -2, 40, 8).fill(DB32.cornflower);
      g.rect(-3, -20, 6, 18).fill(DB32.lightSteel);
      g.rect(-1, -26, 2, 6).fill(DB32.white);
    },
  },
  // 82) The Walled-up Arch — at the east end of the east aqueduct.
  {
    id: 'walled-up-arch',
    ...at(330, 141),
    name: 'The Walled-up Arch',
    description:
      'The aqueduct runs into a wall here: an arch bricked up long after it was built, the new bricks paler ' +
      'than the old. Carved into the keystone, the spiral. Water seeps through the joints, going east, ' +
      'toward somewhere flooded.',
    drawBody(g) {
      g.rect(-10, -26, 20, 26).fill(DB32.dimGray);
      g.rect(-8, -22, 16, 22).fill(DB32.topaz);
      for (let y = -20; y < 0; y += 4) {
        for (let x = -8 + ((y / 4) & 1) * 3; x < 8; x += 6) g.rect(x, y, 1, 4).fill(DB32.dimGray);
        g.rect(-8, y, 16, 1).fill(DB32.dimGray);
      }
      g.rect(-2, -26, 4, 3).fill(DB32.heather);
      g.rect(-1, -25, 2, 1).fill(DB32.valhalla);
      g.rect(-8, -2, 1, 2).fill(DB32.venice);
      g.rect(5, -6, 1, 2).fill(DB32.venice);
    },
    drawSketch(g) {
      g.rect(-34, -34, 68, 58).fill(DB32.dimGray);
      g.rect(-26, -26, 52, 50).fill(DB32.topaz);
      for (let y = -24; y < 24; y += 8) {
        g.rect(-26, y, 52, 2).fill(DB32.dimGray);
        for (let x = -26 + ((y / 8) & 1) * 8; x < 26; x += 16) g.rect(x, y, 2, 8).fill(DB32.dimGray);
      }
      g.rect(-8, -38, 16, 10).fill(DB32.heather);
      g.rect(-4, -36, 8, 1).fill(DB32.valhalla);
      g.rect(-4, -36, 1, 6).fill(DB32.valhalla);
      g.rect(3, -36, 1, 5).fill(DB32.valhalla);
      g.rect(-2, -32, 5, 1).fill(DB32.valhalla);
      g.rect(-24, 18, 2, 6).fill(DB32.venice);
    },
  },
];

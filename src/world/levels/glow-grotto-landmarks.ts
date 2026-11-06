import { DB32, TILE_SIZE } from '@constants';
import { drawGlow } from '@entities/glow';
import type { LandmarkSpec } from '@entities/landmark';
import { giantGlowcap } from '@world/levels/glow-grotto-decor';
import { GROTTO_ROCK } from '@world/tilemap';
import type { Graphics } from 'pixi.js';

// The Glow Grotto's landmarks: the three it has always had, where they have
// always been, and the six the v2 handoff adds past its new openings. Each
// stands where its marker is on the handoff's map
// (design_handoff_level_02_glow_grotto_v2/level-02-glow-grotto-v2-markers.json):
// x is the middle of the marker's column, y the top of the tile it stands on.

const T = TILE_SIZE;

// A landmark's base at the middle of a column, on a row's top edge.
const at = (col: number, row: number) => ({ x: col * T + 8, y: row * T });

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

// The numbers are the markers'.

export const GLOW_GROTTO_LANDMARKS: LandmarkSpec[] = [
  // 2) Mother Glowcap — the mushroom forest's floor.
  {
    id: 'mother-glowcap',
    x: 42 * T,
    y: 40 * T,
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
  // 3) Drowned Lantern — on the lake's second island.
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
  // 4) Spiral Ring — the echo chamber's high shelf.
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
  // 12) Singing Geode — on the highest crystal ledge of Room B.
  {
    id: 'singing-geode',
    ...at(218, 8),
    name: 'Singing Geode',
    description:
      'A stone the size of a barrel, split clean in two, and inside it nothing but crystal, packed so tight ' +
      'there is no room for the dark. Stand beside it and it hums — not loudly, one long low note, the same ' +
      'note the switch crystals rang when you woke them, all three at once.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -9, radius: 18, color: DB32.lightSteel });
      drawGeode(g);
      // The hum: short white strokes off either side.
      for (const [x, y] of [
        [-14, -14],
        [-16, -9],
        [13, -14],
        [15, -9],
      ] as const) {
        g.rect(x, y, 2, 1).fill(DB32.white);
      }
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 32, color: DB32.lightSteel });
      g.rect(-26, -14, 52, 34).fill(GROTTO_ROCK);
      g.rect(-22, -22, 44, 8).fill(GROTTO_ROCK);
      g.rect(-26, -14, 52, 2).fill(DB32.dimGray);
      g.rect(-18, -16, 36, 32).fill(DB32.venice);
      g.rect(-14, -12, 28, 24).fill(DB32.viking);
      for (let x = -12; x <= 10; x += 4) {
        g.rect(x, -10 + ((x * 3) & 7), 2, 18 - ((x * 3) & 7)).fill(DB32.lightSteel);
        g.rect(x, -10 + ((x * 3) & 7), 1, 2).fill(DB32.white);
      }
      for (const y of [-6, 2, 10]) {
        g.rect(-34, y, 4, 1).fill(DB32.white);
        g.rect(30, y, 4, 1).fill(DB32.white);
      }
    },
  },
  // 23) Taproot — the knot on the Great Oak's taproot, on the side root at
  //     row 10, under the daylight crack.
  {
    id: 'taproot',
    ...at(277, 10),
    name: 'Taproot',
    description:
      "The Great Oak's own root, as thick as a tower, coming down through the roof of the cave and on into " +
      'the rock below. Lay a hand on it and it is warm. High up, where the crack lets the day in, the bark ' +
      'is green with moss; down here it is white, and full of little doors that something has been using.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -10, radius: 12, color: DB32.goldenFizz });
      // A burl on the side root: a swelling of bark, its rings showing where
      // a branch root broke off, and a small door in it.
      g.rect(-7, -12, 14, 12).fill(DB32.oiledCedar);
      g.rect(-5, -14, 10, 2).fill(DB32.oiledCedar);
      g.rect(-7, -12, 1, 12).fill(DB32.rope);
      g.rect(-5, -14, 10, 1).fill(DB32.rope);
      g.rect(-4, -11, 7, 7).fill(DB32.rope);
      g.rect(-3, -10, 5, 5).fill(DB32.twine);
      g.rect(-1, -8, 1, 1).fill(DB32.oiledCedar);
      g.rect(3, -5, 3, 5).fill(DB32.loulou);
      g.rect(4, -6, 1, 1).fill(DB32.loulou);
      g.rect(5, -3, 1, 1).fill(DB32.goldenFizz);
      g.rect(-7, -1, 14, 1).fill(DB32.eltGreen);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: -20, radius: 24, color: DB32.goldenFizz });
      g.rect(-14, -34, 28, 56).fill(DB32.oiledCedar);
      g.rect(-14, -34, 3, 56).fill(DB32.rope);
      for (let y = -30; y < 18; y += 8) g.rect(-8, y, 18, 1).fill(DB32.loulou);
      g.rect(-10, -16, 18, 18).fill(DB32.rope);
      g.rect(-6, -12, 10, 10).fill(DB32.twine);
      g.rect(-2, -8, 2, 2).fill(DB32.oiledCedar);
      g.rect(4, 8, 6, 14).fill(DB32.loulou);
      g.rect(7, 14, 1, 1).fill(DB32.goldenFizz);
      g.rect(-14, -36, 28, 2).fill(DB32.eltGreen);
      g.rect(-22, 20, 44, 2).fill(DB32.dell);
    },
  },
  // 28) Miner's Lamp — hung on a prop in the middle gallery.
  {
    id: 'miners-lamp',
    ...at(220, 80),
    name: "Miner's Lamp",
    description:
      'A brass lamp hanging from a nail in a pit-prop, its wick trimmed and burning. The mine has been empty ' +
      'longer than any wick lasts. Someone still comes down to light it — or it was never put out, and has ' +
      'been waiting all this time for a miner who said they would be back.',
    drawBody(g) {
      drawGlow(g, { x: 3, y: -15, radius: 14, color: DB32.tahitiGold });
      g.rect(-3, -24, 3, 24).fill(DB32.oiledCedar);
      g.rect(-3, -24, 1, 24).fill(DB32.rope);
      g.rect(0, -21, 3, 1).fill(DB32.dimGray);
      g.rect(2, -20, 1, 2).fill(DB32.dimGray);
      g.rect(1, -18, 5, 1).fill(DB32.rainforest);
      g.rect(1, -17, 5, 5).fill(DB32.stinger);
      g.rect(2, -16, 3, 3).fill(DB32.tahitiGold);
      g.rect(3, -15, 1, 1).fill(DB32.goldenFizz);
      g.rect(1, -12, 5, 1).fill(DB32.rainforest);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 30, color: DB32.tahitiGold });
      g.rect(-2, -34, 4, 6).fill(DB32.dimGray);
      g.rect(-8, -28, 16, 3).fill(DB32.rainforest);
      g.rect(-10, -25, 20, 26).fill(DB32.stinger);
      g.rect(-7, -22, 14, 20).fill(DB32.tahitiGold);
      g.rect(-2, -16, 4, 8).fill(DB32.goldenFizz);
      g.rect(-1, -14, 2, 4).fill(DB32.white);
      g.rect(-12, 1, 24, 4).fill(DB32.rainforest);
      g.rect(-12, 1, 24, 1).fill(DB32.goldenFizz);
    },
  },
  // 30) The Blue Vein — a seam in the Ore Hall's east wall, off the fourth
  //     scaffold.
  {
    id: 'blue-vein',
    ...at(285, 82),
    name: 'The Blue Vein',
    description:
      'What the mine was dug for: a seam of blue ore as wide as a hand, running up the rock and out of sight. ' +
      'They followed it this far and stopped. The last pick marks are fresh, and the vein beyond them is the ' +
      'brightest part of it.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -16, radius: 16, color: DB32.cornflower });
      const seam: readonly (readonly [number, number, number])[] = [
        [-1, -32, 3],
        [0, -28, 3],
        [1, -24, 4],
        [0, -20, 4],
        [-1, -16, 3],
        [-2, -12, 4],
        [-1, -8, 3],
        [0, -4, 4],
      ];
      for (const [x, y, w] of seam) {
        g.rect(x, y, w, 4).fill(DB32.cornflower);
        g.rect(x, y, 1, 4).fill(DB32.lightSteel);
      }
      g.rect(1, -30, 1, 1).fill(DB32.white);
      g.rect(0, -18, 1, 1).fill(DB32.white);
      g.rect(1, -6, 1, 1).fill(DB32.white);
      // Pick marks either side, and the spoil at its foot.
      for (const [x, y] of [
        [-5, -10],
        [5, -14],
        [-4, -22],
        [6, -6],
      ] as const) {
        g.rect(x, y, 2, 1).fill(DB32.dimGray);
      }
      g.rect(-5, -2, 10, 2).fill(DB32.valhalla);
      g.rect(-2, -3, 2, 1).fill(DB32.cornflower);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 32, color: DB32.cornflower });
      g.rect(-30, -34, 60, 56).fill(GROTTO_ROCK);
      for (let y = -32; y < 20; y += 6) {
        const x = Math.round(Math.sin(y * 0.15) * 6) - 4;
        g.rect(x, y, 9, 6).fill(DB32.cornflower);
        g.rect(x, y, 2, 6).fill(DB32.lightSteel);
      }
      g.rect(2, -20, 2, 2).fill(DB32.white);
      g.rect(-4, 4, 2, 2).fill(DB32.white);
      for (const [x, y] of [
        [-20, -10],
        [16, -18],
        [18, 6],
      ] as const) {
        g.rect(x, y, 6, 2).fill(DB32.dimGray);
      }
    },
  },
  // 32) Drowned Minecart — on the bed of the flooded mine's middle pool.
  {
    id: 'drowned-minecart',
    ...at(232, 119),
    name: 'Drowned Minecart',
    description:
      'A minecart on its side on the bottom of the flooded mine, its load of blue ore spilled in a fan in ' +
      'front of it. The rails it came off end at the water. Whoever was pushing it had the sense to let go.',
    drawBody(g) {
      drawGlow(g, { x: 4, y: -2, radius: 8, color: DB32.cornflower });
      // The tub on its side, its open top facing east, a wheel in the air.
      g.rect(-10, -14, 12, 14).fill(DB32.oiledCedar);
      g.rect(-10, -14, 12, 2).fill(DB32.dimGray);
      g.rect(-10, -2, 12, 2).fill(DB32.dimGray);
      g.rect(-10, -14, 1, 14).fill(DB32.rope);
      g.rect(1, -12, 1, 10).fill(DB32.loulou);
      g.rect(-14, -11, 4, 4).fill(DB32.valhalla);
      g.rect(-13, -10, 2, 2).fill(DB32.dimGray);
      for (const [x, y] of [
        [3, -2],
        [6, -1],
        [9, -2],
        [5, -3],
      ] as const) {
        g.rect(x, y, 2, 2).fill(DB32.cornflower);
      }
      g.rect(-12, -1, 3, 1).fill(DB32.eltGreen);
    },
    drawSketch(g) {
      drawGlow(g, { x: 14, y: 12, radius: 18, color: DB32.cornflower });
      g.rect(-24, -20, 30, 38).fill(DB32.oiledCedar);
      g.rect(-24, -20, 30, 5).fill(DB32.dimGray);
      g.rect(-24, 13, 30, 5).fill(DB32.dimGray);
      g.rect(-24, -20, 3, 38).fill(DB32.rope);
      g.rect(-34, -12, 10, 10).fill(DB32.valhalla);
      g.rect(-32, -10, 6, 6).fill(DB32.dimGray);
      for (let i = 0; i < 6; i++) g.rect(10 + i * 4, 12 + (i % 2) * 3, 4, 4).fill(DB32.cornflower);
      g.rect(-34, 20, 70, 2).fill(DB32.opal);
    },
  },
  // 34) Sunken Bell — on the bed of the Black Currents.
  {
    id: 'sunken-bell',
    ...at(100, 119),
    name: 'Sunken Bell',
    description:
      'A great bronze bell lying on its side on the bottom of the black sea, green and crusted, its clapper ' +
      'still in it. When the currents turn, it rings — once, very low, a note you feel in the water before ' +
      'you hear it. Nobody hung a bell down here. It fell from somewhere.',
    drawBody(g) {
      drawGlow(g, { x: 0, y: -8, radius: 12, color: DB32.viking });
      // On its side, mouth to the east: a dome to the west flaring to a lip.
      g.rect(-10, -10, 4, 8).fill(DB32.rainforest);
      g.rect(-6, -12, 8, 12).fill(DB32.rainforest);
      g.rect(2, -14, 4, 14).fill(DB32.rainforest);
      g.rect(6, -15, 2, 15).fill(DB32.stinger);
      g.rect(-6, -12, 8, 1).fill(DB32.tahitiGold);
      g.rect(2, -14, 4, 1).fill(DB32.tahitiGold);
      g.rect(-2, -9, 1, 6).fill(DB32.eltGreen);
      g.rect(4, -10, 1, 3).fill(DB32.eltGreen);
      g.rect(-9, -7, 2, 1).fill(DB32.eltGreen);
      // The clapper, lolling in the mouth.
      g.rect(3, -5, 3, 3).fill(DB32.dimGray);
      g.rect(-12, -1, 22, 1).fill(DB32.opal);
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 0, radius: 30, color: DB32.viking });
      g.rect(-4, -30, 8, 6).fill(DB32.stinger);
      g.rect(-12, -24, 24, 6).fill(DB32.rainforest);
      g.rect(-16, -18, 32, 20).fill(DB32.rainforest);
      g.rect(-22, 2, 44, 10).fill(DB32.rainforest);
      g.rect(-26, 12, 52, 4).fill(DB32.stinger);
      g.rect(-12, -24, 24, 2).fill(DB32.tahitiGold);
      g.rect(-10, -14, 3, 16).fill(DB32.tahitiGold);
      for (const [x, y] of [
        [6, -12],
        [-14, 4],
        [10, 6],
        [0, -20],
      ] as const) {
        g.rect(x, y, 3, 2).fill(DB32.eltGreen);
      }
      g.rect(-3, 16, 6, 6).fill(DB32.dimGray);
    },
  },
];

// The geode on its ledge, split open to face the room: a shell of grotto rock,
// lit along its rim, and inside it the crystal, packed in points.
function drawGeode(g: Graphics): void {
  g.rect(-9, -12, 18, 12).fill(GROTTO_ROCK);
  g.rect(-7, -15, 14, 3).fill(GROTTO_ROCK);
  g.rect(-7, -15, 14, 1).fill(DB32.dimGray);
  g.rect(-9, -12, 1, 12).fill(DB32.dimGray);
  g.rect(-6, -13, 12, 11).fill(DB32.venice);
  g.rect(-5, -11, 10, 8).fill(DB32.viking);
  for (const [x, h] of [
    [-4, 5],
    [-2, 7],
    [0, 4],
    [2, 6],
    [4, 3],
  ] as const) {
    g.rect(x, -3 - h, 1, h).fill(DB32.lightSteel);
    g.rect(x, -3 - h, 1, 1).fill(DB32.white);
  }
}

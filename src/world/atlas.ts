import { DB32 } from '@constants';
import type { LevelId } from '@world/levels';
import type { Graphics } from 'pixi.js';

// The world map's contents: every level as a place on the sheet — where it is
// drawn, which place it is reached from, and how to find the way in. The map
// itself (systems/world-map.ts) only draws what is listed here.
export interface AtlasPlace {
  level: LevelId;
  // Drawn in the 5×7 bitmap font: A–Z, 0–9, space and / ( ) only.
  label: string;
  // Centre of the place's picture on the 320×224 sheet.
  x: number;
  y: number;
  // The place this one is reached from, drawn as a path between the two.
  from?: LevelId;
  // Where the way in is, said the way a player looks for it.
  howTo: string;
  // A picture of the place, about 20 wide × 14 tall, drawn around (0, 0).
  draw(g: Graphics): void;
}

// The order ← and → walk the places in: the meadow, what leads off it, then
// the keep and what leads off that, then the crypt's cistern.
export const ATLAS: readonly AtlasPlace[] = [
  {
    level: 'meadow',
    label: 'MEADOW',
    x: 64,
    y: 82,
    howTo: 'Where every walk begins. Each other place leads off it, or off a place that does.',
    draw(g) {
      g.rect(-10, 2, 20, 5).fill(DB32.eltGreen);
      g.rect(-10, 2, 20, 1).fill(DB32.atlantis);
      g.rect(-8, 0, 6, 2).fill(DB32.eltGreen);
      g.rect(4, -6, 1, 8).fill(DB32.oiledCedar);
      g.rect(1, -11, 7, 6).fill(DB32.dell);
      g.rect(2, -12, 5, 1).fill(DB32.christi);
      g.rect(-6, -2, 3, 2).fill(DB32.heather);
    },
  },
  {
    level: 'cairn-observatory',
    label: 'OBSERVATORY',
    x: 64,
    y: 38,
    from: 'meadow',
    howTo:
      'From the meadow: the stone gate at the right-hand end of the high platform on the right, just below the ' +
      'Crystal Vein. The trail climbs the hill at night.',
    draw(g) {
      g.rect(-10, -9, 20, 16).fill(0x0c0b1a);
      g.rect(-10, 2, 20, 5).fill(0x26332f);
      g.rect(-4, -2, 8, 4).fill(0x26332f);
      g.rect(-1, -6, 2, 6).fill(DB32.dimGray);
      for (const [x, y] of [
        [-7, -7],
        [5, -6],
        [-4, -4],
        [7, -3],
      ] as const) {
        g.rect(x, y, 1, 1).fill(DB32.white);
      }
    },
  },
  {
    level: 'glow-grotto',
    label: 'GLOW GROTTO',
    x: 64,
    y: 126,
    from: 'meadow',
    howTo:
      'From the meadow: swim up out of the deep lake into the tunnels and work west to the Spiral Fossil. ' +
      'The crack in the rock is in the dip beside it.',
    draw(g) {
      g.rect(-10, -7, 20, 14).fill(0x1a2030);
      g.rect(-7, -4, 14, 10).fill(0x0c1220);
      g.rect(-3, 1, 1, 5).fill(DB32.lightSteel);
      g.rect(-5, -1, 5, 2).fill(DB32.viking);
      g.rect(3, 3, 1, 3).fill(DB32.lightSteel);
      g.rect(2, 2, 3, 1).fill(DB32.viking);
    },
  },
  {
    level: 'old-keep',
    label: 'THE KEEP',
    x: 160,
    y: 82,
    from: 'meadow',
    howTo:
      'From the meadow: walk off the right-hand cliff and fall straight down the shaft. The keep door is at ' +
      'the bottom, underground.',
    draw(g) {
      g.rect(-8, -8, 16, 15).fill(DB32.dimGray);
      g.rect(-8, -11, 4, 3).fill(DB32.dimGray);
      g.rect(-2, -11, 4, 3).fill(DB32.dimGray);
      g.rect(4, -11, 4, 3).fill(DB32.dimGray);
      g.rect(-2, 1, 4, 6).fill(DB32.oiledCedar);
      g.rect(-5, -4, 2, 3).fill(DB32.valhalla);
      g.rect(3, -4, 2, 3).fill(DB32.valhalla);
    },
  },
  {
    level: 'kitchen-garden',
    label: 'GARDEN',
    x: 256,
    y: 82,
    from: 'old-keep',
    howTo:
      'From the keep: the door in the back wall of the entry hall, between the last gold column and the big ' +
      'iron kettle.',
    draw(g) {
      g.rect(-10, -8, 20, 15).fill(0xeaa25f);
      g.rect(-10, 3, 20, 4).fill(DB32.oiledCedar);
      g.rect(-10, 2, 20, 1).fill(DB32.eltGreen);
      g.rect(-4, -2, 7, 5).fill(DB32.tahitiGold);
      g.rect(-1, -4, 1, 2).fill(DB32.dell);
      g.rect(5, -6, 1, 8).fill(DB32.rope);
    },
  },
  {
    level: 'old-keep-library',
    label: 'LIBRARY',
    x: 256,
    y: 38,
    from: 'old-keep',
    howTo:
      'From the keep: climb to the upper floor. The bookshelf to the right of the stone throne is a door — ' +
      'pull a book.',
    draw(g) {
      g.rect(-8, -8, 16, 15).fill(DB32.oiledCedar);
      for (const y of [-6, -1, 4]) {
        for (let x = -7; x < 7; x += 2) {
          g.rect(x, y, 1, 3).fill([DB32.clairvoyant, DB32.eltGreen, DB32.venice][(x + 7) % 3]);
        }
      }
    },
  },
  {
    level: 'old-keep-belfry',
    label: 'BELFRY',
    x: 160,
    y: 38,
    from: 'old-keep',
    howTo: 'From the keep: climb to the upper floor and walk to its far left end. The bell tower door is there.',
    draw(g) {
      g.rect(-10, -9, 20, 16).fill(DB32.valhalla);
      g.rect(-7, -9, 14, 2).fill(DB32.oiledCedar);
      g.rect(-2, -7, 4, 2).fill(DB32.rainforest);
      g.rect(-4, -5, 8, 6).fill(DB32.rainforest);
      g.rect(-5, 1, 10, 2).fill(DB32.rainforest);
      g.rect(-3, -4, 1, 4).fill(DB32.twine);
      g.rect(6, -6, 1, 1).fill(DB32.white);
    },
  },
  {
    level: 'old-keep-crypt',
    label: 'CRYPT',
    x: 160,
    y: 126,
    from: 'old-keep',
    howTo:
      'From the keep: drop through the hole at the far end of the entry hall, then walk left along the ' +
      'basement to the door.',
    draw(g) {
      g.rect(-9, -7, 18, 14).fill(0x202020);
      g.rect(-6, -2, 12, 4).fill(DB32.heather);
      g.rect(-6, -2, 12, 1).fill(DB32.lightSteel);
      g.rect(-8, -6, 1, 5).fill(DB32.lightSteel);
      g.rect(-8, -7, 1, 1).fill(DB32.goldenFizz);
      g.rect(7, -6, 1, 5).fill(DB32.lightSteel);
      g.rect(7, -7, 1, 1).fill(DB32.goldenFizz);
    },
  },
  {
    level: 'flooded-cistern',
    label: 'CISTERN',
    x: 256,
    y: 126,
    from: 'old-keep-crypt',
    howTo:
      'From the crypt: drop through the open grave into the ossuary below. The stone arch with steps going ' +
      'down is the way in.',
    draw(g) {
      g.rect(-9, -7, 18, 14).fill(0x202020);
      g.rect(-9, 1, 18, 6).fill(DB32.venice);
      g.rect(-9, 1, 18, 1).fill(DB32.cornflower);
      g.rect(-3, -7, 2, 8).fill(0x303030);
      g.rect(3, -7, 2, 8).fill(0x303030);
      g.rect(-1, 3, 3, 1).fill(DB32.viking);
    },
  },
];

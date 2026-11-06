import { DB32 } from '@constants';
import { drawGlow } from '@entities/glow';
import type { Graphics } from 'pixi.js';

// The Glow Grotto's props, drawn around their anchor: base on y = 0 for what
// stands, the ceiling's underside at y = 0 for what hangs. The ones that come
// in several shapes take a variant, so a run of them never repeats.

// A giant glowcap, the forest's trees: a pale trunk as tall as two or three
// players and a broad cyan cap with a halo. Height is in pixels; the cap
// widens with it. Base on y = 0.
export function giantGlowcap(height: number): (g: Graphics) => void {
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

// Hanging roots, down from a ceiling: a few strands of uneven length.
export function drawRoots(g: Graphics): void {
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

// A cluster of crystal shards standing on a floor: three or four blades of
// falling height, each a viking face with a lightSteel edge and a white tip,
// and a faint halo. Variant picks the heights and the lean.
export function crystalShards(variant: number): (g: Graphics) => void {
  const sets = [
    [
      [-4, 9],
      [0, 13],
      [3, 7],
    ],
    [
      [-5, 6],
      [-1, 10],
      [2, 12],
      [5, 5],
    ],
    [
      [-3, 11],
      [1, 6],
      [4, 9],
    ],
  ] as const;
  const blades = sets[variant % sets.length];
  return (g) => {
    drawGlow(g, { x: 0, y: -6, radius: 10, color: DB32.viking });
    for (const [x, h] of blades) {
      g.rect(x, -h + 1, 2, h - 1).fill(DB32.viking);
      g.rect(x, -h + 1, 1, h - 1).fill(DB32.lightSteel);
      g.rect(x, -h, 1, 1).fill(DB32.white);
      g.rect(x + 1, -2, 1, 2).fill(DB32.venice);
    }
  };
}

// Crystal hanging from a ceiling, the shards' mirror: two or three blades
// pointing down.
export function hangingShards(variant: number): (g: Graphics) => void {
  const lengths = [
    [7, 12, 5],
    [10, 6],
    [5, 9, 13],
  ][variant % 3];
  return (g) => {
    lengths.forEach((len, i) => {
      const x = -3 + i * 3;
      g.rect(x, 0, 2, len - 1).fill(DB32.viking);
      g.rect(x, 0, 1, len - 1).fill(DB32.lightSteel);
      g.rect(x, len - 1, 1, 1).fill(DB32.white);
    });
  };
}

// A rootlet hanging from a timber root: a thin rope-coloured strand with a
// fork near its end, longer than the roots under the rock.
export function rootlet(variant: number): (g: Graphics) => void {
  const len = [14, 22, 18][variant % 3];
  return (g) => {
    g.rect(0, 0, 1, len).fill(DB32.rope);
    g.rect(-1, len - 4, 1, 3).fill(DB32.rope);
    g.rect(1, len - 6, 1, 4).fill(DB32.twine);
  };
}

// A mine prop: an upright timber with a cross-beam head and a brace, as wide
// as a tile and as tall as `height` px — the galleries' pit-props.
export function pitProp(height: number): (g: Graphics) => void {
  return (g) => {
    g.rect(-2, -height, 4, height).fill(DB32.oiledCedar);
    g.rect(-2, -height, 1, height).fill(DB32.rope);
    g.rect(-7, -height, 14, 3).fill(DB32.oiledCedar);
    g.rect(-7, -height, 14, 1).fill(DB32.rope);
    for (let i = 0; i < 5; i++) g.rect(2 + i, -height + 3 + i, 1, 1).fill(DB32.loulou);
  };
}

// A heap of ore and spoil on a gallery floor: dark rubble with a few
// cornflower nuggets in it.
export function orePile(variant: number): (g: Graphics) => void {
  const w = [12, 9, 14][variant % 3];
  return (g) => {
    g.rect(-w / 2, -3, w, 3).fill(DB32.valhalla);
    g.rect(-w / 2 + 2, -5, w - 4, 2).fill(DB32.valhalla);
    g.rect(-w / 2 + 2, -5, w - 4, 1).fill(DB32.dimGray);
    g.rect(-w / 2, -3, w, 1).fill(DB32.dimGray);
    for (let i = 0; i < 3; i++)
      g.rect(-w / 2 + 2 + ((i * 5 + variant) % (w - 3)), -4 + (i % 2), 2, 1).fill(DB32.cornflower);
  };
}

// A miner's barrow, tipped on its nose and left: a cedar tray on one iron
// wheel, its handles in the air.
export function barrow(g: Graphics): void {
  g.rect(-6, -6, 10, 4).fill(DB32.oiledCedar);
  g.rect(-6, -6, 10, 1).fill(DB32.rope);
  g.rect(-8, -4, 3, 3).fill(DB32.dimGray);
  g.rect(-7, -3, 1, 1).fill(DB32.valhalla);
  g.rect(4, -10, 1, 5).fill(DB32.oiledCedar);
  g.rect(5, -11, 2, 1).fill(DB32.oiledCedar);
  g.rect(-1, -2, 1, 2).fill(DB32.oiledCedar);
}

// Daylight down the crack from the meadow, from the ceiling's underside to
// `height` px: a soft goldenFizz light where it comes in and a wider one where
// it lands, and dust motes caught between them in a widening wedge.
export function daylightShaft(height: number): (g: Graphics) => void {
  return (g) => {
    drawGlow(g, { x: 0, y: 4, radius: 10, color: DB32.goldenFizz });
    drawGlow(g, { x: 0, y: height - 6, radius: 18, color: DB32.goldenFizz });
    for (let i = 0; i < 16; i++) {
      const y = 4 + Math.floor((i * (height - 8)) / 16);
      const half = 4 + Math.floor(y / 10);
      g.rect(((i * 7) % (half * 2 + 1)) - half, y, 1, 1).fill(i % 3 === 0 ? DB32.white : DB32.goldenFizz);
    }
  };
}

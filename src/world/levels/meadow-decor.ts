import { DB32 } from '@constants';
import { drawGlow } from '@entities/glow';
import { GRANITE, GRANITE_HI } from '@world/tilemap';
import type { Graphics } from 'pixi.js';

// The meadow's underground scenery, by the material it belongs to: roots out
// of the earth, stalactites and stalagmites in the stone, crystal in the
// cliff's granite, the cellars' sacks, bones, cobwebs and braziers, and the
// timber props of the Great Gallery.
//
// A floor prop draws with its base on the y=0 line, extending up into
// negative y, like every decoration. A ceiling prop's origin is the
// underside of the ceiling instead, and it hangs down into positive y.
// Each comes in a couple of variants, chosen by the placement, so a run of
// them does not repeat; identical drawings share one HD bake.

// ---------------------------------------------------------------- hanging

// Roots out of an earth ceiling: three strands of different lengths, the
// longest with a side root, lit rope down their left.
export function hangingRoots(variant: number): (g: Graphics) => void {
  const lengths = [
    [7, 12, 5],
    [10, 6, 9],
    [5, 9, 13],
  ][variant % 3];
  return (g) => {
    lengths.forEach((len, i) => {
      const x = -5 + i * 4 + (i === 1 ? variant % 2 : 0);
      g.rect(x, 0, 2, len).fill(DB32.oiledCedar);
      g.rect(x, 0, 1, len - 1).fill(DB32.rope);
      if (len > 10) g.rect(x + 2, len - 4, 2, 1).fill(DB32.oiledCedar);
    });
  };
}

// A stalactite: a cone of grey stone narrowing to a drip, lit along its left.
export function stalactite(variant: number): (g: Graphics) => void {
  const long = variant % 2 === 1;
  return (g) => {
    g.rect(-3, 0, 6, 3).fill(DB32.topaz);
    g.rect(-2, 3, 4, long ? 5 : 3).fill(DB32.topaz);
    g.rect(-1, long ? 8 : 6, 2, long ? 4 : 2).fill(DB32.topaz);
    g.rect(-3, 0, 1, 3).fill(DB32.heather);
    g.rect(-2, 3, 1, long ? 5 : 3).fill(DB32.heather);
    g.rect(2, 0, 1, 3).fill(DB32.dimGray);
    if (long) g.rect(0, 13, 1, 1).fill(DB32.viking);
  };
}

// A cobweb slung from a cellar's vault: five threads fanning down out of one
// point, and two rings of thread sagging between them, the outer one wider.
// The variant leans it a pixel one way or the other.
export function cobweb(variant: number): (g: Graphics) => void {
  const lean = variant % 2 === 0 ? 0 : 1;
  const ends = [-7, -4, 0, 4, 7];
  return (g) => {
    const thread = DB32.lightSteel;
    for (const end of ends) {
      const depth = Math.abs(end) === 7 ? 5 : 8;
      for (let i = 0; i <= depth; i++) g.rect(Math.round((end * i) / depth) + lean, i, 1, 1).fill(thread);
    }
    // The rings: each thread's point at a third and two thirds of the way
    // down, joined to the next, a pixel lower in the middle of each span.
    for (const ring of [0.4, 0.75]) {
      for (let k = 0; k < ends.length - 1; k++) {
        const ax = Math.round(ends[k] * ring) + lean;
        const bx = Math.round(ends[k + 1] * ring) + lean;
        const y = Math.round((Math.abs(ends[k]) === 7 ? 5 : 8) * ring);
        for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++)
          g.rect(x, y + (x === Math.round((ax + bx) / 2) ? 1 : 0), 1, 1).fill(DB32.heather);
      }
    }
  };
}

// A cluster of crystal hanging from the granite, lit at its tips.
export function hangingCrystal(variant: number): (g: Graphics) => void {
  const violet = variant % 2 === 1;
  const body = violet ? DB32.mandy : DB32.viking;
  const deep = violet ? DB32.smokeyAsh : DB32.venice;
  return (g) => {
    g.rect(-4, 0, 8, 2).fill(GRANITE);
    g.rect(-3, 2, 2, 5).fill(body);
    g.rect(0, 2, 2, 8).fill(body);
    g.rect(2, 2, 2, 4).fill(deep);
    g.rect(0, 9, 1, 1).fill(DB32.white);
    g.rect(-3, 6, 1, 1).fill(DB32.lightSteel);
  };
}

// ---------------------------------------------------------------- standing

// A stalagmite: the stalactite's floor-borne twin, a stub of stone with a
// lit left side.
export function stalagmite(variant: number): (g: Graphics) => void {
  const tall = variant % 2 === 1;
  return (g) => {
    g.rect(-3, -3, 6, 3).fill(DB32.topaz);
    g.rect(-2, tall ? -8 : -6, 4, tall ? 5 : 3).fill(DB32.topaz);
    g.rect(-1, tall ? -11 : -8, 2, tall ? 3 : 2).fill(DB32.topaz);
    g.rect(-3, -3, 1, 3).fill(DB32.heather);
    g.rect(-2, tall ? -8 : -6, 1, tall ? 5 : 3).fill(DB32.heather);
    g.rect(2, -3, 1, 3).fill(DB32.dimGray);
  };
}

// Pebbles, in three scatters.
export function pebbles(variant: number): (g: Graphics) => void {
  const spots = [
    [
      [-4, 2],
      [1, 3],
    ],
    [
      [-2, 3],
      [3, 2],
      [-6, 2],
    ],
    [[0, 3]],
  ][variant % 3];
  return (g) => {
    for (const [x, w] of spots) {
      g.rect(x, -2, w, 2).fill(DB32.heather);
      g.rect(x, -2, w, 1).fill(DB32.lightSteel);
      g.rect(x + w - 1, -1, 1, 1).fill(DB32.dimGray);
    }
  };
}

// A cluster of crystal growing out of the granite floor: three points, the
// tallest in the middle, the light in their tips.
export function crystalCluster(variant: number): (g: Graphics) => void {
  const violet = variant % 2 === 1;
  const body = violet ? DB32.mandy : DB32.viking;
  const deep = violet ? DB32.smokeyAsh : DB32.venice;
  return (g) => {
    g.rect(-5, -2, 10, 2).fill(GRANITE_HI);
    g.rect(-4, -6, 2, 4).fill(deep);
    g.rect(-1, -10, 3, 8).fill(body);
    g.rect(-1, -10, 1, 8).fill(DB32.lightSteel);
    g.rect(3, -5, 2, 3).fill(body);
    g.rect(0, -11, 1, 1).fill(DB32.white);
  };
}

// Bones, as the cellars and the gallery keep them: a skull and a long bone,
// or two bones crossed.
export function bones(variant: number): (g: Graphics) => void {
  return (g) => {
    const bone = DB32.pancho;
    const shade = DB32.twine;
    if (variant % 2 === 0) {
      g.rect(-5, -4, 4, 4).fill(bone);
      g.rect(-5, -4, 4, 1).fill(DB32.white);
      g.rect(-4, -3, 1, 1).fill(DB32.valhalla);
      g.rect(-2, -3, 1, 1).fill(DB32.valhalla);
      g.rect(-4, -1, 2, 1).fill(shade);
      g.rect(0, -2, 6, 1).fill(bone);
      g.rect(0, -1, 6, 1).fill(shade);
      g.rect(5, -3, 2, 3).fill(bone);
    } else {
      for (let i = 0; i < 6; i++) {
        g.rect(-3 + i, -6 + i, 1, 1).fill(bone);
        g.rect(2 - i, -6 + i, 1, 1).fill(i % 2 === 0 ? bone : shade);
      }
    }
  };
}

// A grain sack slumped against the cellar wall, tied at the neck.
export function sack(variant: number): (g: Graphics) => void {
  const tall = variant % 2 === 1;
  return (g) => {
    const h = tall ? 10 : 8;
    g.rect(-5, -h + 2, 10, h - 2).fill(DB32.twine);
    g.rect(-4, -h, 8, 2).fill(DB32.twine);
    g.rect(-5, -h + 2, 2, h - 2).fill(DB32.pancho);
    g.rect(3, -h + 3, 2, h - 3).fill(DB32.rope);
    g.rect(-2, -h - 2, 4, 2).fill(DB32.twine);
    g.rect(-2, -h, 4, 1).fill(DB32.oiledCedar);
    g.rect(-1, -4, 2, 1).fill(DB32.rope);
  };
}

// An iron brazier on three legs, a fire in its bowl and its light round it.
export function brazier(): (g: Graphics) => void {
  return (g) => {
    drawGlow(g, { x: 0, y: -12, radius: 14, color: DB32.tahitiGold });
    g.rect(-4, -4, 1, 4).fill(DB32.dimGray);
    g.rect(3, -4, 1, 4).fill(DB32.dimGray);
    g.rect(0, -4, 1, 4).fill(DB32.dimGray);
    g.rect(-5, -7, 11, 3).fill(DB32.dimGray);
    g.rect(-5, -7, 11, 1).fill(DB32.heather);
    g.rect(-3, -11, 7, 4).fill(DB32.tahitiGold);
    g.rect(-1, -14, 3, 4).fill(DB32.goldenFizz);
    g.rect(0, -13, 1, 2).fill(DB32.white);
  };
}

// A miner's prop holding up the Great Gallery's roof: two timber posts and a
// cap across them, three tiles tall.
export function mineProp(): (g: Graphics) => void {
  return (g) => {
    for (const x of [-8, 6]) {
      g.rect(x, -46, 3, 46).fill(DB32.rope);
      g.rect(x, -46, 1, 46).fill(DB32.twine);
      g.rect(x + 2, -46, 1, 46).fill(DB32.oiledCedar);
    }
    g.rect(-10, -48, 20, 3).fill(DB32.rope);
    g.rect(-10, -48, 20, 1).fill(DB32.twine);
    g.rect(-10, -46, 20, 1).fill(DB32.oiledCedar);
  };
}

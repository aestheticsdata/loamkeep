import { DB32 } from '@constants';
import type { GlowfishFrame } from '@entities/glowfish';
import { drawGlowfish, drawGlowfishLarge } from '@entities/glowfish';
import { drawHare, type HarePose } from '@entities/hare';
import { drawMoth, drawMothLarge } from '@entities/moth';
import { record, up } from '@hd/classic-recorder';
import { type CritterLayers, ellipseHalo } from '@hd/critter-hd';
import { type FineBox, FineCanvas } from '@hd/fine-canvas';

// The creatures Claude Design drew by hand — design_handoff_hd_pass/
// prototype/hd.js, RECIPES.md §3 — ported recipe for recipe. Every other
// creature takes the common recipe in @hd/critter-hd.

const half = (from: number | readonly number[], to: number) => ({ from, to, t: 0.5 });

function clearBox(s: FineCanvas, box: FineBox): void {
  const points: [number, number][] = [];
  for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) points.push([x, y]);
  s.clear(points);
}

// The snail: drawn outright rather than lifted, so the shell can be round, the
// spiral stamped along an Archimedean curve, the stalks two fine wide.
export function snailHd(frame: number): CritterLayers {
  const s = new FineCanvas({ x: -12, y: -24, w: 30, h: 24 });
  const foot = DB32.heather;
  const shell = DB32.rope;
  const f = frame;
  s.rect({ x: -12, y: -3, w: 27, h: 3 }, foot).rect({ x: 6, y: -9, w: 9, h: 6 }, foot);
  s.rect({ x: 9, y: -15 - 3 * f, w: 2, h: 6 + 3 * f }, foot).rect({ x: 15, y: -15 + 3 * f, w: 2, h: 6 - 3 * f }, foot);
  s.rect({ x: -12, y: -18, w: 18, h: 15 }, shell).rect({ x: -9, y: -21, w: 12, h: 3 }, shell);
  s.clear([
    [-12, -18],
    [-11, -18],
    [-12, -17],
    [-9, -21],
    [2, -21],
    [5, -18],
    [4, -18],
    [14, -9],
    [13, -9],
    [14, -1],
    [-12, -3],
    [-12, -2],
  ]);
  s.seam(shell, foot, DB32.oiledCedar).edges();
  for (let th = 0; th < Math.PI * 3.1; th += 0.03) {
    const r = 1 + th * 0.7;
    const x = Math.floor(-3.5 + r * Math.cos(th + 2.6));
    const y = Math.floor(-12 + r * Math.sin(th + 2.6) * 0.9);
    for (const [a, b] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      if (s.get(x + a, y + b) === shell) s.set(x + a, y + b, DB32.twine);
    }
  }
  s.recolor({ x: -9, y: -20, w: 3, h: 1 }, [shell, DB32.twine], DB32.pancho);
  const eye = (x: number, y: number) => s.rect({ x, y: y + 1, w: 3, h: 2 }, DB32.valhalla).set(x + 1, y, DB32.valhalla);
  eye(9, -18 - 3 * f);
  eye(15, -18 + 3 * f);
  return { body: s, halo: null };
}

// The hare: lifted, rounded, its ears thinned to 2 fine above the head, the
// back corner rounded, a lit eye.
export function hareHd(pose: HarePose): CritterLayers {
  const s = up(record((g) => drawHare(g, pose)));
  s.round();
  if (pose.bounding) {
    clearBox(s, { x: 14, y: -36, w: 1, h: 12 });
    s.clear([
      [-17, -18],
      [-18, -17],
    ]);
    s.rect({ x: 15, y: -21, w: 3, h: 3 }, DB32.white).rect({ x: 15, y: -21, w: 2, h: 2 }, DB32.valhalla);
  } else {
    clearBox(s, { x: 14, y: -42, w: 1, h: 9 });
    clearBox(s, { x: 8, y: -39 + 3 * pose.ear, w: 1, h: 6 - 3 * pose.ear });
    s.clear([
      [-11, -24],
      [-12, -23],
      [-10, -24],
    ]);
    s.rect({ x: 12, y: -30, w: 3, h: 3 }, DB32.white).rect({ x: 12, y: -30, w: 2, h: 2 }, DB32.valhalla);
  }
  s.edges([DB32.valhalla, DB32.brown]);
  s.recolor({ x: -21, y: -1, w: 42, h: 1 }, DB32.heather, DB32.topaz);
  return { body: s, halo: null };
}

const GLOWING = [DB32.viking, DB32.valhalla, DB32.white];

export function glowfishHd(frame: GlowfishFrame): CritterLayers {
  const s = up(record((g) => drawGlowfish(g, frame)));
  s.round().edges(GLOWING);
  s.shade({ x: -6, y: -3, w: 15, h: 1 }, { from: DB32.viking, to: DB32.lightSteel, t: 0.5 });
  s.rect({ x: 6, y: -6, w: 3, h: 3 }, DB32.lightSteel).rect({ x: 6, y: -6, w: 2, h: 2 }, DB32.valhalla);
  const lure = frame.glow > 0.5 ? DB32.white : DB32.viking;
  clearBox(s, { x: 12, y: -15, w: 3, h: 3 });
  s.rect({ x: 12, y: -14, w: 3, h: 1 }, lure).rect({ x: 13, y: -15, w: 1, h: 3 }, lure);
  s.clear([
    [9, -12],
    [11, -10],
  ]);
  return { body: s, halo: ellipseHalo({ cx: -1.5, cy: -4.5, rx: 22.5, ry: 16.5, peak: 0.22 + frame.glow * 0.3 }) };
}

export function glowfishLargeHd(): CritterLayers {
  const s = up(record(drawGlowfishLarge));
  s.round().elbows().edges(GLOWING);
  // Fin rays: every other column lit.
  s.shade({ x: -30, y: -33, w: 60, h: 9 }, { from: DB32.heather, to: DB32.lightSteel, t: (x) => (x & 1 ? 0.9 : 0) });
  s.shade({ x: -21, y: -15, w: 42, h: 3 }, { from: DB32.viking, to: DB32.lightSteel, t: 0.35 });
  s.rect({ x: 12, y: -24, w: 6, h: 6 }, DB32.lightSteel).disc({ cx: 15, cy: -21, r: 3 }, DB32.valhalla);
  s.rect({ x: 16, y: -24, w: 2, h: 2 }, DB32.white);
  clearBox(s, { x: 24, y: -42, w: 6, h: 6 });
  s.disc({ cx: 27, cy: -39, r: 3 }, DB32.white).set(28, -37, DB32.viking).set(29, -38, DB32.viking);
  return { body: s, halo: ellipseHalo({ cx: 0, cy: -18, rx: 42, ry: 21, peak: 0.42 }) };
}

// The moth: spread wings dithered toward their trailing edge, folded wings
// thinned to 2 fine.
export function mothHd(frame: number): CritterLayers {
  const s = up(record((g) => drawMoth(g, frame)));
  s.round();
  if (frame === 0) {
    s.clear([
      [-9, -9],
      [-8, -9],
      [11, -9],
      [10, -9],
    ]);
    s.shade({ x: -9, y: -6, w: 6, h: 3 }, half(DB32.pancho, DB32.twine));
    s.shade({ x: 6, y: -6, w: 6, h: 3 }, half(DB32.pancho, DB32.twine));
  } else {
    clearBox(s, { x: -4, y: -12, w: 1, h: 6 });
    clearBox(s, { x: 8, y: -12, w: 1, h: 6 });
    s.clear([
      [-6, -12],
      [7, -12],
    ]);
  }
  s.edges().recolor({ x: -3, y: -6, w: 6, h: 1 }, DB32.rope, DB32.oiledCedar);
  return { body: s, halo: null };
}

export function mothLargeHd(): CritterLayers {
  const s = up(record(drawMothLarge));
  s.round().clear([
    [-20, -24],
    [-21, -23],
    [19, -24],
    [20, -23],
    [-21, -13],
    [20, -13],
    [-18, -4],
    [-18, -5],
    [17, -4],
    [17, -5],
  ]);
  s.edges([DB32.valhalla]);
  s.shade({ x: -21, y: -21, w: 9, h: 12 }, { from: DB32.pancho, to: DB32.twine, t: (x) => 0.45 * (1 - (x + 21) / 9) });
  s.shade({ x: 12, y: -21, w: 9, h: 12 }, { from: DB32.pancho, to: DB32.twine, t: (x) => 0.45 * ((x - 12) / 9) });
  for (const [cx, p] of [
    [-12, -14],
    [12, 14],
  ]) {
    s.disc({ cx, cy: -15, r: 3.2 }, DB32.rope);
    s.disc({ cx: cx + (p < 0 ? -1 : 1), cy: -16, r: 1.6 }, DB32.valhalla);
    s.set(cx + (p < 0 ? 1 : -2), -13, DB32.twine);
  }
  for (const y of [-18, -12]) s.recolor({ x: -3, y, w: 6, h: 1 }, DB32.rope, DB32.oiledCedar);
  return { body: s, halo: null };
}

// A lit firefly: a gold point, rounded to a plus, in a radial falloff of
// gold the radius of the classic glow. The classic glow's three faint discs
// dithered as they are read as a disc of dots, not as light.
export function litFireflyHd(): CritterLayers {
  const body = new FineCanvas({ x: 0, y: 0, w: 3, h: 3 });
  body.rect({ x: 0, y: 0, w: 3, h: 3 }, DB32.goldenFizz).clear([
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ]);
  body.set(1, 1, DB32.white);
  return { body, halo: ellipseHalo({ cx: 1.5, cy: 1.5, rx: 12, ry: 12, peak: 0.45, color: DB32.goldenFizz }) };
}

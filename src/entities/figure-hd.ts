import { DB32 } from '@constants';
import type { FigurePose } from '@entities/player';
import { FINE, FineCanvas } from '@hd/fine-canvas';

// The figure's pose on the fine grid. Stride, bob and the swim arms are in
// fine px, so fine motion (L8) can step them by a third of a logical pixel.
export interface FigureHdPose {
  air: boolean;
  swim: boolean;
  climb: boolean;
  climbPhase: number;
  step: number;
  bob: number;
  front: number;
  back: number;
}

// The classic pose, each offset ×3: every HD frame is a classic frame redrawn.
export function figureHdPose(pose: FigurePose): FigureHdPose {
  const reach = Math.round(pose.swimPhase * 2);
  return {
    air: pose.airborne,
    swim: pose.swimming,
    climb: !!pose.climbing,
    climbPhase: pose.climbPhase ?? 0,
    step: FINE * pose.stepOffset,
    bob: FINE * pose.bodyBob,
    front: FINE * (3 + reach),
    back: FINE * (3 - reach),
  };
}

// The same pose with fine in-betweens (L8): the stride swings by
// round(sin · 3) fine px instead of round(sin) logical ones, the bob follows
// it, and the swim arms reach by the fine pixel. `stridePhase` is the walk
// cycle's sine, and 0 whenever the figure is not stepping — so is the bob.
export function figureHdFinePose(pose: FigurePose, stridePhase: number): FigureHdPose {
  const coarse = figureHdPose(pose);
  const step = Math.round(stridePhase * FINE);
  const striding = !coarse.air && !coarse.swim && !coarse.climb;
  return {
    ...coarse,
    step: striding ? step : coarse.step,
    bob: striding ? -Math.abs(step) : coarse.bob,
    front: Math.round(FINE * (3 + 2 * pose.swimPhase)),
    back: Math.round(FINE * (3 - 2 * pose.swimPhase)),
  };
}

export function figureHdKey(p: FigureHdPose): string {
  return `${+p.air}${+p.swim}${+p.climb}${p.climbPhase}|${p.step}|${p.bob}|${p.front}|${p.back}`;
}

// The hooded wanderer on the fine grid, around the same anchor as
// drawFigure (feet at y = 0). The one sprite in the game with a full dark
// outline, so it reads over every background (L3).
//
// Recipe: design_handoff_hd_pass/RECIPES.md §2, ported from `H.figure`.
export function drawFigureHd(p: FigureHdPose): FineCanvas {
  const s = new FineCanvas({ x: -24, y: -54, w: 48, h: 54 });
  const cloak = DB32.lightSteel;
  const shade = DB32.heather;
  const strap = DB32.dimGray;
  const lit = [cloak, DB32.white];
  const b = p.bob;

  // Boots: together in the air and in the water, swinging apart on the ground.
  if (p.air || p.swim) {
    s.rect({ x: -6, y: -6, w: 6, h: 6 }, shade).rect({ x: 0, y: -6, w: 6, h: 6 }, shade);
  } else {
    s.rect({ x: -9 + p.step, y: -6, w: 6, h: 6 }, shade).rect({ x: 3 - p.step, y: -6, w: 6, h: 6 }, shade);
  }

  // Cloak and hood, then the swim arms, which leave the cloak and so go in
  // before the outline does.
  const cy = -30 + b;
  const hy = -48 + b;
  s.rect({ x: -15, y: cy, w: 30, h: 24 }, cloak).rect({ x: -12, y: hy, w: 24, h: 18 }, cloak);
  if (p.swim) {
    s.rect({ x: 6, y: -21, w: p.front, h: 3 }, strap).rect({ x: -6 - p.back, y: -21, w: p.back, h: 3 }, strap);
  }

  // Rounded corners, and two more pixels off each top corner of the hood so
  // it reads round while its logical cell keeps 6 of 9.
  s.round().clear([
    [-11, hy],
    [-12, hy + 1],
    [10, hy],
    [11, hy + 1],
  ]);

  // Cloak: a lit shoulder line, a form shadow on the right (light upper left),
  // a heavier hem.
  s.rect({ x: -14, y: cy, w: 28, h: 2 }, DB32.white).dither(
    { x: -14, y: cy + 2, w: 28, h: 1 },
    { under: null, over: DB32.white, t: 0.5 },
  );
  s.recolor({ x: 12, y: cy + 2, w: 2, h: 20 }, cloak, shade);
  s.shade({ x: 8, y: cy + 3, w: 4, h: 18 }, { from: cloak, to: shade, t: 0.5 });
  s.shade({ x: -14, y: cy + 17, w: 28, h: 4 }, { from: lit, to: shade, t: 0.5 });
  s.recolor({ x: -14, y: cy + 21, w: 28, h: 3 }, lit, shade);

  // Hood: lit crown, shaded right side, the arched opening with a dithered
  // chin bounce at its foot.
  s.recolor({ x: -10, y: hy, w: 20, h: 3 }, cloak, DB32.white);
  s.recolor({ x: 9, y: hy + 2, w: 2, h: 15 }, cloak, shade);
  s.rect({ x: -9, y: hy + 3, w: 18, h: 12 }, DB32.valhalla);
  s.set(-9, hy + 3, DB32.white)
    .set(-8, hy + 3, DB32.white)
    .set(-9, hy + 4, cloak);
  s.set(8, hy + 3, DB32.white)
    .set(7, hy + 3, DB32.white)
    .set(8, hy + 4, cloak);
  s.dither({ x: -8, y: hy + 13, w: 16, h: 2 }, { under: null, over: DB32.deepKoamaru, t: 0.5 });

  s.outline(DB32.valhalla);
  // Contact shadow where the hem meets the boots.
  s.recolor({ x: -13, y: -6, w: 22, h: 1 }, shade, DB32.topaz);

  const ey = -39 + b + (p.air ? -6 : 0);
  s.rect({ x: 3, y: ey, w: 2, h: 2 }, DB32.twine).set(3, ey, DB32.pancho);

  // The arm: hands on the rungs, a shadow line for the strokes, raised for
  // the leap, or the satchel strap swinging against the stride.
  if (p.climb) {
    const h = p.climbPhase ? 3 : 0;
    s.rect({ x: -11, y: -42 - h, w: 2, h: 12 }, strap).set(-11, -42 - h, DB32.topaz);
    s.rect({ x: 9, y: -42 + h, w: 2, h: 12 }, strap).set(9, -42 + h, DB32.topaz);
  } else if (p.swim) {
    s.recolor({ x: -14, y: -18, w: 28, h: 1 }, lit, shade);
  } else if (p.air) {
    s.line({ x0: 1, y0: -27, x1: 10, y1: -36 }, shade);
    s.line({ x0: 0, y0: -29, x1: 9, y1: -38 }, strap, 2);
  } else {
    const dx = -p.step;
    for (let i = 0; i < 10; i++) s.recolor({ x: -12 + dx + i, y: -18 + b + i, w: 1, h: 1 }, lit, shade);
    s.line({ x0: -12 + dx, y0: -20 + b, x1: -3 + dx, y1: -11 + b }, strap, 2);
  }
  return s;
}

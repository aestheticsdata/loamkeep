import { DB32, SCREEN_WIDTH } from '@constants';
import { drawFigureHd, figureHdPose } from '@entities/figure-hd';
import type { LogicalRect } from '@hd/chunk-layer';
import { type ClassicRecorder, up } from '@hd/classic-recorder';
import { type CritterLayers, haloFromClassic } from '@hd/critter-hd';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { bayer, hiOf } from '@hd/palette';
import { smoothScale } from '@hd/smooth-scale';
import {
  type CloudStreak,
  hash,
  type TitleMood,
  TUFT,
  type Tuft,
  type WandererFrame,
  WORDMARK_DOT,
  WORDMARK_Y,
  type WordmarkGlyph,
  wordmarkGlyphs,
} from '@systems/title-art';

// The title scene in HD, by the bundle's laws (it is not in the bundle): the
// sky, the stars and the sun; the clouds, the mist and the twinkling stars,
// which move in fine steps; the scenery's silhouettes; the wordmark.

// Where the sky stops: the horizon of title-art.ts.
const HORIZON_Y = 150;

// The tallest step of a sky seam's gradient, fine px.
const MAX_SEAM_STEP = 9;

// The sky, stars and sun. Each band seam is a stepped Bayer gradient (L5):
// three steps of 25 / 50 / 75 % of the lower band, centred on the seam and
// as tall as the narrower band allows, where classic bleeds one pixel in two
// and one in four; the stars are 2×2 points; the sun's rings are round and
// feathered 2 fine into the ring outside them.
export function titleBackdropHd(mood: TitleMood): CritterLayers {
  const s = new FineCanvas({ x: 0, y: 0, w: SCREEN_WIDTH * FINE, h: HORIZON_Y * FINE });
  const w = SCREEN_WIDTH * FINE;
  mood.bands.forEach(([y0, color], i) => {
    const y1 = i + 1 < mood.bands.length ? mood.bands[i + 1][0] : HORIZON_Y;
    s.rect({ x: 0, y: y0 * FINE, w, h: (y1 - y0) * FINE }, color);
  });
  mood.bands.forEach(([y0, color], i) => {
    if (i === 0) return;
    const above = y0 - mood.bands[i - 1][0];
    const below = (i + 1 < mood.bands.length ? mood.bands[i + 1][0] : HORIZON_Y) - y0;
    const step = Math.max(2, Math.min(MAX_SEAM_STEP, Math.floor((Math.min(above, below) * FINE) / 4)));
    const upper = mood.bands[i - 1][1];
    const seam = y0 * FINE;
    s.dither({ x: 0, y: seam - 2 * step, w, h: step }, { under: null, over: color, t: 0.25 });
    s.dither({ x: 0, y: seam - step, w, h: step }, { under: null, over: color, t: 0.5 });
    s.dither({ x: 0, y: seam, w, h: step }, { under: null, over: upper, t: 0.25 });
  });
  const { count, maxY } = mood.stars;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(hash(i, 3.7) * SCREEN_WIDTH);
    const y = Math.floor(hash(i, 8.1) * maxY);
    s.rect({ x: x * FINE + 1, y: y * FINE + 1, w: 2, h: 2 }, y > maxY - 26 ? DB32.heather : DB32.lightSteel);
  }
  if (mood.sun !== null) {
    const cx = mood.sun.x * FINE + 1.5;
    const cy = mood.sun.y * FINE + 1.5;
    for (const [r, color] of mood.sun.rings) {
      const fr = r * FINE + 1.5;
      s.disc({ cx, cy, r: fr }, color);
      for (let y = Math.floor(cy - fr - 2); y <= cy + fr + 2; y++) {
        for (let x = Math.floor(cx - fr - 2); x <= cx + fr + 2; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (d > fr && d <= fr + 2 && s.ink(x, y) && bayer(x, y) < 0.5) s.set(x, y, color);
        }
      }
    }
  }
  return { body: s, halo: null };
}

// The scenery — hills, conifers, keep, ground — is drawn in single-pixel
// columns, so its slopes are staircases. Lifted, rounded and with its
// elbows bridged twice, each step of a slope becomes a third as tall.
export function sceneryHd(classic: ClassicRecorder): CritterLayers {
  const s = up(classic);
  s.round().elbows().elbows();
  return { body: s, halo: haloFromClassic(classic) };
}

// The wordmark's inks: the face, the lit band across its top rows (null for
// none), and the drop shadow behind it (null for none).
export interface WordmarkInk {
  face: number;
  top: number | null;
  shadow: number | null;
}

// How far the shadow sits behind the face, and how deep the lit band runs
// from the top of the wordmark: classic's 2 and 10 logical px.
const SHADOW_OFFSET = 2 * FINE;
const LIT_ROWS = 10 * FINE;

// The wordmark drawn from its glyph table, not from classic's blocks: each
// letter's dots enlarged to their 9-fine size by smoothScale, so a diagonal
// stroke (K, M, A) is a straight 45° edge and the O is round, with the same
// outline laid behind as the shadow. Nothing is chamfered after the fact.
export function wordmarkHd(ink: WordmarkInk): CritterLayers {
  const top = WORDMARK_Y * FINE;
  const glyphs = wordmarkGlyphs();
  const left = glyphs[0].x * FINE;
  const last = glyphs[glyphs.length - 1];
  const scale = WORDMARK_DOT * FINE;
  const s = new FineCanvas({
    x: left,
    y: top,
    w: (last.x - glyphs[0].x) * FINE + 5 * scale + SHADOW_OFFSET,
    h: 8 * scale + SHADOW_OFFSET,
  });
  const shapes = glyphs.map((glyph) => ({ at: glyph.x * FINE, shape: smoothScale(dots(glyph), scale) }));
  if (ink.shadow !== null) {
    const shadow = ink.shadow;
    for (const { at, shape } of shapes) {
      shape.forInk((x, y) => s.set(at + x + SHADOW_OFFSET, top + y + SHADOW_OFFSET, shadow));
    }
  }
  for (const { at, shape } of shapes) {
    shape.forInk((x, y) => s.set(at + x, top + y, ink.top !== null && y < LIT_ROWS ? ink.top : ink.face));
  }
  return { body: s, halo: null };
}

// A glyph's dots, one pixel each.
function dots(glyph: WordmarkGlyph): FineCanvas {
  const s = new FineCanvas({ x: 0, y: 0, w: glyph.rows[0].length, h: glyph.rows.length });
  glyph.rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === 'X') s.set(x, y, 1);
    });
  });
  return s;
}

// The rule under the wordmark: its line as drawn, its fading dots as opaque
// dithered pixels.
export function wordmarkRuleHd(classic: ClassicRecorder): CritterLayers {
  return { body: up(classic), halo: haloFromClassic(classic) };
}

// The wanderer on the title: the HD figure, breathing, and the hem lifting
// off its back as a 2-fine strip.
export function wandererHd(frame: WandererFrame): CritterLayers {
  const pose = { airborne: false, swimming: false, stepOffset: 0, bodyBob: frame.bodyBob, swimPhase: 0 };
  const s = drawFigureHd(figureHdPose(pose));
  if (frame.hem) s.rect({ x: -17, y: -18 + frame.bodyBob * FINE, w: 2, h: 9 }, DB32.valhalla);
  return { body: s, halo: null };
}

// The dark plate behind a line of text, without alpha: classic's black at
// 34 % as a checkerboard of black fine pixels, the plainest dither there is,
// which a fine pixel's size turns back into a shade.
export function plateHd(at: LogicalRect): FineCanvas {
  const x = at.x * FINE;
  const y = at.y * FINE;
  const w = at.w * FINE;
  const h = at.h * FINE;
  const s = new FineCanvas({ x, y, w, h });
  s.dither({ x, y, w, h }, { under: null, over: DB32.black, t: 0.5 });
  return s;
}

// One cloud streak (title-art.ts CLOUD_STREAKS), drawn once with its left end
// at x = 0 and moved as a whole: classic's three translucent rows as rows of
// opaque pixels at their densities, each tapering over its last 9 fine so the
// streak thins out instead of stopping.
const CLOUD_ROWS: readonly (readonly [number, number, number, number])[] = [
  // dy, inset left, inset width, density — classic's px() calls.
  [0, 0, 0, 0.75],
  [1, 5, 12, 0.5],
  [-1, 12, 26, 0.35],
];

export function cloudHd(streak: CloudStreak): FineCanvas {
  const s = new FineCanvas({ x: 0, y: (streak.y - 1) * FINE, w: streak.width * FINE, h: 3 * FINE });
  for (const [dy, inset, shrink, t] of CLOUD_ROWS) {
    const x0 = inset * FINE;
    const x1 = (streak.width - shrink + inset) * FINE;
    const y = (streak.y + dy) * FINE;
    s.dither(
      { x: x0, y, w: x1 - x0, h: FINE },
      { under: null, over: streak.color, t: (px) => t * Math.min(1, (px - x0 + 1) / 9, (x1 - px) / 9) },
    );
  }
  return s;
}

// One row of the mist: dashes 5 px long every 8, at the row's density,
// across the screen and one period beyond, so it can slide by a fine pixel
// at a time and wrap every 24.
export function mistRowHd(y: number, color: number, t: number): FineCanvas {
  const period = 8 * FINE;
  const s = new FineCanvas({ x: -period, y: y * FINE, w: SCREEN_WIDTH * FINE + 2 * period, h: FINE });
  for (let x = -period; x < SCREEN_WIDTH * FINE + period; x += period) {
    s.dither({ x, y: y * FINE, w: 5 * FINE, h: FINE }, { under: null, over: color, t });
  }
  return s;
}

// The menu cursor: classic's three-step triangle (5, 3 and 1 px tall),
// smoothed up so its two slanted edges are 45° lines. Top-left at (0, 0).
export function cursorHd(color: number): FineCanvas {
  const dots = new FineCanvas({ x: 0, y: 0, w: 3, h: 5 });
  dots.rect({ x: 0, y: 0, w: 1, h: 5 }, color).rect({ x: 1, y: 1, w: 1, h: 3 }, color).set(2, 2, color);
  return smoothScale(dots, FINE);
}

// A grass tuft on the fine grid, its foot at (0, 0) on the ground's top:
// three 1-fine blades — the middle one tallest, the outer two splayed — each
// bent `sway` fine at its tip and less toward its foot, the tips a step
// lighter. A flower is a stem with a plus-shaped head and a lit centre.
export interface TuftPose {
  kind: Tuft;
  // Fine px the tips lean, -2 to 2.
  sway: number;
}

const BLADES: Record<Tuft, readonly (readonly [number, number])[]> = {
  // [foot x, height] per blade, fine px.
  [TUFT.short]: [
    [0, 4],
    [1, 6],
    [2, 4],
  ],
  [TUFT.tall]: [
    [0, 5],
    [1, 9],
    [2, 6],
  ],
  [TUFT.flower]: [[1, 6]],
};

export function tuftHd(pose: TuftPose, tones: TuftTones): FineCanvas {
  const s = new FineCanvas({ x: -4, y: -12, w: 11, h: 12 });
  const splay = [-1, 0, 1];
  BLADES[pose.kind].forEach(([foot, height], i) => {
    const out = pose.kind === TUFT.flower ? 0 : splay[i];
    for (let k = 0; k < height; k++) {
      const bend = Math.round(((pose.sway + out) * k * k) / (height * height));
      s.set(foot + bend, -1 - k, k === height - 1 && pose.kind !== TUFT.flower ? hiOf(tones.grass) : tones.grass);
    }
  });
  if (pose.kind === TUFT.flower) {
    const [foot, height] = BLADES[TUFT.flower][0];
    const x = foot + Math.round(pose.sway / 2);
    const y = -height - 2;
    s.rect({ x: x - 1, y, w: 3, h: 1 }, tones.flower).rect({ x, y: y - 1, w: 1, h: 3 }, tones.flower);
    s.set(x, y, DB32.goldenFizz);
  }
  return s;
}

export interface TuftTones {
  grass: number;
  flower: number;
}

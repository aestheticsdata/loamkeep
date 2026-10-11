import { DB32, SCREEN_WIDTH } from '@constants';
import type { ChunkSource } from '@hd/chunk-layer';
import { FINE, type FineCanvas } from '@hd/fine-canvas';
import { bayer, loOf } from '@hd/palette';
import type { Vec2 } from '@types';
import {
  AUTUMN_BANDS,
  AUTUMN_HORIZON_Y,
  type HillSilhouetteOptions,
  hillRidge,
  MOON_CENTRE,
  NIGHT_GLOW,
  NIGHT_SKY,
  SPIRAL_CENTRE_X,
  SPIRAL_CENTRE_Y,
  SPIRAL_CORNERS,
  SUN_CENTRE,
  SUN_DISCS,
  skyRandom,
} from '@world/parallax';

// The parallax layers on the fine grid (RECIPES §6), each a ChunkSource in
// the layer's own logical coordinates: the same polygons, the same seeds and
// the same generator calls as classic, so every hill, star and grain of dust
// stands where it stands in classic. Flat skies have nothing to refine and
// stay classic in both arts.

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

// A run of fine columns, [x0, x1).
interface FineSpan {
  x0: number;
  x1: number;
}

// The canvas's fine columns, clipped to the span.
function columns(s: FineCanvas, span: FineSpan): [number, number] {
  return [Math.max(s.x0, span.x0), Math.min(s.x0 + s.w, span.x1)];
}

// Hills: the ridge rasterised per fine column, so a slope steps a third of a
// pixel at a time. The rim is the 3 fine above the ridge: on slopes facing
// the light (upper left), 3 fine of rim and 2 rows of 50 % below the ridge;
// on slopes facing away, 1 fine.
export function hillsHd(opts: HillSilhouetteOptions): ChunkSource {
  const flat = hillRidge(opts);
  const points: [number, number][] = [];
  for (let i = 0; i < flat.length; i += 2) points.push([flat[i], flat[i + 1]]);
  const ridgeAt = (x: number): number => {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      if (x <= points[i][0]) {
        const [ax, ay] = points[i - 1];
        const [bx, by] = points[i];
        return ay + ((by - ay) * (x - ax)) / (bx - ax);
      }
    }
    return points[points.length - 1][1];
  };
  const base = (opts.baseY ?? opts.horizonY) * FINE;
  const top = Math.floor(opts.horizonY - opts.maxHeight) - 2;
  return {
    left: 0,
    top,
    width: Math.ceil(opts.width),
    height: Math.ceil((opts.baseY ?? opts.horizonY) - top),
    paint(s) {
      const [fx0, fx1] = columns(s, { x0: 0, x1: opts.width * FINE });
      for (let fx = fx0; fx < fx1; fx++) {
        const lx = (fx + 0.5) / FINE;
        const y0 = Math.ceil(ridgeAt(lx) * FINE - 0.5);
        s.rect(box(fx, y0, 1, base - y0), opts.color);
        if (opts.rimColor === undefined) continue;
        const lit = -(ridgeAt(lx + 0.5) - ridgeAt(lx - 0.5)) > 0.05;
        if (lit) {
          s.rect(box(fx, y0 - 3, 1, 3), opts.rimColor);
          for (let k = 0; k < 2; k++) if (bayer(fx, y0 + k) < 0.5) s.set(fx, y0 + k, opts.rimColor);
        } else {
          s.set(fx, y0 - 3, opts.rimColor).rect(box(fx, y0 - 2, 1, 2), opts.color);
        }
      }
    },
  };
}

// A star at classic's size, softened: thin 1-fine crosses and 2×2 dim stars
// read as a sky of scratches and specks, and were rejected beside classic's.
interface Star {
  // Logical px.
  x: number;
  y: number;
  bright: boolean;
  color: number;
}

function star(s: FineCanvas, at: Star): void {
  const x = at.x * FINE;
  const y = at.y * FINE;
  if (!at.bright) {
    // Classic's whole pixel, its corners a shade down so it reads round.
    s.rect(box(x, y, 3, 3), loOf(at.color))
      .rect(box(x + 1, y, 1, 3), at.color)
      .rect(box(x, y + 1, 3, 1), at.color);
    return;
  }
  // Classic's plus — a white pixel with heather on its four sides — as a
  // soft light: a round white core, its arms lightSteel near it and heather
  // further out, drawn to a point, all inside the plus.
  const cx = x + 1.5;
  const cy = y + 1.5;
  for (let py = y - 3; py < y + 6; py++) {
    for (let px = x - 3; px < x + 6; px++) {
      const dx = Math.abs(px + 0.5 - cx);
      const dy = Math.abs(py + 0.5 - cy);
      const d = Math.hypot(dx, dy);
      const along = Math.max(dx, dy);
      const across = Math.min(dx, dy);
      if (d < 1.6) s.set(px, py, DB32.white);
      else if (across < 1.5 && along < 3) s.set(px, py, DB32.lightSteel);
      else if (across < (along > 3.5 ? 0.6 : 1.5)) s.set(px, py, DB32.heather);
    }
  }
}

// A corner of the spiral: classic's faint lightSteel square and its long
// heather cross, as an opaque disc a step down lightSteel's ramp with arms
// drawn to a point, and the bright star over it. A dithered haze here read
// as a speckle round the star.
function cornerStar(s: FineCanvas, at: Vec2): void {
  const cx = at.x * FINE + 1.5;
  const cy = at.y * FINE + 1.5;
  s.disc({ cx, cy, r: 4.2 }, loOf(DB32.lightSteel));
  for (let k = -7; k <= 7; k++) {
    if (Math.abs(k) > 4) {
      s.set(at.x * FINE + 1 + k, at.y * FINE + 1, DB32.heather).set(at.x * FINE + 1, at.y * FINE + 1 + k, DB32.heather);
    }
  }
  star(s, { x: at.x, y: at.y, bright: true, color: DB32.white });
}

// The star field, from the same generator as classic's makeStarField, call
// for call.
export interface StarField {
  width: number;
  seed: number;
  height: number;
}

export function starFieldHd(field: StarField): ChunkSource {
  const top = -40;
  const bottom = field.height - 40;
  return {
    left: -3,
    top: top - 3,
    width: field.width + 6,
    height: bottom - top + 6,
    paint(s) {
      const next = skyRandom(field.seed);
      const count = Math.floor((field.width * (bottom - top)) / 260);
      for (let i = 0; i < count; i++) {
        const x = Math.floor(next() * field.width);
        const y = Math.floor(top + next() * (bottom - top));
        const bright = next() < 0.11;
        const color = bright ? DB32.white : next() < 0.5 ? DB32.heather : DB32.topaz;
        star(s, { x, y, bright, color });
      }
    },
  };
}

// The moon (RECIPES §6, `H.moon`): a deepKoamaru halo with a dithered outer
// edge, a lightSteel limb, a pancho face, the bite in the night sky's own
// colour, a dithered twine terminator and three craters.
export function moonHd(): ChunkSource {
  const cx = MOON_CENTRE.x * FINE + 1.5;
  const cy = MOON_CENTRE.y * FINE + 1.5;
  return {
    left: MOON_CENTRE.x - 14,
    top: MOON_CENTRE.y - 14,
    width: 29,
    height: 29,
    paint(s) {
      s.disc({ cx, cy, r: 37.5 }, DB32.deepKoamaru);
      const thin: [number, number][] = [];
      s.forInk((x, y) => {
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > 34.5 && bayer(x, y) < 0.5) thin.push([x, y]);
      });
      s.clear(thin);
      s.disc({ cx, cy, r: 31.5 }, DB32.lightSteel).disc({ cx, cy, r: 28.5 }, DB32.pancho);
      const changes: [number, number, number][] = [];
      s.forInk((x, y, c) => {
        const d = Math.hypot(x + 0.5 - cx + 18, y + 0.5 - cy);
        if (d <= 28.5) changes.push([x, y, NIGHT_SKY]);
        else if (c === DB32.pancho && d < 32 && bayer(x, y) < 0.5) changes.push([x, y, DB32.twine]);
      });
      for (const [x, y, c] of changes) s.set(x, y, c);
      s.disc({ cx: cx + 15, cy: cy - 9, r: 3.4 }, DB32.twine).rect(box(cx + 12, cy - 12, 2, 1), DB32.rope);
      s.disc({ cx: cx + 19.5, cy: cy + 10.5, r: 1.8 }, DB32.twine).disc(
        { cx: cx + 6, cy: cy + 18, r: 1.5 },
        DB32.twine,
      );
    },
  };
}

// The night's horizon glow: three 3-fine bands of 25 / 50 / 75 % above the
// solid glow, where classic has one dithered row.
export function nightGlowHd(glowTop: number): ChunkSource {
  return {
    left: 0,
    top: glowTop - 3,
    width: SCREEN_WIDTH,
    height: 403,
    paint(s) {
      const y = glowTop * FINE;
      const w = SCREEN_WIDTH * FINE;
      s.dither(box(0, y - 9, w, 3), { under: null, over: NIGHT_GLOW, t: 0.25 });
      s.dither(box(0, y - 6, w, 3), { under: null, over: NIGHT_GLOW, t: 0.5 });
      s.dither(box(0, y - 3, w, 3), { under: null, over: NIGHT_GLOW, t: 0.75 });
      s.rect(box(0, y, w, 400 * FINE), NIGHT_GLOW);
    },
  };
}

// The garden's evening: the same bands, each seam three 2-fine steps of the
// band above dithered into the one below (75 / 50 / 25 %), not one row.
export function autumnSkyHd(width: number): ChunkSource {
  const top = AUTUMN_HORIZON_Y - 1400;
  return {
    left: 0,
    top,
    width,
    height: 1400,
    paint(s) {
      const w = width * FINE;
      for (let i = 0; i < AUTUMN_BANDS.length; i++) {
        const [start, color] = AUTUMN_BANDS[i];
        const end = i + 1 < AUTUMN_BANDS.length ? AUTUMN_BANDS[i + 1][0] : AUTUMN_HORIZON_Y - top;
        s.rect(box(0, (AUTUMN_HORIZON_Y - end) * FINE, w, (end - start) * FINE), color);
      }
      for (let i = 0; i + 1 < AUTUMN_BANDS.length; i++) {
        const seam = (AUTUMN_HORIZON_Y - AUTUMN_BANDS[i + 1][0]) * FINE;
        const above = AUTUMN_BANDS[i + 1][1];
        [0.75, 0.5, 0.25].forEach((t, k) => {
          s.dither(box(0, seam + k * 2, w, 2), { under: null, over: above, t });
        });
      }
    },
  };
}

// The low sun: its three discs round on the fine grid, each edge feathered
// 2 fine into the disc outside it.
export function lowSunHd(): ChunkSource {
  const cx = SUN_CENTRE.x * FINE + 1.5;
  const cy = SUN_CENTRE.y * FINE + 1.5;
  const outer = SUN_DISCS[0][0];
  return {
    left: SUN_CENTRE.x - outer - 1,
    top: SUN_CENTRE.y - outer - 1,
    width: outer * 2 + 3,
    height: outer * 2 + 3,
    paint(s) {
      for (const [r, color] of SUN_DISCS) {
        const fr = r * FINE + 1.5;
        s.disc({ cx, cy, r: fr }, color);
        for (let y = Math.floor(cy - fr - 2); y <= cy + fr + 2; y++) {
          for (let x = Math.floor(cx - fr - 2); x <= cx + fr + 2; x++) {
            const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
            if (d > fr && d <= fr + 2 && s.ink(x, y) && bayer(x, y) < 0.5) s.set(x, y, color);
          }
        }
      }
    },
  };
}

// The dust across the zenith: the same grains from the same generator, each a
// 2-fine mark (L6), opaque.
export function dustBandHd(width: number): ChunkSource {
  return {
    left: 0,
    top: -10,
    width,
    height: 230,
    paint(s) {
      const next = skyRandom(0x2b1d);
      for (let i = 0; i < width * 3; i++) {
        const x = next() * width;
        const across = (next() + next() + next() - 1.5) * 22;
        const y = 170 - (x / width) * 140 + across;
        // Classic's whole pixel, corners a shade down: smaller specks thinned
        // the band to nothing beside classic's.
        const fx = Math.floor(x * FINE);
        const fy = Math.floor(y) * FINE;
        s.rect(box(fx, fy, 3, 3), loOf(DB32.deepKoamaru))
          .rect(box(fx + 1, fy, 1, 3), DB32.deepKoamaru)
          .rect(box(fx, fy + 1, 3, 1), DB32.deepKoamaru);
      }
    },
  };
}

// The spiral in stars: the dotted runs as 2×2 dots, a fainter star midway
// along each run, the corners as bright stars in a little radial haze.
export function spiralHd(): ChunkSource {
  const at = (p: readonly [number, number]): [number, number] => [SPIRAL_CENTRE_X + p[0], SPIRAL_CENTRE_Y + p[1]];
  return {
    left: SPIRAL_CENTRE_X - 66,
    top: SPIRAL_CENTRE_Y - 40,
    width: 132,
    height: 80,
    paint(s) {
      for (let i = 0; i + 1 < SPIRAL_CORNERS.length; i++) {
        const [ax, ay] = at(SPIRAL_CORNERS[i]);
        const [bx, by] = at(SPIRAL_CORNERS[i + 1]);
        const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let k = 3; k < steps - 2; k += 4) {
          const x = Math.round(ax + ((bx - ax) * k) / steps);
          const y = Math.round(ay + ((by - ay) * k) / steps);
          s.rect(box(x * FINE, y * FINE, 2, 2), DB32.royalBlue);
        }
        star(s, { x: Math.round((ax + bx) / 2), y: Math.round((ay + by) / 2), bright: false, color: DB32.lightSteel });
      }
      for (const corner of SPIRAL_CORNERS) {
        const [x, y] = at(corner);
        cornerStar(s, { x, y });
      }
    },
  };
}

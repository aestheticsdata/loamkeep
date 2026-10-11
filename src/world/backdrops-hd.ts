import { DB32 } from '@constants';
import { FINE, type FineCanvas } from '@hd/fine-canvas';
import type { Vec2 } from '@types';
import type { BackdropKind } from '@world/level';
import {
  GROTTO_BACK,
  GROTTO_BACK_GLINT,
  GROTTO_BACK_GRAIN,
  GROTTO_BACK_STRATA,
  LIBRARY_BACK,
  LIBRARY_SHELF,
  LIBRARY_SPINES,
  MASONRY_BACK,
  MASONRY_DAMP,
  MASONRY_JOINT,
  MASONRY_LIGHT,
  MASONRY_MOSS,
} from '@world/tilemap';

// A backdrop region in logical px: left edge in the world, its width, and
// the rows it spans. Each classic painter hashes x from the region's own
// left edge and y from the world's top, so these do too.
export interface BackdropArea {
  left: number;
  width: number;
  top: number;
  bottom: number;
}

// Paints the part of one backdrop region that falls inside the canvas (a
// chunk, in world fine px). Every painter clips to the canvas first, so a
// level-sized region costs a chunk only its own share.
export function paintBackdropHd(canvas: FineCanvas, kind: BackdropKind, area: BackdropArea): void {
  const clip = clipTo(canvas, area);
  if (!clip) return;
  PAINTERS[kind](canvas, { area, clip });
}

interface Clip {
  // The intersection, in logical px, rounded out to whole logical pixels.
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Job {
  area: BackdropArea;
  clip: Clip;
}

function clipTo(canvas: FineCanvas, area: BackdropArea): Clip | null {
  const x0 = Math.max(area.left, Math.floor(canvas.x0 / FINE));
  const x1 = Math.min(area.left + area.width, Math.ceil((canvas.x0 + canvas.w) / FINE));
  const y0 = Math.max(area.top, Math.floor(canvas.y0 / FINE));
  const y1 = Math.min(area.bottom, Math.ceil((canvas.y0 + canvas.h) / FINE));
  return x0 < x1 && y0 < y1 ? { x0, x1, y0, y1 } : null;
}

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
const half = (over: number) => ({ under: null, over, t: 0.5 });

function base(s: FineCanvas, job: Job, color: number): void {
  const { x0, x1, y0, y1 } = job.clip;
  s.rect(box(x0 * FINE, y0 * FINE, (x1 - x0) * FINE, (y1 - y0) * FINE), color);
}

// The classic speckle hash, per logical pixel: x from the region's left, y
// from the world's top.
function speckle(x: number, y: number): number {
  const n = (x * 374761393 + y * 668265263) | 0;
  return (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
}

// A spine on a library shelf: where the shelf's walk has got to, and which
// spine of the shelf it is.
interface SpineAt {
  x: number;
  y: number;
  i: number;
}

// The classic library's per-spine hash: the spine's index is added to the
// mix, not to y.
function spineHash(at: SpineAt): number {
  const n = (at.x * 374761393 + at.y * 668265263 + at.i) | 0;
  return (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
}

// A wavering line 2 fine thick along every fine column of the clip, with an
// optional 1-fine lit edge above it.
interface Stratum {
  // The line's y in logical px, at a logical x from the region's left edge.
  y: (lx: number) => number;
  color: number;
  lit?: number;
}

function stratum(s: FineCanvas, job: Job, line: Stratum): void {
  const { x0, x1 } = job.clip;
  for (let fx = x0 * FINE; fx < x1 * FINE; fx++) {
    const lx = (fx + 0.5) / FINE - job.area.left;
    const fy = Math.round(line.y(lx) * FINE);
    s.rect(box(fx, fy, 1, 2), line.color);
    if (line.lit !== undefined) s.set(fx, fy - 1, line.lit);
  }
}

const PAINTERS: Record<BackdropKind, (s: FineCanvas, job: Job) => void> = {
  'indoor-dark': (s, job) => base(s, job, DB32.valhalla),
  'crypt-black': (s, job) => base(s, job, DB32.black),
  cave,
  grotto,
  library,
  masonry,
};

// Rock: striations as 2-fine wavering lines with a lit edge above, and the
// classic speckle as 2-fine grains (L6), a second hash doubling them.
function cave(s: FineCanvas, job: Job): void {
  base(s, job, DB32.verdigris);
  const { area, clip } = job;
  for (let bandY = area.top + 6; bandY < area.bottom; bandY += 12) {
    if (bandY < clip.y0 - 2 || bandY > clip.y1 + 2) continue;
    const phase = bandY * 0.13;
    stratum(s, job, { y: (lx) => bandY + Math.sin(lx * 0.04 + phase) * 1.5, color: DB32.opal, lit: DB32.dimGray });
  }
  for (let y = clip.y0; y < clip.y1; y++) {
    for (let x = clip.x0; x < clip.x1; x++) {
      const lx = x - area.left;
      const h = speckle(lx, y);
      if (h < 0.008) s.rect(box(x * FINE, y * FINE + 1, 2, 1), DB32.dimGray);
      else if (h < 0.016) grainLitAbove(s, { x: x * FINE, y: y * FINE + 1 });
      else if (speckle(lx + 7919, y) < 0.016) grainLitAbove(s, { x: x * FINE + 1, y: y * FINE + 2 });
    }
  }
}

function grainLitAbove(s: FineCanvas, at: Vec2): void {
  s.rect(box(at.x, at.y - 1, 2, 1), DB32.dimGray).rect(box(at.x, at.y, 2, 1), DB32.opal);
}

// The grotto's back wall: strata as 2-fine lines, grain as 2-fine marks, and
// the glints as small plus-shaped sparks.
function grotto(s: FineCanvas, job: Job): void {
  base(s, job, GROTTO_BACK);
  const { area, clip } = job;
  for (let bandY = area.top + 20; bandY < area.bottom; bandY += 44) {
    if (bandY < clip.y0 - 12 || bandY > clip.y1 + 12) continue;
    const phase = bandY * 0.07;
    stratum(s, job, {
      y: (lx) => bandY + Math.sin(lx * 0.021 + phase) * 4 + Math.sin(lx * 0.007 + phase * 2) * 6,
      color: GROTTO_BACK_STRATA,
    });
  }
  const firstY = area.top + Math.ceil((clip.y0 - area.top) / 4) * 4;
  for (let y = firstY; y < clip.y1; y += 4) {
    const firstX = Math.ceil((clip.x0 - area.left) / 4) * 4;
    for (let lx = firstX; area.left + lx < clip.x1; lx += 4) {
      const h = speckle(lx, y);
      const fx = (area.left + lx) * FINE;
      const fy = y * FINE;
      if (h < 0.016) {
        s.rect(box(fx, fy + 1, 3, 1), GROTTO_BACK_GLINT)
          .set(fx + 1, fy, GROTTO_BACK_GLINT)
          .set(fx + 1, fy + 2, GROTTO_BACK_GLINT);
      } else if (h < 0.2) {
        s.rect(box(fx, fy + 1, h < 0.08 ? 5 : 2, 1), GROTTO_BACK_GRAIN);
      }
    }
  }
}

// The library's back wall: shelves with a lit lip, spines with a band of
// shadow across them, pilasters with a shaded side.
function library(s: FineCanvas, job: Job): void {
  base(s, job, LIBRARY_BACK);
  const { area, clip } = job;
  for (let y = area.top + 20; y < area.bottom; y += 24) {
    if (y < clip.y0 - 2 || y - 20 > clip.y1) continue;
    s.rect(box(clip.x0 * FINE, y * FINE, (clip.x1 - clip.x0) * FINE, 5), LIBRARY_SHELF);
    s.dither(box(clip.x0 * FINE, y * FINE + 5, (clip.x1 - clip.x0) * FINE, 1), half(LIBRARY_SHELF));
    let x = 0;
    let i = 0;
    while (x < area.width) {
      const h = spineHash({ x, y, i });
      const w = 2 + Math.floor(h * 3);
      const tall = 12 + Math.floor(h * 7);
      const gx = area.left + x;
      if (h > 0.08 && gx + w > clip.x0 && gx < clip.x1) {
        const color = LIBRARY_SPINES[Math.floor(h * 97) % LIBRARY_SPINES.length];
        const fx = gx * FINE;
        const fy = (y - tall) * FINE;
        s.rect(box(fx, fy, w * FINE, tall * FINE), color);
        s.rect(box(fx, fy, w * FINE, 1), LIBRARY_SHELF);
        s.dither(box(fx, fy + Math.floor(tall * 0.75), w * FINE, 2), half(LIBRARY_BACK));
        s.dither(box(fx + w * FINE - 1, fy + 1, 1, tall * FINE - 1), half(LIBRARY_BACK));
      }
      x += w + (h < 0.15 ? 3 : 1);
      i += 1;
    }
  }
  for (let x = 72; x < area.width; x += 160) {
    const gx = area.left + x;
    if (gx + 10 <= clip.x0 || gx >= clip.x1) continue;
    const span = box(gx * FINE, clip.y0 * FINE, 30, (clip.y1 - clip.y0) * FINE);
    s.rect(span, LIBRARY_SHELF);
    s.dither({ ...span, x: span.x + 26, w: 4 }, half(LIBRARY_BACK));
  }
}

// The cistern's back wall: joints 2 fine with a dithered edge, the lit dash
// on some blocks, damp streaks feathered at their sides, moss as a rounded
// patch.
function masonry(s: FineCanvas, job: Job): void {
  base(s, job, MASONRY_BACK);
  const { area, clip } = job;
  for (let y = area.top; y < area.bottom; y += 16) {
    if (y + 46 < clip.y0 || y > clip.y1) continue;
    const fy = y * FINE;
    s.rect(box(clip.x0 * FINE, fy, (clip.x1 - clip.x0) * FINE, 2), MASONRY_JOINT);
    s.dither(box(clip.x0 * FINE, fy + 2, (clip.x1 - clip.x0) * FINE, 1), half(MASONRY_JOINT));
    const offset = ((y - area.top) / 16) % 2 === 0 ? 0 : 16;
    for (let x = -offset; x < area.width; x += 32) {
      const gx = area.left + x;
      if (gx + 40 < clip.x0 || gx > clip.x1) continue;
      const fx = gx * FINE;
      s.rect(box(fx, fy, 2, 48), MASONRY_JOINT).dither(box(fx + 2, fy, 1, 48), half(MASONRY_JOINT));
      const h = speckle(x, y);
      if (h < 0.3) s.rect(box(fx + 6, fy + 6, 78, 2), MASONRY_LIGHT);
      if (h > 0.85) {
        const dx = fx + (6 + Math.floor(h * 16)) * FINE;
        s.rect(box(dx + 1, fy + 3, 4, 90), MASONRY_DAMP);
        s.dither(box(dx, fy + 3, 1, 90), half(MASONRY_DAMP)).dither(box(dx + 5, fy + 3, 1, 90), half(MASONRY_DAMP));
      }
      if (h > 0.6 && h < 0.63) {
        const mx = fx + 12;
        const my = fy + 33;
        s.rect(box(mx + 1, my, 22, 12), MASONRY_MOSS).rect(box(mx, my + 1, 24, 10), MASONRY_MOSS);
      }
    }
  }
}

import { DB32 } from '@constants';
import { FineCanvas } from '@hd/fine-canvas';

// A small drawing enlarged for a greeting or a page, without the blocks:
// EPX (Scale2x) generalised to any whole factor. Each source pixel becomes
// an f×f block, and each of its four corners is cut along the diagonal to
// the colour of the two neighbours meeting there when they agree with each
// other and not with this pixel — the same test as EPX, so a 1-px line or a
// lone eye keeps its shape. Empty counts as a colour: an outer corner of the
// silhouette is cut away, an inner one filled. Staircases become 45° edges
// at the size the drawing is seen; no tone is added, no alpha.
//
// An eye — a lone pixel of one of the `eyes` tones, with none of its own
// tone beside it — is not cut: it becomes a round pupil, with a catch-light
// up and to the left once it is large enough to carry one, sitting in the
// colour around it (the frog's eyes on the corners of their bumps).
export function smoothScale(source: FineCanvas, factor: number, eyes: readonly number[] = []): FineCanvas {
  const out = new FineCanvas({
    x: source.x0 * factor,
    y: source.y0 * factor,
    w: source.w * factor,
    h: source.h * factor,
  });
  for (let sy = source.y0; sy < source.y0 + source.h; sy++) {
    for (let sx = source.x0; sx < source.x0 + source.w; sx++) {
      const own = source.get(sx, sy);
      const n = source.get(sx, sy - 1);
      const s = source.get(sx, sy + 1);
      const w = source.get(sx - 1, sy);
      const e = source.get(sx + 1, sy);
      const eye = eyes.includes(own) && ![n, s, w, e].includes(own);
      // Under an eye, the cell is painted as the colour around it would be.
      const p = eye ? surrounding([n, s, w, e]) : own;
      for (let j = 0; j < factor; j++) {
        const v = (j + 0.5) / factor;
        const top = v < 0.5;
        const vertical = top ? n : s;
        const across = top ? s : n;
        const dv = top ? v : 1 - v;
        for (let i = 0; i < factor; i++) {
          const u = (i + 0.5) / factor;
          const left = u < 0.5;
          const horizontal = left ? w : e;
          const opposite = left ? e : w;
          const du = left ? u : 1 - u;
          const cut = vertical === horizontal && vertical !== p && vertical !== opposite && horizontal !== across;
          let c = cut && du + dv < 0.5 ? vertical : p;
          if (eye) c = pupil({ u, v, factor }) ?? c;
          if (c === GLINT) c = DB32.white;
          else if (c === PUPIL) c = own;
          if (c >= 0) out.set(sx * factor + i, sy * factor + j, c);
        }
      }
    }
  }
  return out;
}

const EMPTY = -1;
const PUPIL = -2;
const GLINT = -3;

// The colour an eye sits in: the most common ink among its four neighbours,
// or none.
function surrounding(around: readonly number[]): number {
  const ink = around.filter((c) => c >= 0);
  if (ink.length === 0) return EMPTY;
  return ink.reduce((best, c) => (ink.filter((x) => x === c).length > ink.filter((x) => x === best).length ? c : best));
}

// Where a point of an eye's cell falls (u, v from 0 to 1 across it): in the
// round pupil, on its catch-light, or outside both (null).
interface EyePoint {
  u: number;
  v: number;
  factor: number;
}

function pupil(at: EyePoint): number | null {
  const d = Math.hypot(at.u - 0.5, at.v - 0.5);
  if (d > 0.42) return null;
  if (at.factor >= 9 && Math.hypot(at.u - 0.36, at.v - 0.36) < 0.1) return GLINT;
  return PUPIL;
}

// A drawing on the fine grid brought back to one pixel per logical pixel,
// each read at its centre fine pixel.
export function toLogical(fine: FineCanvas, per: number): FineCanvas {
  const x0 = Math.floor(fine.x0 / per);
  const y0 = Math.floor(fine.y0 / per);
  const out = new FineCanvas({
    x: x0,
    y: y0,
    w: Math.ceil((fine.x0 + fine.w) / per) - x0,
    h: Math.ceil((fine.y0 + fine.h) / per) - y0,
  });
  const mid = Math.floor(per / 2);
  for (let y = out.y0; y < out.y0 + out.h; y++) {
    for (let x = out.x0; x < out.x0 + out.w; x++) {
      const c = fine.get(x * per + mid, y * per + mid);
      if (c >= 0) out.set(x, y, c);
    }
  }
  return out;
}

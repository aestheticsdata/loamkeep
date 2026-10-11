import { DB32 } from '@constants';
import type { LogicalRect } from '@hd/chunk-layer';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { bayer } from '@hd/palette';

// The dog-ear's size, fine px.
const EAR = 42;

// A sheet of parchment on the fine grid (RECIPES §7), ported from the
// prototype's page 5: pancho with a dithered twine vignette that darkens
// where two edges meet, the classic 2-logical border as 6 fine — loulou,
// three of oiledCedar, a bevel lit top-left and shaded bottom-right, a 50 %
// rope shadow on the paper — and a dog-ear turned up at the bottom right,
// the corner cut away to whatever is behind.
export function parchmentHd(frame: LogicalRect): FineCanvas {
  const fx = frame.x * FINE;
  const fy = frame.y * FINE;
  const fw = frame.w * FINE;
  const fh = frame.h * FINE;
  const s = new FineCanvas({ x: fx - 3, y: fy - 3, w: fw + 6, h: fh + 6 });
  s.rect({ x: fx, y: fy, w: fw, h: fh }, DB32.pancho);
  s.dither(
    { x: fx, y: fy, w: fw, h: fh },
    {
      under: null,
      over: DB32.twine,
      t: (px, py) => {
        const ex = Math.min(px - fx, fx + fw - 1 - px);
        const ey = Math.min(py - fy, fy + fh - 1 - py);
        const v = Math.max(0, 1 - ex / 40) ** 1.6 + Math.max(0, 1 - ey / 40) ** 1.6;
        return Math.min(0.6, 0.45 * v);
      },
    },
  );
  const ring = (i: number, lit: number, shade: number) => {
    const x = fx - 3 + i;
    const y = fy - 3 + i;
    const w = fw + 6 - 2 * i;
    const h = fh + 6 - 2 * i;
    s.rect({ x, y, w, h: 1 }, lit).rect({ x, y, w: 1, h }, lit);
    s.rect({ x, y: y + h - 1, w, h: 1 }, shade).rect({ x: x + w - 1, y, w: 1, h }, shade);
  };
  ring(0, DB32.loulou, DB32.loulou);
  for (let i = 1; i < 4; i++) ring(i, DB32.oiledCedar, DB32.oiledCedar);
  ring(4, DB32.rope, DB32.loulou);
  s.dither({ x: fx + 2, y: fy + 2, w: fw - 4, h: 2 }, { under: null, over: DB32.rope, t: 0.5 });
  s.dither({ x: fx + 2, y: fy + 2, w: 2, h: fh - 4 }, { under: null, over: DB32.rope, t: 0.5 });

  // The dog-ear: the corner beyond the fold is gone; the flap is twine
  // darkening to rope toward its edges, with a pancho line along the fold
  // and a 50 % twine shadow cast on the page.
  const ox = fx + fw + 2;
  const oy = fy + fh + 2;
  const cut: [number, number][] = [];
  for (let py = oy - 2 * EAR; py <= oy; py++) {
    for (let px = ox - 2 * EAR; px <= ox; px++) {
      const dx = ox - px;
      const dy = oy - py;
      const k = dx + dy - EAR;
      if (dx < 0 || dy < 0) continue;
      if (k < 0 && dx <= EAR && dy <= EAR) cut.push([px, py]);
      else if (dx <= EAR && dy <= EAR) {
        const edge = dx >= EAR - 1 || dy >= EAR - 1;
        s.set(px, py, k < 2 ? DB32.pancho : edge || bayer(px, py) < Math.min(0.6, k / 60) ? DB32.rope : DB32.twine);
      } else if (dx <= EAR + 5 && dy <= EAR + 5 && k >= 0 && s.get(px, py) === DB32.pancho && bayer(px, py) < 0.5) {
        s.set(px, py, DB32.twine);
      }
    }
  }
  s.clear(cut);
  return s;
}

// The rule under a page's title: 2 fine of oiledCedar over 1 of twine, both
// ends fading into the paper over 12 fine.
export function ruleHd(at: LogicalRect): FineCanvas {
  const x = at.x * FINE;
  const y = at.y * FINE;
  const w = at.w * FINE;
  const s = new FineCanvas({ x, y, w, h: 3 });
  s.rect({ x, y, w, h: 2 }, DB32.oiledCedar).rect({ x, y: y + 2, w, h: 1 }, DB32.twine);
  const fade: [number, number][] = [];
  s.forInk((px, py) => {
    const end = Math.min(px - x, x + w - 1 - px);
    if (end < 12 && bayer(px, py) >= end / 12) fade.push([px, py]);
  });
  s.clear(fade);
  return s;
}

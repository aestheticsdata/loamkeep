import { DB32, SCREEN_WIDTH } from '@constants';
import { drawFigureHd, figureHdPose } from '@entities/figure-hd';
import { type ClassicRecorder, up } from '@hd/classic-recorder';
import { type CritterLayers, haloFromClassic } from '@hd/critter-hd';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { bayer } from '@hd/palette';
import { hash, type TitleMood, type WandererFrame } from '@systems/title-art';

// The title scene in HD, by the bundle's laws (it is not in the bundle). Only
// what reads at a glance is redrawn: the sky, the stars and the sun; the
// scenery's silhouettes; the wordmark. The layers that move every frame —
// clouds, mist, twinkles — stay classic in both arts.

// Where the sky stops: the horizon of title-art.ts.
const HORIZON_Y = 150;

// The sky, stars and sun. Each band seam is three 2-fine steps of the lower
// band dithered up into the one above (25 / 50 / 75 %), where classic bleeds
// one pixel in two and one in four; the stars are 2×2 points; the sun's rings
// are round and feathered 2 fine into the ring outside them.
export function titleBackdropHd(mood: TitleMood): CritterLayers {
  const s = new FineCanvas({ x: 0, y: 0, w: SCREEN_WIDTH * FINE, h: HORIZON_Y * FINE });
  const w = SCREEN_WIDTH * FINE;
  mood.bands.forEach(([y0, color], i) => {
    const y1 = i + 1 < mood.bands.length ? mood.bands[i + 1][0] : HORIZON_Y;
    s.rect({ x: 0, y: y0 * FINE, w, h: (y1 - y0) * FINE }, color);
  });
  mood.bands.forEach(([y0, color], i) => {
    if (i === 0) return;
    [0.25, 0.5, 0.75].forEach((t, k) => {
      s.dither({ x: 0, y: y0 * FINE - 6 + k * 2, w, h: 2 }, { under: null, over: color, t });
    });
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

// The wordmark: its 3×3 blocks chamfered. Round twice to cut the outer
// corners, bridge the elbows three times to fill the inner ones, so a
// diagonal stroke reads as a diagonal rather than a stair of squares.
export function wordmarkHd(classic: ClassicRecorder): CritterLayers {
  const s = up(classic);
  s.round().round().elbows().elbows().elbows();
  return { body: s, halo: haloFromClassic(classic) };
}

// The wanderer on the title: the HD figure, breathing, and the hem lifting
// off its back as a 2-fine strip.
export function wandererHd(frame: WandererFrame): CritterLayers {
  const pose = { airborne: false, swimming: false, stepOffset: 0, bodyBob: frame.bodyBob, swimPhase: 0 };
  const s = drawFigureHd(figureHdPose(pose));
  if (frame.hem) s.rect({ x: -17, y: -18 + frame.bodyBob * FINE, w: 2, h: 9 }, DB32.valhalla);
  return { body: s, halo: null };
}

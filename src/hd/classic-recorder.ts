import type { GlowSpec } from '@entities/glow';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import type { Graphics } from 'pixi.js';

// One filled rect, in logical px, as a classic draw function laid it down.
export interface ClassicRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  alpha: number;
}

type FillStyle = number | { color: number; alpha?: number };

// A stand-in for Pixi's Graphics that records `rect().fill()` instead of
// drawing it. Every classic sprite is drawn with nothing else (plus the
// sketchbook's integer setTransform), so handing one of these to a classic
// draw function yields exactly what it paints: the ops for `up()` to lift ×3,
// and the mask the footprint law compares the HD drawing against. Runs
// without a renderer, so the footprint test runs in Node.
export class ClassicRecorder {
  readonly rects: ClassicRect[] = [];
  // Every drawGlow laid down, as the light it describes rather than the
  // stack of translucent rows classic draws it with.
  readonly glows: GlowSpec[] = [];
  private transform: { sx: number; sy: number; tx: number; ty: number } | null = null;

  // Pixi's setTransform(a, b, c, d, tx, ty). Only scale and translation are
  // ever used by the game.
  setTransform(...m: [number, number, number, number, number, number]): this {
    this.transform = { sx: m[0], sy: m[3], tx: m[4], ty: m[5] };
    return this;
  }

  resetTransform(): this {
    this.transform = null;
    return this;
  }

  clear(): this {
    this.rects.length = 0;
    this.glows.length = 0;
    return this;
  }

  // Called by drawGlow in place of its rows (see glow.ts).
  recordGlow(glow: GlowSpec): void {
    const t = this.transform;
    this.glows.push(
      t ? { ...glow, x: glow.x * t.sx + t.tx, y: glow.y * t.sy + t.ty, radius: glow.radius * t.sx } : glow,
    );
  }

  rect(x: number, y: number, w: number, h: number): { fill(style: FillStyle): ClassicRecorder } {
    const t = this.transform;
    const box = t ? { x: x * t.sx + t.tx, y: y * t.sy + t.ty, w: w * t.sx, h: h * t.sy } : { x, y, w, h };
    return {
      fill: (style) => {
        const color = typeof style === 'number' ? style : style.color;
        const alpha = typeof style === 'number' ? 1 : (style.alpha ?? 1);
        this.rects.push({ ...box, color, alpha });
        return this;
      },
    };
  }

  // The recorder, typed as what a classic draw function asks for.
  get graphics(): Graphics {
    return this as unknown as Graphics;
  }

  // The logical pixels the opaque rects cover, as the screen shows them:
  // rasterised on the fine grid first, so a rect at a half logical pixel
  // counts where its 9 fine pixels land, and a logical pixel is ink when at
  // least 5 of its 9 are — the same majority the footprint law reads the HD
  // drawing by. Translucent fills (glows) are not part of a silhouette.
  mask(): Set<string> {
    const fine = new Set<string>();
    for (const r of this.rects) {
      if (r.alpha !== 1) continue;
      const x0 = Math.round(r.x * FINE);
      const x1 = Math.round((r.x + r.w) * FINE);
      const y0 = Math.round(r.y * FINE);
      const y1 = Math.round((r.y + r.h) * FINE);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) fine.add(`${x},${y}`);
    }
    const counts = new Map<string, number>();
    for (const key of fine) {
      const [x, y] = key.split(',').map(Number);
      const cell = `${Math.floor(x / FINE)},${Math.floor(y / FINE)}`;
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, n]) => n >= 5).map(([cell]) => cell));
  }
}

// Records one call of a classic draw function.
export function record(draw: (g: Graphics) => void): ClassicRecorder {
  const recorder = new ClassicRecorder();
  draw(recorder.graphics);
  return recorder;
}

// The classic drawing's opaque rects, ×3 on the fine grid: the block every
// derived recipe starts from. The raster keeps one logical pixel of margin
// all round, for the passes that grow a silhouette (elbows, a drop shadow).
export function up(recorder: ClassicRecorder): FineCanvas {
  const rects = recorder.rects.filter((r) => r.alpha === 1);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  // Bounds rounded outward: a rect at a half logical pixel must not put the
  // raster's own origin between fine pixels.
  const left = Math.floor(x0 * FINE) - FINE;
  const top = Math.floor(y0 * FINE) - FINE;
  const canvas = new FineCanvas({
    x: left,
    y: top,
    w: Math.ceil(x1 * FINE) + FINE - left,
    h: Math.ceil(y1 * FINE) + FINE - top,
  });
  for (const r of rects) canvas.rect({ x: r.x * FINE, y: r.y * FINE, w: r.w * FINE, h: r.h * FINE }, r.color);
  return canvas;
}

import { bayer, RAMP } from '@hd/palette';

// One fine pixel is a third of a logical one: a screen pixel at the stage's ×3.
export const FINE = 3;

// No colour: the raster's transparent pixel. DB32 has no negative tones.
const EMPTY = -1;

// A box on the fine grid.
export interface FineBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Ordered dither of `over` on top of `under`, at density `t` (a number, or a
// function of the fine pixel for a gradient). `under: null` keeps whatever is
// already there, which is how a dither is laid over a drawn shape.
export interface DitherSpec {
  under: number | null;
  over: number;
  t: number | ((x: number, y: number) => number);
}

// A gradient from density `from` to `to` across the box (0 → 1 by default).
export interface GradientSpec {
  under: number | null;
  over: number;
  from?: number;
  to?: number;
}

// Dither restricted to pixels that already hold one of `from`.
export interface ShadeSpec {
  from: number | readonly number[];
  to: number;
  t: number | ((x: number, y: number) => number);
}

export interface FineCircle {
  cx: number;
  cy: number;
  r: number;
}

// A ring: the pixels within `width` of the circle's edge, inside it.
export interface FineRing extends FineCircle {
  width: number;
}

export interface FineSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// The fine-pixel raster every HD drawing is authored in, then baked once into
// a texture (bake.ts). Coordinates are fine px around the sprite's own anchor —
// feet or base on y = 0, the classic convention — so the buffer's origin
// (x0, y0) is usually negative. Writes outside the buffer are dropped, like a
// clip, so a recipe never has to guard its edges.
//
// Ported from design_handoff_hd_pass/prototype/engine.js (`F`), with the
// positional arguments folded into boxes and specs.
export class FineCanvas {
  readonly x0: number;
  readonly y0: number;
  readonly w: number;
  readonly h: number;
  readonly pixels: Int32Array;

  constructor(box: FineBox) {
    this.x0 = box.x;
    this.y0 = box.y;
    this.w = box.w;
    this.h = box.h;
    this.pixels = new Int32Array(box.w * box.h).fill(EMPTY);
  }

  private index(x: number, y: number): number {
    const lx = x - this.x0;
    const ly = y - this.y0;
    return lx < 0 || ly < 0 || lx >= this.w || ly >= this.h ? -1 : ly * this.w + lx;
  }

  // The colour at a fine pixel, or -1 where there is none.
  get(x: number, y: number): number {
    const i = this.index(x, y);
    return i < 0 ? EMPTY : this.pixels[i];
  }

  ink(x: number, y: number): boolean {
    return this.get(x, y) !== EMPTY;
  }

  set(x: number, y: number, color: number | null): this {
    if (color === null) return this;
    const i = this.index(x, y);
    if (i >= 0) this.pixels[i] = color;
    return this;
  }

  // Empty each listed fine pixel.
  clear(points: readonly (readonly [number, number])[]): this {
    for (const [x, y] of points) {
      const i = this.index(x, y);
      if (i >= 0) this.pixels[i] = EMPTY;
    }
    return this;
  }

  // A box whose edges fall between fine pixels — a classic rect drawn at a
  // half logical pixel, lifted ×3 — is snapped edge by edge to the nearest
  // pixel boundary, as the screen snaps it.
  rect(box: FineBox, color: number): this {
    const b = snap(box);
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) this.set(x, y, color);
    return this;
  }

  dither(area: FineBox, spec: DitherSpec): this {
    const box = snap(area);
    const { under, over, t } = spec;
    for (let y = box.y; y < box.y + box.h; y++) {
      for (let x = box.x; x < box.x + box.w; x++) {
        const density = typeof t === 'number' ? t : t(x, y);
        this.set(x, y, bayer(x, y) < density ? over : under);
      }
    }
    return this;
  }

  // Density ramps down the box, row by row.
  vgrad(box: FineBox, spec: GradientSpec): this {
    const { from = 0, to = 1 } = spec;
    return this.dither(box, { ...spec, t: (_x, y) => from + ((to - from) * (y - box.y + 0.5)) / box.h });
  }

  // Density ramps across the box, column by column.
  hgrad(box: FineBox, spec: GradientSpec): this {
    const { from = 0, to = 1 } = spec;
    return this.dither(box, { ...spec, t: (x) => from + ((to - from) * (x - box.x + 0.5)) / box.w });
  }

  // Every fine pixel whose centre is within r of the centre.
  disc(circle: FineCircle, color: number): this {
    return this.ring({ ...circle, width: circle.r + 1 }, color);
  }

  // The pixels whose centre lies in (r - width, r].
  ring(circle: FineRing, color: number): this {
    const { cx, cy, r, width } = circle;
    const inner = Math.max(0, r - width);
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = dx * dx + dy * dy;
        if (d <= r * r && (width > r || d > inner * inner)) this.set(x, y, color);
      }
    }
    return this;
  }

  // A stepped line, `thickness` fine px square at every step.
  line(segment: FineSegment, color: number, thickness = 1): this {
    const { x0, y0, x1, y1 } = segment;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n);
      const y = Math.round(y0 + ((y1 - y0) * s) / n);
      this.rect({ x, y, w: thickness, h: thickness }, color);
    }
    return this;
  }

  shade(area: FineBox, spec: ShadeSpec): this {
    const box = snap(area);
    const from = typeof spec.from === 'number' ? [spec.from] : spec.from;
    const { to, t } = spec;
    for (let y = box.y; y < box.y + box.h; y++) {
      for (let x = box.x; x < box.x + box.w; x++) {
        const density = typeof t === 'number' ? t : t(x, y);
        if (from.includes(this.get(x, y)) && bayer(x, y) < density) this.set(x, y, to);
      }
    }
    return this;
  }

  // Every pixel of `from` inside the box becomes `to`.
  recolor(box: FineBox, from: number | readonly number[], to: number): this {
    return this.shade(box, { from, to, t: 1 });
  }

  // Calls `fn` for every inked pixel, in fine coordinates.
  forInk(fn: (x: number, y: number, color: number) => void): void {
    for (let ly = 0; ly < this.h; ly++) {
      for (let lx = 0; lx < this.w; lx++) {
        const c = this.pixels[ly * this.w + lx];
        if (c !== EMPTY) fn(lx + this.x0, ly + this.y0, c);
      }
    }
  }

  // The derived passes read the whole raster first and write after, so a
  // pixel a pass changes never changes what the pass sees of its neighbours.
  private apply(changes: readonly (readonly [number, number, number])[]): this {
    for (const [x, y, c] of changes) {
      const i = this.index(x, y);
      if (i >= 0) this.pixels[i] = c;
    }
    return this;
  }

  private collect(pick: (x: number, y: number, color: number) => number | undefined): this {
    const changes: [number, number, number][] = [];
    this.forInk((x, y, c) => {
      const next = pick(x, y, c);
      if (next !== undefined) changes.push([x, y, next]);
    });
    return this.apply(changes);
  }

  // A 1-fine outline on the inside of the silhouette: every inked pixel with
  // an empty 4-neighbour.
  outline(color: number): this {
    return this.collect((x, y) =>
      !this.ink(x - 1, y) || !this.ink(x + 1, y) || !this.ink(x, y - 1) || !this.ink(x, y + 1) ? color : undefined,
    );
  }

  // Selout (L3), light from the upper left: an edge facing down or right
  // takes its tone's shadow, one facing up or left its lit neighbour. `skip`
  // lists the tones that give light, which never take shade.
  edges(skip: readonly number[] = [], ramp: ReadonlyMap<number, readonly [number, number]> = RAMP): this {
    return this.collect((x, y, c) => {
      if (skip.includes(c)) return undefined;
      const steps = ramp.get(c);
      if (!steps) return undefined;
      if (!this.ink(x, y + 1) || !this.ink(x + 1, y)) return steps[1];
      if (!this.ink(x, y - 1) || !this.ink(x - 1, y)) return steps[0];
      return undefined;
    });
  }

  // A material boundary: a pixel of `a` touching `b` below or to the right
  // becomes `c`.
  seam(a: number, b: number, c: number): this {
    return this.collect((x, y, v) =>
      v === a && (this.get(x + 1, y) === b || this.get(x, y + 1) === b) ? c : undefined,
    );
  }

  // Removes convex corner pixels, one fine px per corner. A logical pixel
  // keeps 8 of its 9, so the footprint does not move.
  round(): this {
    return this.collect((x, y) => {
      const u = this.ink(x, y - 1);
      const d = this.ink(x, y + 1);
      const l = this.ink(x - 1, y);
      const r = this.ink(x + 1, y);
      const corner = (!u && !l && d && r) || (!u && !r && d && l) || (!d && !l && u && r) || (!d && !r && u && l);
      return corner ? EMPTY : undefined;
    });
  }

  // Fills the inner elbow of a staircase step, one fine px into an empty
  // logical pixel, which is 1 of 9 and so does not move the footprint either.
  elbows(): this {
    const changes: [number, number, number][] = [];
    const both = (a: number, b: number) => a !== EMPTY && b !== EMPTY;
    for (let y = this.y0; y < this.y0 + this.h; y++) {
      for (let x = this.x0; x < this.x0 + this.w; x++) {
        if (this.ink(x, y)) continue;
        const u = this.get(x, y - 1);
        const d = this.get(x, y + 1);
        const l = this.get(x - 1, y);
        const r = this.get(x + 1, y);
        if (both(u, l) && !this.ink(x + 1, y) && !this.ink(x, y + 1)) changes.push([x, y, l]);
        else if (both(u, r) && !this.ink(x - 1, y) && !this.ink(x, y + 1)) changes.push([x, y, r]);
        else if (both(d, l) && !this.ink(x + 1, y) && !this.ink(x, y - 1)) changes.push([x, y, l]);
        else if (both(d, r) && !this.ink(x - 1, y) && !this.ink(x, y - 1)) changes.push([x, y, r]);
      }
    }
    return this.apply(changes);
  }

  // Copies every inked pixel of `other` onto this raster, at the same fine
  // coordinates. How a shape built with the whole-raster passes (round,
  // elbows, edges) on a scratch canvas lands in a shared one.
  blit(other: FineCanvas): this {
    other.forInk((x, y, c) => this.set(x, y, c));
    return this;
  }

  // Every pixel of one tone becomes another, across the whole raster.
  swap(from: number, to: number): this {
    for (let i = 0; i < this.pixels.length; i++) if (this.pixels[i] === from) this.pixels[i] = to;
    return this;
  }
}

// A box with its edges snapped to the nearest pixel boundary.
function snap(box: FineBox): FineBox {
  const x = Math.round(box.x);
  const y = Math.round(box.y);
  return { x, y, w: Math.round(box.x + box.w) - x, h: Math.round(box.y + box.h) - y };
}

import { DB32 } from '@constants';
import { type ClassicRecorder, up } from '@hd/classic-recorder';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { bayer, RAMP } from '@hd/palette';
import { smoothScale, toLogical } from '@hd/smooth-scale';
import type { Vec2 } from '@types';

// A creature's HD drawing as two layers: the body, which the footprint law
// holds to the classic silhouette, and the glow, opaque dithered pixels laid
// under it (L1: a halo is not part of the footprint, and never alpha).
export interface CritterLayers {
  body: FineCanvas;
  halo: FineCanvas | null;
}

// What the common recipe needs to know about a creature.
export interface CritterHdOptions {
  // Tones that give light — a belly, a lure, an eye, a firefly — which
  // selout leaves lit (L4).
  emissive?: readonly number[];
  ramp?: ReadonlyMap<number, readonly [number, number]>;
  // Its translucent rects are light (the glowfish's halo): HD keeps them as
  // classic draws them, under the sprite, instead of dithering them.
  softLight?: boolean;
}

// Eyes: a classic single pixel of these tones becomes 2×2 fine, the rest of
// its logical pixel taken by what surrounds it — RECIPES §3.
const EYE_TONES: readonly number[] = [DB32.valhalla, DB32.black];

// The common recipe (RECIPES §3), for every creature the bundle does not
// draw by hand: the classic opaque rects ×3, corners rounded, selout lit
// from the upper left, eyes narrowed to 2×2. It refines the classic
// drawing and never redraws it, so every pose keeps its footprint.
export function critterBodyHd(classic: ClassicRecorder, options: CritterHdOptions = {}): FineCanvas {
  const s = up(classic);
  s.round();
  s.edges(options.emissive ?? [], options.ramp ?? RAMP);
  for (const r of classic.rects) {
    if (r.alpha !== 1 || r.w !== 1 || r.h !== 1 || !EYE_TONES.includes(r.color)) continue;
    narrowEye(s, { x: r.x * FINE, y: r.y * FINE });
  }
  return s;
}

// A 3×3 eye becomes 2×2 in its upper left, the other five fine pixels taken
// by the nearest non-eye ink beside it — unless the eye is on the silhouette,
// where narrowing it would eat into the outline.
function narrowEye(s: FineCanvas, at: Vec2): void {
  const around = [
    s.get(at.x + 3, at.y + 1),
    s.get(at.x - 1, at.y + 1),
    s.get(at.x + 1, at.y + 3),
    s.get(at.x + 1, at.y - 1),
  ];
  if (around.some((c) => c < 0)) {
    s.rect({ x: at.x, y: at.y, w: 3, h: 3 }, DB32.valhalla);
    return;
  }
  const fill = around.find((c) => !EYE_TONES.includes(c)) ?? DB32.valhalla;
  s.rect({ x: at.x, y: at.y, w: 3, h: 3 }, fill).rect({ x: at.x, y: at.y, w: 2, h: 2 }, DB32.valhalla);
}

// A glow: pixels of its colour at a density falling off with elliptic
// distance from the centre, opaque — the glowfish's halo (RECIPES §3), and
// every drawGlow's.
export interface HaloEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  // The density at the centre.
  peak: number;
  // The light's colour: the glowfish's cyan unless said otherwise.
  color?: number;
  // The colour past `rim` of the way out — the light's shadow on the ramp,
  // so the halo dims as it spreads instead of sparkling. Absent: one colour.
  outer?: number;
  rim?: number;
}

export function ellipseHalo(e: HaloEllipse): FineCanvas {
  const s = new FineCanvas({
    x: Math.floor(e.cx - e.rx) - 1,
    y: Math.floor(e.cy - e.ry) - 1,
    w: Math.ceil(e.rx * 2) + 3,
    h: Math.ceil(e.ry * 2) + 3,
  });
  const color = e.color ?? DB32.viking;
  const outer = e.outer ?? color;
  const rim = e.rim ?? 1;
  for (let y = s.y0; y < s.y0 + s.h; y++) {
    for (let x = s.x0; x < s.x0 + s.w; x++) {
      const d = Math.hypot((x + 0.5 - e.cx) / e.rx, (y + 0.5 - e.cy) / e.ry);
      if (d < 1 && bayer(x, y) < e.peak * (1 - d) ** 1.3) s.set(x, y, d > rim ? outer : color);
    }
  }
  return s;
}

// The classic drawing's translucent rects as opaque pixels: each dithers its
// colour in at its alpha as a density, and where rects overlap the denser
// wins, since Bayer thresholds nest. Lights (drawGlow) are not among them:
// HD lays classic's own rings under the sprite (art-body.ts, showGlows).
export function haloFromClassic(classic: ClassicRecorder): FineCanvas | null {
  const glows = classic.rects.filter((r) => r.alpha < 1 && r.alpha > 0);
  if (glows.length === 0) return null;
  let halo: FineCanvas | null = null;
  if (glows.length > 0) {
    const x0 = Math.min(...glows.map((r) => r.x));
    const y0 = Math.min(...glows.map((r) => r.y));
    const x1 = Math.max(...glows.map((r) => r.x + r.w));
    const y1 = Math.max(...glows.map((r) => r.y + r.h));
    const left = Math.floor(x0 * FINE);
    const top = Math.floor(y0 * FINE);
    halo = new FineCanvas({ x: left, y: top, w: Math.ceil(x1 * FINE) - left, h: Math.ceil(y1 * FINE) - top });
    // Densest last, so a faint outer rect never thins a bright inner one.
    for (const r of [...glows].sort((a, b) => a.alpha - b.alpha)) {
      halo.dither(
        { x: r.x * FINE, y: r.y * FINE, w: r.w * FINE, h: r.h * FINE },
        { under: null, over: r.color, t: r.alpha },
      );
    }
  }
  return halo;
}

export function critterHd(classic: ClassicRecorder, options: CritterHdOptions = {}): CritterLayers {
  return { body: critterBodyHd(classic, options), halo: haloFromClassic(classic) };
}

// The two layers as one raster to bake: the halo, then the body over it.
export function flatten(layers: CritterLayers): FineCanvas {
  return layers.halo ? merge(layers.halo, layers.body) : layers.body;
}

// Two rasters as one, the second laid over the first.
function merge(under: FineCanvas, over: FineCanvas): FineCanvas {
  const x0 = Math.min(under.x0, over.x0);
  const y0 = Math.min(under.y0, over.y0);
  const out = new FineCanvas({
    x: x0,
    y: y0,
    w: Math.max(under.x0 + under.w, over.x0 + over.w) - x0,
    h: Math.max(under.y0 + under.h, over.y0 + over.h) - y0,
  });
  return out.blit(under).blit(over);
}

// A green and the two it scallops into.
interface FoliageTones {
  base: number;
  lit: number;
  dark: number;
}

// Foliage (RECIPES §4): scallops on a 6-fine pitch — a lit arc of 3 fine px
// in the next-lighter tone over an offset row of 2-px arcs in the
// next-darker one.
function foliage(s: FineCanvas, tones: FoliageTones): void {
  const changes: [number, number, number][] = [];
  s.forInk((x, y, c) => {
    if (c !== tones.base) return;
    const u = ((x >> 1) + (Math.floor(y / 6) & 1) * 3) % 6;
    const v = ((y % 6) + 6) % 6;
    if (v === 0 && u < 3) changes.push([x, y, tones.lit]);
    else if (v === 3 && u >= 3 && u < 5) changes.push([x, y, tones.dark]);
  });
  for (const [x, y, c] of changes) s.set(x, y, c);
}

// A plant (RECIPES §4, `H.plant`): lifted, rounded, its staircases bridged,
// selout with the trunk spared, foliage scallops on both greens, and a
// catch-light down the trunk's left edge.
export function plantHd(classic: ClassicRecorder): CritterLayers {
  const s = up(classic);
  s.round().elbows().edges([DB32.oiledCedar, DB32.rope]);
  foliage(s, { base: DB32.eltGreen, lit: DB32.christi, dark: DB32.dell });
  foliage(s, { base: DB32.dell, lit: DB32.eltGreen, dark: DB32.opal });
  const lit: [number, number][] = [];
  s.forInk((x, y, c) => {
    if (c === DB32.oiledCedar && !s.ink(x - 1, y)) lit.push([x, y]);
  });
  for (const [x, y] of lit) s.set(x, y, DB32.rope);
  return { body: s, halo: haloFromClassic(classic) };
}

// A drawing shown large — a greeting's subject at ×3 to ×8, a book's sketch
// at page size — drawn at the size it is seen, never a small sprite blown up
// (RECIPES §7). `native` is the classic drawing at its own size and `scaled`
// the same drawing at the size it is shown (for its glows). The body is the
// native drawing smoothed up to the displayed size (smoothScale), then given
// selout as thick as the size calls for, so the rim reads like the in-world
// sprite's does at ×3.
interface LargeRecording {
  native: ClassicRecorder;
  scaled: ClassicRecorder;
  scale: number;
}

export function portraitHd(large: LargeRecording, options: CritterHdOptions = {}): CritterLayers {
  const body = smoothScale(toLogical(up(large.native), FINE), FINE * large.scale, EYE_TONES);
  thickEdges(body, { thickness: Math.max(1, Math.round(large.scale / 2)), ...options });
  // Its glows and translucent rects are laid under it as classic draws them
  // (shownLarge, showGlows): dithered at this size they read as dots.
  return { body, halo: null };
}

interface ThickEdges extends CritterHdOptions {
  thickness: number;
}

// Selout (L3, light from the upper left): a pixel within `thickness` fine
// px of the outline below or to the right takes its tone's shadow; one right
// on the outline above or to the left takes its lit neighbour. A lit rim as
// thick as the shadow read as a pale line drawn round the subject.
function thickEdges(s: FineCanvas, spec: ThickEdges): void {
  const skip = spec.emissive ?? [];
  const ramp = spec.ramp ?? RAMP;
  const changes: [number, number, number][] = [];
  s.forInk((x, y, c) => {
    if (skip.includes(c)) return;
    const steps = ramp.get(c);
    if (!steps) return;
    for (let k = 1; k <= spec.thickness; k++) {
      if (!s.ink(x, y + k) || !s.ink(x + k, y)) {
        changes.push([x, y, steps[1]]);
        return;
      }
      if (k === 1 && (!s.ink(x, y - 1) || !s.ink(x - 1, y))) {
        changes.push([x, y, steps[0]]);
        return;
      }
    }
  });
  for (const [x, y, c] of changes) s.set(x, y, c);
}

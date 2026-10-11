import type { Graphics } from 'pixi.js';

// A soft round light, for things that glow against the dark: concentric
// discs of translucent colour, each built from one rect per pixel row so the
// edge stays on the grid. The outer disc is fainter than the inner, and the
// overlap makes the middle brightest — a falloff in three steps. Squares
// would do the same job over water, but over pure black a translucent square
// reads as a box, not as light.
export interface GlowSpec {
  x: number;
  y: number;
  radius: number;
  color: number;
}

const RINGS: readonly (readonly [number, number])[] = [
  [1, 0.05],
  [0.66, 0.06],
  [0.36, 0.08],
];

export function drawGlow(g: Graphics, glow: GlowSpec): void {
  // A recorder (the HD pass's, see @hd/classic-recorder) takes the glow as a
  // light: HD lays these same rings under its sprite (@hd/art-body).
  const recorder = g as unknown as { recordGlow?: (glow: GlowSpec) => void };
  if (recorder.recordGlow) {
    recorder.recordGlow(glow);
    return;
  }
  paintGlow(g, glow);
}

// The rings themselves. In HD too: a light dithered into opaque dots read as
// a cloud of moving specks, not as light, and was rejected on sight — a glow
// is the one thing HD draws with alpha.
export function paintGlow(g: Graphics, glow: GlowSpec): void {
  for (const [scale, alpha] of RINGS) {
    const r = Math.max(1, Math.round(glow.radius * scale));
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy));
      g.rect(glow.x - half, glow.y + dy, half * 2 + 1, 1).fill({ color: glow.color, alpha });
    }
  }
}

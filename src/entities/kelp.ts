import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import { Graphics } from 'pixi.js';

// Authored description of a strand of glowing kelp: where it is rooted (on a
// lake bed, base on y = 0) and how tall it stands, in pixels.
export interface KelpSpec {
  x: number;
  y: number;
  height: number;
}

// A strand of kelp on the bed of the underground lake, swaying in a current
// nobody can feel, its leaf tips lit the grotto's cyan. Redrawn only when the
// sway moves a whole pixel.
export class Kelp implements Entity {
  readonly sprite: Graphics;

  private readonly spec: KelpSpec;
  private elapsed: number;
  private drawnPhase = Number.NaN;

  constructor(spec: KelpSpec) {
    this.spec = spec;
    this.elapsed = spec.x * 0.03;
    this.sprite = new Graphics();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const phase = Math.round(Math.sin(this.elapsed * 0.9) * 2);
    if (phase === this.drawnPhase) return;
    this.drawnPhase = phase;
    const g = this.sprite;
    g.clear();
    const h = this.spec.height;
    for (let y = 0; y < h; y++) {
      // The sway grows toward the tip: the root does not move at all.
      const x = Math.round((phase * y) / h + Math.sin(y * 0.4) * 0.8);
      g.rect(x, -y - 1, 1, 1).fill(DB32.eltGreen);
      if (y % 5 === 3) {
        const side = (y / 5) % 2 === 0 ? 1 : -2;
        g.rect(x + side, -y - 1, 2, 1).fill(DB32.christi);
        g.rect(x + side + (side > 0 ? 1 : 0), -y - 1, 1, 1).fill(DB32.viking);
      }
    }
    g.rect(Math.round(phase), -h - 1, 1, 1).fill(DB32.white);
  }
}

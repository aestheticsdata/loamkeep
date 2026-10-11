import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import type { AABB } from '@types';
import { Graphics } from 'pixi.js';

// Pixels a second the spores rise, and how far they sway as they go.
const RISE_SPEED = 7;
const SWAY = 5;

// Spores drifting up through a stretch of cave, one entity per stretch: a
// few dozen cyan specks rising slowly, swaying, fading in at the bottom of
// their box and out at the top, and starting again. Scenery, not a creature.
export class Spores implements Entity {
  readonly sprite: Graphics;

  private readonly area: AABB;
  private readonly seeds: readonly number[];
  private readonly phases: readonly number[];
  private elapsed = 0;

  constructor(area: AABB) {
    this.area = area;
    const count = Math.max(6, Math.round((area.width * area.height) / 2600));
    // Two independent values per spore — where along the box it rises, and
    // how far through its climb it starts — or they would line up on a
    // diagonal, the one thing drifting spores never do.
    this.seeds = Array.from({ length: count }, (_, i) => hash(i * 2 + area.x));
    this.phases = Array.from({ length: count }, (_, i) => hash(i * 2 + 1 + area.y));
    this.sprite = new Graphics();
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const g = this.sprite;
    g.clear();
    this.seeds.forEach((seed, i) => {
      const travel = (this.phases[i] * this.area.height + this.elapsed * RISE_SPEED * (0.6 + seed)) % this.area.height;
      const y = this.area.y + this.area.height - travel;
      const x = this.area.x + seed * this.area.width + Math.sin(this.elapsed * 0.8 + i) * SWAY;
      // Faint at both ends of the climb, brightest in the middle.
      const t = travel / this.area.height;
      const alpha = Math.min(1, t * 4, (1 - t) * 4);
      g.rect(Math.round(x), Math.round(y), 1, 1).fill({ color: i % 5 === 0 ? DB32.white : DB32.viking, alpha });
    });
  }
}

// A well-mixed 0..1 value for an integer.
function hash(n: number): number {
  let h = (n * 374761393) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

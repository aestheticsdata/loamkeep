import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import { ArtSwarm, type SwarmMember } from '@hd/art-body';
import type { CritterLayers } from '@hd/critter-hd';
import { FineCanvas } from '@hd/fine-canvas';
import type { AABB } from '@types';

// Pixels a second the spores rise, and how far they sway as they go.
const RISE_SPEED = 7;
const SWAY = 5;

// Spores drifting up through a stretch of cave, one entity per stretch: a
// few dozen cyan specks rising slowly, swaying, fading in at the bottom of
// their box and out at the top, and starting again. Scenery, not a creature.
export class Spores implements Entity {
  readonly sprite = new ArtSwarm('spores');

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
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const spores: SwarmMember[] = this.seeds.map((seed, i) => {
      const travel = (this.phases[i] * this.area.height + this.elapsed * RISE_SPEED * (0.6 + seed)) % this.area.height;
      // Faint at both ends of the climb, brightest in the middle.
      const t = travel / this.area.height;
      const alpha = Math.min(1, t * 4, (1 - t) * 4);
      const color = i % 5 === 0 ? DB32.white : DB32.viking;
      // HD has no alpha: the fade is how many of a 2×2 mote's fine pixels
      // are lit, in four steps.
      const lit = Math.round(alpha * 4);
      return {
        x: this.area.x + seed * this.area.width + Math.sin(this.elapsed * 0.8 + i) * SWAY,
        y: this.area.y + this.area.height - travel,
        draw: (g) => {
          g.rect(0, 0, 1, 1).fill({ color, alpha });
        },
        hd: { key: `${color}:${lit}`, draw: () => sporeHd({ color, lit }) },
      };
    });
    this.sprite.draw(spores);
  }
}

// A spore on the fine grid: a 2×2 mote, `lit` of its pixels on, in the
// order a fade-in reads best — the diagonal first.
interface SporeMote {
  color: number;
  // How many of its four fine pixels are lit.
  lit: number;
}

function sporeHd(spore: SporeMote): CritterLayers {
  const s = new FineCanvas({ x: 0, y: 0, w: 2, h: 2 });
  const order: [number, number][] = [
    [0, 0],
    [1, 1],
    [1, 0],
    [0, 1],
  ];
  for (const [x, y] of order.slice(0, spore.lit)) s.set(x, y, spore.color);
  return { body: s, halo: null };
}

// A well-mixed 0..1 value for an integer.
function hash(n: number): number {
  let h = (n * 374761393) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

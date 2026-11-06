import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import { ArtSwarm, type SwarmMember } from '@hd/art-body';
import type { CritterLayers } from '@hd/critter-hd';
import { FineCanvas } from '@hd/fine-canvas';
import type { AABB } from '@types';

// Pixels a second the specks rise: about what the updraft lifts the player
// at (see Player), so they read as the air that carries them.
const RISE_SPEED = 110;
// How long a speck's streak is, px, at its fastest.
const STREAK = 7;

// The specks rising up an updraft (the Updraft tiles, which draw nothing):
// cornflower dust and the odd white mote, streaked by the speed they go at,
// wrapping round from the top of the column to its foot. Scenery; the lift
// itself is the tiles' (see Player).
// The air an updraft carries: the grotto's cold cave dust, the warm air
// of the garden's vents and spring, twine with pancho glints, or the soot
// up the potting shed's flue and pipeworks, twine with oiledCedar flakes.
export const UPDRAFT_LOOK = {
  cave: 'cave',
  warm: 'warm',
  soot: 'soot',
} as const;

export type UpdraftLook = (typeof UPDRAFT_LOOK)[keyof typeof UPDRAFT_LOOK];

// Each look's specks: the most of them, and the odd glint among them.
const SPECKS: Record<UpdraftLook, { speck: number; glint: number }> = {
  [UPDRAFT_LOOK.cave]: { speck: DB32.cornflower, glint: DB32.white },
  [UPDRAFT_LOOK.warm]: { speck: DB32.twine, glint: DB32.pancho },
  [UPDRAFT_LOOK.soot]: { speck: DB32.twine, glint: DB32.oiledCedar },
};

export class Updraft implements Entity {
  readonly sprite = new ArtSwarm('updraft');

  private readonly area: AABB;
  private readonly look: UpdraftLook;
  private readonly seeds: readonly number[];
  private readonly phases: readonly number[];
  private elapsed = 0;

  constructor(area: AABB, look: UpdraftLook = UPDRAFT_LOOK.cave) {
    this.area = area;
    this.look = look;
    const count = Math.max(8, Math.round((area.width * area.height) / 260));
    this.seeds = Array.from({ length: count }, (_, i) => hash(i * 2 + area.y));
    this.phases = Array.from({ length: count }, (_, i) => hash(i * 2 + 1 + area.x));
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const specks: SwarmMember[] = this.seeds.map((seed, i) => {
      const speed = RISE_SPEED * (0.7 + seed * 0.6);
      const travel = (this.phases[i] * this.area.height + this.elapsed * speed) % this.area.height;
      const color = i % 6 === 0 ? SPECKS[this.look].glint : SPECKS[this.look].speck;
      const length = seed > 0.5 ? STREAK : STREAK - 3;
      return {
        x: this.area.x + (Math.floor(seed * 997) % this.area.width),
        y: this.area.y + this.area.height - travel,
        draw: (g) => {
          g.rect(0, 0, 1, length).fill(color);
        },
        hd: { key: `${color}:${length}`, draw: () => speckHd({ color, length }) },
      };
    });
    this.sprite.draw(specks);
  }
}

// A speck on the fine grid: a streak one fine pixel wide, its head lit and
// its tail a pixel apart from it, the way a thing moving fast leaves a gap.
interface Speck {
  color: number;
  // Logical px.
  length: number;
}

function speckHd(speck: Speck): CritterLayers {
  const h = speck.length * 3;
  const s = new FineCanvas({ x: 0, y: 0, w: 3, h });
  s.rect({ x: 1, y: 0, w: 1, h: h - 3 }, speck.color).set(1, h - 2, speck.color);
  return { body: s, halo: null };
}

// A well-mixed 0..1 value for an integer.
function hash(n: number): number {
  let h = (n * 374761393) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

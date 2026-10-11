import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import type { CritterLayers } from '@hd/critter-hd';
import { FineCanvas } from '@hd/fine-canvas';
import { hiOf, loOf } from '@hd/palette';
import type { Graphics } from 'pixi.js';

const FALL_SPEED = 14;
const SWAY_SPEED = 1.7;
const SWAY_WIDTH = 9;

const LEAF_COLORS = [DB32.tahitiGold, DB32.clairvoyant, DB32.rainforest, DB32.twine] as const;

// Authored description of a leaf: it drifts down from `top` to `bottom`
// around column `x`, swaying, then starts again at the top. `phase` (0..1)
// sets where in that fall it begins, so a handful of leaves never move as one.
export interface FallingLeafSpec {
  x: number;
  top: number;
  bottom: number;
  phase: number;
}

// Scenery that moves: one autumn leaf on an endless fall. No hitbox, no page
// — the garden's light is the point, and the leaves are what shows the air
// is moving in it.
export class FallingLeaf implements Entity {
  readonly sprite = new ArtBody('leaf');

  private readonly spec: FallingLeafSpec;
  private elapsedTime: number;
  private flip = -1;

  constructor(spec: FallingLeafSpec) {
    this.spec = spec;
    this.elapsedTime = (spec.phase * (spec.bottom - spec.top)) / FALL_SPEED;
    this.update(0);
  }

  update(dt: number): void {
    this.elapsedTime += dt;
    const span = this.spec.bottom - this.spec.top;
    const fallen = (this.elapsedTime * FALL_SPEED) % span;
    const sway = Math.sin(this.elapsedTime * SWAY_SPEED);
    this.sprite.x = this.spec.x + sway * SWAY_WIDTH;
    this.sprite.y = this.spec.top + fallen;
    // The leaf tips as it swings: flat at the ends of the sway, on its edge
    // in the middle.
    const flip = Math.abs(sway) > 0.5 ? 0 : 1;
    if (flip === this.flip) return;
    this.flip = flip;
    const color = LEAF_COLORS[Math.floor(this.spec.x) % LEAF_COLORS.length];
    this.sprite.draw(
      (g) => drawLeaf(g, { color, flip }),
      () => leafHd({ color, flip }),
    );
  }
}

// A leaf's look: its colour, and whether it lies flat (0) or on its edge (1).
export interface LeafPose {
  color: number;
  flip: number;
}

export function drawLeaf(g: Graphics, leaf: LeafPose): void {
  if (leaf.flip === 0) {
    g.rect(-1, 0, 3, 1).fill(leaf.color);
    g.rect(0, -1, 1, 1).fill(leaf.color);
  } else {
    g.rect(0, -1, 1, 2).fill(leaf.color);
  }
}

// On the fine grid: lying flat, a pointed leaf lit along its top and shaded
// along its bottom, its stalk curling up; on its edge, a thin blade with its
// shaded side.
export function leafHd(leaf: LeafPose): CritterLayers {
  const s = new FineCanvas({ x: -3, y: -3, w: 9, h: 6 });
  const { color } = leaf;
  if (leaf.flip === 0) {
    s.rect({ x: -2, y: 0, w: 7, h: 1 }, hiOf(color)).rect({ x: -3, y: 1, w: 9, h: 1 }, color);
    s.rect({ x: -2, y: 2, w: 7, h: 1 }, loOf(color));
    s.set(1, -3, color).set(1, -2, color).rect({ x: 0, y: -1, w: 3, h: 1 }, color);
  } else {
    s.rect({ x: 0, y: -3, w: 1, h: 6 }, color).rect({ x: 1, y: -3, w: 1, h: 6 }, loOf(color));
  }
  return { body: s, halo: null };
}

import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import { Graphics } from 'pixi.js';

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
  readonly sprite: Graphics;

  private readonly spec: FallingLeafSpec;
  private elapsedTime: number;
  private flip = -1;

  constructor(spec: FallingLeafSpec) {
    this.spec = spec;
    this.elapsedTime = (spec.phase * (spec.bottom - spec.top)) / FALL_SPEED;
    this.sprite = new Graphics();
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
    this.sprite.clear();
    if (flip === 0) {
      this.sprite.rect(-1, 0, 3, 1).fill(color);
      this.sprite.rect(0, -1, 1, 1).fill(color);
    } else {
      this.sprite.rect(0, -1, 1, 2).fill(color);
    }
  }
}

import { DB32, TILE_SIZE } from '@constants';
import type { Entity, Switchable } from '@entities/entity';
import type { AABB } from '@types';
import { TILE_COLORS, Tile } from '@world/tilemap';
import { Container, Graphics } from 'pixi.js';

// How long the water takes to rise from the bottom to the top, s.
const RISE = 8;

export interface TankSpec {
  // What its pump handle names it by.
  id: string;
  // Its columns, and the rows its water stands at: `low` (where the tiles'
  // water starts under it) and `high` (where it rises to).
  col: number;
  cols: number;
  low: number;
  high: number;
  // Already full, on a visit after the one it was filled on.
  full: boolean;
}

// The pump house's tank: pumping its handle (a Lever) raises the water in it
// from the channel's level to its top over eight seconds, and there it stays.
// It is water that is not tiles: the player swims in it (see Player), and it
// draws itself — the water's body, its surface lit along the top.
export class Tank implements Entity, Switchable {
  readonly sprite = new Container();
  readonly switchId: string;
  private readonly spec: TankSpec;
  private readonly water = new Graphics();
  private level: number;
  private rising = false;
  private shown = -1;

  constructor(spec: TankSpec) {
    this.spec = spec;
    this.switchId = spec.id;
    this.level = spec.full ? spec.high * TILE_SIZE : spec.low * TILE_SIZE;
    this.sprite.addChild(this.water);
    this.redraw();
  }

  setActive(on: boolean, instant: boolean): void {
    if (!on) return;
    if (instant) {
      this.level = this.spec.high * TILE_SIZE;
      this.redraw();
      return;
    }
    this.rising = true;
  }

  waters(): readonly AABB[] {
    const bottom = this.spec.low * TILE_SIZE;
    if (this.level >= bottom) return [];
    return [
      { x: this.spec.col * TILE_SIZE, y: this.level, width: this.spec.cols * TILE_SIZE, height: bottom - this.level },
    ];
  }

  update(dt: number): void {
    if (!this.rising) return;
    const top = this.spec.high * TILE_SIZE;
    const span = (this.spec.low - this.spec.high) * TILE_SIZE;
    this.level = Math.max(top, this.level - (span / RISE) * dt);
    if (this.level === top) this.rising = false;
    this.redraw();
  }

  // The water from its surface down to where the tiles' water takes over,
  // on whole pixels.
  private redraw(): void {
    const y = Math.round(this.level);
    if (y === this.shown) return;
    this.shown = y;
    const x = this.spec.col * TILE_SIZE;
    const w = this.spec.cols * TILE_SIZE;
    const bottom = this.spec.low * TILE_SIZE;
    this.water.clear();
    if (y >= bottom) return;
    this.water.rect(x, y, w, bottom - y).fill(TILE_COLORS[Tile.Water]);
    this.water.rect(x, y, w, 1).fill(DB32.lightSteel);
    this.water.rect(x, y + 1, w, 1).fill(DB32.cornflower);
  }
}

import { DB32, TILE_SIZE } from '@constants';
import type { Entity, StepWorld } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import { carry, type SolidBox } from '@systems/physics';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// What a shuttle is: a minecart on its rails, or a lift in its shaft.
export const SHUTTLE_LOOK = {
  minecart: 'minecart',
  lift: 'lift',
} as const;

export type ShuttleLook = (typeof SHUTTLE_LOOK)[keyof typeof SHUTTLE_LOOK];

export interface ShuttleSpec {
  look: ShuttleLook;
  // The top-left of its box at either end of its run, px.
  from: Vec2;
  to: Vec2;
  // Its box, px: what the player stands on.
  w: number;
  h: number;
  // px/s along the run, and s waited at either end of it.
  speed: number;
  pause: number;
  // Where else along the run it waits as long, px from `from`, either way:
  // the shed's back lift stops at every storey.
  stops?: readonly number[];
}

// A platform that goes back and forth between two points, waiting at each
// end (and at any stop between), and carries whoever stands on it: the mine's minecarts along their
// rails and its lift up and down its shaft. Its top is landed on and walked
// off, never run into — it would push nothing out of its way.
export class Shuttle implements Entity {
  readonly sprite = new Container();
  private readonly spec: ShuttleSpec;
  private readonly body: ArtBody;
  private readonly box: SolidBox;
  private readonly length: number;
  // How far along the run, px, which way it is going, and how long it has
  // waited at the end it is at.
  private along = 0;
  private dir = 1;
  private waited = 0;

  constructor(spec: ShuttleSpec) {
    this.spec = spec;
    this.length = Math.hypot(spec.to.x - spec.from.x, spec.to.y - spec.from.y);
    this.box = { x: spec.from.x, y: spec.from.y, w: spec.w, h: spec.h, oneWay: true };
    const track = new ArtBody(`${spec.look}-track`);
    track.draw((g) => drawTrack(g, spec));
    this.body = new ArtBody(spec.look);
    const pose = { w: spec.w, h: spec.h };
    this.body.draw((g) => (spec.look === SHUTTLE_LOOK.lift ? drawLift(g, pose) : drawMinecart(g, pose)));
    this.sprite.addChild(track, this.body);
    this.place();
  }

  solids(): readonly SolidBox[] {
    return [this.box];
  }

  step(dt: number, world: StepWorld): void {
    const before = { x: this.box.x, y: this.box.y };
    if (this.waited < this.spec.pause) {
      this.waited += dt;
      return;
    }
    const next = this.along + this.dir * this.spec.speed * dt;
    const stop = this.spec.stops?.find((s) => (s - this.along) * this.dir > 0 && (next - s) * this.dir >= 0);
    this.along = next;
    if (stop !== undefined && stop > 0 && stop < this.length) {
      this.along = stop;
      this.waited = 0;
    } else if (this.along >= this.length || this.along <= 0) {
      this.along = Math.min(this.length, Math.max(0, this.along));
      this.dir = -this.dir;
      this.waited = 0;
    }
    this.place();
    if (world.player.standingOn === this.box) {
      carry(world.player, world.ground.tilemap, { x: this.box.x - before.x, y: this.box.y - before.y });
    }
  }

  private place(): void {
    const t = this.length === 0 ? 0 : this.along / this.length;
    this.box.x = this.spec.from.x + (this.spec.to.x - this.spec.from.x) * t;
    this.box.y = this.spec.from.y + (this.spec.to.y - this.spec.from.y) * t;
    this.body.position.set(Math.round(this.box.x), Math.round(this.box.y));
  }
}

// A box's size, px.
interface BoxSize {
  w: number;
  h: number;
}

// The minecart, its top-left at (0, 0): an iron-bound timber tub, open at the
// top, a lit rim, two dark wheels sitting on the rails below its box.
function drawMinecart(g: Graphics, size: BoxSize): void {
  const { w, h } = size;
  g.rect(1, 2, w - 2, h - 6).fill(DB32.oiledCedar);
  g.rect(0, 0, w, 2).fill(DB32.dimGray);
  g.rect(0, 0, w, 1).fill(DB32.heather);
  for (const x of [1, w / 2 - 1, w - 3]) g.rect(x, 2, 2, h - 6).fill(DB32.dimGray);
  for (let x = 4; x < w - 4; x += 5) g.rect(x, 5, 3, 1).fill(DB32.rope);
  g.rect(1, h - 4, w - 2, 1).fill(DB32.loulou);
  for (const x of [5, w - 9]) {
    g.rect(x, h - 4, 4, 4).fill(DB32.valhalla);
    g.rect(x + 1, h - 3, 2, 2).fill(DB32.dimGray);
  }
}

// The lift's cage floor, its top-left at (0, 0): a plank deck on an iron
// frame, a chain up from each end and a bar over the middle, so it reads as
// hanging from something even where the shaft hides what.
function drawLift(g: Graphics, size: BoxSize): void {
  const { w, h } = size;
  g.rect(0, 0, w, 4).fill(DB32.rope);
  g.rect(0, 0, w, 1).fill(DB32.twine);
  for (let x = 7; x < w; x += 8) g.rect(x, 1, 1, 3).fill(DB32.oiledCedar);
  g.rect(0, 4, w, h - 4).fill(DB32.dimGray);
  g.rect(0, 4, w, 1).fill(DB32.heather);
  for (let x = 2; x < w - 2; x += 6) g.rect(x, 6, 3, h - 8).fill(DB32.valhalla);
  for (const x of [1, w - 2]) {
    for (let y = -24; y < 0; y += 3) g.rect(x, y, 1, 2).fill(DB32.topaz);
  }
  g.rect(1, -25, w - 2, 1).fill(DB32.topaz);
}

// What the shuttle runs on, in world space: rails along a minecart's run, laid
// on the timber under its wheels; guide rails up both sides of a lift's shaft.
function drawTrack(g: Graphics, spec: ShuttleSpec): void {
  if (spec.look === SHUTTLE_LOOK.lift) {
    const top = Math.min(spec.from.y, spec.to.y);
    const bottom = Math.max(spec.from.y, spec.to.y) + spec.h;
    for (const x of [spec.from.x - 1, spec.from.x + spec.w]) {
      g.rect(x, top, 1, bottom - top).fill(DB32.dimGray);
      for (let y = top + 6; y < bottom; y += TILE_SIZE) g.rect(x, y, 1, 1).fill(DB32.heather);
    }
    return;
  }
  const left = Math.min(spec.from.x, spec.to.x);
  const right = Math.max(spec.from.x, spec.to.x) + spec.w;
  const y = spec.from.y + spec.h;
  g.rect(left, y - 1, right - left, 1).fill(DB32.topaz);
  g.rect(left, y - 2, right - left, 1).fill(DB32.heather);
  for (let x = left + 2; x < right; x += 6) g.rect(x, y - 1, 3, 1).fill(DB32.loulou);
}

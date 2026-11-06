import { DB32 } from '@constants';
import type { Entity, Grip, StepWorld } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How fast the pulley runs down the line, px/s, and back up it when let go.
const SLIDE = 140;
const RETURN = 60;
// How near the line the top of the player's box has to come to catch it, px.
const REACH = 6;
// The posts the line is strung between, px tall.
const POST = 24;

export interface ClotheslineSpec {
  // Where the line is tied, px: its high end, and its low end.
  from: Vec2;
  to: Vec2;
}

// A line strung downhill between two posts, with a pulley on it: jump into it
// to catch hold, and the pulley carries you down it at 140 px/s, letting go
// at the far end (or with jump). Only ever downhill. Let go of, the pulley
// runs back up to the top.
export class Clothesline implements Entity, Grip {
  readonly sprite = new Container();
  private readonly spec: ClotheslineSpec;
  private readonly pulley = new ArtBody('pulley');
  private readonly length: number;
  // How far along the line the pulley is, 0 at the top to 1 at the bottom.
  private t = 0;
  private held = false;

  constructor(spec: ClotheslineSpec) {
    this.spec = spec;
    this.length = Math.hypot(spec.to.x - spec.from.x, spec.to.y - spec.from.y);
    const line = new ArtBody('clothesline');
    line.draw((g) => drawLine(g, spec));
    this.pulley.draw(drawPulley);
    this.sprite.addChild(line, this.pulley);
    this.place();
  }

  grips(): readonly Grip[] {
    return [this];
  }

  catches(pos: Vec2, size: Vec2): boolean {
    const mid = pos.x + size.x / 2;
    const { from, to } = this.spec;
    const span = to.x - from.x;
    const along = span === 0 ? 0 : (mid - from.x) / span;
    if (along < 0 || along > 0.95) return false;
    const lineY = from.y + (to.y - from.y) * along;
    if (Math.abs(pos.y - lineY) > REACH) return false;
    this.t = along;
    return true;
  }

  holdAt(size: Vec2): Vec2 {
    const at = this.at();
    return { x: at.x - size.x / 2, y: at.y + 2 };
  }

  velocity(): Vec2 {
    const { from, to } = this.spec;
    return { x: ((to.x - from.x) / this.length) * SLIDE, y: ((to.y - from.y) / this.length) * SLIDE };
  }

  releases(): boolean {
    return this.t >= 1;
  }

  step(dt: number, world: StepWorld): void {
    const held = world.player.grip === this;
    if (held) this.t = Math.min(1, this.t + (SLIDE * dt) / this.length);
    else if (this.held || this.t > 0) this.t = Math.max(0, this.t - (RETURN * dt) / this.length);
    this.held = held;
    this.place();
  }

  private at(): Vec2 {
    const { from, to } = this.spec;
    return { x: from.x + (to.x - from.x) * this.t, y: from.y + (to.y - from.y) * this.t };
  }

  private place(): void {
    const at = this.at();
    this.pulley.position.set(Math.round(at.x), Math.round(at.y));
  }
}

// The line and its posts, in world space: a rope-coloured line of 1-px
// stamps from tie to tie, sagging nowhere (it is pulled taut), and a cedar
// post under each tie with a cleat at its top.
function drawLine(g: Graphics, spec: ClotheslineSpec): void {
  const { from, to } = spec;
  const steps = Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(from.x + ((to.x - from.x) * i) / steps);
    const y = Math.round(from.y + ((to.y - from.y) * i) / steps);
    g.rect(x, y, 1, 1).fill(DB32.twine);
  }
  for (const end of [from, to]) {
    g.rect(Math.round(end.x) - 1, Math.round(end.y), 2, POST).fill(DB32.oiledCedar);
    g.rect(Math.round(end.x) - 1, Math.round(end.y), 1, POST).fill(DB32.rope);
    g.rect(Math.round(end.x) - 2, Math.round(end.y) - 1, 4, 1).fill(DB32.dimGray);
  }
}

// The pulley, hanging from the line at (0, 0): a dimGray wheel on the line
// and a cedar handle under it.
function drawPulley(g: Graphics): void {
  g.rect(-2, -2, 4, 4).fill(DB32.dimGray);
  g.rect(-1, -1, 2, 2).fill(DB32.heather);
  g.rect(0, 2, 1, 2).fill(DB32.dimGray);
  g.rect(-3, 4, 7, 2).fill(DB32.oiledCedar);
  g.rect(-3, 4, 7, 1).fill(DB32.rope);
}

import { DB32, TILE_SIZE } from '@constants';
import type { Entity, Grip, StepWorld } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { ArtBody } from '@hd/art-body';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// One swing there and back, s, and how far it goes either way, rad, unless
// given.
const PERIOD = 1.4;
const AMPLITUDE = (35 * Math.PI) / 180;
// The body: what the player catches, px — two tiles tall.
const BODY_W = 24;
const BODY_H = 32;
// Where a hanging player's box sits, px below the body's top: hands on the
// lower ring, feet under it.
const HOLD_Y = 18;
// How many drawings of the chain a swing is cut into.
const CHAIN_STEPS = 24;
// The candles on its crown give light.
const FLAME = [DB32.goldenFizz, DB32.white];

export interface SwingingChandelierSpec {
  // What it swings from, px: a tile up inside the ceiling, so the chain
  // comes out of the underside wherever the swing has it.
  x: number;
  y: number;
  // From there to the top of its body, px.
  chain: number;
  // Where in its swing it starts, rad: π for one that swings against another.
  phase: number;
  // The shed's clock pendulums swing faster and less far, its great
  // pendulum slower.
  period?: number;
  amplitude?: number;
}

// An iron chandelier on a long chain that swings, slowly and always: jump
// into it to catch hold, ride the swing, and jump to let go, flung with its
// speed. Its body stays upright on the end of the chain.
export class SwingingChandelier implements Entity, Grip {
  readonly sprite = new Container();
  private readonly spec: SwingingChandelierSpec;
  private readonly chainArt = new ArtBody('swinging-chandelier-chain');
  private readonly body = new ArtBody('swinging-chandelier', { emissive: FLAME });
  private readonly period: number;
  private readonly amplitude: number;
  private time = 0;
  private shownStep = -1;

  constructor(spec: SwingingChandelierSpec) {
    this.spec = spec;
    this.period = spec.period ?? PERIOD;
    this.amplitude = spec.amplitude ?? AMPLITUDE;
    this.body.draw(drawChandelier);
    this.sprite.addChild(this.chainArt, this.body);
    this.place();
  }

  grips(): readonly Grip[] {
    return [this];
  }

  step(dt: number, _world: StepWorld): void {
    this.time += dt;
    this.place();
  }

  catches(pos: Vec2, size: Vec2): boolean {
    const top = this.bodyTop();
    return (
      pos.x < top.x + BODY_W / 2 &&
      pos.x + size.x > top.x - BODY_W / 2 &&
      pos.y < top.y + BODY_H &&
      pos.y + size.y > top.y
    );
  }

  holdAt(size: Vec2): Vec2 {
    const top = this.bodyTop();
    return { x: top.x - size.x / 2, y: top.y + HOLD_Y };
  }

  velocity(): Vec2 {
    const w = (2 * Math.PI) / this.period;
    const theta = this.angle();
    const spin = this.amplitude * w * Math.cos(w * this.time + this.spec.phase);
    const r = this.spec.chain + HOLD_Y;
    return { x: r * Math.cos(theta) * spin, y: -r * Math.sin(theta) * spin };
  }

  private angle(): number {
    return this.amplitude * Math.sin(((2 * Math.PI) / this.period) * this.time + this.spec.phase);
  }

  // The middle of the body's top, where the chain meets it.
  private bodyTop(): Vec2 {
    const theta = this.angle();
    return { x: this.spec.x + Math.sin(theta) * this.spec.chain, y: this.spec.y + Math.cos(theta) * this.spec.chain };
  }

  private place(): void {
    const top = this.bodyTop();
    this.body.position.set(Math.round(top.x), Math.round(top.y));
    const step = Math.round(((this.angle() / this.amplitude + 1) / 2) * CHAIN_STEPS);
    if (step === this.shownStep) return;
    this.shownStep = step;
    const theta = ((step / CHAIN_STEPS) * 2 - 1) * this.amplitude;
    this.chainArt.position.set(this.spec.x, this.spec.y);
    const length = this.spec.chain;
    this.chainArt.draw((g) => drawChain(g, { theta, length, hidden: TILE_SIZE }));
  }
}

// How the chain is drawn: its angle off the vertical, rad, its length, and
// how much of it is inside the ceiling, px.
interface ChainPose {
  theta: number;
  length: number;
  hidden: number;
}

// The chain from the ceiling to the body: alternate links, a 2 × 2 dimGray
// one and a 1 × 1 heather one, every 3 px along it, from where it comes out
// of the ceiling.
function drawChain(g: Graphics, pose: ChainPose): void {
  for (let i = 0, d = pose.hidden + 1; d < pose.length; i++, d += 3) {
    const x = Math.round(Math.sin(pose.theta) * d);
    const y = Math.round(Math.cos(pose.theta) * d);
    if (i % 2 === 0) g.rect(x - 1, y - 1, 2, 2).fill(DB32.dimGray);
    else g.rect(x, y, 1, 1).fill(DB32.heather);
  }
}

// The chandelier, the middle of its top at (0, 0): a hook, an iron crown
// with four candles burning on it, two curved arms down to a lower ring the
// player holds, and a finial hanging under that. 24 wide, 32 tall.
function drawChandelier(g: Graphics): void {
  drawGlow(g, { x: 0, y: 4, radius: 16, color: DB32.goldenFizz });
  g.rect(-1, 0, 2, 3).fill(DB32.dimGray);
  // The crown, and its candles.
  g.rect(-11, 9, 22, 2).fill(DB32.dimGray);
  g.rect(-11, 9, 22, 1).fill(DB32.heather);
  for (const x of [-10, -4, 3, 9]) {
    g.rect(x, 4, 2, 5).fill(DB32.lightSteel);
    g.rect(x, 4, 1, 5).fill(DB32.white);
    g.rect(x, 1, 2, 3).fill(DB32.goldenFizz);
    g.rect(x, 2, 1, 1).fill(DB32.white);
  }
  // The stem and the arms down to the lower ring.
  g.rect(-1, 3, 2, 16).fill(DB32.valhalla);
  for (let i = 0; i < 6; i++) {
    g.rect(-10 + i, 11 + i, 1, 1).fill(DB32.dimGray);
    g.rect(9 - i, 11 + i, 1, 1).fill(DB32.dimGray);
  }
  g.rect(-6, 17, 12, 2).fill(DB32.dimGray);
  g.rect(-6, 17, 12, 1).fill(DB32.heather);
  // The finial under it.
  g.rect(-2, 19, 4, 3).fill(DB32.dimGray);
  g.rect(-1, 22, 2, 8).fill(DB32.dimGray);
  g.rect(-1, 30, 2, 2).fill(DB32.heather);
}

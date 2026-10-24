import { DB32 } from '@constants';
import type { Entity, StepWorld } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import { carry, type SolidBox } from '@systems/physics';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// One turn of the wheel, s.
const PERIOD = 8;
// The paddles: four, a plank two tiles long at the end of every other spoke.
const PADDLES = 4;
const PADDLE_W = 32;
const PADDLE_H = 4;
// The wheel's spokes, and how many drawings of them a turn is cut into. The
// spokes repeat every eighth of a turn, so 8 bakes cover every angle a turn
// cut into 64 shows.
const SPOKES = 8;
const ART_STEPS = 64;

export interface MillWheelSpec {
  // The hub, in px.
  x: number;
  y: number;
  // From the hub to the top of a paddle, px.
  radius: number;
}

// The mill's water wheel. It turns, slowly, and the planks at the ends of
// four of its spokes stay level as it does — four moving platforms that
// carry whoever stands on them from the stream at its foot up past the
// mill's eaves. It turns so that the paddles rise on its west side and come
// over the top heading east, towards the mill roof: a ride up, and a short
// jump off.
export class MillWheel implements Entity {
  readonly sprite = new Container();
  private readonly spec: MillWheelSpec;
  private readonly wheel = new ArtBody('mill-wheel');
  private readonly paddleSprites: Container[] = [];
  private readonly boxes: SolidBox[] = [];
  private angle = 0;
  private shownStep = -1;

  constructor(spec: MillWheelSpec) {
    this.spec = spec;
    this.wheel.position.set(spec.x, spec.y);
    this.sprite.addChild(this.wheel);
    for (let i = 0; i < PADDLES; i++) {
      const paddle = new ArtBody('mill-paddle');
      paddle.draw(drawPaddle);
      this.paddleSprites.push(paddle);
      this.sprite.addChild(paddle);
      this.boxes.push({ x: 0, y: 0, w: PADDLE_W, h: PADDLE_H, oneWay: true });
    }
    this.place();
  }

  solids(): readonly SolidBox[] {
    return this.boxes;
  }

  step(dt: number, world: StepWorld): void {
    const before = this.boxes.map((b) => ({ x: b.x, y: b.y }));
    this.angle = (this.angle + (dt * 2 * Math.PI) / PERIOD) % (2 * Math.PI);
    this.place();
    const rider = world.player.standingOn;
    const i = rider ? this.boxes.indexOf(rider) : -1;
    if (i >= 0) {
      const by = { x: this.boxes[i].x - before[i].x, y: this.boxes[i].y - before[i].y };
      carry(world.player, world.ground.tilemap, by);
    }
  }

  // Every paddle to where the angle puts it, and the spokes to the nearest
  // of their drawings.
  private place(): void {
    for (let i = 0; i < PADDLES; i++) {
      const at = paddleAt(this.spec, this.angle + (i * 2 * Math.PI) / PADDLES);
      this.boxes[i].x = at.x - PADDLE_W / 2;
      this.boxes[i].y = at.y;
      this.paddleSprites[i].position.set(at.x, at.y);
    }
    const step = Math.round((this.angle / (2 * Math.PI)) * ART_STEPS) % (ART_STEPS / SPOKES);
    if (step === this.shownStep) return;
    this.shownStep = step;
    const turn = (step / ART_STEPS) * 2 * Math.PI;
    this.wheel.draw((g) => drawWheel(g, { radius: this.spec.radius, turn }));
  }
}

// Where a paddle's top middle is, at an angle (0 east, growing clockwise on
// screen, so the paddle at the foot moves west).
function paddleAt(spec: MillWheelSpec, angle: number): Vec2 {
  return { x: spec.x + Math.cos(angle) * spec.radius, y: spec.y + Math.sin(angle) * spec.radius };
}

// How the wheel is drawn: how big, and how far round it has turned.
interface WheelPose {
  radius: number;
  turn: number;
}

// The wheel around its hub: a rim of two cedar rings with a rope one between,
// eight spokes, and an iron hub. Every mark a 1-px rect, so the rim and the
// spokes stay on the grid at every angle.
function drawWheel(g: Graphics, pose: WheelPose): void {
  const rim = pose.radius - 2;
  for (let s = 0; s < SPOKES; s++) {
    const a = pose.turn + (s * 2 * Math.PI) / SPOKES;
    line(g, { x: Math.cos(a) * 4, y: Math.sin(a) * 4 }, { x: Math.cos(a) * rim, y: Math.sin(a) * rim });
  }
  ring(g, { r: rim, color: DB32.oiledCedar });
  ring(g, { r: rim - 1, color: DB32.rope });
  ring(g, { r: rim - 2, color: DB32.oiledCedar });
  g.rect(-4, -4, 8, 8).fill(DB32.dimGray);
  g.rect(-4, -4, 8, 1).fill(DB32.heather);
  g.rect(-1, -1, 2, 2).fill(DB32.valhalla);
}

// A ring of radius `r`, a pixel thick.
interface RingSpec {
  r: number;
  color: number;
}

function ring(g: Graphics, spec: RingSpec): void {
  const n = Math.ceil(2 * Math.PI * spec.r);
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const x = Math.round(Math.cos(a) * spec.r);
    const y = Math.round(Math.sin(a) * spec.r);
    if (seen.has(`${x},${y}`)) continue;
    seen.add(`${x},${y}`);
    g.rect(x, y, 1, 1).fill(spec.color);
  }
}

// A spoke: a line of 2 × 2 px stamps, oiledCedar. A 1-px diagonal reads
// as a row of dots once HD rounds its corners off.
function line(g: Graphics, from: Vec2, to: Vec2): void {
  const steps = Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(from.x + (to.x - from.x) * t - 0.5);
    const y = Math.round(from.y + (to.y - from.y) * t - 0.5);
    g.rect(x, y, 2, 2).fill(DB32.oiledCedar);
  }
}

// A paddle, its top middle at (0, 0): a plank two tiles long, lit along its
// top, its ends shadowed, with the iron cleat that holds it to its spoke.
function drawPaddle(g: Graphics): void {
  g.rect(-16, 0, 32, PADDLE_H).fill(DB32.rope);
  g.rect(-16, 0, 32, 1).fill(DB32.twine);
  g.rect(-16, PADDLE_H - 1, 32, 1).fill(DB32.oiledCedar);
  g.rect(-16, 0, 1, PADDLE_H).fill(DB32.oiledCedar);
  g.rect(15, 0, 1, PADDLE_H).fill(DB32.oiledCedar);
  for (const nx of [-12, -4, 4, 12]) g.rect(nx, 2, 1, 1).fill(DB32.loulou);
  g.rect(-2, PADDLE_H, 4, 2).fill(DB32.dimGray);
}

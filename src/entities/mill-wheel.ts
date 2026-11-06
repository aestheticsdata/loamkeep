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
// How many drawings of the spokes a turn is cut into. A mill wheel's eight
// spokes repeat every eighth of a turn, so 8 bakes cover every angle a turn
// cut into 64 shows; the orrery's four arms, every quarter, so 16.
const ART_STEPS = 64;

// What turns: the mill's water wheel, the potting shed's orrery (brass arms
// from a brass sun, a planet under every tray) or its clock tower's brass
// gear wheel.
export const WHEEL_LOOK = {
  mill: 'mill',
  orrery: 'orrery',
  gear: 'gear',
} as const;

export type WheelLook = (typeof WHEEL_LOOK)[keyof typeof WHEEL_LOOK];

export interface MillWheelSpec {
  // The hub, in px.
  x: number;
  y: number;
  // From the hub to the top of a paddle, px.
  radius: number;
  // How many paddles (4 unless given), and one turn, s (8 unless given): the
  // garden's noria has eight buckets, its gear wheel turns faster.
  paddles?: number;
  period?: number;
  // A mill wheel unless given.
  look?: WheelLook;
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
  private readonly art: WheelArt;
  private readonly wheel: ArtBody;
  private readonly paddleSprites: Container[] = [];
  private readonly boxes: SolidBox[] = [];
  private angle = 0;
  private shownStep = -1;

  constructor(spec: MillWheelSpec) {
    this.spec = spec;
    const look = spec.look ?? WHEEL_LOOK.mill;
    this.art = WHEEL_ART[look];
    this.wheel = new ArtBody(`${look}-wheel`);
    this.wheel.position.set(spec.x, spec.y);
    this.sprite.addChild(this.wheel);
    for (let i = 0; i < (this.spec.paddles ?? PADDLES); i++) {
      const paddle = new ArtBody(`${look}-paddle`);
      paddle.draw(this.art.paddle);
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
    this.angle = (this.angle + (dt * 2 * Math.PI) / (this.spec.period ?? PERIOD)) % (2 * Math.PI);
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
    for (let i = 0; i < (this.spec.paddles ?? PADDLES); i++) {
      const at = paddleAt(this.spec, this.angle + (i * 2 * Math.PI) / (this.spec.paddles ?? PADDLES));
      this.boxes[i].x = at.x - PADDLE_W / 2;
      this.boxes[i].y = at.y;
      this.paddleSprites[i].position.set(at.x, at.y);
    }
    const step = Math.round((this.angle / (2 * Math.PI)) * ART_STEPS) % (ART_STEPS / this.art.spokes);
    if (step === this.shownStep) return;
    this.shownStep = step;
    const turn = (step / ART_STEPS) * 2 * Math.PI;
    this.wheel.draw((g) => drawWheel(g, { radius: this.spec.radius, turn, art: this.art }));
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
  art: WheelArt;
}

// The drawings of one look: how many spokes, their colour, the rings of its
// rim from the outside in (none for the orrery's arms), whether the rim
// bears teeth, and its hub and paddle.
interface WheelArt {
  spokes: number;
  spoke: number;
  rim: readonly number[];
  teeth: boolean;
  hub: (g: Graphics) => void;
  paddle: (g: Graphics) => void;
}

// The wheel around its hub, its spokes out to the rim (or, with no rim, to
// the paddles). Every mark a 1-px rect, so the rim and the spokes stay on the
// grid at every angle.
function drawWheel(g: Graphics, pose: WheelPose): void {
  const { art } = pose;
  const rim = pose.radius - 2;
  for (let s = 0; s < art.spokes; s++) {
    const a = pose.turn + (s * 2 * Math.PI) / art.spokes;
    line(
      g,
      { from: { x: Math.cos(a) * 4, y: Math.sin(a) * 4 }, to: { x: Math.cos(a) * rim, y: Math.sin(a) * rim } },
      art.spoke,
    );
  }
  for (const [i, color] of art.rim.entries()) ring(g, { r: rim - i, color });
  if (art.teeth) {
    const teeth = Math.round(pose.radius / 3);
    for (let t = 0; t < teeth; t++) {
      const a = pose.turn + (t * 2 * Math.PI) / teeth;
      g.rect(Math.round(Math.cos(a) * (rim + 1)) - 1, Math.round(Math.sin(a) * (rim + 1)) - 1, 3, 3).fill(
        DB32.rainforest,
      );
    }
  }
  art.hub(g);
}

// The mill wheel's iron hub.
function drawIronHub(g: Graphics): void {
  g.rect(-4, -4, 8, 8).fill(DB32.dimGray);
  g.rect(-4, -4, 8, 1).fill(DB32.heather);
  g.rect(-1, -1, 2, 2).fill(DB32.valhalla);
}

// The orrery's sun: a brass ball, lit from above, with a spark in it.
function drawSun(g: Graphics): void {
  g.rect(-5, -3, 10, 6).fill(DB32.tahitiGold);
  g.rect(-3, -5, 6, 10).fill(DB32.tahitiGold);
  g.rect(-3, -5, 6, 2).fill(DB32.goldenFizz);
  g.rect(-5, -3, 2, 2).fill(DB32.goldenFizz);
  g.rect(2, 2, 3, 2).fill(DB32.brown);
  g.rect(-2, -3, 2, 2).fill(DB32.white);
}

// The gear's brass boss, and its axle.
function drawBrassHub(g: Graphics): void {
  g.rect(-5, -5, 10, 10).fill(DB32.rainforest);
  g.rect(-5, -5, 10, 1).fill(DB32.goldenFizz);
  g.rect(-2, -2, 4, 4).fill(DB32.valhalla);
  g.rect(-2, -2, 4, 1).fill(DB32.dimGray);
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

// A spoke: a line of 2 × 2 px stamps. A 1-px diagonal reads
// as a row of dots once HD rounds its corners off.
// A spoke's two ends.
interface Span {
  from: Vec2;
  to: Vec2;
}

function line(g: Graphics, span: Span, color: number): void {
  const { from, to } = span;
  const steps = Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(from.x + (to.x - from.x) * t - 0.5);
    const y = Math.round(from.y + (to.y - from.y) * t - 0.5);
    g.rect(x, y, 2, 2).fill(color);
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

// A tray of the orrery, its top middle at (0, 0): a brass plate, lit along its
// top, and under its middle the planet it carries, a blue world lit from
// above with a green island, on a short brass stem.
function drawPlanetTray(g: Graphics): void {
  g.rect(-16, 0, 32, PADDLE_H).fill(DB32.rainforest);
  g.rect(-16, 0, 32, 1).fill(DB32.goldenFizz);
  g.rect(-16, PADDLE_H - 1, 32, 1).fill(DB32.brown);
  g.rect(-1, PADDLE_H, 2, 2).fill(DB32.rainforest);
  g.rect(-4, PADDLE_H + 2, 8, 6).fill(DB32.cornflower);
  g.rect(-3, PADDLE_H + 1, 6, 8).fill(DB32.cornflower);
  g.rect(-3, PADDLE_H + 2, 4, 2).fill(DB32.lightSteel);
  g.rect(-2, PADDLE_H + 1, 3, 1).fill(DB32.white);
  g.rect(-4, PADDLE_H + 6, 8, 2).fill(DB32.venice);
  g.rect(1, PADDLE_H + 4, 2, 2).fill(DB32.christi);
}

// A plate on the gear's rim, its top middle at (0, 0): brass, lit along its
// top, its ends dark, its bolt in the middle.
function drawBrassPlate(g: Graphics): void {
  g.rect(-16, 0, 32, PADDLE_H).fill(DB32.rainforest);
  g.rect(-16, 0, 32, 1).fill(DB32.goldenFizz);
  g.rect(-16, 0, 1, PADDLE_H).fill(DB32.brown);
  g.rect(15, 0, 1, PADDLE_H).fill(DB32.brown);
  g.rect(-1, 1, 2, 2).fill(DB32.valhalla);
  g.rect(-2, PADDLE_H, 4, 2).fill(DB32.brown);
}

const WHEEL_ART: Record<WheelLook, WheelArt> = {
  [WHEEL_LOOK.mill]: {
    spokes: 8,
    spoke: DB32.oiledCedar,
    rim: [DB32.oiledCedar, DB32.rope, DB32.oiledCedar],
    teeth: false,
    hub: drawIronHub,
    paddle: drawPaddle,
  },
  [WHEEL_LOOK.orrery]: {
    spokes: 4,
    spoke: DB32.rainforest,
    rim: [],
    teeth: false,
    hub: drawSun,
    paddle: drawPlanetTray,
  },
  [WHEEL_LOOK.gear]: {
    spokes: 8,
    spoke: DB32.rainforest,
    rim: [DB32.rainforest, DB32.goldenFizz, DB32.brown],
    teeth: true,
    hub: drawBrassHub,
    paddle: drawBrassPlate,
  },
};

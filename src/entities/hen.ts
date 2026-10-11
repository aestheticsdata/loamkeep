import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

const STROLL_SPEED = 14;
// A hen strolls, stops, pecks the ground a few times, and strolls on.
const STROLL_TIME = 1.4;
const PECK_TIME = 1.1;

// A brown hen in the kitchen garden, strolling its patch of turf and stopping
// every few steps to peck at it.
export class Hen implements Critter {
  readonly sprite: Container;
  readonly species = 'hen' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawHen(g, false),
    subjectScale: 4,
    speech: "Bawk! Oh — it's you. Have you seen a worm? Small, wiggly, delicious?",
  };

  private readonly spec: PatrolSpec;
  private readonly body: Graphics;
  private x: number;
  private facing: 1 | -1 = 1;
  private timer: number;
  private pecking = false;
  private elapsed = 0;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.timer = (spec.x * 0.017) % STROLL_TIME;
    this.sprite = new Container();
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.pecking = !this.pecking;
      this.timer = this.pecking ? PECK_TIME : STROLL_TIME;
      if (!this.pecking && Math.random() < 0.35) this.facing = this.facing === 1 ? -1 : 1;
    }
    if (!this.pecking) {
      this.x += this.facing * STROLL_SPEED * dt;
      if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
        this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
        this.facing = this.facing === 1 ? -1 : 1;
      }
    }
    const down = this.pecking && Math.floor(this.elapsed * 6) % 2 === 0;
    this.body.clear();
    drawHen(this.body, down);
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 6, y: this.spec.y - 11, width: 12, height: 11 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), feet on y = 0, facing right: 12 wide × 11 tall. Plump
// brown body, a red comb, a yellow beak; pecking, the head goes down to the
// ground in front of it.
export function drawHen(g: Graphics, pecking: boolean): void {
  const feather = DB32.rope;
  const featherDark = DB32.oiledCedar;
  // Legs.
  g.rect(-2, -2, 1, 2).fill(DB32.goldenFizz);
  g.rect(1, -2, 1, 2).fill(DB32.goldenFizz);
  // Body and tail.
  g.rect(-5, -7, 9, 5).fill(feather);
  g.rect(-6, -9, 2, 4).fill(featherDark);
  g.rect(-4, -5, 6, 1).fill(DB32.twine);
  g.rect(-3, -6, 4, 1).fill(featherDark);
  if (pecking) {
    g.rect(3, -5, 3, 3).fill(feather);
    g.rect(6, -3, 2, 1).fill(DB32.goldenFizz);
    g.rect(4, -6, 2, 1).fill(DB32.clairvoyant);
    g.rect(5, -4, 1, 1).fill(DB32.valhalla);
    return;
  }
  g.rect(3, -10, 3, 4).fill(feather);
  g.rect(6, -9, 2, 1).fill(DB32.goldenFizz);
  g.rect(3, -11, 3, 1).fill(DB32.clairvoyant);
  g.rect(5, -7, 1, 1).fill(DB32.clairvoyant);
  g.rect(4, -9, 1, 1).fill(DB32.valhalla);
}

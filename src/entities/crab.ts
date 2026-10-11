import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

const SIDLE_SPEED = 20;

// A small freshwater crab, sidling along a ledge — sideways, naturally — and
// clacking its claws as it goes. It never turns round: it just goes the other
// way, still facing front.
export class Crab implements Critter {
  readonly sprite: Container;
  readonly species = 'crab' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawCrab(g, 1),
    subjectScale: 5,
    speech: 'Sideways is the only way! Forwards is for show-offs.',
  };

  private readonly spec: PatrolSpec;
  private readonly body: Graphics;
  private x: number;
  private dir: 1 | -1 = 1;
  private elapsed = 0;
  private frame = -1;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.sprite = new Container();
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.x += this.dir * SIDLE_SPEED * dt;
    if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
      this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
      this.dir = this.dir === 1 ? -1 : 1;
    }
    const frame = Math.floor(this.elapsed * 5) & 1;
    if (frame !== this.frame) {
      this.frame = frame;
      this.body.clear();
      drawCrab(this.body, frame);
    }
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 7, y: this.spec.y - 6, width: 14, height: 6 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), legs on y = 0, facing the viewer: 14 wide × 7 tall.
// Red shell, eyes on stalks, two claws that open and shut on `frame`.
export function drawCrab(g: Graphics, frame: number): void {
  const shell = DB32.clairvoyant;
  g.rect(-4, -4, 8, 3).fill(shell);
  g.rect(-3, -5, 6, 1).fill(shell);
  g.rect(-3, -5, 2, 1).fill(DB32.brown);
  // Legs.
  for (const x of [-5, -4, 3, 4]) g.rect(x, -1, 1, 1).fill(DB32.clairvoyant);
  // Eyes on stalks.
  g.rect(-2, -7, 1, 2).fill(shell);
  g.rect(1, -7, 1, 2).fill(shell);
  g.rect(-2, -7, 1, 1).fill(DB32.valhalla);
  g.rect(1, -7, 1, 1).fill(DB32.valhalla);
  // Claws, opening and shutting.
  g.rect(-7, -5, 2, 2).fill(shell);
  g.rect(5, -5, 2, 2).fill(shell);
  g.rect(-7, -6 - frame, 1, 1).fill(shell);
  g.rect(6, -6 - frame, 1, 1).fill(shell);
}

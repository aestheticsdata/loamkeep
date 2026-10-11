import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

const STRUT_SPEED = 12;

// A pigeon strutting along a ledge, head bobbing in time with every step,
// as if it owned the tower and had just been told it does not.
export class Pigeon implements Critter {
  readonly sprite: Container;
  readonly species = 'pigeon' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawPigeon(g, 0),
    subjectScale: 4,
    speech: 'Coo. Coo-coo. ...Got any crumbs? No? Then coo to you too.',
  };

  private readonly spec: PatrolSpec;
  private readonly body: Graphics;
  private x: number;
  private facing: 1 | -1 = 1;
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
    this.x += this.facing * STRUT_SPEED * dt;
    if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
      this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
      this.facing = this.facing === 1 ? -1 : 1;
    }
    const frame = Math.floor(this.elapsed * 4) & 1;
    if (frame !== this.frame) {
      this.frame = frame;
      this.body.clear();
      drawPigeon(this.body, frame);
    }
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 6, y: this.spec.y - 9, width: 12, height: 9 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), feet on y = 0, facing right: 11 wide × 9 tall. Grey,
// a green-and-purple sheen on the neck; the head pokes forward on frame 1.
export function drawPigeon(g: Graphics, bob: number): void {
  const grey = DB32.topaz;
  g.rect(-1, -1, 1, 1).fill(DB32.brown);
  g.rect(1, -1, 1, 1).fill(DB32.brown);
  g.rect(-5, -5, 8, 4).fill(grey);
  g.rect(-6, -4, 2, 2).fill(DB32.dimGray);
  g.rect(-3, -5, 4, 1).fill(DB32.heather);
  g.rect(1 + bob, -8, 3, 3).fill(grey);
  g.rect(1 + bob, -6, 2, 1).fill(DB32.eltGreen);
  g.rect(2 + bob, -5, 1, 1).fill(DB32.smokeyAsh);
  g.rect(3 + bob, -7, 1, 1).fill(DB32.brown);
  g.rect(4 + bob, -7, 1, 1).fill(DB32.dimGray);
}

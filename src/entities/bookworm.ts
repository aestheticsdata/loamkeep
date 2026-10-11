import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

const INCH_SPEED = 5;

// A bookworm inching along the top of a stack: hump up, stretch out, hump up.
export class Bookworm implements Critter {
  readonly sprite: Container;
  readonly species = 'bookworm' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawBookworm(g, 1),
    subjectScale: 6,
    speech: "I've eaten three dictionaries and I still can't spell 'definately'.",
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
    const frame = Math.floor(this.elapsed * 2) & 1;
    // It only gets anywhere while stretching out.
    if (frame === 0) this.x += this.facing * INCH_SPEED * dt;
    if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
      this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
      this.facing = this.facing === 1 ? -1 : 1;
    }
    if (frame !== this.frame) {
      this.frame = frame;
      this.body.clear();
      drawBookworm(this.body, frame);
    }
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 5, y: this.spec.y - 5, width: 10, height: 5 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), on y = 0, head to the right: a pale green worm in
// spectacles, 9 wide. Frame 1 has it humped in the middle, frame 0 stretched.
export function drawBookworm(g: Graphics, frame: number): void {
  const body = DB32.atlantis;
  if (frame === 1) {
    g.rect(-4, -1, 2, 1).fill(body);
    g.rect(-2, -3, 3, 2).fill(body);
    g.rect(1, -1, 2, 1).fill(body);
    g.rect(3, -3, 2, 3).fill(body);
  } else {
    g.rect(-5, -1, 9, 1).fill(body);
    g.rect(3, -3, 2, 3).fill(body);
  }
  // Spectacles, of course.
  g.rect(4, -3, 1, 1).fill(DB32.white);
  g.rect(5, -3, 1, 1).fill(DB32.valhalla);
}

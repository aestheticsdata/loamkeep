import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const INCH_SPEED = 4;

// An earthworm on a tunnel floor, going about it the way the library's
// bookworm does — hump up, stretch out — and getting no further for it.
export class Earthworm implements Critter {
  readonly sprite: Container;
  readonly species = 'earthworm' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawEarthworm(g, 1),
    subjectScale: 6,
    speech: 'Down here we call it a tunnel. Up there they call it a lawn. Same thing, really.',
  };

  private readonly spec: PatrolSpec;
  private readonly body = new ArtBody('earthworm');
  private x: number;
  private facing: 1 | -1 = 1;
  private elapsed: number;
  private frame = -1;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.elapsed = spec.x * 0.011;
    this.sprite = new Container();
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
      this.body.draw((g) => drawEarthworm(g, frame));
    }
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 5, y: this.spec.y - 4, width: 10, height: 4 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), on y = 0, head to the right: the bookworm's shape in
// earth pink with a darker band and no spectacles, 10 wide. Frame 1 has it
// humped in the middle, frame 0 stretched.
export function drawEarthworm(g: Graphics, frame: number): void {
  const body = DB32.mandy;
  if (frame === 1) {
    g.rect(-4, -1, 2, 1).fill(body);
    g.rect(-2, -3, 3, 2).fill(body);
    g.rect(1, -1, 2, 1).fill(body);
    g.rect(3, -2, 2, 2).fill(body);
    g.rect(-1, -3, 1, 2).fill(DB32.brown);
  } else {
    g.rect(-5, -1, 10, 1).fill(body);
    g.rect(3, -2, 2, 2).fill(body);
    g.rect(0, -1, 2, 1).fill(DB32.brown);
  }
}

// The page's earthworm, drawn at page size: a chain of round segments in a
// lazy wave, the band two segments from the head, a dark eye-spot.
export function drawEarthwormLarge(g: Graphics): void {
  for (let i = 0; i < 14; i++) {
    const x = -26 + i * 4;
    const y = -6 - Math.round(Math.sin(i * 0.55) * 6);
    const color = i === 9 || i === 10 ? DB32.brown : DB32.mandy;
    for (let dy = -3; dy <= 3; dy++) {
      const half = Math.round(Math.sqrt(9 - dy * dy));
      g.rect(x - half, y + dy, half * 2 + 1, 1).fill(color);
    }
    g.rect(x - 1, y + 2, 2, 1).fill(DB32.smokeyAsh);
  }
  g.rect(28, -11, 1, 1).fill(DB32.valhalla);
}

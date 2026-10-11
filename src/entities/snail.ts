import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import { snailHd } from '@entities/critters-hd';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// Pixels a second. Watch one for a while and it has moved.
const CRAWL_SPEED = 2.5;

// A snail on the granite, crossing a ledge at a snail's pace, eye stalks
// waving as it goes.
export class Snail implements Critter {
  readonly sprite: Container;
  readonly species = 'snail' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawSnail(g, 0),
    subjectScale: 5,
    speech: "Whoa, slow down! Where's the fire? I've been on this rock since Tuesday.",
  };

  private readonly spec: PatrolSpec;
  private readonly body: ArtBody;
  private x: number;
  private facing: 1 | -1 = 1;
  private elapsed = 0;
  private frame = -1;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.sprite = new Container();
    this.body = new ArtBody('snail');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.x += this.facing * CRAWL_SPEED * dt;
    if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
      this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
      this.facing = this.facing === 1 ? -1 : 1;
    }
    const frame = Math.floor(this.elapsed * 1.5) & 1;
    if (frame !== this.frame) {
      this.frame = frame;
      this.body.draw(
        (g) => drawSnail(g, frame),
        () => snailHd(frame),
      );
    }
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 5, y: this.spec.y - 7, width: 10, height: 7 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), foot on y = 0, head to the right: 10 wide × 7 tall.
// A striped spiral shell — of course it is a spiral — on a pale foot.
export function drawSnail(g: Graphics, frame: number): void {
  const shell = DB32.rope;
  const stripe = DB32.twine;
  g.rect(-4, -1, 9, 1).fill(DB32.heather);
  g.rect(2, -3, 3, 2).fill(DB32.heather);
  // Eye stalks, waving.
  g.rect(3, -5 - frame, 1, 2 + frame).fill(DB32.heather);
  g.rect(5, -5 + frame, 1, 2 - frame).fill(DB32.heather);
  g.rect(3, -6 - frame, 1, 1).fill(DB32.valhalla);
  g.rect(5, -6 + frame, 1, 1).fill(DB32.valhalla);
  // The shell and its spiral.
  g.rect(-4, -6, 6, 5).fill(shell);
  g.rect(-3, -7, 4, 1).fill(shell);
  g.rect(-3, -5, 4, 1).fill(stripe);
  g.rect(-3, -5, 1, 3).fill(stripe);
  g.rect(-3, -3, 3, 1).fill(stripe);
  g.rect(-1, -4, 1, 1).fill(stripe);
}

import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const SCURRY_SPEED = 48;
const SCURRY_TIME = 0.35;
const FREEZE_TIME = 1.5;

// A cellar mouse: dead still, whiskers going, then off along the shelf in a
// blur, then dead still again.
export class Mouse implements Critter {
  readonly sprite: Container;
  readonly species = 'mouse' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawMouse(g, 0),
    subjectScale: 6,
    speech: "Eek! I mean — hello. I wasn't eating the cheese. What cheese?",
  };

  private readonly spec: PatrolSpec;
  private readonly body: ArtBody;
  private x: number;
  private facing: 1 | -1 = 1;
  private timer: number;
  private scurrying = false;
  private elapsed = 0;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.timer = (spec.x * 0.023) % FREEZE_TIME;
    this.sprite = new Container();
    this.body = new ArtBody('mouse');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.scurrying = !this.scurrying;
      this.timer = this.scurrying ? SCURRY_TIME : FREEZE_TIME;
      if (this.scurrying && Math.random() < 0.5) this.facing = this.facing === 1 ? -1 : 1;
    }
    if (this.scurrying) {
      this.x += this.facing * SCURRY_SPEED * dt;
      if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
        this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
        this.facing = this.facing === 1 ? -1 : 1;
      }
    }
    this.body.draw((g) => drawMouse(g, this.scurrying ? 0 : Math.floor(this.elapsed * 8) & 1));
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 5, y: this.spec.y - 5, width: 10, height: 5 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), feet on y = 0, nose to the right: 10 wide × 5 tall.
// Grey, round ears, a long pink tail, whiskers that twitch on `whisker`.
export function drawMouse(g: Graphics, whisker: number): void {
  const fur = DB32.topaz;
  g.rect(-8, -1, 4, 1).fill(DB32.mandy);
  g.rect(-4, -4, 6, 4).fill(fur);
  g.rect(2, -3, 2, 3).fill(fur);
  g.rect(4, -2, 1, 1).fill(DB32.mandy);
  g.rect(0, -6, 2, 2).fill(DB32.heather);
  g.rect(1, -5, 1, 1).fill(DB32.mandy);
  g.rect(2, -3, 1, 1).fill(DB32.valhalla);
  g.rect(4, -3 - whisker, 2, 1).fill(DB32.lightSteel);
  g.rect(-3, -1, 1, 1).fill(DB32.heather);
}

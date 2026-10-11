import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const SCUTTLE_SPEED = 26;
// A newt goes in little dashes: scuttle, stop dead, look about, scuttle.
const DASH_TIME = 0.5;
const STOP_TIME = 1.2;

// An orange cave newt on the shore of the underground lake, dashing along a
// stretch of wet rock and stopping dead in between, as newts do.
export class Newt implements Critter {
  readonly sprite: Container;
  readonly species = 'newt' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawNewt(g, 0),
    subjectScale: 5,
    speech: "I'm not a lizard, I'm a newt. We're moist. It's a whole different thing.",
  };

  private readonly spec: PatrolSpec;
  private readonly body: ArtBody;
  private x: number;
  private facing: 1 | -1 = 1;
  private timer: number;
  private dashing = false;
  private elapsed = 0;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.timer = (spec.x * 0.031) % STOP_TIME;
    this.sprite = new Container();
    this.body = new ArtBody('newt');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.dashing = !this.dashing;
      this.timer = this.dashing ? DASH_TIME : STOP_TIME;
    }
    if (this.dashing) {
      this.x += this.facing * SCUTTLE_SPEED * dt;
      if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
        this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
        this.facing = this.facing === 1 ? -1 : 1;
      }
    }
    this.body.draw((g) => drawNewt(g, this.dashing ? Math.floor(this.elapsed * 12) & 1 : 0));
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 7, y: this.spec.y - 4, width: 14, height: 4 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), feet on y = 0, head to the right: 14 wide × 4 tall.
// Bright orange with dark spots, a long tail curling behind it, and legs
// that splay out sideways the way a newt's do.
export function drawNewt(g: Graphics, step: number): void {
  const skin = DB32.tahitiGold;
  const spot = DB32.oiledCedar;
  g.rect(-7, -2, 4, 1).fill(skin);
  g.rect(-8, -1, 2, 1).fill(skin);
  g.rect(-3, -3, 7, 2).fill(skin);
  g.rect(4, -3, 3, 2).fill(skin);
  g.rect(6, -2, 1, 1).fill(DB32.goldenFizz);
  g.rect(5, -3, 1, 1).fill(DB32.valhalla);
  g.rect(-2, -3, 1, 1).fill(spot);
  g.rect(1, -2, 1, 1).fill(spot);
  g.rect(-5, -2, 1, 1).fill(spot);
  // Legs, splayed, alternating.
  g.rect(-3 + step, -1, 1, 1).fill(skin);
  g.rect(2 - step, -1, 1, 1).fill(skin);
}

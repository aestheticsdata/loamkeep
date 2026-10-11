import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

// A mountain hare in its winter coat. It sits, twitches an ear, and then goes
// off in a burst of long low bounds before sitting again — never a walk.
const SIT_TIME = 1.6;
const BOUND_SPEED = 70;
const BOUNDS = 4;
const BOUND_TIME = 0.28;
const BOUND_HEIGHT = 5;

export class Hare implements Critter {
  readonly sprite: Container;
  readonly species = 'hare' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawHare(g, { bounding: false, ear: 0 }),
    subjectScale: 4,
    speech: "I'm a HARE. Not a rabbit. Completely different. Look at the ears.",
  };

  private readonly spec: PatrolSpec;
  private readonly body: Graphics;
  private x: number;
  private facing: 1 | -1 = 1;
  private timer: number;
  private boundsLeft = 0;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.timer = (spec.x * 0.013) % SIT_TIME;
    this.sprite = new Container();
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.timer -= dt;
    let hop = 0;
    if (this.boundsLeft > 0) {
      this.x += this.facing * BOUND_SPEED * dt;
      if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
        this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
        this.facing = this.facing === 1 ? -1 : 1;
      }
      const t = 1 - Math.max(0, this.timer) / BOUND_TIME;
      hop = Math.round(Math.sin(t * Math.PI) * BOUND_HEIGHT);
      if (this.timer <= 0) {
        this.boundsLeft -= 1;
        this.timer = this.boundsLeft > 0 ? BOUND_TIME : SIT_TIME;
      }
    } else if (this.timer <= 0) {
      this.boundsLeft = BOUNDS;
      this.timer = BOUND_TIME;
      if (Math.random() < 0.4) this.facing = this.facing === 1 ? -1 : 1;
    }
    const ear = this.boundsLeft === 0 && this.timer % 1.1 < 0.15 ? 1 : 0;
    this.body.clear();
    drawHare(this.body, { bounding: this.boundsLeft > 0, ear });
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y - hop;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 6, y: this.spec.y - 13, width: 12, height: 13 }, playerPos, playerSize);
  }
}

export interface HarePose {
  bounding: boolean;
  // 1 while one ear is flicked back.
  ear: number;
}

// Drawn around (0, 0), feet on y = 0, head to the right: 12 wide × 13 tall,
// white with black ear tips. Sitting, it is a tall round lump with its ears
// up; bounding, it is stretched long and low.
export function drawHare(g: Graphics, pose: HarePose): void {
  const fur = DB32.white;
  const furLo = DB32.heather;
  const tip = DB32.valhalla;
  if (pose.bounding) {
    g.rect(-6, -6, 10, 4).fill(fur);
    g.rect(-6, -3, 10, 1).fill(furLo);
    g.rect(3, -8, 4, 4).fill(fur);
    g.rect(4, -12, 1, 4).fill(fur);
    g.rect(4, -12, 1, 1).fill(tip);
    g.rect(-7, -5, 1, 1).fill(fur);
    g.rect(-6, -2, 3, 2).fill(furLo);
    g.rect(2, -2, 3, 2).fill(furLo);
    g.rect(5, -7, 1, 1).fill(tip);
    return;
  }
  g.rect(-4, -8, 7, 8).fill(fur);
  g.rect(-5, -6, 1, 5).fill(fur);
  g.rect(-4, -1, 7, 1).fill(furLo);
  g.rect(-5, -3, 1, 1).fill(DB32.lightSteel);
  g.rect(1, -11, 5, 4).fill(fur);
  // Ears, one of them flicking back now and then.
  g.rect(2, -13 + pose.ear, 1, 3 - pose.ear).fill(fur);
  g.rect(2, -13 + pose.ear, 1, 1).fill(tip);
  g.rect(4, -14, 1, 4).fill(fur);
  g.rect(4, -14, 1, 1).fill(tip);
  g.rect(4, -10, 1, 1).fill(tip);
  g.rect(6, -9, 1, 1).fill(DB32.brown);
}

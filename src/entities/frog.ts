import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const SIT_TIME = 2.8;
const LEAP_TIME = 0.6;
const LEAP_HEIGHT = 14;

// Authored description of a frog: two spots on the ground it leaps between,
// both at foot height y — usually the two banks of a pool.
export interface FrogSpec {
  fromX: number;
  toX: number;
  y: number;
}

// A frog that sits on one bank, croaking, and now and then leaps the pool to
// the other bank in one long arc, and later back.
export class Frog implements Critter {
  readonly sprite: Container;
  readonly species = 'frog' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawFrog(g, { croak: true, leaping: false }),
    subjectScale: 5,
    speech: "Ribbit. ...That's all I've got. I'm a frog.",
  };

  private readonly spec: FrogSpec;
  private readonly body: ArtBody;
  private timer: number;
  private onFar = false;
  private leaping = false;
  private x: number;
  private lift = 0;

  constructor(spec: FrogSpec) {
    this.spec = spec;
    this.x = spec.fromX;
    this.timer = (spec.fromX * 0.017) % SIT_TIME;
    this.sprite = new Container();
    this.body = new ArtBody('frog');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      if (this.leaping) {
        this.leaping = false;
        this.onFar = !this.onFar;
        this.timer = SIT_TIME;
      } else {
        this.leaping = true;
        this.timer = LEAP_TIME;
      }
    }
    const from = this.onFar ? this.spec.toX : this.spec.fromX;
    const to = this.onFar ? this.spec.fromX : this.spec.toX;
    if (this.leaping) {
      const t = 1 - this.timer / LEAP_TIME;
      this.x = from + (to - from) * t;
      this.lift = Math.sin(t * Math.PI) * LEAP_HEIGHT;
    } else {
      this.x = from;
      this.lift = 0;
    }
    const croak = !this.leaping && this.timer % 1.4 < 0.35;
    this.body.draw((g) => drawFrog(g, { croak, leaping: this.leaping }));
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y - this.lift;
    this.sprite.scale.set(to > from ? 1 : -1, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 5, y: this.spec.y - this.lift - 7, width: 10, height: 7 }, playerPos, playerSize);
  }
}

export interface FrogPose {
  croak: boolean;
  leaping: boolean;
}

// Drawn around (0, 0), feet on y = 0, facing right: 10 wide × 7 tall. Sitting,
// a squat green dome with big eyes; croaking, a pale bubble swells under its
// chin; leaping, it is all legs.
export function drawFrog(g: Graphics, pose: FrogPose): void {
  const skin = DB32.christi;
  const skinLo = DB32.dell;
  if (pose.leaping) {
    g.rect(-3, -6, 7, 3).fill(skin);
    g.rect(-6, -4, 3, 1).fill(skinLo);
    g.rect(-7, -3, 2, 1).fill(skinLo);
    g.rect(3, -4, 2, 2).fill(skinLo);
    g.rect(2, -7, 2, 1).fill(DB32.atlantis);
    g.rect(3, -7, 1, 1).fill(DB32.valhalla);
    return;
  }
  g.rect(-4, -4, 8, 4).fill(skin);
  g.rect(-5, -2, 2, 2).fill(skinLo);
  g.rect(3, -2, 2, 2).fill(skinLo);
  // Eyes on top, bulging.
  g.rect(-2, -6, 2, 2).fill(DB32.atlantis);
  g.rect(1, -6, 2, 2).fill(DB32.atlantis);
  g.rect(-1, -6, 1, 1).fill(DB32.valhalla);
  g.rect(2, -6, 1, 1).fill(DB32.valhalla);
  g.rect(0, -2, 3, 1).fill(skinLo);
  if (pose.croak) {
    g.rect(2, -2, 3, 3).fill(DB32.pancho);
    g.rect(3, -1, 1, 1).fill(DB32.white);
  }
}

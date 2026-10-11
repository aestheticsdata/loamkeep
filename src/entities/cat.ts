import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

// Seconds between two tail flicks, and between two big stretches.
const FLICK_EVERY = 2.3;
const STRETCH_EVERY = 9;
const STRETCH_TIME = 1.4;

// Authored description of a cat: where it lies, feet on y.
export interface CatSpec {
  x: number;
  y: number;
}

// The library cat, curled up asleep on the floorboards. Its tail flicks now
// and then; once in a long while it stretches right out, then curls back up.
export class Cat implements Critter {
  readonly sprite: Container;
  readonly species = 'cat' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawCat(g, { stretching: false, flick: 0 }),
    subjectScale: 4,
    speech: "Mrrp. You're standing in my sunbeam. There is no sun in here. Still.",
  };

  private readonly spec: CatSpec;
  private readonly body: Graphics;
  private elapsed: number;
  private drawn = '';

  constructor(spec: CatSpec) {
    this.spec = spec;
    this.elapsed = spec.x * 0.02;
    this.sprite = new Container();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const stretching = this.elapsed % STRETCH_EVERY < STRETCH_TIME;
    const flick = this.elapsed % FLICK_EVERY < 0.25 ? 1 : 0;
    const key = `${stretching}${flick}`;
    if (key === this.drawn) return;
    this.drawn = key;
    this.body.clear();
    drawCat(this.body, { stretching, flick });
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.spec.x - 8, y: this.spec.y - 7, width: 16, height: 7 }, playerPos, playerSize);
  }
}

export interface CatPose {
  stretching: boolean;
  flick: number;
}

// Drawn around (0, 0), lying on y = 0: a ginger loaf 14 wide × 7 tall with
// its tail wrapped round, ears up, eyes shut. Stretching, it is a long low
// line with its front paws out.
export function drawCat(g: Graphics, pose: CatPose): void {
  const fur = DB32.tahitiGold;
  const furDark = DB32.rope;
  if (pose.stretching) {
    g.rect(-9, -4, 14, 3).fill(fur);
    g.rect(5, -2, 4, 2).fill(fur);
    g.rect(-12, -6, 4, 4).fill(fur);
    g.rect(-12, -8, 1, 2).fill(fur);
    g.rect(-9, -8, 1, 2).fill(fur);
    g.rect(-11, -5, 1, 1).fill(DB32.valhalla);
    g.rect(-6, -4, 1, 3).fill(furDark);
    g.rect(0, -4, 1, 3).fill(furDark);
    g.rect(9, -6, 1, 4).fill(fur);
    return;
  }
  g.rect(-6, -5, 12, 5).fill(fur);
  g.rect(-5, -6, 10, 1).fill(fur);
  g.rect(-3, -5, 1, 4).fill(furDark);
  g.rect(1, -5, 1, 4).fill(furDark);
  // Head tucked in on the left, ears up, eyes shut.
  g.rect(-8, -6, 5, 5).fill(fur);
  g.rect(-8, -8, 1, 2).fill(fur);
  g.rect(-5, -8, 1, 2).fill(fur);
  g.rect(-7, -4, 2, 1).fill(DB32.valhalla);
  g.rect(-8, -2, 1, 1).fill(DB32.mandy);
  // Tail round the front, its tip flicking.
  g.rect(-4, -1, 11, 1).fill(furDark);
  g.rect(7, -2 - pose.flick, 1, 2).fill(furDark);
}

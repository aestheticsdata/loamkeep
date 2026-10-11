import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const DIG_SPEED = 9;
const DIG_TIME = 2.2;
const REST_TIME = 1.4;
// Paw swaps a second while it is on the move.
const PADDLE = 4;

// A mole in the tunnels under the garden: a short shuffle along the floor,
// paws going, then a sit and a sniff, then on again — turning only at the
// ends of its own stretch of tunnel.
export class Mole implements Critter {
  readonly sprite: Container;
  readonly species = 'mole' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawMole(g, 0),
    subjectScale: 5,
    speech: "Is someone there? You smell like you're wearing boots indoors.",
  };

  private readonly spec: PatrolSpec;
  private readonly body = new ArtBody('mole');
  private x: number;
  private facing: 1 | -1 = 1;
  private timer: number;
  private digging = true;
  private elapsed = 0;

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.timer = (spec.x * 0.017) % DIG_TIME;
    this.sprite = new Container();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.digging = !this.digging;
      this.timer = this.digging ? DIG_TIME : REST_TIME;
    }
    if (this.digging) {
      this.x += this.facing * DIG_SPEED * dt;
      if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
        this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
        this.facing = this.facing === 1 ? -1 : 1;
      }
    }
    const paw = this.digging ? Math.floor(this.elapsed * PADDLE) & 1 : 0;
    this.body.draw((g) => drawMole(g, paw));
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.x - 7, y: this.spec.y - 7, width: 14, height: 7 }, playerPos, playerSize);
  }
}

// Drawn around (0, 0), feet on y = 0, nose to the right: 12 wide × 7 tall.
// Velvet black with a blue sheen along the back, a pink snout and pink
// hands; `paw` swaps which hand is out in front.
export function drawMole(g: Graphics, paw: number): void {
  g.rect(-6, -6, 10, 6).fill(DB32.valhalla);
  g.rect(-5, -7, 8, 1).fill(DB32.deepKoamaru);
  g.rect(-4, -6, 6, 1).fill(DB32.deepKoamaru);
  g.rect(4, -4, 2, 2).fill(DB32.valhalla);
  g.rect(6, -4, 1, 1).fill(DB32.mandy);
  if (paw) {
    g.rect(4, -2, 3, 1).fill(DB32.mandy);
    g.rect(3, -1, 2, 1).fill(DB32.mandy);
  } else {
    g.rect(3, -1, 3, 1).fill(DB32.mandy);
  }
  g.rect(-5, -1, 2, 1).fill(DB32.mandy);
  g.rect(-7, -3, 1, 1).fill(DB32.mandy);
}

// The page's mole, drawn at page size: a round velvet body, the sheen, the
// long snout with its whiskers, and the big digging hands.
export function drawMoleLarge(g: Graphics): void {
  for (let dy = -10; dy <= 10; dy++) {
    const half = Math.round(18 * Math.sqrt(1 - (dy * dy) / 100));
    g.rect(-half, -12 + dy, half * 2, 1).fill(DB32.valhalla);
  }
  g.rect(-12, -21, 20, 2).fill(DB32.deepKoamaru);
  g.rect(-8, -19, 12, 1).fill(DB32.deepKoamaru);
  g.rect(16, -14, 6, 5).fill(DB32.valhalla);
  g.rect(22, -13, 3, 3).fill(DB32.mandy);
  g.rect(23, -13, 1, 1).fill(DB32.white);
  for (const y of [-15, -12, -9]) g.rect(24, y, 6, 1).fill(DB32.lightSteel);
  g.rect(10, -4, 9, 4).fill(DB32.mandy);
  for (const x of [11, 14, 17]) g.rect(x, 0, 2, 2).fill(DB32.mandy);
  g.rect(-14, -2, 6, 2).fill(DB32.mandy);
  g.rect(-20, -9, 2, 2).fill(DB32.mandy);
  g.rect(14, -15, 1, 1).fill(DB32.dimGray);
}

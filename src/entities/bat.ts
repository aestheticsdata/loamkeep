import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// Seconds a bat hangs between two flutters, and how long a flutter lasts.
const HANG_TIME = 3.4;
const FLUTTER_TIME = 1.1;
const FLUTTER_RADIUS = 10;

// Authored description of a bat: the point on a ceiling's underside it hangs
// from (x, y). It hangs there upside down, wrapped in its wings, and every so
// often lets go for a quick loop round its spot before hanging up again.
export interface BatSpec {
  x: number;
  y: number;
}

export class Bat implements Critter {
  readonly sprite: Container;
  readonly species = 'bat' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawBatLarge(g),
    subjectScale: 4,
    speech: "Shh, I'm hanging out. Upside down. Like a professional.",
  };

  private readonly spec: BatSpec;
  private readonly body: ArtBody;
  private timer: number;
  private fluttering = false;
  private pos: Vec2;

  constructor(spec: BatSpec) {
    this.spec = spec;
    this.pos = { x: spec.x, y: spec.y };
    this.timer = (spec.x * 0.021) % HANG_TIME;
    this.sprite = new Container();
    this.body = new ArtBody('bat');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.fluttering = !this.fluttering;
      this.timer = this.fluttering ? FLUTTER_TIME : HANG_TIME;
    }
    if (this.fluttering) {
      const t = 1 - this.timer / FLUTTER_TIME;
      const a = t * Math.PI * 2;
      this.pos = {
        x: this.spec.x + Math.sin(a) * FLUTTER_RADIUS,
        y: this.spec.y + 8 + (1 - Math.cos(a)) * 5,
      };
      const frame = Math.floor(t * 14) & 1;
      this.body.draw((g) => drawBatFlying(g, frame));
    } else {
      this.pos = { x: this.spec.x, y: this.spec.y };
      const blink = this.timer % 1.3 < 0.12;
      this.body.draw((g) => drawBatHanging(g, blink));
    }
    this.sprite.x = this.pos.x;
    this.sprite.y = this.pos.y;
  }

  // Generous downward: a bat hangs from a tunnel roof three or four tiles
  // over a standing head, and walking under one is meeting it.
  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    return touches({ x: this.pos.x - 5, y: this.pos.y, width: 10, height: 52 }, playerPos, playerSize);
  }
}

// Hanging, drawn from (0, 0) on the ceiling downward: a dark furled shape
// 5 wide × 8 tall, feet up, ears down, two pale eyes that blink.
export function drawBatHanging(g: Graphics, blink: boolean): void {
  const wing = DB32.loulou;
  g.rect(-1, 0, 1, 1).fill(DB32.topaz);
  g.rect(1, 0, 1, 1).fill(DB32.topaz);
  g.rect(-2, 1, 5, 5).fill(wing);
  g.rect(-1, 6, 3, 1).fill(wing);
  g.rect(-2, 7, 1, 1).fill(wing);
  g.rect(2, 7, 1, 1).fill(wing);
  if (!blink) {
    g.rect(-1, 5, 1, 1).fill(DB32.pancho);
    g.rect(1, 5, 1, 1).fill(DB32.pancho);
  }
}

// In flight, drawn around (0, 0): a little M of wings, 11 wide.
export function drawBatFlying(g: Graphics, frame: number): void {
  const wing = DB32.loulou;
  g.rect(-1, -2, 3, 3).fill(wing);
  g.rect(-1, -3, 1, 1).fill(wing);
  g.rect(1, -3, 1, 1).fill(wing);
  const tip = frame === 0 ? -3 : 1;
  g.rect(-5, -1, 4, 1).fill(wing);
  g.rect(2, -1, 4, 1).fill(wing);
  g.rect(-6, tip, 1, 2).fill(wing);
  g.rect(6, tip, 1, 2).fill(wing);
  g.rect(-1, -1, 1, 1).fill(DB32.pancho);
  g.rect(1, -1, 1, 1).fill(DB32.pancho);
}

// The portrait: hanging, but large enough for a face — big ears, a grin.
// 13 wide × 15 tall, anchored with its top at -15 so the page lifts it like
// any standing creature.
export function drawBatLarge(g: Graphics): void {
  const wing = DB32.loulou;
  const wingHi = DB32.smokeyAsh;
  g.rect(-2, -15, 1, 2).fill(DB32.topaz);
  g.rect(2, -15, 1, 2).fill(DB32.topaz);
  g.rect(-5, -13, 11, 9).fill(wing);
  g.rect(-6, -11, 1, 6).fill(wing);
  g.rect(6, -11, 1, 6).fill(wing);
  g.rect(-4, -12, 1, 7).fill(wingHi);
  // Head at the bottom, upside down: ears point down.
  g.rect(-3, -4, 7, 3).fill(wing);
  g.rect(-3, -1, 1, 1).fill(wing);
  g.rect(3, -1, 1, 1).fill(wing);
  g.rect(-2, -4, 1, 1).fill(DB32.pancho);
  g.rect(2, -4, 1, 1).fill(DB32.pancho);
  g.rect(-1, -3, 3, 1).fill(DB32.mandy);
}

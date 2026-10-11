import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

// Tail wiggle (Hz), glow pulse (rad/s) and the slow vertical drift (rad/s,
// px). The pulse is slower than the tail so the light reads as breathing,
// not as flicker.
const WIGGLE_FREQUENCY = 4;
const PULSE_SPEED = 2.2;
const DRIFT_SPEED = 1.3;
const DRIFT_AMPLITUDE = 3;
// How many brightness steps the halo is quantised to. Redrawing only when
// the step changes keeps this to a handful of redraws a second.
const GLOW_STEPS = 4;

// Authored description of a glowfish, as for Fish: it patrols minX..maxX at
// `speed`, centred on `y`, and drifts a few pixels up and down as it goes.
export interface GlowfishSpec {
  x: number;
  y: number;
  speed: number;
  minX: number;
  maxX: number;
  facing?: 1 | -1;
}

// What drawGlowfish needs for one frame: which tail, and how bright the halo
// is (0..1).
export interface GlowfishFrame {
  tail: number;
  glow: number;
}

// A pale fish that carries its own light, for the flooded cistern where
// nothing else does. Not a Fish: meeting one writes its own page, and the
// greeting check tells the two apart by class.
export class Glowfish implements Entity {
  readonly sprite: Container;

  private posX: number;
  private posY: number;
  private readonly baseY: number;
  private velX: number;
  private facing: 1 | -1;
  private readonly minX: number;
  private readonly maxX: number;
  private readonly body: Graphics;
  private elapsedTime: number;
  private drawn: GlowfishFrame = { tail: -1, glow: -1 };

  private static readonly BODY_LEFT = -5;
  private static readonly BODY_RIGHT = 4;
  private static readonly BODY_TOP = -4;
  private static readonly BODY_BOTTOM = 2;

  constructor(spec: GlowfishSpec) {
    this.posX = spec.x;
    this.baseY = spec.y;
    this.posY = spec.y;
    this.facing = spec.facing ?? 1;
    this.velX = this.facing * spec.speed;
    this.minX = spec.minX;
    this.maxX = spec.maxX;
    // Phase from x, so a shoal does not pulse in step.
    this.elapsedTime = spec.x * 0.11;
    this.sprite = new Container();
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsedTime += dt;
    this.posX += this.velX * dt;
    if (this.posX < this.minX) {
      this.posX = this.minX;
      this.velX = Math.abs(this.velX);
      this.facing = 1;
    } else if (this.posX > this.maxX) {
      this.posX = this.maxX;
      this.velX = -Math.abs(this.velX);
      this.facing = -1;
    }
    this.posY = this.baseY + Math.sin(this.elapsedTime * DRIFT_SPEED) * DRIFT_AMPLITUDE;

    const tail = Math.floor(this.elapsedTime * WIGGLE_FREQUENCY) & 1;
    const pulse = (Math.sin(this.elapsedTime * PULSE_SPEED) + 1) / 2;
    const glow = Math.round(pulse * GLOW_STEPS) / GLOW_STEPS;
    if (tail !== this.drawn.tail || glow !== this.drawn.glow) {
      this.drawn = { tail, glow };
      this.body.clear();
      drawGlowfish(this.body, this.drawn);
    }

    this.sprite.x = this.posX;
    this.sprite.y = this.posY;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const left = this.posX + Glowfish.BODY_LEFT;
    const right = this.posX + Glowfish.BODY_RIGHT;
    const top = this.posY + Glowfish.BODY_TOP;
    const bottom = this.posY + Glowfish.BODY_BOTTOM;
    return (
      playerPos.x < right &&
      playerPos.x + playerSize.x > left &&
      playerPos.y < bottom &&
      playerPos.y + playerSize.y > top
    );
  }
}

// Drawn around (0, 0), head on the right as Fish's is. The halo is two
// stepped rectangles of translucent cyan, the inner one brighter, so the
// light keeps the pixel grid instead of blurring off it.
export function drawGlowfish(g: Graphics, frame: GlowfishFrame): void {
  const halo = DB32.viking;
  const outer = 0.06 + frame.glow * 0.1;
  const inner = 0.14 + frame.glow * 0.18;
  g.rect(-8, -6, 15, 9).fill({ color: halo, alpha: outer });
  g.rect(-6, -7, 11, 11).fill({ color: halo, alpha: outer });
  g.rect(-5, -4, 9, 5).fill({ color: halo, alpha: inner });

  // Body: pale, with a cyan belly line that is the source of the light.
  g.rect(-2, -2, 5, 2).fill(DB32.lightSteel);
  g.rect(-1, -3, 3, 1).fill(DB32.lightSteel);
  g.rect(-2, -1, 5, 1).fill(DB32.viking);
  g.rect(2, -2, 1, 1).fill(DB32.valhalla);
  // The lure: one bright pixel on a stalk over the head.
  g.rect(3, -4, 1, 1).fill(DB32.heather);
  g.rect(4, -5, 1, 1).fill(frame.glow > 0.5 ? DB32.white : DB32.viking);

  if (frame.tail === 0) {
    g.rect(-3, -2, 1, 2).fill(DB32.heather);
  } else {
    g.rect(-3, -2, 1, 1).fill(DB32.heather);
    g.rect(-4, -3, 1, 1).fill(DB32.heather);
    g.rect(-4, 0, 1, 1).fill(DB32.heather);
  }
}

// The portrait, for the greeting and the creatures book: ~24 × 14 at native
// size, drawn for scaling rather than scaled up from the 9-px sprite, for the
// reason drawFishLarge gives. Anchored at the bottom-centre like the rest.
export function drawGlowfishLarge(g: Graphics): void {
  const halo = DB32.viking;
  g.rect(-14, -13, 28, 14).fill({ color: halo, alpha: 0.12 });
  g.rect(-12, -11, 24, 10).fill({ color: halo, alpha: 0.2 });

  const body = DB32.lightSteel;
  g.rect(-6, -9, 12, 1).fill(body);
  g.rect(-7, -8, 14, 1).fill(body);
  g.rect(-8, -7, 16, 3).fill(body);
  g.rect(-7, -4, 14, 1).fill(body);
  g.rect(8, -7, 1, 2).fill(body);
  // Glowing belly band.
  g.rect(-7, -5, 14, 1).fill(DB32.viking);
  g.rect(-6, -4, 12, 1).fill(DB32.viking);
  // Translucent fins.
  g.rect(-2, -11, 4, 2).fill(DB32.heather);
  g.rect(-1, -3, 3, 1).fill(DB32.heather);
  // Tail.
  g.rect(-10, -8, 2, 4).fill(DB32.heather);
  g.rect(-11, -9, 1, 2).fill(DB32.heather);
  g.rect(-11, -5, 1, 2).fill(DB32.heather);
  // Eye.
  g.rect(4, -8, 2, 2).fill(DB32.valhalla);
  g.rect(5, -8, 1, 1).fill(DB32.white);
  // Lure on its stalk.
  g.rect(6, -11, 1, 2).fill(DB32.heather);
  g.rect(7, -13, 1, 2).fill(DB32.heather);
  g.rect(8, -14, 2, 2).fill(DB32.white);
}

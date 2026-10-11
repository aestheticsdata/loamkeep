import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

// Wing beats per second. Fast, the way a moth's are, against the slow loop
// it flies.
const FLAP_FREQUENCY = 10;

// Authored description of a moth circling a light. It flies an ellipse round
// (x, y) — `rx` across and `ry` up and down — once every `period` seconds,
// with a wobble on top so the loop never looks traced.
export interface MothSpec {
  x: number;
  y: number;
  rx: number;
  ry: number;
  period: number;
}

// A pale moth that circles a glowcap. Decorative, with the AABB overlap every
// creature has, for the first-moth greeting.
export class Moth implements Entity {
  readonly sprite: Container;

  private readonly spec: MothSpec;
  private readonly body: Graphics;
  private readonly pos: Vec2 = { x: 0, y: 0 };
  private elapsedTime: number;
  private wingFrame = -1;

  private static readonly HALF_WIDTH = 3;
  private static readonly HEIGHT = 4;

  constructor(spec: MothSpec) {
    this.spec = spec;
    // Start each moth somewhere different on its loop.
    this.elapsedTime = (spec.x * 0.07) % spec.period;
    this.sprite = new Container();
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsedTime += dt;
    const angle = (this.elapsedTime / this.spec.period) * Math.PI * 2;
    const wobble = Math.sin(this.elapsedTime * 5.3) * 2;
    this.pos.x = this.spec.x + Math.cos(angle) * this.spec.rx;
    this.pos.y = this.spec.y + Math.sin(angle) * this.spec.ry + wobble;

    const frame = Math.floor(this.elapsedTime * FLAP_FREQUENCY) & 1;
    if (frame !== this.wingFrame) {
      this.wingFrame = frame;
      this.body.clear();
      drawMoth(this.body, frame);
    }
    this.sprite.x = this.pos.x;
    this.sprite.y = this.pos.y;
    // Facing follows the direction of travel round the loop.
    this.sprite.scale.set(Math.sin(angle) > 0 ? -1 : 1, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const left = this.pos.x - Moth.HALF_WIDTH;
    const right = this.pos.x + Moth.HALF_WIDTH;
    const top = this.pos.y - Moth.HEIGHT;
    const bottom = this.pos.y;
    return (
      playerPos.x < right &&
      playerPos.x + playerSize.x > left &&
      playerPos.y < bottom &&
      playerPos.y + playerSize.y > top
    );
  }
}

// Drawn around (0, 0), body on the y = -2 line: 7 wide × 4 tall. Frame 0 has
// the wings spread flat, frame 1 folded up over the back.
export function drawMoth(g: Graphics, wingFrame: number): void {
  const wing = DB32.pancho;
  const wingDark = DB32.twine;
  g.rect(-1, -3, 2, 2).fill(DB32.rope);
  g.rect(1, -4, 1, 1).fill(DB32.twine);
  if (wingFrame === 0) {
    g.rect(-3, -3, 2, 2).fill(wing);
    g.rect(2, -3, 2, 2).fill(wing);
    g.rect(-3, -2, 1, 1).fill(wingDark);
    g.rect(3, -2, 1, 1).fill(wingDark);
  } else {
    g.rect(-2, -4, 1, 2).fill(wing);
    g.rect(2, -4, 1, 2).fill(wing);
  }
}

// The portrait for the greeting and the book: the moth at rest with its
// wings open, 15 wide × 10 tall, with the eye-spots a sprite has no room for.
export function drawMothLarge(g: Graphics): void {
  const wing = DB32.pancho;
  const wingDark = DB32.twine;
  // Body and antennae.
  g.rect(-1, -8, 2, 7).fill(DB32.rope);
  g.rect(-3, -10, 1, 2).fill(DB32.rope);
  g.rect(2, -10, 1, 2).fill(DB32.rope);
  g.rect(-2, -9, 1, 1).fill(DB32.rope);
  g.rect(1, -9, 1, 1).fill(DB32.rope);
  // Forewings and hindwings.
  g.rect(-7, -8, 6, 4).fill(wing);
  g.rect(1, -8, 6, 4).fill(wing);
  g.rect(-6, -4, 5, 3).fill(wing);
  g.rect(1, -4, 5, 3).fill(wing);
  g.rect(-7, -8, 6, 1).fill(wingDark);
  g.rect(1, -8, 6, 1).fill(wingDark);
  // Eye-spots.
  g.rect(-5, -6, 2, 2).fill(DB32.rope);
  g.rect(3, -6, 2, 2).fill(DB32.rope);
  g.rect(-5, -6, 1, 1).fill(DB32.valhalla);
  g.rect(4, -6, 1, 1).fill(DB32.valhalla);
}

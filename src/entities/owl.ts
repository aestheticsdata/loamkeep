import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

// Seconds between two blinks, and how long the eyes stay shut. Slow on
// purpose: an owl that blinks like a person reads as nervous.
const BLINK_INTERVAL = 4.2;
const BLINK_LENGTH = 0.18;
// Seconds the head spends looking one way before it turns to the next.
const LOOK_INTERVAL = 2.6;

// Where the eyes are turned: -1 left, 0 straight at the player, 1 right.
export type OwlLook = -1 | 0 | 1;

export interface OwlPose {
  blink: boolean;
  look: OwlLook;
}

// Authored description of an owl perched on a ledge.
//   x - centre x
//   y - FOOT y (the top of the tile it perches on)
export interface OwlSpec {
  x: number;
  y: number;
}

// An owl, perched. It never flies and never walks — it sits where the level
// puts it, blinks, and turns its head round the room. Like the rabbit it
// exposes only an AABB overlap, so Game can fire the first-owl greeting.
//
// Each owl starts its clocks at an offset taken from its x, so two owls in
// one storey don't blink in unison.
export class Owl implements Entity {
  readonly sprite: Container;

  private readonly posX: number;
  private readonly posY: number;
  private readonly body: Graphics;
  private elapsedTime: number;
  private pose: OwlPose = { blink: false, look: 0 };

  // Silhouette extent around (posX, posY = feet), matching drawOwl.
  private static readonly BODY_LEFT = -4;
  private static readonly BODY_RIGHT = 4;
  private static readonly BODY_TOP = -11;

  constructor(spec: OwlSpec) {
    this.posX = spec.x;
    this.posY = spec.y;
    this.elapsedTime = (spec.x * 0.37) % BLINK_INTERVAL;
    this.sprite = new Container();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    drawOwl(this.body, this.pose);
  }

  update(dt: number): void {
    this.elapsedTime += dt;
    const blink = this.elapsedTime % BLINK_INTERVAL < BLINK_LENGTH;
    // Straight, left, straight, right — the slow sweep of a head on a swivel.
    const sweep: readonly OwlLook[] = [0, -1, 0, 1];
    const look = sweep[Math.floor(this.elapsedTime / LOOK_INTERVAL) % sweep.length];
    if (blink === this.pose.blink && look === this.pose.look) return;
    this.pose = { blink, look };
    this.body.clear();
    drawOwl(this.body, this.pose);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const left = this.posX + Owl.BODY_LEFT;
    const right = this.posX + Owl.BODY_RIGHT;
    const top = this.posY + Owl.BODY_TOP;
    const bottom = this.posY;
    return (
      playerPos.x < right &&
      playerPos.x + playerSize.x > left &&
      playerPos.y < bottom &&
      playerPos.y + playerSize.y > top
    );
  }
}

// Drawn around (0, 0) with the talons on the y = 0 line: 8 wide × 11 tall.
// Brown body with a pale face disc, two ear tufts, gold eyes. Exported for
// the greeting popup and the creatures book, which draw it scaled up.
export function drawOwl(g: Graphics, pose: OwlPose): void {
  const body = DB32.rope;
  const wing = DB32.oiledCedar;
  const breast = DB32.twine;
  const face = DB32.pancho;
  const eye = DB32.goldenFizz;
  const pupil = DB32.valhalla;
  const beak = DB32.tahitiGold;

  // Talons gripping the ledge.
  g.rect(-3, -1, 2, 1).fill(beak);
  g.rect(1, -1, 2, 1).fill(beak);

  // Body, with the folded wings darker down each side.
  g.rect(-4, -9, 8, 8).fill(body);
  g.rect(-4, -6, 1, 5).fill(wing);
  g.rect(3, -6, 1, 5).fill(wing);
  // Pale breast with two rows of chevrons.
  g.rect(-2, -5, 4, 4).fill(breast);
  g.rect(-2, -4, 1, 1).fill(body);
  g.rect(1, -4, 1, 1).fill(body);
  g.rect(-1, -2, 2, 1).fill(body);

  // Ear tufts.
  g.rect(-4, -11, 1, 2).fill(body);
  g.rect(3, -11, 1, 2).fill(body);
  g.rect(-3, -10, 1, 1).fill(body);
  g.rect(2, -10, 1, 1).fill(body);

  // Face disc and eyes.
  g.rect(-3, -9, 6, 3).fill(face);
  if (pose.blink) {
    g.rect(-3, -8, 2, 1).fill(wing);
    g.rect(1, -8, 2, 1).fill(wing);
  } else {
    g.rect(-3, -9, 2, 2).fill(eye);
    g.rect(1, -9, 2, 2).fill(eye);
    // The pupil sits on the side the head is turned to; straight on, it is
    // the inner pixel of each eye, which reads as looking at you.
    const left = pose.look === -1 ? -3 : -2;
    const right = pose.look === 1 ? 2 : 1;
    g.rect(left, -8, 1, 1).fill(pupil);
    g.rect(right, -8, 1, 1).fill(pupil);
  }
  g.rect(-1, -7, 2, 1).fill(beak);
}

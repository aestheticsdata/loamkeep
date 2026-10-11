import { DB32 } from '@constants';
import { type Critter, type PatrolSpec, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const TRUNDLE_SPEED = 9;
// How near the player has to come for it to roll up, in pixels.
const SHY_DISTANCE = 26;

// A hedgehog trundling along the heath, nose first. Come close and it rolls
// itself into a ball of spines until you go away again.
export class Hedgehog implements Critter {
  readonly sprite: Container;
  readonly species = 'hedgehog' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawHedgehog(g, { curled: false, step: 0 }),
    subjectScale: 4,
    speech: "Personal space, please. I'm about ninety percent spikes.",
  };

  private readonly spec: PatrolSpec;
  private readonly body: ArtBody;
  private x: number;
  private facing: 1 | -1 = 1;
  private elapsed = 0;
  private curled = false;
  private drawn = '';

  constructor(spec: PatrolSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.sprite = new Container();
    this.body = new ArtBody('hedgehog');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  // Told where the player is every frame by the shared nearness check in
  // isPlayerInRange's caller would be neater, but Game only asks critters on
  // contact; so the hedgehog keeps its own idea of the player, set below.
  private playerX = Number.NEGATIVE_INFINITY;
  private playerY = Number.NEGATIVE_INFINITY;

  update(dt: number): void {
    this.elapsed += dt;
    this.curled = Math.abs(this.playerX - this.x) < SHY_DISTANCE && Math.abs(this.playerY - this.spec.y) < SHY_DISTANCE;
    if (!this.curled) {
      this.x += this.facing * TRUNDLE_SPEED * dt;
      if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
        this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
        this.facing = this.facing === 1 ? -1 : 1;
      }
    }
    const step = Math.floor(this.elapsed * 4) & 1;
    const key = `${this.curled}${step}`;
    if (key !== this.drawn) {
      this.drawn = key;
      this.body.draw((g) => drawHedgehog(g, { curled: this.curled, step }));
    }
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    this.playerX = playerPos.x + playerSize.x / 2;
    this.playerY = playerPos.y + playerSize.y;
    return touches({ x: this.x - 6, y: this.spec.y - 7, width: 12, height: 7 }, playerPos, playerSize);
  }
}

export interface HedgehogPose {
  curled: boolean;
  step: number;
}

// Drawn around (0, 0), feet on y = 0, snout to the right: 12 wide × 7 tall.
export function drawHedgehog(g: Graphics, pose: HedgehogPose): void {
  const spine = DB32.oiledCedar;
  const spineHi = DB32.twine;
  if (pose.curled) {
    g.rect(-5, -7, 10, 7).fill(spine);
    g.rect(-6, -5, 12, 3).fill(spine);
    for (const [x, y] of [
      [-4, -7],
      [-1, -8],
      [2, -7],
      [-6, -5],
      [5, -4],
      [-2, -5],
      [1, -3],
    ] as const) {
      g.rect(x, y, 1, 1).fill(spineHi);
    }
    return;
  }
  g.rect(-6, -6, 9, 5).fill(spine);
  g.rect(-5, -7, 7, 1).fill(spine);
  for (const x of [-5, -3, -1, 1]) g.rect(x, -7, 1, 1).fill(spineHi);
  // Face: pale, pointed, with a shiny black nose and eye.
  g.rect(3, -5, 3, 3).fill(DB32.pancho);
  g.rect(6, -4, 1, 1).fill(DB32.valhalla);
  g.rect(4, -5, 1, 1).fill(DB32.valhalla);
  // Little feet, shuffling.
  g.rect(-4 + pose.step, -1, 2, 1).fill(DB32.rope);
  g.rect(1 - pose.step, -1, 2, 1).fill(DB32.rope);
}

import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

const SWARM_SIZE = 6;
const SWARM_RADIUS = 14;

// Authored description of a knot of bees: the hive they buzz round, its top.
export interface BeesSpec {
  x: number;
  y: number;
}

// Bees buzzing in busy little loops over their hive, wings a blur.
export class Bees implements Critter {
  readonly sprite: Container;
  readonly species = 'bees' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: drawBeeLarge,
    subjectScale: 5,
    speech: "Bzz — busy, busy, can't stop! Lovely to meet you! Bzz!",
  };

  private readonly spec: BeesSpec;
  private readonly body: Graphics;
  private elapsed: number;

  constructor(spec: BeesSpec) {
    this.spec = spec;
    this.elapsed = spec.x * 0.03;
    this.sprite = new Container();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const g = this.body;
    g.clear();
    for (let i = 0; i < SWARM_SIZE; i++) {
      const t = this.elapsed * (2.2 + i * 0.3) + i * 1.9;
      const x = Math.round(Math.sin(t) * SWARM_RADIUS * (0.5 + (i % 2) * 0.5));
      const y = Math.round(-8 + Math.sin(t * 1.7 + i) * 6);
      g.rect(x, y, 2, 1).fill(DB32.goldenFizz);
      g.rect(x + 1, y, 1, 1).fill(DB32.valhalla);
      g.rect(x, y - 1 - (Math.floor(this.elapsed * 30 + i) & 1), 1, 1).fill(DB32.lightSteel);
    }
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const box = { x: this.spec.x - SWARM_RADIUS, y: this.spec.y - 16, width: SWARM_RADIUS * 2, height: 16 };
    return touches(box, playerPos, playerSize);
  }
}

// The portrait: one bee, striped, with its wings up. 10 wide × 8 tall.
export function drawBeeLarge(g: Graphics): void {
  g.rect(-4, -5, 8, 4).fill(DB32.goldenFizz);
  g.rect(-2, -5, 1, 4).fill(DB32.valhalla);
  g.rect(1, -5, 1, 4).fill(DB32.valhalla);
  g.rect(4, -4, 2, 2).fill(DB32.valhalla);
  g.rect(-5, -3, 1, 1).fill(DB32.valhalla);
  g.rect(-2, -8, 3, 3).fill({ color: DB32.lightSteel, alpha: 0.8 });
  g.rect(1, -8, 3, 2).fill({ color: DB32.lightSteel, alpha: 0.6 });
  g.rect(5, -4, 1, 1).fill(DB32.white);
}

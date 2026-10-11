import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import { drawGlow } from '@entities/glow';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, Graphics } from 'pixi.js';

// How many fireflies a swarm has, and how far they wander from its centre.
const SWARM_SIZE = 7;
const SWARM_RADIUS = 18;

// Authored description of a swarm: its centre, a little above the ground.
export interface FirefliesSpec {
  x: number;
  y: number;
}

// A loose swarm of fireflies drifting round one spot, each blinking on its
// own slow beat. One entity for the swarm; walk into it and it says hello.
export class Fireflies implements Critter {
  readonly sprite: Container;
  readonly species = 'fireflies' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: drawFirefliesLarge,
    subjectScale: 3,
    speech: "Hi! Hello! Hi! We're not stars, we're just a lot closer! Hi!",
  };

  private readonly spec: FirefliesSpec;
  private readonly body: Graphics;
  private elapsed: number;

  constructor(spec: FirefliesSpec) {
    this.spec = spec;
    this.elapsed = spec.x * 0.05;
    this.sprite = new Container();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.body = new Graphics();
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.body.clear();
    for (let i = 0; i < SWARM_SIZE; i++) {
      const t = this.elapsed * (0.5 + i * 0.07) + i * 1.7;
      const x = Math.round(Math.sin(t) * SWARM_RADIUS * (0.4 + (i % 3) * 0.3));
      const y = Math.round(Math.cos(t * 1.3 + i) * SWARM_RADIUS * 0.5);
      const lit = Math.sin(this.elapsed * 2 + i * 2.1) > -0.2;
      if (lit) {
        drawGlow(this.body, { x, y, radius: 4, color: DB32.goldenFizz });
        this.body.rect(x, y, 1, 1).fill(DB32.goldenFizz);
      } else {
        this.body.rect(x, y, 1, 1).fill(DB32.stinger);
      }
    }
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const box = { x: this.spec.x - SWARM_RADIUS, y: this.spec.y - 10, width: SWARM_RADIUS * 2, height: 20 };
    return touches(box, playerPos, playerSize);
  }
}

// The portrait: one firefly, close up — wings, a dark body, the lit tail.
// 12 wide × 9 tall, base on y = 0.
export function drawFirefliesLarge(g: Graphics): void {
  drawGlow(g, { x: -3, y: -3, radius: 8, color: DB32.goldenFizz });
  g.rect(-5, -4, 4, 3).fill(DB32.goldenFizz);
  g.rect(-5, -4, 1, 3).fill(DB32.white);
  g.rect(-1, -5, 5, 4).fill(DB32.valhalla);
  g.rect(4, -4, 2, 2).fill(DB32.valhalla);
  g.rect(5, -6, 1, 2).fill(DB32.valhalla);
  g.rect(0, -8, 4, 3).fill({ color: DB32.lightSteel, alpha: 0.7 });
  g.rect(-2, -9, 3, 2).fill({ color: DB32.lightSteel, alpha: 0.5 });
  g.rect(5, -4, 1, 1).fill(DB32.white);
}

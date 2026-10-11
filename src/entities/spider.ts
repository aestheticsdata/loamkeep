import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How far down its thread the spider lets itself, unless told otherwise, and
// how long a trip takes.
const DROP = 40;
const PERIOD = 6;

// Authored description of a spider: the point on a ceiling it hangs from,
// and how far it lets itself down — less under a low ceiling.
export interface SpiderSpec {
  x: number;
  y: number;
  drop?: number;
}

// A small round spider on a thread from the ceiling, letting itself down and
// winding itself back up, over and over, never in any hurry.
export class Spider implements Critter {
  readonly sprite: Container;
  readonly species = 'spider' as const;
  readonly greetsOnlyOnGround = true;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawSpider(g, 0),
    subjectScale: 5,
    speech: "Hello! Mind the web, I've only just finished it. Eight legs, and still it takes all night.",
  };

  private readonly spec: SpiderSpec;
  private readonly body = new ArtBody('spider');
  private elapsed: number;
  private drop = 0;

  constructor(spec: SpiderSpec) {
    this.spec = spec;
    this.elapsed = spec.x * 0.013;
    this.sprite = new Container();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const t = (this.elapsed % PERIOD) / PERIOD;
    // Down slowly, a pause at the bottom, back up a little quicker.
    this.drop = Math.round((this.spec.drop ?? DROP) * Math.min(1, Math.sin(t * Math.PI) * 1.3));
    const drop = this.drop;
    const wiggle = Math.floor(this.elapsed * 3) & 1;
    this.body.draw((g) => {
      g.rect(0, 0, 1, drop).fill({ color: DB32.lightSteel, alpha: 0.6 });
      drawSpiderAt(g, drop, wiggle);
    });
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const y = this.spec.y + this.drop;
    return touches({ x: this.spec.x - 5, y: y - 2, width: 10, height: 8 }, playerPos, playerSize);
  }
}

// The spider itself, hanging from (0, 0) at `y` down its thread.
function drawSpiderAt(g: Graphics, y: number, wiggle: number): void {
  const body = DB32.valhalla;
  g.rect(-2, y, 4, 4).fill(body);
  g.rect(-1, y - 1, 2, 1).fill(body);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.rect(side < 0 ? -4 - wiggle : 2 + wiggle, y + i, 2, 1).fill(body);
    }
  }
  g.rect(-1, y + 1, 1, 1).fill(DB32.white);
  g.rect(1, y + 1, 1, 1).fill(DB32.white);
}

// The portrait: the spider close up, legs out, on y = 0 with its thread above.
export function drawSpider(g: Graphics, wiggle: number): void {
  g.rect(0, -10, 1, 4).fill(DB32.lightSteel);
  drawSpiderAt(g, -6, wiggle);
}

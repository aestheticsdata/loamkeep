import { DB32 } from '@constants';
import { type Critter, touches } from '@entities/critter';
import { ArtBody } from '@hd/art-body';
import type { GreetingSpec } from '@systems/greeting';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

const LENGTH = 18;

// Authored description of an eel: its depth y and the stretch of water it
// patrols, minX..maxX, at `speed`.
export interface EelSpec {
  x: number;
  y: number;
  speed: number;
  minX: number;
  maxX: number;
}

// A long olive eel winding through the cistern's water, its body a slow wave.
// Met while swimming, so no waiting for solid ground before it says hello.
export class Eel implements Critter {
  readonly sprite: Container;
  readonly species = 'eel' as const;
  readonly greetsOnlyOnGround = false;
  readonly greeting: GreetingSpec = {
    drawSubject: (g) => drawEel(g, 0),
    subjectScale: 3,
    speech: "Oh! Sorry. I'm not slimy, I'm just... shiny. Everyone says slimy.",
  };

  private readonly spec: EelSpec;
  private readonly body: ArtBody;
  private x: number;
  private facing: 1 | -1 = 1;
  private elapsed: number;

  constructor(spec: EelSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.elapsed = spec.x * 0.01;
    this.sprite = new Container();
    this.body = new ArtBody('eel');
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.x += this.facing * this.spec.speed * dt;
    if (this.x <= this.spec.minX || this.x >= this.spec.maxX) {
      this.x = Math.max(this.spec.minX, Math.min(this.spec.maxX, this.x));
      this.facing = this.facing === 1 ? -1 : 1;
    }
    this.body.draw((g) => drawEel(g, this.elapsed * 6));
    this.sprite.x = this.x;
    this.sprite.y = this.spec.y + Math.sin(this.elapsed * 0.8) * 4;
    this.sprite.scale.set(this.facing, 1);
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const box = { x: this.x - LENGTH / 2, y: this.sprite.y - 4, width: LENGTH, height: 6 };
    return touches(box, playerPos, playerSize);
  }
}

// Drawn around (0, 0), head to the right: an olive body LENGTH long, waving
// by `phase`, with a pale belly line and a small eye.
export function drawEel(g: Graphics, phase: number): void {
  for (let i = 0; i < LENGTH; i++) {
    const x = i - LENGTH / 2;
    const y = Math.round(Math.sin(phase + i * 0.5) * (1.5 * (1 - i / LENGTH)));
    g.rect(x, y - 2, 1, 2).fill(DB32.rainforest);
    g.rect(x, y, 1, 1).fill(DB32.plum);
  }
  g.rect(LENGTH / 2 - 2, -2, 1, 1).fill(DB32.valhalla);
  g.rect(LENGTH / 2, -1, 1, 1).fill(DB32.rainforest);
}

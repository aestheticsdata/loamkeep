import { DB32 } from '@constants';
import type { Entity } from '@entities/entity';
import { ArtBody, ArtSwarm, type SwarmMember } from '@hd/art-body';
import type { CritterLayers } from '@hd/critter-hd';
import { FineCanvas } from '@hd/fine-canvas';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How many wasps, how long one takes round the nest, s, and how far out they
// fly, px.
const WASPS = 5;
const ORBIT = 2.4;
const RADIUS = 32;
// How near a wasp has to come to the player's box to sting, px.
const STING = 2;

export interface WaspNestSpec {
  // The middle of the nest, px.
  x: number;
  y: number;
}

// A paper wasps' nest hanging under the vine terraces, and its wasps circling
// it two tiles out, never stopping. A wasp touched sends the player back to
// the last checkpoint, as a bramble does: the way past is to time it.
export class WaspNest implements Entity {
  readonly sprite = new Container();
  private readonly spec: WaspNestSpec;
  private readonly wasps = new ArtSwarm('wasps');
  private time = 0;

  constructor(spec: WaspNestSpec) {
    this.spec = spec;
    const nest = new ArtBody('wasp-nest');
    nest.draw(drawNest);
    nest.position.set(spec.x, spec.y);
    this.sprite.addChild(nest, this.wasps);
    this.update(0);
  }

  hurts(playerPos: Vec2, playerSize: Vec2): boolean {
    return this.positions().some(
      (w) =>
        w.x >= playerPos.x - STING &&
        w.x <= playerPos.x + playerSize.x + STING &&
        w.y >= playerPos.y - STING &&
        w.y <= playerPos.y + playerSize.y + STING,
    );
  }

  update(dt: number): void {
    this.time += dt;
    const wing = Math.floor(this.time * 20) % 2;
    const members: SwarmMember[] = this.positions().map((at) => ({
      x: Math.round(at.x),
      y: Math.round(at.y),
      draw: (g) => drawWasp(g, wing),
      hd: { key: `${wing}`, draw: () => waspHd(wing) },
    }));
    this.wasps.draw(members);
  }

  // Where each wasp is now: spread round the nest, each on a circle a little
  // smaller than the others', so they do not fly as one ring.
  private positions(): Vec2[] {
    return Array.from({ length: WASPS }, (_, i) => {
      const a = (this.time / ORBIT) * 2 * Math.PI + (i * 2 * Math.PI) / WASPS;
      const r = RADIUS - (i % 3) * 4;
      return { x: this.spec.x + Math.cos(a) * r, y: this.spec.y + Math.sin(a) * r };
    });
  }
}

// The nest, its middle at (0, 0): a grey paper bulb hanging from a stalk,
// banded in heather and topaz, its mouth dark at the bottom.
function drawNest(g: Graphics): void {
  g.rect(0, -10, 1, 3).fill(DB32.rope);
  g.rect(-3, -7, 7, 2).fill(DB32.topaz);
  g.rect(-4, -5, 9, 8).fill(DB32.topaz);
  g.rect(-3, 3, 7, 2).fill(DB32.topaz);
  for (const y of [-6, -3, 0, 3]) g.rect(-4, y, 9, 1).fill(DB32.heather);
  g.rect(-4, -5, 1, 8).fill(DB32.dimGray);
  g.rect(-1, 4, 3, 1).fill(DB32.valhalla);
}

// A wasp, at (0, 0): a goldenFizz body banded black, and a wing up or down.
function drawWasp(g: Graphics, wing: number): void {
  g.rect(-1, 0, 3, 1).fill(DB32.goldenFizz);
  g.rect(0, 0, 1, 1).fill(DB32.black);
  g.rect(0, wing ? -1 : 1, 1, 1).fill(DB32.white);
}

// The wasp on the fine grid.
function waspHd(wing: number): CritterLayers {
  const s = new FineCanvas({ x: -3, y: -3, w: 9, h: 9 });
  s.rect({ x: -3, y: 0, w: 9, h: 3 }, DB32.goldenFizz).rect({ x: 0, y: 0, w: 2, h: 3 }, DB32.black);
  s.rect({ x: 3, y: 1, w: 2, h: 1 }, DB32.black).set(5, 1, DB32.valhalla);
  s.rect({ x: 0, y: wing ? -3 : 3, w: 3, h: 3 }, DB32.white);
  return { body: s, halo: null };
}

import { DB32, TILE_SIZE } from '@constants';
import type { Entity, StepWorld } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import { type Body, type SolidBox, stepPhysics, type Walker } from '@systems/physics';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How fast a block slides while the player walks into it, px/s: a third of a
// walk, so it reads as weight.
const PUSH_SPEED = 24;
// How much of the walker's side has to be against the block to push it, px:
// more than a toe caught on its corner.
const PUSH_OVERLAP = 4;
// How close the walker's side has to be to the block's, px: the physics
// stops a body exactly against a box, so this only has to absorb rounding.
const TOUCH = 0.5;

// What a block is drawn as. Both are pushed the same way.
export const BLOCK_LOOK = {
  hay: 'hay',
  barrel: 'barrel',
  crate: 'crate',
  ice: 'ice',
} as const;
export type BlockLook = (typeof BLOCK_LOOK)[keyof typeof BLOCK_LOOK];

export interface PushBlockSpec {
  // The tile the block starts on: its column, and the row of the tile it
  // stands on.
  col: number;
  row: number;
  look: BlockLook;
  // Tiles it slides on after a push stops (the ice house's blocks): 0
  // unless given.
  slide?: number;
}

// A block one tile big that the player can push but never pull: a hay bale
// in the meadow's field, a barrel in its cellar. It slides at PUSH_SPEED for
// as long as the player walks into it on the ground, falls when there is
// nothing under it, and is solid to stand on — which is what it is for, the
// step up to a ledge the ground is too far below. Where it ends up lasts only
// as long as the visit: the level puts it back on the next.
export class PushBlock implements Entity, Body {
  readonly sprite = new Container();
  readonly pos: Vec2;
  readonly vel: Vec2 = { x: 0, y: 0 };
  readonly size: Vec2 = { x: TILE_SIZE, y: TILE_SIZE };
  onGround = false;
  private readonly box: SolidBox;
  private readonly slide: number;
  // Which way it was last pushed, and how far it has still to slide, px.
  private dir = 0;
  private sliding = 0;

  constructor(spec: PushBlockSpec) {
    this.slide = (spec.slide ?? 0) * TILE_SIZE;
    this.pos = { x: spec.col * TILE_SIZE, y: (spec.row - 1) * TILE_SIZE };
    this.box = { x: this.pos.x, y: this.pos.y, w: TILE_SIZE, h: TILE_SIZE };
    const look = BLOCKS[spec.look];
    const body = new ArtBody(look.species);
    body.draw(look.draw);
    this.sprite.addChild(body);
    this.place();
  }

  solids(): readonly SolidBox[] {
    return [this.box];
  }

  step(dt: number, world: StepWorld): void {
    const push = pushedBy(world.player, this.box);
    if (push !== 0) {
      this.dir = push;
      this.sliding = this.slide;
    }
    const moving = push !== 0 ? push : this.sliding > 0 ? this.dir : 0;
    this.vel.x = moving * PUSH_SPEED;
    const from = this.pos.x;
    const others = world.ground.boxes.filter((b) => b !== this.box);
    stepPhysics(this, { tilemap: world.ground.tilemap, boxes: others }, dt);
    if (push === 0) this.sliding = this.vel.x === 0 ? 0 : Math.max(0, this.sliding - Math.abs(this.pos.x - from));
    this.box.x = this.pos.x;
    this.box.y = this.pos.y;
    this.place();
  }

  private place(): void {
    this.sprite.position.set(this.pos.x + TILE_SIZE / 2, this.pos.y + TILE_SIZE);
  }
}

// Which way the walker is pushing the box (-1, 0 or 1): on the ground,
// against its side, walking into it.
function pushedBy(walker: Walker, box: SolidBox): number {
  if (!walker.onGround || walker.move === 0) return 0;
  const top = Math.max(walker.pos.y, box.y);
  const bottom = Math.min(walker.pos.y + walker.size.y, box.y + box.h);
  if (bottom - top <= PUSH_OVERLAP) return 0;
  if (walker.move > 0 && Math.abs(walker.pos.x + walker.size.x - box.x) <= TOUCH) return 1;
  if (walker.move < 0 && Math.abs(walker.pos.x - (box.x + box.w)) <= TOUCH) return -1;
  return 0;
}

// A hay bale, 16 × 16 around its foot: straw in twine, lit pancho along the
// top, two rope bands round it, and loose stalks sticking out of the ends.
export function drawHayBale(g: Graphics): void {
  g.rect(-8, -15, 16, 15).fill(DB32.twine);
  g.rect(-7, -16, 14, 1).fill(DB32.twine);
  g.rect(-7, -15, 14, 2).fill(DB32.pancho);
  g.rect(-8, -2, 16, 2).fill(DB32.rainforest);
  // The straw's grain: short dark strokes, staggered row by row.
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 3; i++) {
      g.rect(-6 + i * 5 + (row % 2) * 2, -12 + row * 3, 2, 1).fill(DB32.rainforest);
    }
  }
  for (const bx of [-4, 3]) {
    g.rect(bx, -16, 1, 16).fill(DB32.rope);
    g.rect(bx + 1, -16, 1, 16).fill(DB32.oiledCedar);
  }
  g.rect(-9, -10, 1, 2).fill(DB32.twine);
  g.rect(8, -7, 1, 2).fill(DB32.twine);
  g.rect(-9, -5, 1, 1).fill(DB32.pancho);
}

// A barrel, 16 × 16 around its foot: cedar staves bulging a pixel at the
// middle, lit rope down the left, and three iron hoops.
export function drawBarrel(g: Graphics): void {
  g.rect(-7, -16, 14, 16).fill(DB32.oiledCedar);
  g.rect(-8, -12, 16, 8).fill(DB32.oiledCedar);
  g.rect(-6, -16, 2, 16).fill(DB32.rope);
  g.rect(-7, -12, 1, 8).fill(DB32.rope);
  for (const sx of [-2, 2, 5]) g.rect(sx, -15, 1, 14).fill(DB32.loulou);
  for (const hy of [-14, -8, -3]) {
    const wide = hy === -8;
    g.rect(wide ? -8 : -7, hy, wide ? 16 : 14, 2).fill(DB32.dimGray);
    g.rect(wide ? -8 : -7, hy, wide ? 16 : 14, 1).fill(DB32.heather);
  }
  g.rect(-5, -16, 10, 1).fill(DB32.rope);
}

// A crate from the keep's larder: planks of oiled cedar, rope-lit, a cross
// brace from corner to corner and dimGray corner irons.
export function drawCrate(g: Graphics): void {
  g.rect(-8, -16, 16, 16).fill(DB32.oiledCedar);
  g.rect(-8, -16, 16, 1).fill(DB32.rope);
  for (const py of [-11, -6]) g.rect(-7, py, 14, 1).fill(DB32.loulou);
  for (let i = 0; i < 12; i++) g.rect(-6 + i, -14 + i, 2, 1).fill(DB32.rope);
  g.rect(-8, -16, 1, 16).fill(DB32.loulou);
  g.rect(7, -16, 1, 16).fill(DB32.loulou);
  for (const [x, y] of [
    [-8, -16],
    [5, -16],
    [-8, -3],
    [5, -3],
  ] as const) {
    g.rect(x, y, 3, 3).fill(DB32.dimGray);
    g.rect(x, y, 3, 1).fill(DB32.heather);
  }
}

// A block of ice cut from the ice house's pond, 16 × 16 around its foot:
// lightSteel, frosted white along its top and down its lit side, its faces
// cut in cornflower and venice, a crack of white through it.
export function drawIceBlock(g: Graphics): void {
  g.rect(-8, -16, 16, 16).fill(DB32.lightSteel);
  g.rect(-8, -16, 16, 2).fill(DB32.white);
  g.rect(-8, -16, 2, 16).fill(DB32.white);
  g.rect(3, -14, 5, 14).fill(DB32.cornflower);
  g.rect(6, -14, 2, 14).fill(DB32.venice);
  g.rect(-8, -2, 16, 2).fill(DB32.cornflower);
  for (const [x, y] of [
    [-4, -12],
    [-3, -11],
    [-2, -9],
    [-2, -8],
    [-1, -6],
  ] as const) {
    g.rect(x, y, 1, 1).fill(DB32.white);
  }
}

// Each look's drawing, and the name its bakes are kept under.
const BLOCKS: Record<BlockLook, { species: string; draw: (g: Graphics) => void }> = {
  [BLOCK_LOOK.hay]: { species: 'hay-bale', draw: drawHayBale },
  [BLOCK_LOOK.barrel]: { species: 'barrel', draw: drawBarrel },
  [BLOCK_LOOK.crate]: { species: 'crate', draw: drawCrate },
  [BLOCK_LOOK.ice]: { species: 'ice-block', draw: drawIceBlock },
};

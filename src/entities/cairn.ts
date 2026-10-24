import { DB32, TILE_SIZE } from '@constants';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { ArtBody } from '@hd/art-body';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How near the player's middle has to come to a cairn to light it, px.
const REACH_X = 12;
const REACH_Y = 16;
// The lantern's flame breathes between two sizes of glow, this often, s.
const BREATH = 0.6;

// The WorldState flag that remembers a cairn was lit, across visits.
export function cairnLitFlag(levelId: string, cairnId: string): string {
  return `cairn-lit.${levelId}.${cairnId}`;
}

export interface CairnSpec {
  id: string;
  // The tile the cairn stands on: its column, and the row of that tile.
  col: number;
  row: number;
  // Already lit, on a visit after the one it was first lit on.
  lit: boolean;
}

// A checkpoint: a small cairn of stones with a lantern on top. It is dark
// until the player walks past it, then lit for good; Game makes the last one
// lit the place the player is sent back to after touching a bramble.
export class Cairn implements Entity {
  readonly sprite = new Container();
  readonly id: string;
  private readonly stones = new ArtBody('cairn');
  private readonly lantern = new ArtBody('cairn-lantern', { emissive: [DB32.goldenFizz, DB32.white] });
  private readonly foot: Vec2;
  private lit: boolean;
  private time = 0;
  private bright = false;

  constructor(spec: CairnSpec) {
    this.id = spec.id;
    this.lit = spec.lit;
    this.foot = { x: spec.col * TILE_SIZE + TILE_SIZE / 2, y: spec.row * TILE_SIZE };
    this.sprite.position.set(this.foot.x, this.foot.y);
    this.stones.draw(drawCairnStones);
    this.sprite.addChild(this.stones, this.lantern);
    this.drawLantern();
  }

  get isLit(): boolean {
    return this.lit;
  }

  // Where the player stands when sent back here: just east of it, on the
  // tile it stands on. Top-left of the player's box.
  get respawnAt(): Vec2 {
    return { x: this.foot.x + 4, y: this.foot.y - TILE_SIZE };
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const dx = Math.abs(playerPos.x + playerSize.x / 2 - this.foot.x);
    const dy = Math.abs(playerPos.y + playerSize.y / 2 - (this.foot.y - TILE_SIZE / 2));
    return dx <= REACH_X && dy <= REACH_Y;
  }

  light(): void {
    if (this.lit) return;
    this.lit = true;
    this.drawLantern();
  }

  update(dt: number): void {
    if (!this.lit) return;
    this.time += dt;
    const bright = Math.floor(this.time / BREATH) % 2 === 0;
    if (bright === this.bright) return;
    this.bright = bright;
    this.drawLantern();
  }

  private drawLantern(): void {
    const lit = this.lit;
    const bright = this.bright;
    this.lantern.draw((g) => drawCairnLantern(g, { lit, bright }));
  }
}

// Three flat stones, widest at the foot, each lit along its top: the classic
// meadow cairn, smaller, so the lantern on it reads first.
function drawCairnStones(g: Graphics): void {
  const stones: readonly (readonly [number, number, number, number])[] = [
    [-6, -3, 12, 3],
    [-4, -6, 9, 3],
    [-3, -8, 6, 2],
  ];
  for (const [x, y, w, h] of stones) {
    g.rect(x, y, w, h).fill(DB32.topaz);
    g.rect(x, y, w, 1).fill(DB32.heather);
    g.rect(x, y + h - 1, w, 1).fill(DB32.dimGray);
  }
}

// How the lantern is drawn: whether it is lit, and on which breath.
interface LanternPose {
  lit: boolean;
  bright: boolean;
}

// The lantern on top: an iron cage with a flame in it — goldenFizz with a
// white heart and a soft glow once lit, a cold wick before.
function drawCairnLantern(g: Graphics, pose: LanternPose): void {
  if (pose.lit) drawGlow(g, { x: 0, y: -12, radius: pose.bright ? 12 : 10, color: DB32.goldenFizz });
  g.rect(-2, -16, 5, 1).fill(DB32.dimGray);
  g.rect(-2, -15, 1, 6).fill(DB32.dimGray);
  g.rect(2, -15, 1, 6).fill(DB32.dimGray);
  g.rect(-2, -9, 5, 1).fill(DB32.dimGray);
  g.rect(0, -17, 1, 1).fill(DB32.dimGray);
  if (pose.lit) {
    g.rect(-1, -14, 3, 5).fill(DB32.goldenFizz);
    g.rect(0, -13, 1, 3).fill(DB32.white);
  } else {
    g.rect(0, -11, 1, 2).fill(DB32.valhalla);
  }
}

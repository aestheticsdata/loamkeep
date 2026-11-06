import { DB32, TILE_SIZE } from '@constants';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { drawCandleBody, drawFlame } from '@entities/tall-candle';
import { ArtBody } from '@hd/art-body';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How near the player's middle has to come to a cairn to light it, px.
const REACH_X = 12;
const REACH_Y = 16;

// The WorldState flag that remembers a cairn was lit, across visits.
export function cairnLitFlag(levelId: string, cairnId: string): string {
  return `cairn-lit.${levelId}.${cairnId}`;
}

// What a checkpoint looks like: the meadow's cairn of stones with a lantern
// on it, the grotto's glowcap lantern, a small cap on a stalk that lights
// cyan, or the keep's tall candle, dark until it is lit, or the potting
// shed's brass lamp.
export const CAIRN_LOOK = {
  cairn: 'cairn',
  glowcap: 'glowcap',
  candle: 'candle',
  pumpkin: 'pumpkin',
  lamp: 'lamp',
} as const;

export type CairnLook = (typeof CAIRN_LOOK)[keyof typeof CAIRN_LOOK];

// The drawings of one look: what it stands on, and the light on top.
interface CairnArt {
  base: (g: Graphics) => void;
  light: (g: Graphics, pose: LanternPose) => void;
  emissive: readonly number[];
  // How long each of its two breaths lasts once lit, s.
  breath: number;
}

export interface CairnSpec {
  id: string;
  // The tile the cairn stands on: its column, and the row of that tile.
  col: number;
  row: number;
  // Already lit, on a visit after the one it was first lit on.
  lit: boolean;
  // A cairn unless given.
  look?: CairnLook;
}

// A checkpoint: a small cairn of stones with a lantern on top. It is dark
// until the player walks past it, then lit for good; Game makes the last one
// lit the place the player is sent back to after touching a bramble.
export class Cairn implements Entity {
  readonly sprite = new Container();
  readonly id: string;
  private readonly art: CairnArt;
  private readonly stones: ArtBody;
  private readonly lantern: ArtBody;
  private readonly foot: Vec2;
  private lit: boolean;
  private time = 0;
  private bright = false;

  constructor(spec: CairnSpec) {
    this.id = spec.id;
    this.lit = spec.lit;
    const look = spec.look ?? CAIRN_LOOK.cairn;
    this.art = CAIRN_ART[look];
    this.stones = new ArtBody(look);
    this.lantern = new ArtBody(`${look}-lantern`, { emissive: this.art.emissive });
    this.foot = { x: spec.col * TILE_SIZE + TILE_SIZE / 2, y: spec.row * TILE_SIZE };
    this.sprite.position.set(this.foot.x, this.foot.y);
    this.stones.draw(this.art.base);
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
    const bright = Math.floor(this.time / this.art.breath) % 2 === 0;
    if (bright === this.bright) return;
    this.bright = bright;
    this.drawLantern();
  }

  private drawLantern(): void {
    const lit = this.lit;
    const bright = this.bright;
    this.lantern.draw((g) => this.art.light(g, { lit, bright }));
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

// The grotto's lantern: a pale glowcap stalk, bent a little, with a ring of
// gills under where the cap sits.
function drawGlowcapStalk(g: Graphics): void {
  g.rect(-4, -1, 9, 1).fill(DB32.dell);
  g.rect(-1, -9, 3, 8).fill(DB32.lightSteel);
  g.rect(-1, -9, 1, 8).fill(DB32.white);
  g.rect(1, -5, 1, 4).fill(DB32.heather);
  g.rect(-2, -10, 5, 1).fill(DB32.heather);
}

// Its cap, the light: a dome of viking with a white crown and a halo once
// lit, a dull venice cap before.
function drawGlowcapCap(g: Graphics, pose: LanternPose): void {
  if (pose.lit) drawGlow(g, { x: 0, y: -13, radius: pose.bright ? 13 : 11, color: DB32.viking });
  const cap = pose.lit ? DB32.viking : DB32.venice;
  g.rect(-4, -13, 9, 3).fill(cap);
  g.rect(-3, -15, 7, 2).fill(cap);
  g.rect(-1, -16, 3, 1).fill(cap);
  g.rect(-4, -11, 9, 1).fill(pose.lit ? DB32.lightSteel : DB32.opal);
  if (pose.lit) {
    g.rect(-2, -15, 3, 1).fill(DB32.white);
    g.rect(2, -13, 1, 1).fill(DB32.white);
  }
}

// The keep's candle: the tall candle's flame, flickering at its usual six
// beats a second, and a soft glow round it, once lit; its dark wick before
// a charred tip on it.
function drawCandleLight(g: Graphics, pose: LanternPose): void {
  if (!pose.lit) {
    g.rect(0, -14, 1, 1).fill(DB32.black);
    return;
  }
  drawGlow(g, { x: 0, y: -15, radius: 10, color: DB32.goldenFizz });
  drawFlame(g, pose.bright ? 0 : 1);
}

// The garden's lantern: a carved pumpkin, the pumpkins' own tahitiGold lit
// twine and shaded rope, with a stem; the candle inside is its light.
function drawPumpkinShell(g: Graphics): void {
  g.rect(-4, -9, 9, 1).fill(DB32.tahitiGold);
  g.rect(-5, -8, 11, 6).fill(DB32.tahitiGold);
  g.rect(-4, -2, 9, 2).fill(DB32.tahitiGold);
  g.rect(-3, -9, 5, 1).fill(DB32.twine);
  g.rect(-5, -8, 1, 3).fill(DB32.twine);
  g.rect(5, -8, 1, 6).fill(DB32.rope);
  g.rect(-4, -1, 9, 1).fill(DB32.rope);
  g.rect(0, -11, 2, 2).fill(DB32.dell);
  g.rect(0, -11, 1, 2).fill(DB32.eltGreen);
}

// Its carved face: two eyes and a grin, dark until it is lit, then the candle
// showing through them, goldenFizz with a white heart, in a soft glow.
function drawPumpkinFace(g: Graphics, pose: LanternPose): void {
  const lit = pose.lit;
  if (lit) drawGlow(g, { x: 0, y: -5, radius: pose.bright ? 12 : 10, color: DB32.goldenFizz });
  const cut = lit ? DB32.goldenFizz : DB32.loulou;
  g.rect(-3, -7, 2, 2).fill(cut);
  g.rect(2, -7, 2, 2).fill(cut);
  g.rect(-3, -4, 7, 1).fill(cut);
  g.rect(-2, -3, 5, 1).fill(cut);
  if (lit) g.rect(0, -4, 1, 1).fill(DB32.white);
}

// The potting shed's lamp, standing on the floor: the house's hanging lamp
// (potting-shed-art.ts) on a topaz post with a rainforest foot — its brass
// cap, the frame under its glass, and the ring it hangs by.
function drawLampStand(g: Graphics): void {
  g.rect(-3, -1, 7, 1).fill(DB32.rainforest);
  g.rect(-2, -2, 5, 1).fill(DB32.rainforest);
  g.rect(0, -10, 1, 8).fill(DB32.topaz);
  g.rect(-3, -12, 7, 2).fill(DB32.rainforest);
  g.rect(-3, -18, 7, 1).fill(DB32.rainforest);
  g.rect(-2, -19, 5, 1).fill(DB32.rainforest);
  g.rect(0, -20, 1, 1).fill(DB32.topaz);
}

// Its glass, the light: goldenFizz with a white heart in a warm glow once
// lit; before, dark valhalla glass with a lightSteel glint and a cold wick.
function drawLampGlass(g: Graphics, pose: LanternPose): void {
  if (pose.lit) {
    drawGlow(g, { x: 0, y: -15, radius: pose.bright ? 12 : 10, color: DB32.goldenFizz });
    g.rect(-2, -17, 5, 5).fill(DB32.goldenFizz);
    g.rect(-1, -16, 3, 3).fill(DB32.white);
    return;
  }
  g.rect(-2, -17, 5, 5).fill(DB32.valhalla);
  g.rect(-2, -17, 1, 2).fill(DB32.lightSteel);
  g.rect(0, -14, 1, 2).fill(DB32.black);
}

// The lantern's flame breathes between two sizes of glow, 0.6 s each; the
// glowcap and the lamp the same; the candle flickers, six beats a second.
const CAIRN_ART: Record<CairnLook, CairnArt> = {
  [CAIRN_LOOK.cairn]: {
    base: drawCairnStones,
    light: drawCairnLantern,
    emissive: [DB32.goldenFizz, DB32.white],
    breath: 0.6,
  },
  [CAIRN_LOOK.glowcap]: {
    base: drawGlowcapStalk,
    light: drawGlowcapCap,
    emissive: [DB32.viking, DB32.white],
    breath: 0.6,
  },
  [CAIRN_LOOK.pumpkin]: {
    base: drawPumpkinShell,
    light: drawPumpkinFace,
    emissive: [DB32.goldenFizz, DB32.white],
    breath: 0.5,
  },
  [CAIRN_LOOK.candle]: {
    base: drawCandleBody,
    light: drawCandleLight,
    emissive: [DB32.white, DB32.goldenFizz, DB32.tahitiGold],
    breath: 1 / 6,
  },
  [CAIRN_LOOK.lamp]: {
    base: drawLampStand,
    light: drawLampGlass,
    emissive: [DB32.goldenFizz, DB32.white],
    breath: 0.6,
  },
};

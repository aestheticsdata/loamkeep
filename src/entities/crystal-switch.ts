import { DB32, TILE_SIZE } from '@constants';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { ArtBody } from '@hd/art-body';
import type { CritterLayers } from '@hd/critter-hd';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import type { Vec2 } from '@types';
import type { TileRect } from '@world/level';
import type { Graphics } from 'pixi.js';

// How far outside the crystals the player's box may be and still touch them,
// px: walking up against one, landing on it, or bumping a head on it.
const TOUCH = 1;
// The light breathes between two sizes of halo, this often, s.
const BREATH = 0.9;

// The WorldState flag that remembers a switch crystal was lit.
export function crystalLitFlag(levelId: string, crystalId: string): string {
  return `crystal-lit.${levelId}.${crystalId}`;
}

// What a switch looks like: a cluster of the grotto's crystals, or the
// potting shed's white piano keys, one to a tile, that ring as they go down.
export const CRYSTAL_LOOK = {
  crystal: 'crystal',
  pianoKey: 'piano-key',
} as const;

export type CrystalLook = (typeof CRYSTAL_LOOK)[keyof typeof CRYSTAL_LOOK];

export interface CrystalSwitchSpec {
  id: string;
  // The crystal tiles that make up the switch (C in the rows): the entity
  // draws only their light.
  area: TileRect;
  // The note it rings when it lights, Hz: a different one for each of a
  // room's three.
  pitch: number;
  // Already lit, on a visit after the one it was first lit on.
  lit: boolean;
  // Crystal unless given.
  look?: CrystalLook;
}

// A cluster of crystals that lights when the player touches it and stays lit:
// three in a room open its crystal gate (see Game). The crystals themselves
// are tiles; this is the light in them — a halo the glowcaps' way, and a white
// glint running down each facet. A piano key is drawn whole over its crystal
// tiles, and goes down when it rings.
export class CrystalSwitch implements Entity {
  readonly sprite: ArtBody;
  readonly id: string;
  readonly pitch: number;
  private readonly area: TileRect;
  private readonly art: SwitchArt;
  private lit: boolean;
  private time = 0;
  private bright = false;

  constructor(spec: CrystalSwitchSpec) {
    this.id = spec.id;
    this.pitch = spec.pitch;
    this.area = spec.area;
    this.lit = spec.lit;
    const look = spec.look ?? CRYSTAL_LOOK.crystal;
    this.art = SWITCH_ART[look];
    this.sprite = new ArtBody(`${look}-switch`, { emissive: [DB32.white, DB32.lightSteel], softLight: true });
    this.sprite.position.set(spec.area.col * TILE_SIZE, spec.area.row * TILE_SIZE);
    this.redraw();
  }

  get isLit(): boolean {
    return this.lit;
  }

  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const x0 = this.area.col * TILE_SIZE - TOUCH;
    const y0 = this.area.row * TILE_SIZE - TOUCH;
    const x1 = (this.area.col + this.area.cols) * TILE_SIZE + TOUCH;
    const y1 = (this.area.row + this.area.rows) * TILE_SIZE + TOUCH;
    return playerPos.x < x1 && playerPos.x + playerSize.x > x0 && playerPos.y < y1 && playerPos.y + playerSize.y > y0;
  }

  light(): void {
    if (this.lit) return;
    this.lit = true;
    this.redraw();
  }

  update(dt: number): void {
    if (!this.lit) return;
    this.time += dt;
    const bright = Math.floor(this.time / BREATH) % 2 === 0;
    if (bright === this.bright) return;
    this.bright = bright;
    this.redraw();
  }

  private redraw(): void {
    const pose = { cols: this.area.cols, rows: this.area.rows, lit: this.lit, bright: this.bright };
    const hd = this.art.hd;
    this.sprite.draw((g) => this.art.draw(g, pose), hd && (() => hd(pose)));
  }
}

// How a switch's light is drawn: the size of the cluster in tiles, whether
// it is lit, and on which breath.
interface SwitchPose {
  cols: number;
  rows: number;
  lit: boolean;
  bright: boolean;
}

// Every switch has a heart, a small diamond in the middle of its top tile —
// deepKoamaru while it sleeps, so a switch can be told from the crystal
// around it. Lit: the heart white in a lightSteel ring, a halo as wide as the
// cluster, a white crown along its top, and every prism's ridge lit white.
function drawSwitchLight(g: Graphics, pose: SwitchPose): void {
  const w = pose.cols * TILE_SIZE;
  const h = pose.rows * TILE_SIZE;
  const cx = Math.floor(w / 2);
  const heart = pose.lit ? DB32.white : DB32.deepKoamaru;
  if (pose.lit) {
    const radius = Math.round(Math.max(w, h) * (pose.bright ? 0.9 : 0.75));
    drawGlow(g, { x: w / 2, y: h / 2, radius, color: DB32.lightSteel });
    g.rect(0, 0, w, 2).fill(DB32.white);
    for (let c = 0; c < pose.cols; c++) g.rect(c * TILE_SIZE + 8, 2, 1, h - 3).fill(DB32.white);
    g.rect(cx - 3, 6, 7, 5).fill(DB32.lightSteel);
  }
  g.rect(cx - 1, 6, 3, 5).fill(heart);
  g.rect(cx - 2, 7, 5, 3).fill(heart);
}

// The drawings of one look: classic, and HD by hand where the common recipe
// would not do (it rounds corners, which on a key would show the crystal
// tile under it).
interface SwitchArt {
  draw: (g: Graphics, pose: SwitchPose) => void;
  hd?: (pose: SwitchPose) => CritterLayers;
}

// One piece of a keyboard, in logical px over the switch's top-left.
interface KeyPiece {
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
}

// The keyboard over the switch's tiles: a key slip of rope-lit cedar along
// the top, three white keys to a tile with a valhalla gap between each, and
// a black key over every gap but the one at a tile's edge; a valhalla line
// along the foot. Rung, the keys are down: a heather lip under the slip.
function keyPieces(pose: SwitchPose): KeyPiece[] {
  const w = pose.cols * TILE_SIZE;
  const h = pose.rows * TILE_SIZE;
  const pieces: KeyPiece[] = [
    { x: 0, y: 2, w, h: h - 2, color: DB32.white },
    { x: 0, y: 0, w, h: 2, color: DB32.oiledCedar },
    { x: 0, y: 0, w, h: 1, color: DB32.rope },
  ];
  if (pose.lit) pieces.push({ x: 0, y: 2, w, h: 1, color: DB32.heather });
  for (let c = 0; c < pose.cols; c++) {
    const x = c * TILE_SIZE;
    for (const gap of [5, 10, 15]) pieces.push({ x: x + gap, y: 2, w: 1, h: h - 2, color: DB32.valhalla });
    for (const gap of [5, 10]) pieces.push({ x: x + gap - 1, y: 2, w: 3, h: 8, color: DB32.valhalla });
  }
  pieces.push({ x: 0, y: h - 1, w, h: 1, color: DB32.valhalla });
  return pieces;
}

function drawPianoKeys(g: Graphics, pose: SwitchPose): void {
  if (pose.lit) {
    const w = pose.cols * TILE_SIZE;
    const radius = Math.round(Math.max(w, pose.rows * TILE_SIZE) * (pose.bright ? 0.8 : 0.65));
    drawGlow(g, { x: w / 2, y: 0, radius, color: DB32.lightSteel });
  }
  for (const p of keyPieces(pose)) g.rect(p.x, p.y, p.w, p.h).fill(p.color);
}

// The keys in HD, drawn whole (the common recipe rounds corners, which on a
// key would show the crystal tile under it): the same pieces on the fine
// grid, each white key shaded lightSteel down its right edge.
function drawPianoKeysHd(pose: SwitchPose): CritterLayers {
  const s = new FineCanvas({ x: 0, y: 0, w: pose.cols * TILE_SIZE * FINE, h: pose.rows * TILE_SIZE * FINE });
  for (const p of keyPieces(pose)) {
    s.rect({ x: p.x * FINE, y: p.y * FINE, w: p.w * FINE, h: p.h * FINE }, p.color);
    if (p.color === DB32.valhalla && p.w === 1) {
      s.rect({ x: p.x * FINE - 1, y: p.y * FINE + 24, w: 1, h: p.h * FINE - 27 }, DB32.lightSteel);
    }
  }
  return { body: s, halo: null };
}

const SWITCH_ART: Record<CrystalLook, SwitchArt> = {
  [CRYSTAL_LOOK.crystal]: { draw: drawSwitchLight },
  [CRYSTAL_LOOK.pianoKey]: { draw: drawPianoKeys, hd: drawPianoKeysHd },
};

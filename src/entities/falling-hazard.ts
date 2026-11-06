import { DB32, TILE_SIZE } from '@constants';
import type { Entity, StepWorld } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import type { Audio } from '@systems/audio';
import type { Vec2 } from '@types';
import { Tile, type Tilemap } from '@world/tilemap';
import { Container, type Graphics } from 'pixi.js';

// The column under it that wakes it, px either side of its middle, and how
// far down, tiles.
const REACH_X = 12;
const REACH_DOWN = 10;
// It shakes this long before it drops, s, a pixel either way every 2 frames.
const WARN = 0.4;
const SHAKE_FRAMES = 2;
// Its fall: px/s², and px/s at most.
const GRAVITY = 900;
const MAX_FALL = 360;
// Its pieces scatter this long, s, once it lands.
const SHATTER = 0.3;
// Gone this long before it is back, s, and back over this long.
const RESPAWN = 6;
const FADE_IN = 0.3;

// What hangs: the keep's loose masonry, the garden's icicles in the ice
// house and the keystones of its aqueduct, and the potting shed's picture
// frames, loose plaster and the clods of earth over its foundations.
export const HAZARD_VARIANT = {
  looseStone: 'loose-stone',
  icicle: 'icicle',
  keystone: 'keystone',
  frame: 'frame',
  plaster: 'plaster',
  clod: 'clod',
} as const;

export type HazardVariant = (typeof HAZARD_VARIANT)[keyof typeof HAZARD_VARIANT];

// Where a thing is in its fall.
const PHASE = {
  hanging: 'hanging',
  warning: 'warning',
  falling: 'falling',
  shattered: 'shattered',
  gone: 'gone',
} as const;

type Phase = (typeof PHASE)[keyof typeof PHASE];

export interface FallingHazardSpec {
  // The middle of it, and the underside of the ceiling tile it hangs from.
  x: number;
  y: number;
  variant: HazardVariant;
  // For its tick, its shatter and its splash.
  audio: Audio;
}

// Something hanging from a ceiling that comes down on whoever walks under it:
// it shakes for a moment with grit falling off it, then drops; touching it
// as it falls sends the player back to the last checkpoint, as a bramble
// does. It breaks on the floor (a splash, in water) and leaves nothing, and
// six seconds later it is back — but it waits for the player to have left
// the column under it before it can fall again.
export class FallingHazard implements Entity {
  readonly sprite = new Container();
  private readonly spec: FallingHazardSpec;
  private readonly body: ArtBody;
  private readonly size: { w: number; h: number };
  private phase: Phase = PHASE.hanging;
  // Starts past its fade-in: there from the first frame.
  private time = FADE_IN;
  private drop = 0;
  private speed = 0;
  // Whether the player has been out of its column since it came back.
  private rearmed = true;
  private shownKey = '';

  constructor(spec: FallingHazardSpec) {
    this.spec = spec;
    this.size = HAZARD_ART[spec.variant].size;
    this.body = new ArtBody(spec.variant);
    this.sprite.position.set(spec.x, spec.y);
    this.sprite.addChild(this.body);
    this.redraw();
  }

  hurts(playerPos: Vec2, playerSize: Vec2): boolean {
    if (this.phase !== PHASE.falling) return false;
    const left = this.spec.x - this.size.w / 2;
    const top = this.spec.y + this.drop;
    return (
      playerPos.x < left + this.size.w &&
      playerPos.x + playerSize.x > left &&
      playerPos.y < top + this.size.h &&
      playerPos.y + playerSize.y > top
    );
  }

  step(dt: number, world: StepWorld): void {
    const below = this.playerBelow(world);
    this.time += dt;
    if (this.phase === PHASE.hanging) {
      if (!below) this.rearmed = true;
      if (below && this.rearmed) this.enter(PHASE.warning);
    } else if (this.phase === PHASE.warning) {
      if (this.time >= WARN) this.enter(PHASE.falling);
    } else if (this.phase === PHASE.falling) {
      this.speed = Math.min(MAX_FALL, this.speed + GRAVITY * dt);
      this.drop += this.speed * dt;
      this.land(world.ground.tilemap);
    } else if (this.phase === PHASE.shattered) {
      if (this.time >= SHATTER) this.enter(PHASE.gone);
    } else if (this.time >= RESPAWN) {
      this.enter(PHASE.hanging);
      this.rearmed = !below;
    }
    this.redraw();
  }

  private enter(phase: Phase): void {
    this.phase = phase;
    this.time = 0;
    if (phase === PHASE.warning) this.spec.audio.dustTick();
    if (phase === PHASE.falling) this.speed = 0;
    if (phase === PHASE.hanging) this.drop = 0;
  }

  // Ends the fall on the first solid or water tile under its bottom edge.
  private land(map: Tilemap): void {
    const tx = Math.floor(this.spec.x / TILE_SIZE);
    const ty = Math.floor((this.spec.y + this.drop + this.size.h) / TILE_SIZE);
    if (map.at(tx, ty) === Tile.Water) {
      this.spec.audio.splash();
      this.enter(PHASE.gone);
    } else if (map.isSolid(tx, ty)) {
      this.drop = ty * TILE_SIZE - this.spec.y - this.size.h;
      this.spec.audio.shatter();
      this.enter(PHASE.shattered);
    }
  }

  // Whether the player is in the column under it, within reach, with nothing
  // solid between.
  private playerBelow(world: StepWorld): boolean {
    const { pos, size } = world.player;
    if (pos.x + size.x < this.spec.x - REACH_X || pos.x > this.spec.x + REACH_X) return false;
    const top = this.spec.y;
    if (pos.y + size.y <= top || pos.y > top + REACH_DOWN * TILE_SIZE) return false;
    const map = world.ground.tilemap;
    const tx = Math.floor(this.spec.x / TILE_SIZE);
    for (let ty = Math.floor(top / TILE_SIZE); ty < Math.floor(pos.y / TILE_SIZE); ty++) {
      if (map.isSolid(tx, ty)) return false;
    }
    return true;
  }

  private redraw(): void {
    const shake = this.phase === PHASE.warning ? (Math.floor((this.time * 60) / SHAKE_FRAMES) % 2 ? 1 : -1) : 0;
    const fade = this.phase === PHASE.hanging ? Math.min(1, this.time / FADE_IN) : 1;
    this.sprite.alpha = fade;
    this.body.visible = this.phase !== PHASE.gone;
    this.body.position.set(shake, Math.round(this.drop));
    const pose: HazardPose = {
      variant: this.spec.variant,
      dust: this.phase === PHASE.warning ? Math.min(4, Math.floor((this.time / WARN) * 5)) : -1,
      debris: this.phase === PHASE.shattered ? Math.min(5, Math.floor((this.time / SHATTER) * 6)) : -1,
    };
    const key = `${pose.dust}:${pose.debris}`;
    if (!this.body.visible || key === this.shownKey) return;
    this.shownKey = key;
    this.body.draw((g) => drawHazard(g, pose));
  }
}

// How a hazard is drawn: which one, how far its warning dust has fallen
// (-1 for none), and how far its pieces have scattered (-1 while whole).
interface HazardPose {
  variant: HazardVariant;
  dust: number;
  debris: number;
}

// One variant: its box, px; how it is drawn whole; the grit that falls off
// it as it shakes; and its pieces once broken, a lit tone and a dark one.
interface HazardArt {
  size: { w: number; h: number };
  draw: (g: Graphics) => void;
  dust: number;
  debris: readonly [lit: number, dark: number];
}

// Drawn with its top middle at (0, 0), the ceiling's underside.
function drawHazard(g: Graphics, pose: HazardPose): void {
  const art = HAZARD_ART[pose.variant];
  const { h } = art.size;
  if (pose.debris >= 0) {
    // Four pieces scattering out and down from where it broke.
    const d = pose.debris;
    const [lit, dark] = art.debris;
    for (const [dx, color] of [
      [-1, lit],
      [1, dark],
      [-2, dark],
      [2, lit],
    ] as const) {
      g.rect(dx * (1 + d), h - 1 - Math.max(0, 3 - d) + d, 1, 1).fill(color);
    }
    return;
  }
  art.draw(g);
  if (pose.dust >= 0) {
    g.rect(-2, h + 1 + pose.dust * 2, 1, 1).fill(art.dust);
    g.rect(2, h + 3 + pose.dust * 3, 1, 1).fill(art.dust);
  }
}

// A block of masonry come loose: dimGray, its top lit heather, a valhalla
// crack across it.
function drawLooseStone(g: Graphics): void {
  g.rect(-5, 0, 10, 6).fill(DB32.dimGray);
  g.rect(-5, 0, 10, 1).fill(DB32.heather);
  g.rect(-5, 5, 10, 1).fill(DB32.valhalla);
  g.rect(-1, 1, 1, 2).fill(DB32.valhalla);
  g.rect(0, 3, 2, 1).fill(DB32.valhalla);
}

// An icicle: lightSteel, a white edge down its lit side, tapering to a point.
function drawIcicle(g: Graphics): void {
  for (const [y, half] of [
    [0, 3],
    [3, 2],
    [6, 2],
    [8, 1],
    [10, 1],
  ] as const) {
    const rows = y === 10 ? 2 : y === 8 ? 2 : 3;
    g.rect(-half, y, half * 2, rows).fill(DB32.lightSteel);
    g.rect(-half, y, 1, rows).fill(DB32.white);
  }
}

// A keystone: a heather wedge, wider at its top, its faces cut in valhalla.
function drawKeystone(g: Graphics): void {
  g.rect(-5, 0, 10, 3).fill(DB32.heather);
  g.rect(-4, 3, 8, 3).fill(DB32.heather);
  g.rect(-3, 6, 6, 2).fill(DB32.heather);
  g.rect(-5, 0, 10, 1).fill(DB32.lightSteel);
  g.rect(-1, 1, 1, 6).fill(DB32.valhalla);
}

// A picture frame hung from the ceiling on a twine wire and a dimGray nail:
// a tahitiGold gilt frame lit twine along its top and left, shaded rope
// along its bottom and right, round a little landscape — a venice sky, a
// dell hill, a pancho sun.
function drawFrame(g: Graphics): void {
  g.rect(0, 0, 1, 1).fill(DB32.dimGray);
  g.rect(-2, 1, 5, 1).fill(DB32.twine);
  g.rect(-5, 2, 10, 8).fill(DB32.tahitiGold);
  g.rect(-5, 2, 10, 1).fill(DB32.twine);
  g.rect(-5, 3, 1, 6).fill(DB32.twine);
  g.rect(-5, 9, 10, 1).fill(DB32.rope);
  g.rect(4, 3, 1, 6).fill(DB32.rope);
  g.rect(-3, 4, 6, 4).fill(DB32.venice);
  g.rect(-3, 6, 6, 2).fill(DB32.dell);
  g.rect(-1, 5, 3, 1).fill(DB32.dell);
  g.rect(1, 4, 1, 1).fill(DB32.pancho);
}

// A slab of the ceiling's plaster come away from its lath: twine, ragged
// along its underside, the strip of rope lath still on its top, a pancho
// lit edge down its left and an oiledCedar crack.
function drawPlaster(g: Graphics): void {
  g.rect(-5, 0, 10, 3).fill(DB32.twine);
  g.rect(-4, 3, 7, 1).fill(DB32.twine);
  g.rect(-2, 4, 3, 1).fill(DB32.twine);
  g.rect(-5, 0, 10, 1).fill(DB32.rope);
  g.rect(-5, 1, 1, 2).fill(DB32.pancho);
  g.rect(1, 1, 1, 2).fill(DB32.oiledCedar);
  g.rect(2, 3, 1, 1).fill(DB32.oiledCedar);
}

// A clod of earth come loose from the ceiling over the foundations: a lump
// of oiledCedar, lit rope along its top, shaded loulou under, loulou grit
// in it and a twine root hair hanging out of it.
function drawClod(g: Graphics): void {
  g.rect(-3, 0, 6, 1).fill(DB32.rope);
  g.rect(-4, 1, 8, 4).fill(DB32.oiledCedar);
  g.rect(-4, 1, 1, 2).fill(DB32.rope);
  g.rect(-3, 5, 6, 1).fill(DB32.loulou);
  g.rect(3, 3, 1, 2).fill(DB32.loulou);
  g.rect(-2, 2, 1, 1).fill(DB32.loulou);
  g.rect(1, 3, 1, 1).fill(DB32.loulou);
  g.rect(-1, 6, 1, 2).fill(DB32.twine);
}

// Masonry, ice and stone shed heather grit and break into heather and
// dimGray; the house's own things break into their own tones.
const HAZARD_ART: Record<HazardVariant, HazardArt> = {
  [HAZARD_VARIANT.looseStone]: {
    size: { w: 10, h: 6 },
    draw: drawLooseStone,
    dust: DB32.heather,
    debris: [DB32.heather, DB32.dimGray],
  },
  [HAZARD_VARIANT.icicle]: {
    size: { w: 6, h: 12 },
    draw: drawIcicle,
    dust: DB32.heather,
    debris: [DB32.heather, DB32.dimGray],
  },
  [HAZARD_VARIANT.keystone]: {
    size: { w: 10, h: 8 },
    draw: drawKeystone,
    dust: DB32.heather,
    debris: [DB32.heather, DB32.dimGray],
  },
  [HAZARD_VARIANT.frame]: {
    size: { w: 10, h: 10 },
    draw: drawFrame,
    dust: DB32.twine,
    debris: [DB32.tahitiGold, DB32.rope],
  },
  [HAZARD_VARIANT.plaster]: {
    size: { w: 10, h: 5 },
    draw: drawPlaster,
    dust: DB32.pancho,
    debris: [DB32.twine, DB32.rope],
  },
  [HAZARD_VARIANT.clod]: {
    size: { w: 8, h: 8 },
    draw: drawClod,
    dust: DB32.oiledCedar,
    debris: [DB32.rope, DB32.oiledCedar],
  },
};

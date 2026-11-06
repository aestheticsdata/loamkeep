import { DB32, TILE_SIZE } from '@constants';
import type { Entity, Switchable } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import type { Audio } from '@systems/audio';
import type { SolidBox } from '@systems/physics';
import { Container, type Graphics } from 'pixi.js';

// How long the gate takes to rise its own height, s.
const RISE = 0.8;

// What the gate looks like: the keep's portcullis, or the iron grate of the
// potting shed's seed vault.
export const PORTCULLIS_LOOK = {
  portcullis: 'portcullis',
  grate: 'grate',
} as const;

export type PortcullisLook = (typeof PORTCULLIS_LOOK)[keyof typeof PORTCULLIS_LOOK];

export interface PortcullisSpec {
  // What its lever names it by.
  id: string;
  // Its top tile (the top Y of its run in the rows), and how many rows it
  // runs down.
  col: number;
  row: number;
  rows: number;
  // A portcullis unless given.
  look?: PortcullisLook;
}

// An iron gate across a passage (Y in the rows): solid while it is down. A
// lever raises it (see Lever): it slides up into the wall over it in 0.8 s,
// eased at both ends, solid only as far down as it still reaches, and never
// comes down again. The tiles it stood in are what they were all along —
// water in a channel, air elsewhere (see Tilemap.fromAscii) — so an open
// gate leaves nothing behind.
export class Portcullis implements Entity, Switchable {
  readonly sprite = new Container();
  readonly switchId: string;
  private readonly body: ArtBody;
  private readonly draw: (g: Graphics, pose: GatePose) => void;
  private readonly box: SolidBox;
  private readonly height: number;
  private readonly rows: number;
  // How far it has risen, 0..1, and whether it is on its way up.
  private risen = 0;
  private rising = false;
  private shown = -1;

  constructor(spec: PortcullisSpec) {
    this.switchId = spec.id;
    this.rows = spec.rows;
    const look = spec.look ?? PORTCULLIS_LOOK.portcullis;
    this.body = new ArtBody(look);
    this.draw = PORTCULLIS_ART[look];
    this.height = spec.rows * TILE_SIZE;
    this.box = { x: spec.col * TILE_SIZE, y: spec.row * TILE_SIZE, w: TILE_SIZE, h: this.height };
    this.sprite.position.set(this.box.x, this.box.y);
    this.sprite.addChild(this.body);
    this.redraw();
  }

  get isOpen(): boolean {
    return this.risen >= 1;
  }

  setActive(on: boolean, instant: boolean): void {
    if (!on || this.isOpen || this.rising) return;
    if (instant) {
      this.risen = 1;
      this.redraw();
      return;
    }
    this.rising = true;
  }

  cue(audio: Audio): void {
    audio.chainRattle();
  }

  solids(): readonly SolidBox[] {
    return this.isOpen ? [] : [this.box];
  }

  update(dt: number): void {
    if (!this.rising) return;
    this.risen = Math.min(1, this.risen + dt / RISE);
    if (this.risen >= 1) this.rising = false;
    this.redraw();
  }

  // The gate drawn as far down as it still hangs, and the box cut to it.
  private redraw(): void {
    const t = this.risen;
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const up = Math.round(eased * this.height);
    this.box.h = this.height - up;
    if (up === this.shown) return;
    this.shown = up;
    // Gone, there is nothing to draw — and HD cannot bake an empty drawing.
    this.body.visible = up < this.height;
    if (!this.body.visible) return;
    const pose = { rows: this.rows, up };
    this.body.draw((g) => this.draw(g, pose));
  }
}

// How the gate is drawn: how many rows it runs, and how far it has risen, px.
interface GatePose {
  rows: number;
  up: number;
}

// The gate, its top-left at (0, 0), risen `up` px into the wall: what shows
// is its bottom `height - up` px, from y = 0 down. No fill — the backdrop or
// the water shows between the bars. Per tile: three bars 2 px wide at x 1, 7
// and 13, heather with a lightSteel left edge and a valhalla shadow down
// their right; a dimGray cross-bar at y 6-7 with a heather top line; and on
// the bottom tile, each bar narrows to a 1-px spike tip for its last 2 px.
function drawPortcullis(g: Graphics, pose: GatePose): void {
  const height = pose.rows * TILE_SIZE;
  const shown = height - pose.up;
  const tipFrom = height - 2;
  for (const bx of [1, 7, 13]) {
    const solid = Math.min(shown, tipFrom - pose.up);
    if (solid > 0) {
      g.rect(bx, 0, 2, solid).fill(DB32.heather);
      g.rect(bx, 0, 1, solid).fill(DB32.lightSteel);
      g.rect(bx + 2, 0, 1, solid).fill(DB32.valhalla);
    }
    const tipTop = Math.max(0, tipFrom - pose.up);
    if (shown > tipTop) g.rect(bx, tipTop, 1, shown - tipTop).fill(DB32.heather);
  }
  for (let r = 0; r < pose.rows; r++) {
    const y = r * TILE_SIZE + 6 - pose.up;
    if (y < 0 || y + 2 > shown) continue;
    g.rect(0, y, TILE_SIZE, 2).fill(DB32.dimGray);
    g.rect(0, y, TILE_SIZE, 1).fill(DB32.heather);
  }
}

// A vault grate: a lattice of dimGray iron, square holes between bars 2 px
// thick on a 5-px pitch both ways, each bar lit heather along its top or
// left and shaded valhalla along its bottom or right, a lightSteel rivet where
// two cross, and a flat bottom bar — no spikes, it rises into the floor of
// the vault over it. Risen `up` px, like the portcullis: what shows is its
// bottom `height - up` px.
function drawGrate(g: Graphics, pose: GatePose): void {
  const shown = pose.rows * TILE_SIZE - pose.up;
  for (const bx of GRATE_PITCH) {
    g.rect(bx, 0, 2, shown).fill(DB32.dimGray);
    g.rect(bx, 0, 1, shown).fill(DB32.heather);
    g.rect(bx + 2, 0, 1, shown).fill(DB32.valhalla);
  }
  for (let r = 0; r < pose.rows; r++) {
    for (const by of GRATE_PITCH) {
      const y = r * TILE_SIZE + by - pose.up;
      if (y < 0 || y + 3 > shown - 2) continue;
      g.rect(0, y, TILE_SIZE, 2).fill(DB32.dimGray);
      g.rect(0, y, TILE_SIZE, 1).fill(DB32.heather);
      g.rect(0, y + 2, TILE_SIZE, 1).fill(DB32.valhalla);
      for (const bx of GRATE_PITCH) g.rect(bx, y, 1, 1).fill(DB32.lightSteel);
    }
  }
  const foot = Math.max(0, shown - 2);
  g.rect(0, foot, TILE_SIZE, shown - foot).fill(DB32.dimGray);
  g.rect(0, foot, TILE_SIZE, 1).fill(DB32.heather);
}

// Where the grate's bars run across a tile, px, both ways.
const GRATE_PITCH: readonly number[] = [1, 6, 11];

const PORTCULLIS_ART: Record<PortcullisLook, (g: Graphics, pose: GatePose) => void> = {
  [PORTCULLIS_LOOK.portcullis]: drawPortcullis,
  [PORTCULLIS_LOOK.grate]: drawGrate,
};

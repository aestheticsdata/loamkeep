import { DB32, TILE_SIZE } from '@constants';
import type { Entity } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import { bayer } from '@hd/palette';
import type { SolidBox } from '@systems/physics';
import type { TileRect } from '@world/level';
import type { Graphics } from 'pixi.js';

// How long the gate takes to dissolve once opened, s, and in how many steps.
const DISSOLVE = 0.6;
const STEPS = 4;

// The WorldState flag that remembers a gate was opened.
export function gateOpenFlag(levelId: string, gateId: string): string {
  return `${levelId}.${gateId}`;
}

// What a gate looks like: the grotto's crystal bars, or the potting shed's
// velvet curtain across the music box's alcove.
export const GATE_LOOK = {
  crystal: 'crystal',
  curtain: 'curtain',
} as const;

export type GateLook = (typeof GATE_LOOK)[keyof typeof GATE_LOOK];

export interface CrystalGateSpec {
  id: string;
  // The gate's tiles (Z in the rows), which are neither drawn nor solid as
  // tiles: the gate is.
  area: TileRect;
  // The switch crystals that open it, all of them lit.
  switches: readonly string[];
  // Already open, on a visit after the one it was opened on.
  open: boolean;
  // Crystal unless given.
  look?: GateLook;
}

// A wall of crystal bars across a passage, solid until its room's three
// switch crystals are lit (Game opens it). It opens by dissolving, in four
// steps of an ordered dither over 0.6 s, and is solid until the last. A
// curtain draws aside the same way.
export class CrystalGate implements Entity {
  readonly sprite: ArtBody;
  readonly id: string;
  readonly switches: readonly string[];
  private readonly area: TileRect;
  private readonly pixel: GatePixel;
  private readonly boxes: SolidBox[];
  // Steps of the dissolve shown: 0 whole, STEPS gone.
  private shown = 0;
  private opening = false;
  private time = 0;

  constructor(spec: CrystalGateSpec) {
    this.id = spec.id;
    this.switches = spec.switches;
    this.area = spec.area;
    const look = spec.look ?? GATE_LOOK.crystal;
    this.pixel = GATE_PIXEL[look];
    this.sprite = new ArtBody(`${look}-gate`, { emissive: [DB32.white] });
    const { col, row, cols, rows } = spec.area;
    this.boxes = [{ x: col * TILE_SIZE, y: row * TILE_SIZE, w: cols * TILE_SIZE, h: rows * TILE_SIZE }];
    this.sprite.position.set(col * TILE_SIZE, row * TILE_SIZE);
    if (spec.open) this.shown = STEPS;
    this.redraw();
  }

  get isOpen(): boolean {
    return this.opening || this.shown === STEPS;
  }

  open(): void {
    if (this.isOpen) return;
    this.opening = true;
  }

  solids(): readonly SolidBox[] {
    return this.shown === STEPS ? [] : this.boxes;
  }

  update(dt: number): void {
    if (!this.opening) return;
    this.time += dt;
    const step = Math.min(STEPS, Math.floor((this.time / DISSOLVE) * STEPS));
    if (step === this.shown) return;
    this.shown = step;
    if (step === STEPS) this.opening = false;
    this.redraw();
  }

  // Gone, there is nothing to draw — and HD cannot bake an empty drawing.
  private redraw(): void {
    this.sprite.visible = this.shown < STEPS;
    if (!this.sprite.visible) return;
    const pose = { cols: this.area.cols, rows: this.area.rows, gone: this.shown / STEPS, pixel: this.pixel };
    this.sprite.draw((g) => drawGate(g, pose));
  }
}

// The colour of a gate's pixel at (x, y), px into it, whole, for a gate
// `h` px tall.
type GatePixel = (x: number, y: number, h: number) => number;

// How the gate is drawn: its size in tiles, how much of it the dissolve has
// taken, 0 to 1, and its look's colour at each pixel.
interface GatePose {
  cols: number;
  rows: number;
  gone: number;
  pixel: GatePixel;
}

// The gate in its look's colours — whole, each run of one colour down a
// column a rect; dissolving, pixel by pixel, every pixel the dissolve has
// reached left out by the ordered dither, so the gate thins evenly and never
// in stripes.
function drawGate(g: Graphics, pose: GatePose): void {
  const w = pose.cols * TILE_SIZE;
  const h = pose.rows * TILE_SIZE;
  if (pose.gone > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (bayer(x, y) < pose.gone) continue;
        g.rect(x, y, 1, 1).fill(pose.pixel(x, y, h));
      }
    }
    return;
  }
  for (let x = 0; x < w; x++) {
    let top = 0;
    for (let y = 1; y <= h; y++) {
      if (y < h && pose.pixel(x, y, h) === pose.pixel(x, top, h)) continue;
      g.rect(x, top, 1, y - top).fill(pose.pixel(x, top, h));
      top = y;
    }
  }
}

// Bars of crystal standing side by side, each 4 px wide: a venice core, a
// viking face and a lightSteel edge, a white glint near the top of every
// tile.
function crystalPixel(x: number, y: number): number {
  const across = x % 4;
  if (y % TILE_SIZE === 3 && across === 1) return DB32.white;
  if (across === 0) return DB32.lightSteel;
  if (across === 3) return DB32.venice;
  return DB32.viking;
}

// A velvet curtain hung from a rainforest rod lit tahitiGold: clairvoyant
// folds 4 px apart, each crest lit brown and each hollow shaded loulou, and
// a loulou hem along its foot.
function curtainPixel(x: number, y: number, h: number): number {
  if (y === 0) return DB32.tahitiGold;
  if (y === 1) return DB32.rainforest;
  if (y === h - 1) return DB32.loulou;
  const across = x % 4;
  if (across === 0) return DB32.brown;
  if (across === 3) return DB32.loulou;
  return DB32.clairvoyant;
}

const GATE_PIXEL: Record<GateLook, GatePixel> = {
  [GATE_LOOK.crystal]: crystalPixel,
  [GATE_LOOK.curtain]: curtainPixel,
};

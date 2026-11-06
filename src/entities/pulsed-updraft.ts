import { DB32, TILE_SIZE } from '@constants';
import type { Entity, Switchable } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { UPDRAFT_LOOK, Updraft, type UpdraftLook } from '@entities/updraft';
import { ArtBody } from '@hd/art-body';
import type { TileRect } from '@world/level';
import { Container, type Graphics } from 'pixi.js';

// It blows this long, s, then is still this long, and again.
const ON = 2;
const OFF = 1.5;

export interface PulsedUpdraftSpec {
  // What a lever names it by.
  id: string;
  // Its updraft tiles.
  area: TileRect;
  // Blowing from the start (the spring), or still until switched on (the
  // orangery's vent, see Lever).
  active: boolean;
  // The air it carries, and the haze at its mouth: warm unless given.
  look?: UpdraftLook;
}

// Warm air up a column of updraft tiles in gusts: two seconds blowing, one
// and a half still, round and round — the boiler's vent up the orangery to
// its cupola, the spring in the aqueduct. While it is still, or not yet
// switched on, its tiles lift nobody (see Player) and nothing shows; while it
// blows, warm specks rise up it and a haze hangs at its mouth.
export class PulsedUpdraft implements Entity, Switchable {
  readonly sprite = new Container();
  readonly switchId: string;
  private readonly area: TileRect;
  private readonly specks: Updraft;
  private readonly haze: ArtBody;
  private active: boolean;
  private time = 0;

  constructor(spec: PulsedUpdraftSpec) {
    this.switchId = spec.id;
    this.area = spec.area;
    this.active = spec.active;
    const look = spec.look ?? UPDRAFT_LOOK.warm;
    const { col, row, cols, rows } = spec.area;
    this.specks = new Updraft(
      { x: col * TILE_SIZE, y: row * TILE_SIZE, width: cols * TILE_SIZE, height: rows * TILE_SIZE },
      look,
    );
    const width = cols * TILE_SIZE;
    this.haze = new ArtBody(look === UPDRAFT_LOOK.warm ? 'vent-haze' : `${look}-haze`, {
      emissive: [DB32.tahitiGold],
    });
    this.haze.draw((g) => HAZES[look](g, width));
    this.haze.position.set(col * TILE_SIZE, (row + rows) * TILE_SIZE);
    this.sprite.addChild(this.haze, this.specks.sprite);
    this.show();
  }

  get blowing(): boolean {
    return this.active && this.time % (ON + OFF) < ON;
  }

  setActive(on: boolean, _instant: boolean): void {
    this.active = on;
    this.time = 0;
    this.show();
  }

  calm(): readonly TileRect[] {
    return this.blowing ? [] : [this.area];
  }

  update(dt: number): void {
    this.time += dt;
    if (this.blowing) this.specks.update(dt);
    this.show();
  }

  private show(): void {
    this.specks.sprite.visible = this.blowing;
    this.haze.visible = this.blowing;
  }
}

// The haze at a vent's mouth, `width` px across, each over a mark at its
// heart (HD cannot bake a drawing of nothing but light): warm air glowing
// oiledCedar over a tahitiGold ember; soot, a loulou pall round an
// oiledCedar heart over a flake of soot; the cave's cold air a cornflower
// breath over a mote.
const HAZES: Record<UpdraftLook, (g: Graphics, width: number) => void> = {
  [UPDRAFT_LOOK.warm]: (g, width) => {
    drawGlow(g, { x: width / 2, y: -6, radius: width, color: DB32.oiledCedar });
    g.rect(width / 2 - 1, -2, 2, 1).fill(DB32.tahitiGold);
  },
  [UPDRAFT_LOOK.soot]: (g, width) => {
    drawGlow(g, { x: width / 2, y: -6, radius: Math.round(width * 1.5), color: DB32.loulou });
    drawGlow(g, { x: width / 2, y: -4, radius: Math.round(width * 0.6), color: DB32.oiledCedar });
    g.rect(width / 2 - 1, -2, 2, 1).fill(DB32.oiledCedar);
  },
  [UPDRAFT_LOOK.cave]: (g, width) => {
    drawGlow(g, { x: width / 2, y: -6, radius: width, color: DB32.cornflower });
    g.rect(width / 2, -2, 1, 1).fill(DB32.cornflower);
  },
};

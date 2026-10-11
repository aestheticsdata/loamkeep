import { DB32 } from '@constants';
import { bake, LiveTexture } from '@hd/bake';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { bayer } from '@hd/palette';
import {
  isWaterSurface,
  STATIC_BODY_TOP_OFFSET,
  Tile,
  type Tilemap,
  tileHash,
  WATER_REST_DEPRESSION,
} from '@world/tilemap';
import { TILE_FINE } from '@world/tiles-hd';
import { Container, Sprite, type Texture } from 'pixi.js';

const T = TILE_FINE;
// Where the still body starts below a surface tile's top, and where the
// surface sits at rest — the classic offsets, ×3.
const BODY_TOP = STATIC_BODY_TOP_OFFSET * FINE;
const REST = WATER_REST_DEPRESSION * FINE;
// The furthest the classic bob moves the surface: one logical pixel.
const SWING = FINE;

// Water darkens with depth by dithering deepKoamaru into venice, up to 50 %
// (RECIPES §5). `depth` is how many water tiles sit above this one.
// A fine pixel of water: where it is, which tile row it is in, and how many
// water tiles lie above that one.
interface WaterPixel {
  x: number;
  y: number;
  ty: number;
  depth: number;
}

function bodyTone(at: WaterPixel): number {
  const dd = (at.depth * T + (at.y - at.ty * T)) / 160;
  return bayer(at.x, at.y) < Math.min(0.5, dd * 0.5) ? DB32.deepKoamaru : DB32.venice;
}

function depthOf(map: Tilemap, tx: number, ty: number): number {
  let d = 0;
  while (map.at(tx, ty - d - 1) === Tile.Water) d++;
  return d;
}

// The still body of every water tile in the canvas: the whole tile when it
// is under water, below the surface band when it is the surface. Painted
// into the chunks with the tiles, since it never moves.
export function paintWaterBodyHd(canvas: FineCanvas, map: Tilemap): void {
  const tx0 = Math.max(0, Math.floor(canvas.x0 / T));
  const tx1 = Math.min(map.width, Math.ceil((canvas.x0 + canvas.w) / T));
  const ty0 = Math.max(0, Math.floor(canvas.y0 / T));
  const ty1 = Math.min(map.height, Math.ceil((canvas.y0 + canvas.h) / T));
  for (let ty = ty0; ty < ty1; ty++) {
    for (let tx = tx0; tx < tx1; tx++) {
      if (map.at(tx, ty) !== Tile.Water) continue;
      const depth = depthOf(map, tx, ty);
      const top = ty * T + (isWaterSurface(map, tx, ty) ? BODY_TOP : 0);
      for (let y = top; y < (ty + 1) * T; y++) {
        for (let x = tx * T; x < (tx + 1) * T; x++) canvas.set(x, y, bodyTone({ x, y, depth, ty }));
      }
    }
  }
}

// How a pool's surface is moving this frame: `offset` lifts or drops the
// whole band (fine px), `wave` (0 or 1) adds a travelling one-fine ripple,
// `t` is the pool's clock.
export interface SurfaceMotion {
  offset: number;
  wave: number;
  t: number;
}

// The water this frame: which pool the player is in (-1 for none), and how
// it moves.
export interface WaterState {
  activeId: number;
  motion: SurfaceMotion;
}

const STILL: SurfaceMotion = { offset: 0, wave: 0, t: 0 };

// The band from the meniscus down to the still body, for every surface tile
// of one pool: 2 fine of cornflower, a 50 % seam, 2 of royalBlue, a 50 %
// seam into the body, and the tile's sparkle riding it.
function paintSurface(canvas: FineCanvas, pool: Pool, motion: SurfaceMotion): void {
  canvas.pixels.fill(-1);
  for (const { tx, ty } of pool.tiles) {
    const x0 = tx * T;
    const y0 = ty * T;
    const crest = (x: number) =>
      y0 + REST + motion.offset + Math.round(Math.sin(x * 0.26 - motion.t * 5) * motion.wave);
    for (let x = x0; x < x0 + T; x++) {
      const top = crest(x);
      for (let y = top; y < y0 + BODY_TOP; y++) {
        const k = y - top;
        let c: number;
        if (k < 2) c = DB32.cornflower;
        else if (k === 2) c = bayer(x, y) < 0.5 ? DB32.cornflower : DB32.royalBlue;
        else if (k < 5) c = DB32.royalBlue;
        else if (k < 7) c = bayer(x, y) < 0.5 ? DB32.royalBlue : DB32.venice;
        else c = bodyTone({ x, y, depth: 0, ty });
        canvas.set(x, y, c);
      }
    }
    if (tileHash(tx, ty, 200) < 0.3) {
      const sx = x0 + FINE * (2 + Math.floor(tileHash(tx, ty, 201) * 12));
      const sy = crest(sx) + 6;
      canvas.rect({ x: sx, y: sy, w: 2, h: 1 }, DB32.lightSteel).set(sx + 2, sy, DB32.cornflower);
    }
  }
}

interface Pool {
  id: number;
  tiles: { tx: number; ty: number }[];
  canvas: FineCanvas;
}

// Every pool's surface band, one sprite each. A still pool is baked once; the
// pool the player is in is repainted every frame it moves, and returned to
// rest when they leave it.
export class WaterSurfaceHd {
  readonly container = new Container();
  private readonly pools = new Map<number, Pool>();
  private readonly sprites = new Map<number, Sprite>();
  // Each pool's still texture, while it is still.
  private readonly still = new Map<number, Texture>();
  private live: { id: number; texture: LiveTexture } | null = null;

  constructor(map: Tilemap) {
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        if (!isWaterSurface(map, tx, ty)) continue;
        const id = map.waterBodyAt(tx, ty);
        const tiles = this.pools.get(id)?.tiles ?? [];
        tiles.push({ tx, ty });
        if (tiles.length === 1) this.pools.set(id, { id, tiles, canvas: new FineCanvas({ x: 0, y: 0, w: 0, h: 0 }) });
      }
    }
    for (const pool of this.pools.values()) {
      const xs = pool.tiles.map((p) => p.tx);
      const ys = pool.tiles.map((p) => p.ty);
      const tx0 = Math.min(...xs);
      const ty0 = Math.min(...ys);
      // Room for the band to swing a logical pixel up, and the wave one more.
      pool.canvas = new FineCanvas({
        x: tx0 * T,
        y: ty0 * T + REST - SWING - 1,
        w: (Math.max(...xs) - tx0 + 1) * T,
        h: (Math.max(...ys) - ty0) * T + BODY_TOP - REST + SWING + 1,
      });
      this.rest(pool);
    }
  }

  // Moves the pool `activeId`, if any; every other pool stays at rest.
  update(activeId: number, motion: SurfaceMotion): void {
    if (this.live && this.live.id !== activeId) this.settle();
    const pool = this.pools.get(activeId);
    if (!pool) return;
    paintSurface(pool.canvas, pool, motion);
    if (this.live) {
      this.live.texture.update(pool.canvas);
      return;
    }
    this.still.get(pool.id)?.destroy(true);
    this.still.delete(pool.id);
    this.live = { id: activeId, texture: new LiveTexture(pool.canvas) };
    this.show(pool, this.live.texture.baked.texture);
  }

  destroy(): void {
    this.live?.texture.destroy();
    for (const texture of this.still.values()) texture.destroy(true);
    this.container.destroy({ children: true });
  }

  // The pool that was moving goes back to a still texture of its own.
  private settle(): void {
    if (!this.live) return;
    const pool = this.pools.get(this.live.id);
    this.live.texture.destroy();
    this.live = null;
    if (pool) this.rest(pool);
  }

  private rest(pool: Pool): void {
    paintSurface(pool.canvas, pool, STILL);
    const texture = bake(pool.canvas).texture;
    this.still.set(pool.id, texture);
    this.show(pool, texture);
  }

  // Points the pool's sprite at a texture. Textures are owned by `still` and
  // `live`, never by the sprite.
  private show(pool: Pool, texture: Texture): void {
    let sprite = this.sprites.get(pool.id);
    if (!sprite) {
      sprite = new Sprite();
      sprite.scale.set(1 / FINE);
      sprite.position.set(pool.canvas.x0 / FINE, pool.canvas.y0 / FINE);
      this.sprites.set(pool.id, sprite);
      this.container.addChild(sprite);
    }
    sprite.texture = texture;
  }
}

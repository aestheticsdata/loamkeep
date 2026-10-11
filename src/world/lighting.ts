import { DB32 } from '@constants';
import { FINE, type FineCanvas } from '@hd/fine-canvas';
import { bayer, LIT_RAMP } from '@hd/palette';
import type { Vec2 } from '@types';
import { holdsTile, type LevelLighting, type LightSource, type LitRoom } from '@world/level';
import { Tile, type Tilemap, tileHash } from '@world/tilemap';
import { TILE_FINE } from '@world/tiles-hd';

// Light at which a pixel is drawn as it is; every STEP below it, one step
// down its ramp, to at most MAX_STEPS. Above LIFT it dithers one step up.
const NEUTRAL = 0.62;
const STEP = 0.16;
const LIFT = 0.86;
const MAX_STEPS = 4;
// A creature is never darker than this many steps, so it still reads.
const MAX_SPRITE_STEPS = 3;
// A wall between rooms takes this much of the brightest room beside it.
const WALL_SHARE = 0.55;

// The light of a lit level (design_handoff_potting_shed/RECIPES.md §4): each
// room's own, interpolated between tile centres, plus every source within
// reach, its strength times (1 - d/r) to the power 1.5. Drawn by stepping
// each pixel down (or up) its ramp, never by a new tone.
export class LightField {
  private readonly rooms: readonly LitRoom[];
  private readonly lights: readonly LightSource[];
  private readonly width: number;
  private readonly height: number;
  // Per tile: the room it belongs to (-1: none), its ambient light, and for
  // a tile that can be seen through, the room whose back wall shows in it.
  private readonly member: Int16Array;
  private readonly ambient: Float32Array;
  private readonly wall: Int16Array;

  constructor(map: Tilemap, lighting: LevelLighting) {
    this.rooms = lighting.rooms;
    this.lights = lighting.lights;
    this.width = map.width;
    this.height = map.height;
    const n = map.width * map.height;
    this.member = new Int16Array(n).fill(-1);
    this.ambient = new Float32Array(n);
    this.wall = new Int16Array(n).fill(-1);

    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        if (!inRoom(map, tx, ty)) continue;
        const i = this.rooms.findIndex((r) => holdsTile(r, { x: tx, y: ty }));
        if (i >= 0) this.member[ty * map.width + tx] = i;
      }
    }
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        const k = ty * map.width + tx;
        const own = this.member[k];
        const best = own >= 0 ? own : this.brightestBeside(tx, ty);
        this.ambient[k] = own >= 0 ? this.rooms[own].ambient : best >= 0 ? this.rooms[best].ambient * WALL_SHARE : 0;
        if (!map.isSolid(tx, ty)) this.wall[k] = best;
      }
    }
  }

  // The room whose back wall shows through an open tile, if any.
  wallAt(tx: number, ty: number): LitRoom | null {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return null;
    const i = this.wall[ty * this.width + tx];
    return i >= 0 ? this.rooms[i] : null;
  }

  // The light at a fine pixel of the world.
  level(at: Vec2): number {
    let light = this.ambientLevel(at);
    for (const s of this.lights) light += reach(s, at);
    return light;
  }

  // How many steps down its ramp a sprite standing at (x, y) in logical px
  // is drawn: the light at its feet, in whole steps.
  stepsAt(at: Vec2): number {
    const light = this.level({ x: at.x * FINE, y: at.y * FINE });
    return Math.max(0, Math.min(MAX_SPRITE_STEPS, Math.round((NEUTRAL - light) / STEP)));
  }

  // Lights a raster in place: every pixel stepped along its ramp by the
  // light where it is, and on the back walls (`wall`, when given, says which
  // pixels are wall) the specks a warm light throws — golden fizz near it,
  // tahiti gold further out.
  lightChunk(canvas: FineCanvas, wall?: Uint8Array): void {
    const near = this.lights.filter(
      (s) =>
        (s.x + s.radius) * TILE_FINE > canvas.x0 &&
        (s.x - s.radius) * TILE_FINE < canvas.x0 + canvas.w &&
        (s.y + s.radius) * TILE_FINE > canvas.y0 &&
        (s.y - s.radius) * TILE_FINE < canvas.y0 + canvas.h,
    );
    const warm = near.filter((s) => s.warm);
    const at = { x: 0, y: 0 };
    for (let j = 0; j < canvas.h; j++) {
      for (let i = 0; i < canvas.w; i++) {
        const k = j * canvas.w + i;
        const c = canvas.pixels[k];
        if (c < 0) continue;
        at.x = canvas.x0 + i;
        at.y = canvas.y0 + j;
        let light = this.ambientLevel(at);
        for (const s of near) light += reach(s, at);
        let out = shade(c, light, at);
        if (wall?.[k]) out = speck(warm, at) ?? out;
        canvas.pixels[k] = out;
      }
    }
  }

  // The rooms' own light, interpolated between tile centres.
  private ambientLevel(at: Vec2): number {
    const tx = at.x / TILE_FINE - 0.5;
    const ty = at.y / TILE_FINE - 0.5;
    const x0 = Math.floor(tx);
    const y0 = Math.floor(ty);
    const ax = tx - x0;
    const ay = ty - y0;
    return (
      this.ambientAt(x0, y0) * (1 - ax) * (1 - ay) +
      this.ambientAt(x0 + 1, y0) * ax * (1 - ay) +
      this.ambientAt(x0, y0 + 1) * (1 - ax) * ay +
      this.ambientAt(x0 + 1, y0 + 1) * ax * ay
    );
  }

  private ambientAt(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return 0;
    return this.ambient[ty * this.width + tx];
  }

  // Of the rooms in the eight tiles round a tile, the brightest.
  private brightestBeside(tx: number, ty: number): number {
    let best = -1;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = tx + dx;
        const y = ty + dy;
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
        const r = this.member[y * this.width + x];
        if (r >= 0 && (best < 0 || this.rooms[r].ambient > this.rooms[best].ambient)) best = r;
      }
    }
    return best;
  }
}

// A tile belongs to the room round it when it is open, or is something
// standing in the room (a gallery, a shelf of books) rather than its walls.
function inRoom(map: Tilemap, tx: number, ty: number): boolean {
  const t = map.at(tx, ty);
  return !map.isSolid(tx, ty) || t === Tile.Timber || t === Tile.Bookcase;
}

// What one source adds at a fine pixel.
function reach(s: LightSource, at: Vec2): number {
  const d = Math.hypot(at.x / TILE_FINE - s.x, at.y / TILE_FINE - s.y);
  return d < s.radius ? s.strength * (1 - d / s.radius) ** 1.5 : 0;
}

// A colour under a light: in bright light a dither of its lit neighbour,
// otherwise k steps down its ramp with the fraction dithered (L5).
function shade(color: number, light: number, at: Vec2): number {
  const b = bayer(at.x, at.y);
  if (light > LIFT) return b < Math.min(0.5, (light - LIFT) / 0.2) ? hi(color) : color;
  const k = Math.max(0, Math.min(MAX_STEPS, (NEUTRAL - light) / STEP));
  let n = Math.floor(k);
  if (b < k - n) n += 1;
  let c = color;
  for (let i = 0; i < n; i++) c = lo(c);
  return c;
}

// A speck of warm light on a back wall, or null.
function speck(warm: readonly LightSource[], at: Vec2): number | null {
  for (const s of warm) {
    const d = Math.hypot(at.x / TILE_FINE - s.x, at.y / TILE_FINE - s.y) / s.radius;
    if (d >= 0.6) continue;
    if (bayer(at.x * 7 + 3, at.y * 5 + 1) >= 0.1 * (1 - d / 0.6) ** 2) continue;
    if (tileHash(at.x >> 1, at.y >> 1, 950) >= 0.5) continue;
    return d < 0.25 ? DB32.goldenFizz : DB32.tahitiGold;
  }
  return null;
}

function hi(c: number): number {
  return LIT_RAMP.get(c)?.[0] ?? c;
}

function lo(c: number): number {
  return LIT_RAMP.get(c)?.[1] ?? c;
}

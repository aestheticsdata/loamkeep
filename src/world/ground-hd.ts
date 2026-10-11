import { DB32, TILE_SIZE } from '@constants';
import { ChunkLayer, type LogicalRect } from '@hd/chunk-layer';
import type { FineCanvas } from '@hd/fine-canvas';
import { paintBackdropHd } from '@world/backdrops-hd';
import type { Level } from '@world/level';
import type { LightField } from '@world/lighting';
import { roomBackdropAt } from '@world/room-backdrops-hd';
import { Tile, type Tilemap, tileFaces } from '@world/tilemap';
import { drawTileHd, TILE_FINE } from '@world/tiles-hd';
import { paintWaterBodyHd, type WaterState, WaterSurfaceHd } from '@world/water-hd';
import { Container } from 'pixi.js';

// A level's ground in HD: its backdrops, its tiles and the still body of its
// water, baked in chunks around the camera, and over them the surface of
// every pool. The classic counterpart is the backdrop, tilemap and water
// Graphics game.ts builds; art-mode shows one or the other. A lit level
// (`light`) has a back wall per room instead of its backdrop regions, and
// every chunk and pool is lit as it is baked.
export class GroundHd {
  readonly container = new Container();
  private readonly chunks: ChunkLayer;
  private readonly surface: WaterSurfaceHd;

  constructor(level: Level, light: LightField | null = null) {
    const map = level.tilemap;
    const regions = level.spec.backdropRegions ?? [
      { col: 0, row: level.spec.rockBgStartRow, cols: map.width, rows: map.height - level.spec.rockBgStartRow },
    ];
    const backdrops = regions.map((r) => ({
      left: r.col * TILE_SIZE,
      width: r.cols * TILE_SIZE,
      top: r.row * TILE_SIZE,
      bottom: (r.row + r.rows) * TILE_SIZE,
    }));

    // The classic order: backdrops, then the tiles row by row — the row just
    // below the chunk too, whose tufts stand up into it, and the row above,
    // whose roots hang down into it — then the water.
    const paint = (canvas: FineCanvas) => {
      if (light) paintRoomWalls(canvas, { map, light });
      else for (const area of backdrops) paintBackdropHd(canvas, level.spec.backdrop, area);
      const walls = light ? canvas.pixels.slice() : null;
      const tx0 = Math.max(0, Math.floor(canvas.x0 / TILE_FINE));
      const tx1 = Math.min(map.width, Math.ceil((canvas.x0 + canvas.w) / TILE_FINE));
      const ty0 = Math.max(0, Math.floor(canvas.y0 / TILE_FINE) - 1);
      const ty1 = Math.min(map.height, Math.ceil((canvas.y0 + canvas.h) / TILE_FINE) + 1);
      for (let ty = ty0; ty < ty1; ty++) {
        for (let tx = tx0; tx < tx1; tx++) {
          const tile = map.at(tx, ty);
          if (tile !== Tile.Empty && tile !== Tile.Water) {
            drawTileHd(canvas, tile, { tx, ty, faces: tileFaces(map, tx, ty) });
          }
        }
      }
      paintWaterBodyHd(canvas, map);
      if (light && walls) light.lightChunk(canvas, stillWall(canvas, { walls, map }));
    };

    this.chunks = new ChunkLayer({ width: map.width * TILE_SIZE, height: map.height * TILE_SIZE, paint });
    this.surface = new WaterSurfaceHd(map, light ? (canvas) => light.lightChunk(canvas) : undefined);
    this.container.addChild(this.chunks.container, this.surface.container);
  }

  // Bakes what the camera sees and moves the pool the player is in.
  update(view: LogicalRect, water: WaterState): void {
    this.chunks.show(view);
    this.surface.update(water.activeId, water.motion);
  }

  destroy(): void {
    this.chunks.destroy();
    this.surface.destroy();
    this.container.destroy();
  }
}

// What a lit chunk is painted from: the map, and its light.
interface LitGround {
  map: Tilemap;
  light: LightField;
}

// The back wall of every open tile in the chunk, from the room it looks
// into; an open tile that looks into no room is black.
function paintRoomWalls(canvas: FineCanvas, ground: LitGround): void {
  const tx0 = Math.max(0, Math.floor(canvas.x0 / TILE_FINE));
  const tx1 = Math.min(ground.map.width, Math.ceil((canvas.x0 + canvas.w) / TILE_FINE));
  const ty0 = Math.max(0, Math.floor(canvas.y0 / TILE_FINE));
  const ty1 = Math.min(ground.map.height, Math.ceil((canvas.y0 + canvas.h) / TILE_FINE));
  for (let ty = ty0; ty < ty1; ty++) {
    for (let tx = tx0; tx < tx1; tx++) {
      if (ground.map.isSolid(tx, ty)) continue;
      const room = ground.light.wallAt(tx, ty);
      for (let y = ty * TILE_FINE; y < (ty + 1) * TILE_FINE; y++) {
        for (let x = tx * TILE_FINE; x < (tx + 1) * TILE_FINE; x++) {
          canvas.set(x, y, room ? roomBackdropAt(x, y, room) : DB32.black);
        }
      }
    }
  }
}

// The back wall as painted, before the tiles went down over it.
interface WallSnapshot {
  walls: Int32Array;
  map: Tilemap;
}

// Which pixels are still the back wall after the tiles and water went down
// over it: painted then, unchanged since, and not inside a solid tile (whose
// boards may be the very colour of the wall behind them).
function stillWall(canvas: FineCanvas, before: WallSnapshot): Uint8Array {
  const out = new Uint8Array(before.walls.length);
  for (let j = 0; j < canvas.h; j++) {
    const ty = Math.floor((canvas.y0 + j) / TILE_FINE);
    for (let i = 0; i < canvas.w; i++) {
      const k = j * canvas.w + i;
      if (before.walls[k] < 0 || before.walls[k] !== canvas.pixels[k]) continue;
      if (!before.map.isSolid(Math.floor((canvas.x0 + i) / TILE_FINE), ty)) out[k] = 1;
    }
  }
  return out;
}

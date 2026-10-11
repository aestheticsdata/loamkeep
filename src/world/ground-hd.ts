import { TILE_SIZE } from '@constants';
import { ChunkLayer, type LogicalRect } from '@hd/chunk-layer';
import type { FineCanvas } from '@hd/fine-canvas';
import { paintBackdropHd } from '@world/backdrops-hd';
import type { Level } from '@world/level';
import { Tile } from '@world/tilemap';
import { drawTileHd, TILE_FINE } from '@world/tiles-hd';
import { paintWaterBodyHd, type WaterState, WaterSurfaceHd } from '@world/water-hd';
import { Container } from 'pixi.js';

// A level's ground in HD: its backdrops, its tiles and the still body of its
// water, baked in chunks around the camera, and over them the surface of
// every pool. The classic counterpart is the backdrop, tilemap and water
// Graphics game.ts builds; art-mode shows one or the other.
export class GroundHd {
  readonly container = new Container();
  private readonly chunks: ChunkLayer;
  private readonly surface: WaterSurfaceHd;

  constructor(level: Level) {
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
    // below the chunk too, whose tufts stand up into it — then the water.
    const paint = (canvas: FineCanvas) => {
      for (const area of backdrops) paintBackdropHd(canvas, level.spec.backdrop, area);
      const tx0 = Math.max(0, Math.floor(canvas.x0 / TILE_FINE));
      const tx1 = Math.min(map.width, Math.ceil((canvas.x0 + canvas.w) / TILE_FINE));
      const ty0 = Math.max(0, Math.floor(canvas.y0 / TILE_FINE));
      const ty1 = Math.min(map.height, Math.ceil((canvas.y0 + canvas.h) / TILE_FINE) + 1);
      for (let ty = ty0; ty < ty1; ty++) {
        for (let tx = tx0; tx < tx1; tx++) {
          const tile = map.at(tx, ty);
          if (tile !== Tile.Empty && tile !== Tile.Water) drawTileHd(canvas, tile, { tx, ty });
        }
      }
      paintWaterBodyHd(canvas, map);
    };

    this.chunks = new ChunkLayer({ width: map.width * TILE_SIZE, height: map.height * TILE_SIZE, paint });
    this.surface = new WaterSurfaceHd(map);
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

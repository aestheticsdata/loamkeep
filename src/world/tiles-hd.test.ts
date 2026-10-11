import { TILE_SIZE } from '@constants';
import { record } from '@hd/classic-recorder';
import { FineCanvas } from '@hd/fine-canvas';
import { footprint } from '@hd/footprint';
import { drawTile, Tile } from '@world/tilemap';
import { drawTileHd, TILE_FINE } from '@world/tiles-hd';
import { describe, expect, it } from 'vitest';

// Every kind but Empty and Water (the water is its own layer).
const KINDS = Object.entries(Tile).filter(([, t]) => t !== Tile.Empty && t !== Tile.Water);

// Enough tiles that every hashed variant shows up: tufts and flowers on
// grass, pebbles in dirt, rivets, cracks in both directions, spines.
const SPOTS = Array.from({ length: 40 }, (_, i) => ({ tx: 3 + i * 7, ty: 2 + ((i * 5) % 11) }));

describe('every tile in HD keeps its classic footprint', () => {
  for (const [name, tile] of KINDS) {
    it(name, () => {
      for (const spot of SPOTS) {
        const classic = record((g) => drawTile(g, tile, spot.tx * TILE_SIZE, spot.ty * TILE_SIZE, spot.tx, spot.ty));
        // Classic Heath and AutumnTurf lay their dither row at i + (ty & 1),
        // which on odd rows puts one pixel in the next tile's first column,
        // where that tile's own fill covers it. HD keeps to its own tile.
        const right = (spot.tx + 1) * TILE_SIZE;
        classic.rects.splice(0, classic.rects.length, ...classic.rects.filter((r) => r.x < right));
        // A margin of one tile above for whatever stands up off the top
        // edge, and one below for what hangs off the bottom (roots).
        const hd = new FineCanvas({
          x: spot.tx * TILE_FINE,
          y: (spot.ty - 1) * TILE_FINE,
          w: TILE_FINE,
          h: 3 * TILE_FINE,
        });
        drawTileHd(hd, tile, spot);
        expect(footprint(classic, hd), `${name} at ${spot.tx},${spot.ty}`).toBe(0);
      }
    });
  }
});

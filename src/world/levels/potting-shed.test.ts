import { TILE_SIZE } from '@constants';
import { record } from '@hd/classic-recorder';
import { propHd } from '@hd/critter-hd';
import { footprintDiff } from '@hd/footprint';
import { LIT_RAMP } from '@hd/palette';
import { loadLevel } from '@world/levels';
import { type Cell, Moves, reach } from '@world/levels/reach';
import { ownedAreas } from '@world/room-reveal';
import { describe, expect, it } from 'vitest';

const level = loadLevel('potting-shed');
const map = level.tilemap;
const rooms = level.spec.lighting?.rooms ?? [];

describe('the potting shed', () => {
  it('can be walked from the shed door to every room, and back', () => {
    const spawn = level.spawn('from-garden');
    const start: Cell = [Math.floor(spawn.x / TILE_SIZE), Math.floor(spawn.y / TILE_SIZE)];
    const moves = new Moves(map);
    const { there, home, key } = reach({ map, moves, start });
    const cells: Cell[] = [];
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (moves.stands(x, y)) cells.push([x, y]);

    const inRooms = cells.filter(([x, y]) =>
      rooms.some((r) => x >= r.col && x < r.col + r.cols && y >= r.row && y < r.row + r.rows),
    );
    const lost = inRooms.filter(([x, y]) => !there.has(key(x, y)) || !home.has(key(x, y)));
    expect(inRooms.length).toBeGreaterThan(700);
    expect(lost.map(([x, y]) => `${x},${y}`)).toEqual([]);
  });

  it('veils each tile under one room at most, and every tile of every room', () => {
    const owner = new Map<string, string>();
    const areas = ownedAreas(rooms);
    rooms.forEach((room, i) => {
      for (const a of areas[i]) {
        for (let y = a.row; y < a.row + a.rows; y++) {
          for (let x = a.col; x < a.col + a.cols; x++) {
            expect(owner.get(`${x},${y}`), `${room.id} at ${x},${y}`).toBeUndefined();
            owner.set(`${x},${y}`, room.id);
          }
        }
      }
    });
    for (const r of rooms) {
      for (let y = r.row; y < r.row + r.rows; y++) {
        for (let x = r.col; x < r.col + r.cols; x++) expect(owner.has(`${x},${y}`)).toBe(true);
      }
    }
    // The mole's chamber opens off the west tunnel and, listed first, owns
    // the stretch of tunnel under it; the tunnel goes round it.
    expect(areas[rooms.findIndex((r) => r.id === 'mole')]).toEqual([{ col: 40, row: 60, cols: 15, rows: 6 }]);
    expect(areas[rooms.findIndex((r) => r.id === 'tunnel-west')]).toEqual([
      { col: 16, row: 63, cols: 24, rows: 3 },
      { col: 55, row: 63, cols: 4, rows: 3 },
    ]);
  });

  it('starts the player on the shed floor', () => {
    const spawn = level.spawn('from-garden');
    const shed = rooms.find((r) => r.holdsCamera);
    expect(shed?.id).toBe('shed');
    expect(map.isSolid(Math.floor(spawn.x / TILE_SIZE), Math.floor(spawn.y / TILE_SIZE) + 1)).toBe(true);
  });

  for (const [i, decoration] of level.spec.decorations.entries()) {
    it(`keeps prop ${i} to its classic footprint in HD`, () => {
      const recorded = record(decoration.draw);
      expect(footprintDiff(recorded, propHd(recorded, LIT_RAMP).body)).toEqual([]);
    });
  }
});

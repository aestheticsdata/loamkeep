import { TILE_SIZE } from '@constants';
import { record } from '@hd/classic-recorder';
import { propHd } from '@hd/critter-hd';
import { footprintDiff } from '@hd/footprint';
import { LIT_RAMP } from '@hd/palette';
import { loadLevel } from '@world/levels';
import { ownedAreas } from '@world/room-reveal';
import { Tile, type Tilemap } from '@world/tilemap';
import { describe, expect, it } from 'vitest';

const level = loadLevel('potting-shed');
const map = level.tilemap;
const rooms = level.spec.lighting?.rooms ?? [];

// A tile-level port of the movement rules, kept on the cautious side of the
// player's real ones (design_handoff_potting_shed/prototype/shed-map.js,
// SHED.reach): walk a column and fall; jump up one or two rows with up to
// three columns of drift and the headroom for it; jump across up to three
// columns; climb ladders, and step off the top of one onto the ledge beside
// it; swim.
class Moves {
  constructor(private readonly map: Tilemap) {}

  free(x: number, y: number): boolean {
    return !this.map.isSolid(x, y);
  }

  ladder(x: number, y: number): boolean {
    return this.map.at(x, y) === Tile.Ladder;
  }

  water(x: number, y: number): boolean {
    return this.map.at(x, y) === Tile.Water;
  }

  // A cell the figure can be in without falling.
  stands(x: number, y: number): boolean {
    if (!this.free(x, y)) return false;
    return (
      !this.free(x, y + 1) || this.ladder(x, y) || this.ladder(x, y + 1) || this.water(x, y) || this.water(x, y + 1)
    );
  }

  // Where a figure let go of at (x, y) comes to rest, if anywhere.
  fall(x: number, y: number): [number, number] | null {
    let fy = y;
    while (fy < this.map.height && this.free(x, fy) && !this.stands(x, fy)) fy++;
    return this.stands(x, fy) ? [x, fy] : null;
  }

  from(x: number, y: number): [number, number][] {
    const out: [number, number][] = [];
    const add = (p: [number, number] | null) => {
      if (p) out.push(p);
    };
    for (const d of [-1, 1]) if (this.free(x + d, y)) add(this.fall(x + d, y));
    if (this.ladder(x, y) || this.water(x, y)) {
      if (this.free(x, y - 1)) out.push([x, y - 1]);
      if (this.free(x, y + 1)) out.push(this.fall(x, y + 1) ?? [x, y + 1]);
    }
    if (this.ladder(x, y + 1)) out.push([x, y + 1]);
    if (this.ladder(x, y) && this.free(x, y - 1) && !this.ladder(x, y - 1)) {
      for (const d of [-1, 1]) {
        for (let k = 1; k <= 2; k++) if (this.free(x, y - k) && this.stands(x + d, y - k)) out.push([x + d, y - k]);
      }
    }
    if (!this.free(x, y + 1) || this.ladder(x, y + 1)) {
      for (let up = 1; up <= 2; up++) {
        let headroom = true;
        for (let k = 1; k <= up; k++) if (!this.free(x, y - k)) headroom = false;
        if (!headroom) break;
        for (const d of [-1, 1]) {
          for (let dx = 1; dx <= 3; dx++) {
            let clear = true;
            for (let s = 1; s <= dx; s++) if (!this.free(x + d * s, y - up)) clear = false;
            if (!clear) break;
            if (this.stands(x + d * dx, y - up)) out.push([x + d * dx, y - up]);
          }
        }
      }
      if (this.free(x, y - 1)) {
        for (const d of [-1, 1]) {
          for (let dx = 1; dx <= 3; dx++) {
            if (!this.free(x + d * dx, y - 1) || !this.free(x + d * dx, y)) break;
            add(this.fall(x + d * dx, y));
          }
        }
      }
    }
    return out;
  }
}

describe('the potting shed', () => {
  it('can be walked from the shed door to every room, and back', () => {
    const moves = new Moves(map);
    const key = (x: number, y: number) => y * map.width + x;
    const spawn = level.spawn('from-garden');
    const start: [number, number] = [Math.floor(spawn.x / TILE_SIZE), Math.floor(spawn.y / TILE_SIZE)];

    const cells: [number, number][] = [];
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (moves.stands(x, y)) cells.push([x, y]);
    const back = new Map<number, [number, number][]>();
    for (const [x, y] of cells) {
      for (const [nx, ny] of moves.from(x, y)) {
        const k = key(nx, ny);
        back.set(k, [...(back.get(k) ?? []), [x, y]]);
      }
    }
    const search = (next: (x: number, y: number) => [number, number][]) => {
      const seen = new Set([key(...start)]);
      const queue = [start];
      while (queue.length > 0) {
        const [x, y] = queue.shift() as [number, number];
        for (const p of next(x, y)) {
          if (seen.has(key(...p))) continue;
          seen.add(key(...p));
          queue.push(p);
        }
      }
      return seen;
    };
    const there = search((x, y) => moves.from(x, y));
    const home = search((x, y) => back.get(key(x, y)) ?? []);

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

import { TILE_SIZE } from '@constants';
import { loadLevel } from '@world/levels';
import { type Cell, Moves, reach } from '@world/levels/reach';
import { Tile } from '@world/tilemap';
import { describe, expect, it } from 'vitest';

const level = loadLevel('meadow');
const map = level.tilemap;

// The cell whose tile a thing at (x, y) stands on is the row below its feet.
const footOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE) - 1];

// What moves, and so cannot be read off the tiles:
//   - the mill wheel lifts a swimmer from the stream at its foot (cols
//     72-73) to its top paddle, a short jump from the mill roof (row 12);
//   - the hay bales, pushed up against the loft's posts (from the west to
//     col 109, from the east to col 117), are the step up onto the loft
//     (row 16) that the field's grass is too far below; and the east one,
//     pushed into the brambles (cols 121-123) as far as is safe, is the
//     stepping stone over them, which no jump from the grass clears;
//   - in the barrel cellar, the barrel on its floor pushed against the
//     first block (cols 124-126) is the step onto it, and the barrel in the
//     pit beyond it, pushed against either wall, is the way out of the pit.
const LIFTS: readonly (readonly [Cell, Cell])[] = [
  [
    [120, 19],
    [124, 19],
  ],
  [
    [123, 66],
    [124, 62],
  ],
  [
    [127, 66],
    [126, 62],
  ],
  [
    [133, 66],
    [134, 62],
  ],
  [
    [72, 20],
    [76, 11],
  ],
  [
    [73, 20],
    [76, 11],
  ],
  [
    [108, 19],
    [110, 15],
  ],
  [
    [118, 19],
    [116, 15],
  ],
];

describe('the meadow', () => {
  const moves = new Moves(map, { rise: 3, across: 4, bounce: 7 });
  const spawn = level.spawn(level.spec.defaultSpawnId);
  const start: Cell = [Math.floor(spawn.x / TILE_SIZE), Math.floor(spawn.y / TILE_SIZE)];
  const { there, home, key } = reach({ map, moves, start, extra: LIFTS });
  const both = ([x, y]: Cell) => there.has(key(x, y)) && home.has(key(x, y));

  it('reaches every landmark from the starting cairn, and back', () => {
    const lost = level.spec.landmarks.filter((l) => !both(footOf(l.x, l.y))).map((l) => l.id);
    expect(lost).toEqual([]);
  });

  it('reaches every spawn from the starting cairn, and back', () => {
    const lost = level.spec.spawns
      .filter((s) => !both([Math.floor(s.x / TILE_SIZE), Math.floor(s.y / TILE_SIZE)]))
      .map((s) => s.id);
    expect(lost).toEqual([]);
  });

  // Water stands only in a basin. Under every water tile is rock or more
  // water; beside one, air only where it is falling — a column no more than
  // a waterfall wide, with water under it, running on down into the water it
  // feeds.
  it('holds every pool in a basin, and lets only waterfalls touch the air', () => {
    const water = (x: number, y: number) => map.at(x, y) === Tile.Water;
    const open = (x: number, y: number) => !map.isSolid(x, y) && !water(x, y);
    const runAt = (x: number, y: number) => {
      let from = x;
      let to = x;
      while (water(from - 1, y)) from--;
      while (water(to + 1, y)) to++;
      return to - from + 1;
    };
    const leaks: string[] = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (!water(x, y)) continue;
        if (open(x, y + 1)) leaks.push(`${x},${y} over air`);
        const falling = water(x, y + 1) && runAt(x, y) <= 3;
        if ((open(x - 1, y) || open(x + 1, y)) && !falling) leaks.push(`${x},${y} against air`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('leaves no way in that has no way back out', () => {
    const traps = [...there].filter((k) => !home.has(k)).map((k) => `${k % map.width},${Math.floor(k / map.width)}`);
    expect(traps).toEqual([]);
  });
});

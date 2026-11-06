import { TILE_SIZE } from '@constants';
import type { TileRect } from '@world/level';
import { loadLevel } from '@world/levels';
import { GLOW_GROTTO_GATES, GLOW_GROTTO_SWITCHES } from '@world/levels/glow-grotto';
import { GLOW_GROTTO_ROWS } from '@world/levels/glow-grotto-rows';
import { type Cell, Moves, type ReachRules, reach } from '@world/levels/reach';
import { Tile, Tilemap } from '@world/tilemap';
import { describe, expect, it } from 'vitest';

const level = loadLevel('glow-grotto');
const map = level.tilemap;

// The grotto was built to a puffball's eight rows (its old check, a port of
// the player's physics, said so); the rest as in the meadow.
const RULES: ReachRules = { rise: 3, across: 4, bounce: 8 };

// The cell whose tile a thing at (x, y) stands on is the row below its feet.
const footOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE) - 1];
const cellOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)];

// What moves, and so cannot be read off the tiles: the lift (cols 186-188)
// carries whoever steps on beside its shaft at the upper gallery (row 62),
// the middle one (row 80) or the lower one (row 100) to either of the
// others. The minecarts only ride along floors already walked.
const LIFT_STOPS: readonly Cell[] = [61, 79, 99].flatMap((y): Cell[] => [
  [185, y],
  [189, y],
]);
const LIFTS: readonly (readonly [Cell, Cell])[] = LIFT_STOPS.flatMap((a) =>
  LIFT_STOPS.filter((b) => b !== a).map((b) => [a, b] as const),
);

const start = cellOf(level.spawn(level.spec.defaultSpawnId).x, level.spawn(level.spec.defaultSpawnId).y);

// Whether a cell can touch a cluster of tiles: beside it or on top of it, or
// under it with only air between, close enough for a jump to bump it.
function touches([x, y]: Cell, area: TileRect, moves: Moves): boolean {
  const right = area.col + area.cols;
  const bottom = area.row + area.rows;
  if (x >= area.col - 1 && x <= right && y >= area.row - 1 && y < bottom) return true;
  if (x < area.col || x >= right || y < bottom || y > bottom + 2) return false;
  for (let k = bottom; k < y; k++) if (!moves.free(x, k)) return false;
  return true;
}

describe('the glow grotto', () => {
  // The gates as they are once opened: their tiles are no wall (the gate
  // entity is, until it dissolves).
  const moves = new Moves(map, RULES);
  const { there, home, key } = reach({ map, moves, start, extra: LIFTS });
  const both = ([x, y]: Cell) => there.has(key(x, y)) && home.has(key(x, y));

  it('reaches every landmark from the crack, and back', () => {
    const lost = level.spec.landmarks.filter((l) => !both(footOf(l.x, l.y))).map((l) => l.id);
    expect(lost).toEqual([]);
  });

  it('reaches every spawn from the crack, and back', () => {
    const lost = level.spec.spawns.filter((s) => !both(cellOf(s.x, s.y))).map((s) => s.id);
    expect(lost).toEqual([]);
  });

  it('leaves no way in that has no way back out', () => {
    const traps = [...there].filter((k) => !home.has(k)).map((k) => `${k % map.width},${Math.floor(k / map.width)}`);
    expect(traps).toEqual([]);
  });

  // Before either gate is open, every switch is in reach: the gates are
  // never what stands between the player and the crystals that open them.
  it('reaches every switch crystal with both gates shut', () => {
    const shut = Tilemap.fromAscii(GLOW_GROTTO_ROWS.map((r) => r.replaceAll('Z', 'R')));
    const shutMoves = new Moves(shut, RULES);
    const closed = reach({ map: shut, moves: shutMoves, start, extra: LIFTS });
    const cells = [...closed.there].map((k): Cell => [k % shut.width, Math.floor(k / shut.width)]);
    const lost = GLOW_GROTTO_SWITCHES.filter((s) => !cells.some((c) => touches(c, s.area, shutMoves))).map((s) => s.id);
    expect(lost).toEqual([]);
  });

  it('puts every switch on crystal and every gate on its gate tiles', () => {
    const tilesIn = (r: TileRect) =>
      Array.from({ length: r.rows }, (_, y) => Array.from({ length: r.cols }, (_, x) => map.at(r.col + x, r.row + y)));
    for (const s of GLOW_GROTTO_SWITCHES)
      expect(
        tilesIn(s.area)
          .flat()
          .every((t) => t === Tile.Crystal),
      ).toBe(true);
    for (const g of GLOW_GROTTO_GATES)
      expect(
        tilesIn(g.area)
          .flat()
          .every((t) => t === Tile.CrystalGate),
      ).toBe(true);
    const gateTiles = map.tiles.filter((t) => t === Tile.CrystalGate).length;
    expect(gateTiles).toBe(GLOW_GROTTO_GATES.reduce((n, g) => n + g.area.cols * g.area.rows, 0));
  });

  // Water stands only in a basin, as in the meadow: under every water tile is
  // rock or more water; beside one, air only where it is falling.
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
});

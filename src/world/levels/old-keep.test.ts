import { TILE_SIZE } from '@constants';
import { loadLevel } from '@world/levels';
import { OLD_KEEP_ROWS } from '@world/levels/old-keep-rows';
import { type Cell, Moves, type ReachRules, reach } from '@world/levels/reach';
import { PORTCULLIS_CHAR, Tile, Tilemap } from '@world/tilemap';
import { describe, expect, it } from 'vitest';

const level = loadLevel('old-keep');
const map = level.tilemap;
// The handoff's own rules, which it checked these rows with (and the hall
// has always needed): a jump crosses 3 empty columns rising one or two rows,
// 2 rising three (see ReachRules).
const RULES: ReachRules = { rise: 3, across: 4, bounce: 8, drift: 4, topDrift: 3 };

// The cell whose tile a thing at (x, y) stands on is the row below its feet.
const footOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE) - 1];
const cellOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)];
const spawn = level.spawn(level.spec.defaultSpawnId);
const start = cellOf(spawn.x, spawn.y);

// What moves, and so cannot be read off the tiles: the chapel's chandeliers
// carry the player from the east tribune (row 24, cols 39-50) by way of B and
// then A to the west tribune (row 20, cols 4-14) and the Reliquary — the one
// place the handoff says only they reach (swinging-chandelier.ts; the swing
// itself is walked in swinging-chandelier.test.ts).
const CHANDELIERS: readonly (readonly [Cell, Cell])[] = [
  [
    [41, 23],
    [6, 19],
  ],
];

// The levers (lever, portcullis): each pulled where it stands, on the tile at
// (col, row) — as old-keep.ts places them.
const LEVERS: readonly (readonly [Cell, string])[] = [
  [[170, 30], 'treasury'],
  ...[114, 104, 94, 84, 74].map((col): [Cell, string] => [[col + 1, 69], `cell${col}`]),
  ...[134, 144].map((col): [Cell, string] => [[col - 1, 69], `cell${col}`]),
  [[175, 77], 'sluice'],
];

// Each portcullis's top tile.
const GATES: Record<string, Cell> = {
  treasury: [165, 34],
  ...Object.fromEntries([74, 84, 94, 104, 114, 134, 144].map((col) => [`cell${col}`, [col, 66] as Cell])),
  sluice: [170, 79],
};

// The rows with the named gates shut: their tiles brick.
function shut(closed: ReadonlySet<string>): Tilemap {
  const rows = OLD_KEEP_ROWS.map((r) => [...r]);
  for (const id of closed) {
    const [col, top] = GATES[id];
    for (let row = top; rows[row][col] === PORTCULLIS_CHAR; row++) rows[row][col] = 'B';
  }
  return Tilemap.fromAscii(rows.map((r) => r.join('')));
}

describe('the old keep', () => {
  // Every gate open — as they all end up (see the last test).
  const moves = new Moves(map, RULES);
  const { there, home, key } = reach({ map, moves, start, extra: CHANDELIERS });
  const both = ([x, y]: Cell) => there.has(key(x, y)) && home.has(key(x, y));

  it('reaches every landmark from the meadow door, and back', () => {
    const lost = level.spec.landmarks.filter((l) => !both(footOf(l.x, l.y))).map((l) => l.id);
    expect(lost).toEqual([]);
  });

  it('reaches every spawn from the meadow door, and back', () => {
    const lost = level.spec.spawns.filter((s) => !both(cellOf(s.x, s.y))).map((s) => s.id);
    expect(lost).toEqual([]);
  });

  it('leaves no way in that has no way back out', () => {
    const traps = [...there].filter((k) => !home.has(k)).map((k) => `${k % map.width},${Math.floor(k / map.width)}`);
    expect(traps).toEqual([]);
  });

  // With every gate down, pull every lever that can be reached, open what it
  // opens, and go again: every gate comes up in the end — the cells one
  // after another, out from the ladder.
  it('opens every portcullis, one lever leading to the next', () => {
    const closed = new Set(Object.keys(GATES));
    for (let changed = true; changed; ) {
      changed = false;
      const gated = shut(closed);
      const r = reach({ map: gated, moves: new Moves(gated, RULES), start, extra: CHANDELIERS });
      for (const [[x, y], gate] of LEVERS) {
        if (closed.has(gate) && r.there.has(r.key(x, y))) {
          closed.delete(gate);
          changed = true;
        }
      }
    }
    expect([...closed]).toEqual([]);
  });

  it('holds every pool in a basin, and lets only waterfalls touch the air', () => {
    const water = (x: number, y: number) => map.at(x, y) === Tile.Water;
    const open = (x: number, y: number) => !map.isSolid(x, y) && !water(x, y);
    const leaks: string[] = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (!water(x, y)) continue;
        if (open(x, y + 1)) leaks.push(`${x},${y} over air`);
        if ((open(x - 1, y) || open(x + 1, y)) && !water(x, y + 1)) leaks.push(`${x},${y} against air`);
      }
    }
    expect(leaks).toEqual([]);
  });
});

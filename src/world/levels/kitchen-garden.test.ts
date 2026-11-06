import { TILE_SIZE } from '@constants';
import { loadLevel } from '@world/levels';
import { KITCHEN_GARDEN_ROWS } from '@world/levels/kitchen-garden-rows';
import { type Cell, Moves, type ReachRules, reach } from '@world/levels/reach';
import { Tile, Tilemap } from '@world/tilemap';
import { describe, expect, it } from 'vitest';

const level = loadLevel('kitchen-garden');
// The handoff's rules (3 rows up, 3-4 across, a puffball's 8), counted the
// way the keep's are: the empty columns a jump crosses (see ReachRules).
const RULES: ReachRules = { rise: 3, across: 4, bounce: 8, drift: 4, topDrift: 3 };

const footOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE) - 1];
const cellOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)];
const spawn = level.spawn(level.spec.defaultSpawnId);
const start = cellOf(spawn.x, spawn.y);

// What moves, and so cannot be read off the tiles:
//   - the noria lifts a swimmer from the millpond to the pergola walk;
//   - the clotheslines carry the player down from the orangery roof to the
//     windpump's top, and from there to the dovecote's roof;
//   - the gear wheel joins the gear room's two ledges, both ways;
//   - a barrel pushed against the wine cellar's shelf is the step onto it;
//   - an ice block slid to the west end of tier 94 is the step up to the
//     Frozen Swan's ledge.
const MOVERS: readonly (readonly [Cell, Cell])[] = [
  [
    [177, 55],
    [190, 36],
  ],
  [
    [237, 6],
    [228, 10],
  ],
  [
    [219, 10],
    [161, 16],
  ],
  [
    [177, 94],
    [187, 91],
  ],
  [
    [187, 91],
    [177, 94],
  ],
  [
    [223, 66],
    [224, 62],
  ],
  [
    [120, 93],
    [117, 89],
  ],
];

// The switches, by the cell the player stands in to work them: the pump
// handle (the tank), the vent lever in the boiler room, the sluice lever in
// the coal store.
const SWITCH = { tank: 'tank', vents: 'vents', sluice: 'sluice' } as const;
type Switch = (typeof SWITCH)[keyof typeof SWITCH];
const SWITCHES: Record<Switch, Cell> = { tank: [207, 99], vents: [283, 67], sluice: [292, 90] };

// The rows as the switches leave them: the tank full to row 78, the
// orangery's vent blowing, the sluice up — or not.
function rowsWith(on: ReadonlySet<Switch>): string[] {
  return KITCHEN_GARDEN_ROWS.map((row, y) => {
    let r: string = row;
    if (on.has(SWITCH.tank) && y >= 78 && y <= 107) r = `${r.slice(0, 214)}WWWWWWWWW${r.slice(223)}`;
    if (!on.has(SWITCH.vents) && y <= 55) r = r.slice(0, 264) + r.slice(264, 267).replaceAll('^', '.') + r.slice(267);
    if (!on.has(SWITCH.sluice)) r = r.replaceAll('Y', 'B');
    return r;
  });
}

function reachWith(on: ReadonlySet<Switch>) {
  const map = Tilemap.fromAscii(rowsWith(on));
  return { map, ...reach({ map, moves: new Moves(map, RULES), start, extra: MOVERS }) };
}

describe('the kitchen garden', () => {
  const all = new Set(Object.values(SWITCH));
  const { map, there, home, key } = reachWith(all);
  const both = ([x, y]: Cell) => there.has(key(x, y)) && home.has(key(x, y));

  it('stands every switch where it can be worked', () => {
    const moves = new Moves(map, RULES);
    expect(Object.values(SWITCHES).filter(([x, y]) => !moves.stands(x, y))).toEqual([]);
  });

  it('reaches every landmark from the keep door, and back, once every switch is on', () => {
    const lost = level.spec.landmarks.filter((l) => !both(footOf(l.x, l.y))).map((l) => l.id);
    expect(lost).toEqual([]);
  });

  it('reaches every spawn from the keep door, and back', () => {
    const lost = level.spec.spawns.filter((s) => !both(cellOf(s.x, s.y))).map((s) => s.id);
    expect(lost).toEqual([]);
  });

  it('leaves no way in that has no way back out, once every switch is on', () => {
    const traps = [...there].filter((k) => !home.has(k)).map((k) => `${k % map.width},${Math.floor(k / map.width)}`);
    expect(traps).toEqual([]);
  });

  // From the start — the tank low, the vent still, the sluice down — work
  // every switch that can be reached, and go again, until all are on. On
  // the way, any way in with no way back out must lead to a switch not yet
  // worked: the pump house is one until its handle fills the tank.
  it('works every switch in turn, and never strands the player before it', () => {
    const on = new Set<Switch>();
    const stranded: string[] = [];
    for (let changed = true; changed; ) {
      changed = false;
      const r = reachWith(on);
      const waiting = Object.values(SWITCH).filter((s) => !on.has(s));
      const traps = [...r.there].filter((k) => !r.home.has(k));
      // A way in with no way back is fair only with a waiting switch in it.
      const trapped = new Set(traps);
      if (traps.length > 0 && !waiting.some((s) => trapped.has(r.key(...SWITCHES[s])))) {
        stranded.push(`${[...on].join('+') || 'start'}: ${traps.length}`);
      }
      for (const s of waiting) {
        if (r.there.has(r.key(...SWITCHES[s]))) {
          on.add(s);
          changed = true;
        }
      }
    }
    expect({ on: [...on].sort(), stranded }).toEqual({ on: Object.values(SWITCH).sort(), stranded: [] });
  });

  it('holds every pool in a basin, and lets only waterfalls touch the air', () => {
    const water = (x: number, y: number) => level.tilemap.at(x, y) === Tile.Water;
    const open = (x: number, y: number) => !level.tilemap.isSolid(x, y) && !water(x, y);
    const runAt = (x: number, y: number) => {
      let from = x;
      let to = x;
      while (water(from - 1, y)) from--;
      while (water(to + 1, y)) to++;
      return to - from + 1;
    };
    const leaks: string[] = [];
    for (let y = 0; y < level.tilemap.height; y++) {
      for (let x = 0; x < level.tilemap.width; x++) {
        if (!water(x, y)) continue;
        if (open(x, y + 1)) leaks.push(`${x},${y} over air`);
        const falling = water(x, y + 1) && runAt(x, y) <= 3;
        if ((open(x - 1, y) || open(x + 1, y)) && !falling) leaks.push(`${x},${y} against air`);
      }
    }
    expect(leaks).toEqual([]);
  });
});

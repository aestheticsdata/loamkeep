import { isClimbable, isHazard, isUpdraft, Tile, type Tilemap } from '@world/tilemap';

// A tile-level port of the player's movement rules, for the levels' reach
// tests, kept on the cautious side of the real ones: walk a column and fall;
// jump up a row or two with up to three columns of drift and the headroom for
// it, or up to `rise` rows with two; jump across up to `across`
// columns; climb ladders and vines, and step off the top of one onto the
// ledge beside it; swim, and pop out of the water onto a bank a row up; and
// on a puffball, be thrown up to `bounce` rows; and in an updraft, rise up
// the column to hover just over its top, stepping off it to either side on
// the way. A cell is where the figure's feet are: its own tile, one tall.
//
// A hazard (a bramble) is never walked into, fallen through or landed in:
// touching one sends the player back to the last cairn.

export type Cell = readonly [number, number];

export interface ReachRules {
  // Rows a jump can rise with a column of air above the take-off: 2 for the
  // shed, which only ever needed that, 3 in the open.
  rise: number;
  // Columns a jump can carry across a gap, landing no higher.
  across: number;
  // Rows a puffball throws the player, straight up.
  bounce: number;
  // Columns over a jump can land, rising one or two rows (3 unless given),
  // and rising `rise` (2 unless given). The keep's handoff counts the empty
  // columns crossed, one fewer, so its rules give 4 and 3: a 2-row jump is
  // in the air ~0.67 s, ~48 px of drift at walking speed, and the 4th column
  // over needs 37 of them; today's hall has always asked for it.
  drift?: number;
  topDrift?: number;
}

export const SHED_RULES: ReachRules = { rise: 2, across: 3, bounce: 0 };

export class Moves {
  constructor(
    private readonly map: Tilemap,
    private readonly rules: ReachRules = SHED_RULES,
  ) {}

  free(x: number, y: number): boolean {
    return !this.map.isSolid(x, y) && !isHazard(this.map.at(x, y));
  }

  climbable(x: number, y: number): boolean {
    return isClimbable(this.map.at(x, y));
  }

  water(x: number, y: number): boolean {
    return this.map.at(x, y) === Tile.Water;
  }

  updraft(x: number, y: number): boolean {
    return isUpdraft(this.map.at(x, y));
  }

  // A cell the figure can be in without falling.
  stands(x: number, y: number): boolean {
    if (!this.free(x, y)) return false;
    return (
      this.map.isSolid(x, y + 1) ||
      this.climbable(x, y) ||
      this.climbable(x, y + 1) ||
      this.water(x, y) ||
      this.water(x, y + 1) ||
      this.updraft(x, y) ||
      this.updraft(x, y + 1)
    );
  }

  // Where a figure let go of at (x, y) comes to rest, if anywhere.
  fall(x: number, y: number): Cell | null {
    let fy = y;
    while (fy < this.map.height && this.free(x, fy) && !this.stands(x, fy)) fy++;
    return this.stands(x, fy) ? [x, fy] : null;
  }

  from(x: number, y: number): Cell[] {
    const out: Cell[] = [];
    const add = (p: Cell | null) => {
      if (p) out.push(p);
    };
    for (const d of [-1, 1]) if (this.free(x + d, y)) add(this.fall(x + d, y));
    if (this.climbable(x, y) || this.water(x, y)) {
      if (this.free(x, y - 1)) out.push([x, y - 1]);
      if (this.free(x, y + 1)) add(this.fall(x, y + 1));
    }
    if (this.climbable(x, y + 1)) out.push([x, y + 1]);
    // Up an updraft: it lifts, and never lets down. Stepped out of, still
    // rising, it carries the player a column further than a walk off a
    // ledge would before they come down.
    if (this.updraft(x, y)) {
      if (this.free(x, y - 1)) out.push([x, y - 1]);
      for (const d of [-1, 1]) if (this.free(x + d, y) && this.free(x + 2 * d, y)) add(this.fall(x + 2 * d, y));
    }
    // Into the water below: it holds nobody up.
    if (this.water(x, y + 1)) out.push([x, y + 1]);
    if (this.climbable(x, y) && this.free(x, y - 1) && !this.climbable(x, y - 1)) {
      for (const d of [-1, 1]) {
        for (let k = 1; k <= 2; k++) if (this.free(x, y - k) && this.stands(x + d, y - k)) out.push([x + d, y - k]);
      }
    }
    // Out of the water: the exit boost lands the player on a bank a row up.
    if (this.water(x, y + 1) && !this.water(x, y)) {
      for (const d of [-1, 1]) {
        for (let dx = 1; dx <= 2; dx++) {
          if (!this.free(x + d * dx, y - 1)) break;
          if (this.stands(x + d * dx, y - 1)) out.push([x + d * dx, y - 1]);
        }
      }
    }
    if (this.map.isSolid(x, y + 1) || this.climbable(x, y + 1)) {
      this.jumps(x, y, out);
      if (this.map.at(x, y + 1) === Tile.Puffball) this.bounces(x, y, out);
    }
    return out;
  }

  // Up a row or two with drift, `rise` rows straight up then over, and
  // across a gap.
  private jumps(x: number, y: number, out: Cell[]): void {
    for (let up = 1; up <= this.rules.rise; up++) {
      let headroom = true;
      for (let k = 1; k <= up; k++) if (!this.free(x, y - k)) headroom = false;
      if (!headroom) break;
      const drift = up <= 2 ? (this.rules.drift ?? 3) : (this.rules.topDrift ?? 2);
      for (const d of [-1, 1]) {
        for (let dx = 1; dx <= drift; dx++) {
          let clear = true;
          for (let s = 1; s <= dx; s++) if (!this.free(x + d * s, y - up)) clear = false;
          if (!clear) break;
          if (this.stands(x + d * dx, y - up)) out.push([x + d * dx, y - up]);
        }
      }
    }
    // Into an updraft overhead: the box only has to touch it, so one row
    // higher than a jump lands.
    for (let up = 1; up <= this.rules.rise + 1 && this.free(x, y - up); up++) {
      if (this.updraft(x, y - up)) {
        out.push([x, y - up]);
        break;
      }
    }
    if (this.free(x, y - 1)) {
      for (const d of [-1, 1]) {
        // The arc clears a hazard at the feet's level, never a wall. A
        // hazard is a column wider than a hole: the player can stand with
        // most of their body over the edge of a hole, and over none of a
        // bramble.
        let reach = this.rules.across;
        for (let dx = 1; dx <= reach; dx++) {
          if (!this.free(x + d * dx, y - 1) || this.map.isSolid(x + d * dx, y)) break;
          if (!this.free(x + d * dx, y)) {
            reach = Math.min(reach, this.rules.across - 1);
            continue;
          }
          const p = this.fall(x + d * dx, y);
          if (p) out.push(p);
        }
      }
    }
  }

  // Thrown straight up off a puffball: anywhere up the clear column, and a
  // step or two to either side of it, on the way — three over the last two
  // rows, where the arc hangs longest (0.6 s to its top, at walking speed
  // nearer 3 tiles than 2).
  private bounces(x: number, y: number, out: Cell[]): void {
    for (let up = 1; up <= this.rules.bounce; up++) {
      if (!this.free(x, y - up)) break;
      const drift = up >= this.rules.bounce - 1 ? 3 : 2;
      for (const d of [-1, 1]) {
        for (let dx = 1; dx <= drift; dx++) {
          if (!this.free(x + d * dx, y - up)) break;
          if (this.stands(x + d * dx, y - up)) out.push([x + d * dx, y - up]);
        }
      }
    }
  }
}

// Every cell reachable from `start`, and every cell `start` can be reached
// from, by `moves` plus any `extra` links (a lift, a pushed bale: what moves
// and so cannot be read off the tiles).
export interface ReachMap {
  // Cells reachable from the start.
  there: Set<number>;
  // Cells the start is reachable from.
  home: Set<number>;
  key(x: number, y: number): number;
}

export interface ReachSearch {
  map: Tilemap;
  moves: Moves;
  start: Cell;
  extra?: readonly (readonly [Cell, Cell])[];
}

export function reach(search: ReachSearch): ReachMap {
  const { map, moves, start } = search;
  const key = (x: number, y: number) => y * map.width + x;
  const forward = new Map<number, Cell[]>();
  const back = new Map<number, Cell[]>();
  const link = (a: Cell, b: Cell) => {
    forward.set(key(...a), [...(forward.get(key(...a)) ?? []), b]);
    back.set(key(...b), [...(back.get(key(...b)) ?? []), a]);
  };
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (!moves.stands(x, y)) continue;
      for (const p of moves.from(x, y)) link([x, y], p);
    }
  }
  for (const [a, b] of search.extra ?? []) link(a, b);
  const walk = (next: Map<number, Cell[]>) => {
    const seen = new Set([key(...start)]);
    const queue: Cell[] = [start];
    while (queue.length > 0) {
      const [x, y] = queue.shift() as Cell;
      for (const p of next.get(key(x, y)) ?? []) {
        if (seen.has(key(...p))) continue;
        seen.add(key(...p));
        queue.push(p);
      }
    }
    return seen;
  };
  return { there: walk(forward), home: walk(back), key };
}

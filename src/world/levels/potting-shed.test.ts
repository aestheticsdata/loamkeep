import { TILE_SIZE } from '@constants';
import { Cairn } from '@entities/cairn';
import { ART_MODE, setArtMode } from '@hd/art-mode';
import { record } from '@hd/classic-recorder';
import { propHd } from '@hd/critter-hd';
import { footprintDiff } from '@hd/footprint';
import { LIT_RAMP } from '@hd/palette';
import { loadLevel } from '@world/levels';
import { POTTING_SHED_ROWS } from '@world/levels/potting-shed-rows';
import { type Cell, Moves, type ReachRules, reach } from '@world/levels/reach';
import { LightField } from '@world/lighting';
import { ownedAreas } from '@world/room-reveal';
import { Tile, Tilemap } from '@world/tilemap';
import { describe, expect, it } from 'vitest';

// Building the level's entities draws them: in classic, which needs no canvas.
setArtMode(ART_MODE.classic);
const noop = () => {};
const context = {
  transitionTo: noop,
  worldState: { get: () => false, set: noop },
  audio: new Proxy({}, { get: () => noop }),
} as never;

const level = loadLevel('potting-shed');
const rooms = level.spec.lighting?.rooms ?? [];
// The rules the handoffs for levels 05-10 were asked to check against (3
// rows up, 3-4 columns over), counted the way the keep's are: the empty
// columns a jump crosses (see ReachRules). The handoff's own script drifted
// a column less, which no jump needs.
const RULES: ReachRules = { rise: 3, across: 4, bounce: 8, drift: 4, topDrift: 3 };

const footOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE) - 1];
const cellOf = (x: number, y: number): Cell => [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)];
const spawn = level.spawn(level.spec.defaultSpawnId);
const start = cellOf(spawn.x, spawn.y);

// The switches, by the cells the player stands in to work them: the damper
// lever in the laundry (the flue), the valve lever in the pipeworks (its
// vents), the lever on the last drawer cabinet (the vault grate), and the
// three piano keys, all of them, for the curtain.
const SWITCH = { flue: 'flue', vents: 'vents', vault: 'vault', curtain: 'curtain' } as const;
type Switch = (typeof SWITCH)[keyof typeof SWITCH];
const SWITCHES: Record<Switch, readonly Cell[]> = {
  flue: [[150, 64]],
  vents: [[246, 94]],
  vault: [[106, 129]],
  curtain: [
    [214, 45],
    [226, 45],
    [236, 45],
  ],
};

// The rows as the switches leave them: the flue and the vents blowing or
// still, the grate up or down, the curtain drawn aside or not.
function rowsWith(on: ReadonlySet<Switch>): string[] {
  return POTTING_SHED_ROWS.map((row, y) => {
    let r: string = row;
    const still = (from: number, to: number) => r.slice(0, from) + r.slice(from, to).replaceAll('^', '.') + r.slice(to);
    if (!on.has(SWITCH.flue) && y <= 80) r = still(150, 166);
    if (!on.has(SWITCH.vents) && y >= 84) r = still(120, 300);
    if (!on.has(SWITCH.vault)) r = r.replaceAll('Y', 'K');
    if (!on.has(SWITCH.curtain)) r = r.replaceAll('Z', 'j');
    return r;
  });
}

function reachWith(on: ReadonlySet<Switch>) {
  const map = Tilemap.fromAscii(rowsWith(on));
  return { map, ...reach({ map, moves: new Moves(map, RULES), start }) };
}

describe('the potting shed', () => {
  const all = new Set(Object.values(SWITCH));
  const { map, there, home, key } = reachWith(all);
  const both = ([x, y]: Cell) => there.has(key(x, y)) && home.has(key(x, y));

  it('stands every switch where it can be worked', () => {
    const moves = new Moves(map, RULES);
    const cells = Object.values(SWITCHES).flat();
    expect(cells.filter(([x, y]) => !moves.stands(x, y))).toEqual([]);
  });

  it('can be walked from the shed door to every place it can be stood in, and back, once every switch is on', () => {
    const moves = new Moves(map, RULES);
    const lost: string[] = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) if (moves.stands(x, y) && !both([x, y])) lost.push(`${x},${y}`);
    }
    expect(lost).toEqual([]);
  });

  it('can be walked from the shed door to every room, and back, once every switch is on', () => {
    const moves = new Moves(map, RULES);
    const lost: string[] = [];
    for (const r of rooms) {
      for (let y = r.row; y < r.row + r.rows; y++) {
        for (let x = r.col; x < r.col + r.cols; x++) if (moves.stands(x, y) && !both([x, y])) lost.push(`${x},${y}`);
      }
    }
    expect(lost).toEqual([]);
  });

  it('reaches every landmark from the shed door, and back, once every switch is on', () => {
    const lost = level.spec.landmarks.filter((l) => !both(footOf(l.x, l.y))).map((l) => l.id);
    expect(lost).toEqual([]);
  });

  it('reaches every spawn from the shed door, and back', () => {
    const lost = level.spec.spawns.filter((s) => !both(cellOf(s.x, s.y))).map((s) => s.id);
    expect(lost).toEqual([]);
  });

  it('leaves no way in that has no way back out, once every switch is on', () => {
    const traps = [...there].filter((k) => !home.has(k)).map((k) => `${k % map.width},${Math.floor(k / map.width)}`);
    expect(traps).toEqual([]);
  });

  // From the start — the flue and the vents still, the grate down, the
  // curtain drawn — work every switch that can be reached, and go again,
  // until all are on. On the way, any way in with no way back out must lead
  // to a switch not yet worked.
  it('works every switch in turn, and never strands the player before it', () => {
    const on = new Set<Switch>();
    const stranded: string[] = [];
    for (let changed = true; changed; ) {
      changed = false;
      const r = reachWith(on);
      const waiting = Object.values(SWITCH).filter((s) => !on.has(s));
      const traps = new Set([...r.there].filter((k) => !r.home.has(k)));
      if (traps.size > 0 && !waiting.some((s) => SWITCHES[s].some((c) => traps.has(r.key(...c))))) {
        stranded.push(`${[...on].join('+') || 'start'}: ${traps.size}`);
      }
      for (const s of waiting) {
        if (SWITCHES[s].every((c) => r.there.has(r.key(...c)))) {
          on.add(s);
          changed = true;
        }
      }
    }
    expect({ on: [...on].sort(), stranded }).toEqual({ on: Object.values(SWITCH).sort(), stranded: [] });
  });

  it('holds every pool in a basin', () => {
    const water = (x: number, y: number) => level.tilemap.at(x, y) === Tile.Water;
    const open = (x: number, y: number) => !level.tilemap.isSolid(x, y) && !water(x, y);
    const leaks: string[] = [];
    for (let y = 0; y < level.tilemap.height; y++) {
      for (let x = 0; x < level.tilemap.width; x++) {
        if (!water(x, y)) continue;
        if (open(x, y + 1) || open(x - 1, y) || open(x + 1, y)) leaks.push(`${x},${y}`);
      }
    }
    expect(leaks).toEqual([]);
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
    expect(areas[rooms.findIndex((r) => r.id === 'mole')]).toEqual([{ col: 40, row: 84, cols: 15, rows: 6 }]);
  });

  // An open tile in no room and beside none has no back wall: in HD it is a
  // black hole. Water is drawn over its own; a ladder down a shaft through
  // the ground shows the dark of the shaft.
  it('gives every open tile a back wall', () => {
    const t = level.tilemap;
    const light = new LightField(t, level.spec.lighting ?? { rooms: [], lights: [] });
    const shaft = (x: number, y: number) => t.at(x, y) === Tile.Ladder && t.isSolid(x - 1, y) && t.isSolid(x + 1, y);
    const drawnOver = (x: number, y: number) => t.at(x, y) === Tile.Water || shaft(x, y);
    const open: string[] = [];
    for (let y = 0; y < t.height; y++) {
      for (let x = 0; x < t.width; x++)
        if (!t.isSolid(x, y) && !drawnOver(x, y) && !light.wallAt(x, y)) open.push(`${x},${y}`);
    }
    expect(open).toEqual([]);
  });

  it('stands every lamp on a floor', () => {
    const lamps = level.spec
      .createEntities(context)
      .filter((e): e is Cairn => e instanceof Cairn)
      .map((c) => cellOf(c.sprite.x, c.sprite.y));
    expect(lamps).toHaveLength(21);
    expect(lamps.filter(([x, y]) => !map.isSolid(x, y) || map.isSolid(x, y - 1)).map(String)).toEqual([]);
  });

  // A checkpoint's lamp throws no light until the checkpoint is lit.
  it('lights a lamp only once its checkpoint is lit', () => {
    const lighting = level.spec.lighting ?? { rooms: [], lights: [] };
    const at = { x: (11 + 0.5) * TILE_SIZE * 3, y: (74 - 1.5) * TILE_SIZE * 3 };
    const dark = new LightField(level.tilemap, lighting, () => false).level(at);
    const lit = new LightField(level.tilemap, lighting, (lamp) => lamp === 'shed').level(at);
    expect(lit - dark).toBeCloseTo(0.45);
    expect(new LightField(level.tilemap, lighting).lampArea('shed')).toEqual({ x: 120, y: 1096, w: 128, h: 128 });
  });

  it('starts the player on the shed floor', () => {
    const shed = rooms.find((r) => r.holdsCamera);
    expect(shed?.id).toBe('shed');
    expect(map.isSolid(start[0], start[1] + 1)).toBe(true);
  });

  // A prop stands on a floor, or hangs from a ceiling (or a window, on a
  // wall, does neither), and is never drawn into a wall or a platform.
  it('keeps every prop out of the walls, on a floor or under a ceiling', () => {
    const t = level.tilemap;
    const tile = (px: number) => Math.floor(px / TILE_SIZE);
    const wrong: string[] = [];
    level.spec.decorations.forEach((d, i) => {
      const { rects } = record(d.draw);
      const inWall = rects.some((q) => {
        for (let y = q.y; y < q.y + q.h; y++) {
          for (let x = q.x; x < q.x + q.w; x++) if (t.isSolid(tile(d.x + x), tile(d.y + y))) return true;
        }
        return false;
      });
      const top = Math.min(...rects.map((q) => q.y));
      const bottom = Math.max(...rects.map((q) => q.y + q.h));
      // On a piece of furniture, between rows: the candle on the kitchen table.
      const onFurniture = !Number.isInteger(d.y / TILE_SIZE);
      const stands = bottom <= 0 && (onFurniture || t.isSolid(tile(d.x), tile(d.y)));
      const hangs = top >= 0 && t.isSolid(tile(d.x), tile(d.y) - 1);
      const onWall = top < 0 && bottom > 0;
      if (inWall || !(stands || hangs || onWall)) wrong.push(`${i} at ${tile(d.x)},${d.y / TILE_SIZE}`);
    });
    expect(wrong).toEqual([]);
  });

  for (const [i, decoration] of level.spec.decorations.entries()) {
    it(`keeps prop ${i} to its classic footprint in HD`, () => {
      const recorded = record(decoration.draw);
      expect(footprintDiff(recorded, propHd(recorded, LIT_RAMP).body)).toEqual([]);
    });
  }
});

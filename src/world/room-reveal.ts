import { DB32, TILE_SIZE } from '@constants';
import { type ArtPair, registerArt, unregisterArt } from '@hd/art-mode';
import { FINE } from '@hd/fine-canvas';
import { bayer } from '@hd/palette';
import type { Vec2 } from '@types';
import { holdsTile, type LitRoom, type TileRect } from '@world/level';
import { Container, Texture, TilingSprite } from 'pixi.js';

// Seconds a room takes to come out of the dark once entered, in four steps.
const REVEAL_TIME = 0.7;
const STEPS = 4;

// Which rooms of a level the player has been in, kept across visits.
export interface RoomMemory {
  seen(id: string): boolean;
  see(id: string): void;
}

// The dark over a lit level's rooms (design_handoff_potting_shed/RECIPES.md
// §1, "the gag"): every room not yet entered is black, so the shed shows
// only itself, and walking into one lights it in four dithered steps. In
// HD the dither is on the fine grid, in classic on the logical one.
export class RoomReveal {
  readonly container = new Container();
  private readonly rooms: readonly LitRoom[];
  private readonly memory: RoomMemory;
  private readonly veils: Veil[];
  private readonly art: ArtPair;
  // True until the first update: the room the player arrives in is lit from
  // the first frame, not faded in — the shed opens lit, the rest dark.
  private arriving = true;

  constructor(rooms: readonly LitRoom[], memory: RoomMemory) {
    this.rooms = rooms;
    this.memory = memory;
    const classic = new Container();
    const hd = new Container();
    const areas = ownedAreas(rooms);
    this.veils = rooms.map((room, i) => {
      const veil = new Veil(areas[i]);
      classic.addChild(veil.classic);
      hd.addChild(veil.hd);
      veil.show(memory.seen(room.id) ? 0 : STEPS);
      return veil;
    });
    this.container.addChild(classic, hd);
    this.art = registerArt({ classic, hd });
  }

  // The room the player is in is seen from now on; rooms being revealed go
  // on lighting up.
  update(player: Vec2, dt: number): void {
    const room = this.roomAt(player);
    if (room && !this.memory.seen(room.id)) {
      this.memory.see(room.id);
      const veil = this.veils[this.rooms.indexOf(room)];
      if (this.arriving) veil.show(0);
      else veil.lift();
    }
    this.arriving = false;
    for (const veil of this.veils) veil.step(dt);
  }

  // Where the camera holds while the player is in a room that holds it —
  // the room's middle — or null to follow the player.
  holdFor(player: Vec2): Vec2 | null {
    const room = this.roomAt(player);
    if (!room?.holdsCamera) return null;
    return { x: (room.col + room.cols / 2) * TILE_SIZE, y: (room.row + room.rows / 2) * TILE_SIZE };
  }

  destroy(): void {
    unregisterArt(this.art);
    this.container.destroy({ children: true });
  }

  private roomAt(at: Vec2): LitRoom | null {
    const tile = { x: Math.floor(at.x / TILE_SIZE), y: Math.floor(at.y / TILE_SIZE) };
    return this.rooms.find((r) => holdsTile(r, tile)) ?? null;
  }
}

// The tiles each room owns, as rectangles: the tiles of its own rectangle
// that no room before it in the list has taken. Rooms overlap where a
// chamber opens off a tunnel; the tunnel, listed first, keeps the overlap,
// as it does in the light (lighting.ts) and in where the player is.
export function ownedAreas(rooms: readonly LitRoom[]): TileRect[][] {
  return rooms.map((room, i) => {
    const earlier = rooms.slice(0, i);
    const taken = (tx: number, ty: number) => earlier.some((r) => holdsTile(r, { x: tx, y: ty }));
    const areas: TileRect[] = [];
    let above: TileRect[] = [];
    for (let ty = room.row; ty < room.row + room.rows; ty++) {
      const runs: TileRect[] = [];
      for (let tx = room.col; tx < room.col + room.cols; tx++) {
        if (taken(tx, ty)) continue;
        const last = runs.at(-1);
        if (last && last.col + last.cols === tx) last.cols += 1;
        else runs.push({ col: tx, row: ty, cols: 1, rows: 1 });
      }
      // A run under one just like it lengthens that one downward.
      const row: TileRect[] = [];
      for (const run of runs) {
        const same = above.find((a) => a.col === run.col && a.cols === run.cols);
        if (same) {
          same.rows += 1;
          row.push(same);
        } else {
          areas.push(run);
          row.push(run);
        }
      }
      above = row;
    }
    return areas;
  });
}

// The dark over one room, drawn twice, once per art.
class Veil {
  readonly classic = new Container();
  readonly hd = new Container();
  // How far through its reveal the room is, 0 → 1, or null when it is not
  // being revealed.
  private progress: number | null = null;

  constructor(areas: readonly TileRect[]) {
    for (const area of areas) {
      const box = {
        x: area.col * TILE_SIZE,
        y: area.row * TILE_SIZE,
        width: area.cols * TILE_SIZE,
        height: area.rows * TILE_SIZE,
      };
      this.classic.addChild(new TilingSprite({ texture: Texture.EMPTY, ...box }));
      const fine = new TilingSprite({ texture: Texture.EMPTY, ...box });
      fine.tileScale.set(1 / FINE);
      this.hd.addChild(fine);
    }
  }

  lift(): void {
    this.progress = 0;
  }

  step(dt: number): void {
    if (this.progress === null) return;
    this.progress = Math.min(1, this.progress + dt / REVEAL_TIME);
    this.show(Math.round((1 - this.progress) * STEPS));
    if (this.progress >= 1) this.progress = null;
  }

  // Shows the dark at `level` steps of STEPS: STEPS is black, 0 is gone.
  show(level: number): void {
    const visible = level > 0;
    this.classic.visible = visible;
    this.hd.visible = visible;
    if (!visible) return;
    const texture = darkness(level);
    for (const sprite of [...this.classic.children, ...this.hd.children]) (sprite as TilingSprite).texture = texture;
  }
}

// A 4 by 4 tile of black at `level` quarters of Bayer density, made once.
const textures = new Map<number, Texture>();

function darkness(level: number): Texture {
  let texture = textures.get(level);
  if (!texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context for the room reveal');
    ctx.fillStyle = `#${DB32.black.toString(16).padStart(6, '0')}`;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) if (bayer(x, y) < level / STEPS) ctx.fillRect(x, y, 1, 1);
    }
    texture = Texture.from(canvas);
    textures.set(level, texture);
  }
  return texture;
}

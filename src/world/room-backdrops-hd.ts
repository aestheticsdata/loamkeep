import { DB32 } from '@constants';
import { bayer } from '@hd/palette';
import { type LitRoom, ROOM_BACKDROP, type RoomBackdrop } from '@world/level';
import { tileHash } from '@world/tilemap';
import { TILE_FINE } from '@world/tiles-hd';

// The back walls of a lit level's rooms, in HD: one colour per fine pixel,
// from its place in the world, so a pattern runs on unbroken from tile to
// tile and chunk to chunk. Each is the room's own material one ramp step
// down, so anything that can be stood on reads in front of it.
//
// design_handoff_potting_shed/RECIPES.md §3, verbatim (`BD.*`).
export function roomBackdropAt(x: number, y: number, room: LitRoom): number {
  return PATTERNS[room.backdrop](x, y, room);
}

type Pattern = (x: number, y: number, room: LitRoom) => number;

// x mod n, never negative.
const mod = (x: number, n: number) => ((x % n) + n) % n;
const h = tileHash;

// The fine row of the room's floor: its bottom edge.
const floorOf = (room: LitRoom) => (room.row + room.rows) * TILE_FINE;

// The shed's own boards, a step darker: 24-fine boards, a dark gap, a lit
// edge and a knot here and there.
function shed(x: number, y: number): number {
  const bx = mod(x, 24);
  if (bx < 2) return DB32.valhalla;
  if (bx === 2) return DB32.oiledCedar;
  if ((bx === 8 || bx === 15) && h(Math.floor(x / 24), Math.floor(y / 18), 800) < 0.35) return DB32.valhalla;
  return DB32.loulou;
}

// The seed hall: a wall of tiny drawers, each with a label card and a brass
// knob, and one in fourteen left ajar.
function drawers(x: number, y: number): number {
  const cx = mod(x, 24);
  const cy = mod(y, 18);
  const i = Math.floor(x / 24);
  const j = Math.floor(y / 18);
  if (cx < 2 || cy < 2) return DB32.valhalla;
  if (h(i, j, 810) < 0.07 && cy < 4) return DB32.black;
  if (cy === 2) return DB32.rope;
  if (cx >= 9 && cx < 15 && cy >= 5 && cy < 8) return h(i, j, 811) < 0.5 ? DB32.twine : DB32.rope;
  if (cx >= 11 && cx < 13 && cy >= 11 && cy < 13) return DB32.tahitiGold;
  return cx === 23 || cy === 17 ? DB32.loulou : DB32.oiledCedar;
}

// Tiles in loulou grout over a wainscot of boards with a rope cap.
function kitchen(x: number, y: number, room: LitRoom): number {
  const floor = floorOf(room);
  if (y >= floor - 36) {
    if (y < floor - 33) return DB32.rope;
    const bx = mod(x, 12);
    return bx < 1 ? DB32.valhalla : bx === 1 ? DB32.oiledCedar : DB32.loulou;
  }
  if (mod(x, 18) === 0 || mod(y, 18) === 0) return DB32.loulou;
  return bayer(x, y) < 0.25 ? DB32.rope : DB32.oiledCedar;
}

// Green striped paper with a small diamond, over a dado and wainscot.
function wallGreen(x: number, y: number, room: LitRoom): number {
  const floor = floorOf(room);
  if (y >= floor - 30) return y < floor - 27 ? DB32.rope : mod(x, 12) < 1 ? DB32.loulou : DB32.oiledCedar;
  const sx = mod(x, 18);
  const my = mod(y, 24);
  if (sx < 2) return DB32.eltGreen;
  if (sx >= 8 && sx < 10 && my >= 10 && my < 12) return DB32.christi;
  if (((sx === 7 || sx === 10) && my === 11) || ((my === 9 || my === 12) && (sx === 8 || sx === 9))) {
    return DB32.eltGreen;
  }
  return DB32.dell;
}

// Rose paper: a sprig on a half-drop repeat between cedar hairlines.
function wallRose(x: number, y: number, room: LitRoom): number {
  const floor = floorOf(room);
  if (y >= floor - 30) return y < floor - 27 ? DB32.rope : mod(x, 12) < 1 ? DB32.valhalla : DB32.oiledCedar;
  const sx = mod(x, 18);
  const my = mod(y + (Math.floor(x / 18) & 1) * 12, 24);
  if (sx === 0) return DB32.oiledCedar;
  if (sx >= 8 && sx < 10 && my >= 8 && my < 10) return DB32.mandy;
  if (sx >= 8 && sx < 10 && my === 10) return DB32.smokeyAsh;
  if (sx === 10 && my === 11) return DB32.dell;
  return DB32.loulou;
}

// Roof boards seen from under the roof, and a rafter every six tiles.
function rafters(x: number, y: number): number {
  const px = mod(x, 288);
  if (px < 12) return px < 2 ? DB32.rope : px > 10 ? DB32.loulou : DB32.oiledCedar;
  const by = mod(y, 12);
  if (by === 0) return DB32.valhalla;
  if (by === 1) return DB32.oiledCedar;
  return DB32.loulou;
}

// The cellars' brick, 18 × 9 in running bond, one in five a darker brick.
function brick(x: number, y: number): number {
  const row = Math.floor(y / 9);
  const shifted = x + (row & 1) * 9;
  const bx = mod(shifted, 18);
  const by = mod(y, 9);
  if (bx >= 16 || by >= 7) return DB32.valhalla;
  if (by === 0) return DB32.rope;
  return h(Math.floor(shifted / 18), row, 820) < 0.2 ? DB32.loulou : DB32.oiledCedar;
}

// A tunnel's earth, shored up: a timber post every seven tiles and a lintel
// along the top of the tunnel, clods, and the odd black hole.
function earth(x: number, y: number, room: LitRoom): number {
  const post = mod(x - 18, 336);
  if (post < 12) return post < 2 ? DB32.twine : post > 9 ? DB32.oiledCedar : DB32.rope;
  const top = room.row * TILE_FINE;
  if (y < top + 9) return y < top + 2 ? DB32.twine : y > top + 7 ? DB32.oiledCedar : DB32.rope;
  const cx = Math.floor(x / 12);
  const cy = Math.floor(y / 9);
  if (h(cx, cy, 830) < 0.3 && mod(x, 12) < 6 && mod(y, 9) < 2) return DB32.oiledCedar;
  if (h(cx, cy, 831) < 0.08 && mod(x, 12) < 2 && mod(y, 9) === 4) return DB32.black;
  return DB32.valhalla;
}

// The still pool's cave: blue-black clods and a rare drip catching the light.
function pool(x: number, y: number): number {
  const cx = Math.floor(x / 12);
  const cy = Math.floor(y / 9);
  if (h(cx, cy, 840) < 0.3 && mod(x, 12) < 6 && mod(y, 9) < 2) return DB32.deepKoamaru;
  if (h(cx, cy, 841) < 0.05 && mod(x, 12) < 2 && mod(y, 9) < 3) return DB32.venice;
  return DB32.valhalla;
}

const PATTERNS: Record<RoomBackdrop, Pattern> = {
  [ROOM_BACKDROP.shed]: shed,
  [ROOM_BACKDROP.drawers]: drawers,
  [ROOM_BACKDROP.kitchen]: kitchen,
  [ROOM_BACKDROP.wallGreen]: wallGreen,
  [ROOM_BACKDROP.wallRose]: wallRose,
  [ROOM_BACKDROP.rafters]: rafters,
  [ROOM_BACKDROP.brick]: brick,
  [ROOM_BACKDROP.earth]: earth,
  [ROOM_BACKDROP.pool]: pool,
};

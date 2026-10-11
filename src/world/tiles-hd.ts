import { DB32 } from '@constants';
import { FINE, type FineBox, FineCanvas } from '@hd/fine-canvas';
import { bayer, hiOf, loOf } from '@hd/palette';
import {
  CRYPT_FLOOR,
  CRYPT_HI,
  CRYPT_LO,
  CRYPT_WALL,
  GRANITE,
  GRANITE_CRACK,
  GRANITE_HI,
  GROTTO_GRAIN,
  GROTTO_ROCK,
  HEATH_FROST,
  HEATH_MOSS,
  HEATHER,
  HEATHER_HI,
  LICHEN,
  PEAT,
  PEAT_ROOT,
  PUFFBALL,
  PUFFBALL_SHADE,
  rootAt,
  TILE_COLORS,
  Tile,
  type TileFaces,
  TURF,
  TURF_DARK,
  TURF_LIGHT,
  tileHash,
} from '@world/tilemap';

// A tile is 16 logical px, 48 fine.
export const TILE_FINE = 48;

// A tile's place in the map. Its fine origin is (tx, ty) × 48 in world fine
// px, and every recipe draws there, so Bayer is anchored to the world and a
// dither runs on unbroken from one tile into the next (and across chunks).
export interface TileSpot {
  tx: number;
  ty: number;
  // Which faces are open to the air, for the kinds that draw them (the
  // house's floorboards). Absent: both, as when a tile is drawn alone.
  faces?: TileFaces;
}

interface Origin {
  x: number;
  y: number;
  tx: number;
  ty: number;
  faces: TileFaces;
}

// The HD drawing of one tile, into a canvas in world fine coordinates. Each
// recipe calls tileHash with the classic salts first, so every tuft, pebble,
// rivet and spine lands on the tile it lands on in classic and `split`
// compares drawing, not layout. HD-only detail takes salts of its own.
//
// Recipes: design_handoff_hd_pass/RECIPES.md §5 (grass, dirt, the brick
// shader, ladder) — the other kinds are drawn by its laws.
export function drawTileHd(canvas: FineCanvas, tile: Tile, spot: TileSpot): void {
  const o: Origin = {
    x: spot.tx * TILE_FINE,
    y: spot.ty * TILE_FINE,
    tx: spot.tx,
    ty: spot.ty,
    faces: spot.faces ?? { up: true, down: true },
  };
  const draw = RECIPES[tile];
  if (draw) draw(canvas, o);
}

type Recipe = (s: FineCanvas, o: Origin) => void;

const RECIPES: Partial<Record<Tile, Recipe>> = {
  [Tile.Grass]: grass,
  [Tile.Dirt]: dirt,
  [Tile.Stone]: stone,
  [Tile.DarkStone]: (s, o) => brick(s, o, { base: DB32.topaz, hi: DB32.heather, mid: DB32.dimGray, lo: DB32.valhalla }),
  [Tile.CastleBrick]: castleBrick,
  [Tile.CastleFloor]: castleFloor,
  [Tile.GoldPillar]: goldPillar,
  [Tile.CryptBrick]: cryptBrick,
  [Tile.CryptFloor]: (s, o) => brick(s, o, { base: CRYPT_FLOOR, hi: CRYPT_HI, mid: null, lo: CRYPT_LO }),
  [Tile.Timber]: timber,
  [Tile.GrottoRock]: grottoRock,
  [Tile.Bookcase]: bookcase,
  [Tile.Ladder]: ladder,
  [Tile.Heath]: heath,
  [Tile.Peat]: peat,
  [Tile.Granite]: granite,
  [Tile.Puffball]: puffball,
  [Tile.AutumnTurf]: autumnTurf,
  [Tile.Floorboards]: floorboards,
  [Tile.PlankWall]: plankWall,
  [Tile.PackedEarth]: packedEarth,
  [Tile.RootEarth]: rootEarth,
};

const T = TILE_FINE;
const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
const half = (over: number) => ({ under: null, over, t: 0.5 });
const quarter = (over: number) => ({ under: null, over, t: 0.25 });
const h = tileHash;

function fill(s: FineCanvas, o: Origin, color: number): void {
  s.rect(box(o.x, o.y, T, T), color);
}

// ---------------------------------------------------------------- grass

function grass(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, DB32.eltGreen);
  s.rect(box(x, y, T, 2), DB32.atlantis).dither(box(x, y + 2, T, 1), half(DB32.atlantis));
  s.vgrad(box(x, y + 33, T, 6), { under: null, over: DB32.dell });
  s.rect(box(x, y + 39, T, 9), DB32.dell).dither(box(x, y + 45, T, 3), quarter(DB32.opal));
  for (let i = 0; i < 15; i++) {
    s.rect(box(x + Math.floor(h(tx, ty, 300 + i) * 47), y + 7 + Math.floor(h(tx, ty, 320 + i) * 24), 1, 2), DB32.dell);
  }
  for (let i = 0; i < 6; i++) {
    s.rect(
      box(x + Math.floor(h(tx, ty, 340 + i) * 47), y + 5 + Math.floor(h(tx, ty, 350 + i) * 16), 1, 2),
      DB32.atlantis,
    );
  }
  // Tufts on the classic tuft cells: a short blade of 1 + 2 + 3 fine px, or a
  // tall one over two cells, its tip leaning by hash.
  const tufts = h(tx, ty, 1) < 0.4 ? 3 : 4;
  for (let i = 0; i < tufts; i++) {
    const c = x + FINE * (Math.floor(h(tx, ty, 10 + i) * 14) + 1);
    const lean = h(tx, ty, 360 + i) < 0.5 ? 0 : 1;
    if (h(tx, ty, 20 + i) < 0.3) {
      s.set(c + 1 + lean, y - 6, DB32.atlantis);
      s.rect(box(c + lean, y - 5, 2, 2), DB32.atlantis).rect(box(c + 1, y - 3, 2, 2), DB32.atlantis);
      s.rect(box(c, y - 1, 3, 1), DB32.atlantis);
    } else {
      s.set(c + 1 + lean, y - 3, DB32.atlantis);
      s.rect(box(c + lean, y - 2, 2, 1), DB32.atlantis).rect(box(c, y - 1, 3, 1), DB32.atlantis);
    }
  }
  // The wildflower: a two-tone stem, a red head with a lit petal and a pale
  // heart, or a bud.
  if (h(tx, ty, 100) < 0.2) {
    const fx = x + FINE * (1 + Math.floor(h(tx, ty, 101) * 14));
    s.rect(box(fx + 1, y - 6, 1, 6), DB32.eltGreen).rect(box(fx + 2, y - 6, 1, 6), DB32.dell);
    if (h(tx, ty, 102) < 0.5) {
      s.rect(box(fx + 1, y - 9, 4, 1), DB32.clairvoyant).rect(box(fx, y - 8, 6, 1), DB32.clairvoyant);
      s.rect(box(fx + 1, y - 7, 4, 1), DB32.clairvoyant).rect(box(fx + 2, y - 9, 2, 1), DB32.brown);
      s.set(fx + 2, y - 8, DB32.pancho);
    } else {
      s.rect(box(fx + 1, y - 9, 1, 3), DB32.clairvoyant).rect(box(fx, y - 8, 3, 1), DB32.clairvoyant);
      s.set(fx + 1, y - 8, DB32.brown);
    }
  }
}

// ---------------------------------------------------------------- dirt

function dirt(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, DB32.oiledCedar);
  // The stratum wavers by a fine pixel instead of running ruler-straight.
  const sy = y + FINE * (2 + Math.floor(h(tx, ty, 70) * 10));
  for (let i = 0; i < T; i++) s.rect(box(x + i, sy + Math.round(Math.sin((x + i) * 0.18 + tx)), 1, 2), DB32.loulou);
  for (let i = 0; i < 20; i++) {
    const gx = x + 2 + Math.floor(h(tx, ty, 400 + i) * 43);
    const gy = y + 3 + Math.floor(h(tx, ty, 430 + i) * 42);
    s.rect(box(gx, gy, 2, 1), DB32.loulou);
  }
  // Grains lit from above: rope over loulou (L6).
  for (let i = 0; i < 9; i++) {
    const gx = x + 2 + Math.floor(h(tx, ty, 460 + i) * 43);
    const gy = y + 3 + Math.floor(h(tx, ty, 480 + i) * 42);
    s.rect(box(gx, gy, 2, 1), DB32.rope).rect(box(gx, gy + 1, 2, 1), DB32.loulou);
  }
  // The pebble: a topaz disc lit top-left, a glint, a dark underside and a
  // cast shadow on the soil.
  if (h(tx, ty, 80) < 0.35) {
    const px = x + FINE * (2 + Math.floor(h(tx, ty, 81) * 10));
    const py = y + FINE * (4 + Math.floor(h(tx, ty, 82) * 8));
    s.rect(box(px, py + 6, 6, 1), DB32.loulou);
    s.disc({ cx: px + 3, cy: py + 3, r: 3.2 }, DB32.topaz);
    s.rect(box(px + 1, py, 4, 1), DB32.heather).rect(box(px, py + 1, 2, 2), DB32.heather);
    s.set(px + 2, py + 1, DB32.lightSteel);
    s.rect(box(px + 2, py + 5, 3, 1), DB32.dimGray);
  }
}

// ---------------------------------------------------------------- masonry

interface BrickPalette {
  base: number;
  hi: number;
  // null: a 50 % dither of base and lo, for a palette with no tone between.
  mid: number | null;
  lo: number;
}

// The brick shader every masonry kind shares: each fine pixel takes its tone
// from where it sits in a 24×24 fine brick, running bond offset 12 on odd
// rows, all world-aligned — the classic 8×8 bricks at three times the grain.
// 2 fine of mortar and a fine of bevel shadow right and below, a lit top.
// `chips` scatters one pit per brick, a mid over a hi.
function brick(s: FineCanvas, o: Origin, pal: BrickPalette, chips = false): void {
  const mid = (wx: number, wy: number) => pal.mid ?? (bayer(wx, wy) < 0.5 ? pal.lo : pal.base);
  for (let j = 0; j < T; j++) {
    for (let i = 0; i < T; i++) {
      const wx = o.x + i;
      const wy = o.y + j;
      const row = Math.floor(wy / 24);
      const off = row & 1 ? 12 : 0;
      const bx = (((wx - off) % 24) + 24) % 24;
      const by = wy % 24;
      let c = pal.base;
      if (bx >= 22 || by >= 22) c = pal.lo;
      else if (bx === 21 || by === 21) c = mid(wx, wy);
      else if (by <= 1) c = bx === 20 ? pal.base : pal.hi;
      else if (by === 20 && bx > 0) c = mid(wx, wy);
      s.set(wx, wy, c);
      if (chips && bx < 19 && by > 3 && by < 15) {
        const bi = Math.floor((wx - off) / 24);
        if (h(bi, row, 500) < 0.5) {
          const cx = 3 + Math.floor(h(bi, row, 501) * 14);
          const cy = 4 + Math.floor(h(bi, row, 502) * 9);
          if ((bx === cx || bx === cx + 1) && by === cy) s.set(wx, wy, mid(wx, wy));
          if ((bx === cx || bx === cx + 1) && by === cy + 1) s.set(wx, wy, pal.hi);
        }
      }
    }
  }
}

function stone(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  brick(s, o, { base: DB32.heather, hi: DB32.lightSteel, mid: DB32.topaz, lo: DB32.dimGray }, true);
  // The crack: a short zigzag with a lit lip on its left.
  if (h(tx, ty, 110) < 0.18) {
    const cx = x + FINE * (2 + Math.floor(h(tx, ty, 111) * 12));
    const cy = y + FINE * (2 + Math.floor(h(tx, ty, 112) * 12));
    s.set(cx, cy, DB32.dimGray)
      .set(cx + 1, cy + 1, DB32.dimGray)
      .set(cx + 1, cy + 2, DB32.dimGray);
    s.set(cx + 2, cy + 3, DB32.dimGray)
      .set(cx, cy + 1, DB32.lightSteel)
      .set(cx, cy + 2, DB32.lightSteel);
  }
}

function castleBrick(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  brick(s, o, { base: DB32.dimGray, hi: DB32.heather, mid: DB32.verdigris, lo: DB32.valhalla }, true);
  // The rivet: iron, lit top-left, dark bottom-right.
  if (h(tx, ty, 130) < 0.12) {
    const rx = x + FINE * (3 + Math.floor(h(tx, ty, 131) * 10));
    const ry = y + FINE * (3 + Math.floor(h(tx, ty, 132) * 10));
    s.rect(box(rx, ry, 3, 3), DB32.valhalla)
      .set(rx, ry, DB32.heather)
      .set(rx + 2, ry + 2, DB32.black);
  }
}

function castleFloor(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  brick(s, o, { base: DB32.heather, hi: DB32.lightSteel, mid: DB32.topaz, lo: DB32.dimGray });
  // Polish: a glint as a small white cross with lightSteel arms.
  if (h(tx, ty, 140) < 0.08) {
    const px = x + FINE * (4 + Math.floor(h(tx, ty, 141) * 8));
    const py = y + FINE * (4 + Math.floor(h(tx, ty, 142) * 8));
    s.set(px + 1, py, DB32.lightSteel)
      .set(px, py + 1, DB32.lightSteel)
      .set(px + 2, py + 1, DB32.lightSteel);
    s.set(px + 1, py + 2, DB32.lightSteel).set(px + 1, py + 1, DB32.white);
  }
}

function cryptBrick(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  brick(s, o, { base: CRYPT_WALL, hi: CRYPT_HI, mid: null, lo: CRYPT_LO });
  if (h(tx, ty, 150) < 0.08) {
    const cx = x + FINE * (2 + Math.floor(h(tx, ty, 151) * 12));
    const cy = y + FINE * (2 + Math.floor(h(tx, ty, 152) * 12));
    s.set(cx + 1, cy, DB32.white)
      .set(cx + 1, cy + 1, DB32.white)
      .set(cx, cy + 1, CRYPT_HI)
      .set(cx + 2, cy + 1, CRYPT_HI);
  }
}

// ---------------------------------------------------------------- wood

// A beam: a lit top in two steps, a dark underside with one dithered band
// into the wood, grain lines with a lit edge above them (L6), the joint as a gap with
// a lit wall, the peg as a little lit dome.
function timber(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, DB32.oiledCedar);
  s.rect(box(x, y, T, 2), DB32.twine).rect(box(x, y + 2, T, 4), DB32.rope);
  s.dither(box(x, y + 40, T, 2), half(DB32.valhalla)).rect(box(x, y + 42, T, 6), DB32.valhalla);
  const a = 2 + Math.floor(h(tx, ty, 160) * 6);
  const b = 1 + Math.floor(h(tx, ty, 161) * 6);
  grain(s, { x: x + FINE * a, y: y + 16, w: FINE * (14 - a), h: 0 });
  grain(s, { x: x + FINE * b, y: y + 28, w: FINE * (12 - b), h: 0 });
  for (let i = 0; i < 4; i++) {
    const gx = x + 3 + Math.floor(h(tx, ty, 164 + i) * 38);
    const gy = y + 10 + Math.floor(h(tx, ty, 168 + i) * 26);
    s.rect(box(gx, gy, 4, 1), DB32.loulou);
  }
  if (h(tx, ty, 162) < 0.5) {
    s.rect(box(x, y + 6, 2, 36), DB32.valhalla).rect(box(x + 2, y + 6, 1, 36), DB32.rope);
  }
  if (h(tx, ty, 163) < 0.25) {
    s.disc({ cx: x + 24, cy: y + 12, r: 3 }, DB32.twine);
    s.set(x + 23, y + 10, DB32.pancho)
      .set(x + 25, y + 14, DB32.rope)
      .set(x + 26, y + 13, DB32.rope);
  }
}

// A grain line 2 fine thick, its last fine pixels thinning to 1, with a
// 1-fine lit edge along its top.
function grain(s: FineCanvas, line: FineBox): void {
  s.rect(box(line.x, line.y - 1, line.w - 2, 1), DB32.rope);
  s.rect(box(line.x, line.y, line.w - 3, 2), DB32.loulou).rect(box(line.x + line.w - 3, line.y, 3, 1), DB32.loulou);
}

// The library's bookcase: spines in their own ramp tones — a lit left edge,
// a shaded right one, a cap of pancho and, on the wider spines, a band.
function bookcase(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  const spines = [
    DB32.clairvoyant,
    DB32.eltGreen,
    DB32.deepKoamaru,
    DB32.rainforest,
    DB32.venice,
    DB32.loulou,
    DB32.dell,
    DB32.brown,
  ];
  fill(s, o, DB32.oiledCedar);
  s.rect(box(x, y + 3, T, 39), DB32.valhalla);
  let cx = 1;
  let i = 0;
  while (cx < 15) {
    const w = 1 + Math.floor(h(tx * 7 + i, ty, 200) * 2);
    const top = 2 + Math.floor(h(tx * 7 + i, ty, 201) * 4);
    const color = spines[Math.floor(h(tx * 7 + i, ty, 202) * spines.length)];
    const width = Math.min(w, 15 - cx);
    const sx = x + FINE * cx;
    const sw = FINE * width;
    const sy = y + FINE * top;
    s.rect(box(sx, sy, sw, FINE * (13 - top)), color);
    s.rect(box(sx, sy + 3, 1, FINE * (13 - top) - 3), hiOf(color));
    s.rect(box(sx + sw - 1, sy + 3, 1, FINE * (13 - top) - 3), loOf(color));
    s.rect(box(sx, sy, sw, 2), DB32.pancho).rect(box(sx, sy + 2, sw, 1), hiOf(color));
    if (sw >= 6) s.rect(box(sx + 1, sy + 9 + Math.floor(h(tx * 7 + i, ty, 204) * 9), sw - 2, 2), loOf(color));
    cx += w + (h(tx * 7 + i, ty, 203) < 0.15 ? 1 : 0);
    i += 1;
  }
  s.rect(box(x, y + 42, T, 1), DB32.twine)
    .rect(box(x, y + 43, T, 4), DB32.rope)
    .rect(box(x, y + 47, T, 1), DB32.oiledCedar);
  s.rect(box(x, y, T, 2), DB32.twine).rect(box(x, y + 2, T, 1), DB32.rope);
}

// Rails and rungs, each in three tones: lit, body, shadow.
function ladder(s: FineCanvas, o: Origin): void {
  const { x, y } = o;
  for (const rx of [6, 36]) {
    s.rect(box(x + rx, y, 6, T), DB32.rope).rect(box(x + rx, y, 2, T), DB32.twine);
    s.rect(box(x + rx + 5, y, 1, T), DB32.oiledCedar);
  }
  for (const ry of [9, 33]) {
    s.rect(box(x + 12, y + ry, 24, 2), DB32.twine).rect(box(x + 12, y + ry + 2, 24, 2), DB32.rope);
    s.rect(box(x + 12, y + ry + 4, 24, 2), DB32.oiledCedar).set(x + 12, y + ry + 4, DB32.loulou);
  }
}

// ---------------------------------------------------------------- stone of the hills

function grottoRock(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, GROTTO_ROCK);
  for (let i = 0; i < 5; i++) {
    const w = i < 2 ? 3 : 1;
    const px = Math.min(Math.floor(h(tx, ty, 170 + i) * 16), 16 - w);
    const py = Math.floor(h(tx, ty, 180 + i) * 16);
    const gx = x + FINE * px;
    const gy = y + FINE * py + 1;
    if (w === 3) s.rect(box(gx, gy, 8, 1), GROTTO_GRAIN).rect(box(gx + 2, gy - 1, 4, 1), GROTTO_GRAIN);
    else s.rect(box(gx, gy, 2, 1), GROTTO_GRAIN);
  }
  // Finer grain over the whole face (L6: the marks a third the size, three
  // times as many).
  for (let i = 0; i < 10; i++) {
    s.rect(box(x + Math.floor(h(tx, ty, 600 + i) * 46), y + Math.floor(h(tx, ty, 610 + i) * 47), 2, 1), GROTTO_GRAIN);
  }
  // The fleck that catches the glow: a little cyan diamond, lit at its heart.
  if (h(tx, ty, 190) < 0.07) {
    const cx = x + FINE * (2 + Math.floor(h(tx, ty, 191) * 12));
    const cy = y + FINE * (2 + Math.floor(h(tx, ty, 192) * 12));
    s.set(cx + 1, cy, DB32.viking)
      .rect(box(cx, cy + 1, 3, 1), DB32.viking)
      .set(cx + 1, cy + 2, DB32.viking);
    s.set(cx + 1, cy + 1, DB32.lightSteel);
  }
}

// Heath: frost along the top, moss, peat underneath reached through two
// dither bands, sprigs of heather standing up out of it.
function heath(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, HEATH_MOSS);
  s.rect(box(x, y, T, 2), HEATH_FROST).dither(box(x, y + 2, T, 1), half(HEATH_FROST));
  s.dither(box(x, y + 29, T, 2), quarter(PEAT)).dither(box(x, y + 31, T, 2), half(PEAT));
  s.rect(box(x, y + 33, T, 15), PEAT);
  for (let i = 0; i < 8; i++) {
    s.rect(box(x + Math.floor(h(tx, ty, 620 + i) * 46), y + 6 + Math.floor(h(tx, ty, 628 + i) * 22), 2, 1), PEAT);
  }
  const sprigs = 2 + Math.floor(h(tx, ty, 210) * 3);
  for (let i = 0; i < sprigs; i++) {
    const sx = 1 + Math.floor(h(tx, ty, 211 + i) * 14);
    const tall = 2 + Math.floor(h(tx, ty, 216 + i) * 3);
    const cx = x + FINE * sx;
    const top = y + FINE * (1 - tall);
    s.rect(box(cx, top + 3, 2, FINE * tall - 3), HEATHER);
    s.rect(box(cx, top, 2, 3), HEATHER_HI).set(cx - 1, top + 1, HEATHER_HI);
    if (tall > 2) s.set(cx + 2, top + 5, HEATHER);
  }
  if (h(tx, ty, 220) < 0.3) {
    const fx = x + FINE * (4 + Math.floor(h(tx, ty, 221) * 8));
    s.rect(box(fx + 1, y + 12, 4, 1), HEATH_FROST).rect(box(fx, y + 13, 6, 1), HEATH_FROST);
  }
}

// Peat: roots 2 fine thick that wander by a fine pixel and thin at their tip.
function peat(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, PEAT);
  for (let i = 0; i < 2; i++) {
    const ry = 2 + Math.floor(h(tx, ty, 230 + i) * 12);
    const rx = Math.floor(h(tx, ty, 232 + i) * 6);
    const len = Math.min(4 + Math.floor(h(tx, ty, 234 + i) * 8), 16 - rx);
    const x0 = x + FINE * rx;
    const w = FINE * len;
    for (let k = 0; k < w; k++) {
      const wy = y + FINE * ry + 1 + Math.round(Math.sin((x0 + k) * 0.3 + i));
      s.rect(box(x0 + k, wy, 1, k < w - 3 ? 2 : 1), PEAT_ROOT);
    }
    // A root hair dropping off it.
    const hx = x0 + Math.floor(h(tx, ty, 640 + i) * Math.max(1, w - 2));
    s.rect(box(hx, y + FINE * ry + 3, 1, 3), PEAT_ROOT);
  }
}

// Granite: the cracks of the classic outcrop, each now a 2-fine fissure with
// a rough edge, lit faces beside them, lichen as round blobs, and a fine
// grain of dark marks lit from above.
function granite(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, GRANITE);
  for (let i = 0; i < 10; i++) {
    const gx = x + 2 + Math.floor(h(tx, ty, 650 + i) * 42);
    const gy = y + 3 + Math.floor(h(tx, ty, 660 + i) * 40);
    s.rect(box(gx, gy - 1, 2, 1), GRANITE_HI).rect(box(gx, gy, 2, 1), GRANITE_CRACK);
  }
  const crackRight = h(tx, ty, 240) < 0.4;
  const crackBottom = h(tx, ty, 241) < 0.45;
  if (crackRight) {
    s.rect(box(x + 46, y, 2, T), GRANITE_CRACK).dither(box(x + 45, y, 1, T), half(GRANITE_CRACK));
    s.rect(box(x + 42, y + 3, 2, 42), GRANITE_HI).dither(box(x + 44, y + 3, 1, 42), half(GRANITE_HI));
  }
  if (crackBottom) {
    s.rect(box(x, y + 46, T, 2), GRANITE_CRACK).dither(box(x, y + 45, T, 1), half(GRANITE_CRACK));
  }
  if (h(tx, ty - 1, 241) < 0.45) {
    s.rect(box(x + 3, y, 42, 2), GRANITE_HI).dither(box(x + 3, y + 2, 42, 1), half(GRANITE_HI));
  }
  for (let i = 0; i < 2; i++) {
    if (h(tx, ty, 244 + i) < 0.5) {
      const lx = x + FINE * (2 + Math.floor(h(tx, ty, 246 + i) * 11));
      const ly = y + FINE * (2 + Math.floor(h(tx, ty, 248 + i) * 11));
      s.rect(box(lx + 1, ly, 4, 1), LICHEN).rect(box(lx, ly + 1, 6, 2), LICHEN);
      s.rect(box(lx + 3, ly + 3, 3, 2), LICHEN).set(lx + 4, ly + 5, LICHEN);
    }
  }
}

// The puffball's cap: the classic silhouette at three times the grain with
// its staircases rounded, a lit crown, the underside reached through a
// dither band, soft round spots.
function puffball(s: FineCanvas, o: Origin): void {
  const { x, y, tx } = o;
  const cap = new FineCanvas({ x, y, w: T, h: T });
  cap.rect(box(x + 9, y + 3, 30, 3), PUFFBALL).rect(box(x + 3, y + 6, 42, 6), PUFFBALL);
  cap.rect(box(x, y + 12, T, 27), PUFFBALL).rect(box(x, y + 39, T, 9), PUFFBALL_SHADE);
  cap.round().elbows();
  cap.shade(box(x, y + 35, T, 4), { from: PUFFBALL, to: PUFFBALL_SHADE, t: 0.5 });
  // The lit crown: the classic white dash, its corners knocked back.
  cap.recolor(box(x + 12, y + 6, 9, 3), PUFFBALL, DB32.white);
  for (const [cx, cy] of [
    [x + 12, y + 6],
    [x + 20, y + 6],
    [x + 12, y + 8],
    [x + 20, y + 8],
  ]) {
    cap.set(cx, cy, PUFFBALL);
  }
  cap.disc({ cx: x + 12 + (tx % 3) * 9, cy: y + 24, r: 3 }, PUFFBALL_SHADE);
  cap.disc({ cx: x + 33 - (tx % 2) * 12, cy: y + 16.5, r: 2.2 }, PUFFBALL_SHADE);
  s.blit(cap);
}

// Autumn turf: the grass recipe in straw, soil underneath, and the fallen
// leaves as pointed little leaves lit along their top.
function autumnTurf(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, TURF);
  s.rect(box(x, y, T, 2), TURF_LIGHT).dither(box(x, y + 2, T, 1), half(TURF_LIGHT));
  for (let i = 0; i < 10; i++) {
    s.rect(box(x + Math.floor(h(tx, ty, 700 + i) * 47), y + 5 + Math.floor(h(tx, ty, 710 + i) * 20), 1, 2), TURF_DARK);
  }
  s.dither(box(x, y + 26, T, 2), quarter(DB32.oiledCedar)).dither(box(x, y + 28, T, 2), half(DB32.oiledCedar));
  s.rect(box(x, y + 30, T, 18), DB32.oiledCedar);
  for (let i = 0; i < 5; i++) {
    const gx = x + 2 + Math.floor(h(tx, ty, 720 + i) * 43);
    const gy = y + 32 + Math.floor(h(tx, ty, 725 + i) * 14);
    s.rect(box(gx, gy, 2, 1), DB32.rope).rect(box(gx, gy + 1, 2, 1), DB32.loulou);
  }
  for (let i = 0; i < 3; i++) {
    const bx = x + FINE * Math.floor(h(tx, ty, 260 + i) * 16);
    s.rect(box(bx, y - 3, 1, 6), TURF)
      .rect(box(bx + 1, y - 3, 1, 6), TURF_DARK)
      .set(bx + 1, y - 3, TURF_LIGHT);
  }
  const leaves = [DB32.tahitiGold, DB32.clairvoyant, DB32.rope];
  for (let i = 0; i < 3; i++) {
    if (h(tx, ty, 270 + i) < 0.55) {
      const lx = x + FINE * (1 + Math.floor(h(tx, ty, 273 + i) * 13));
      const ly = y + FINE * (2 + Math.floor(h(tx, ty, 276 + i) * 5));
      const c = leaves[i];
      s.rect(box(lx + 1, ly, 4, 1), hiOf(c))
        .rect(box(lx, ly + 1, 6, 1), c)
        .rect(box(lx + 1, ly + 2, 4, 1), loOf(c));
    }
  }
}

// ---------------------------------------------------------------- the column

// Gold, turned: a catch-light that falls off by dither either side, the
// seam of the cylinder turning past it, and the shadow side deepening in
// steps — the four classic flutes, each at three times the grain.
function goldPillar(s: FineCanvas, o: Origin): void {
  const { x, y } = o;
  const col = (fx: number, w: number) => box(x + fx, y, w, T);
  fill(s, o, TILE_COLORS[Tile.GoldPillar]);
  s.dither(col(4, 2), half(DB32.goldenFizz)).rect(col(6, 3), DB32.goldenFizz).dither(col(9, 2), half(DB32.goldenFizz));
  s.rect(col(24, 2), DB32.stinger).dither(col(26, 1), half(DB32.stinger));
  s.dither(col(33, 3), quarter(DB32.stinger)).dither(col(36, 3), half(DB32.stinger));
  s.rect(col(39, 3), DB32.stinger).rect(col(42, 3), DB32.oiledCedar).dither(col(45, 2), half(DB32.oiledCedar));
}

// ---------------------------------------------------------------- the potting shed's house
// design_handoff_potting_shed/RECIPES.md §2.

// A floor in section: the void between two floors in loulou with a quarter
// of valhalla, a joist standing in it with a lit left edge, the board face
// on top where air is above (a lit lip, grain, a joint, a nail head), and
// the lath and plaster of the ceiling below where air is below.
function floorboards(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, DB32.loulou);
  s.dither(box(x, y, T, T), quarter(DB32.valhalla));
  const jx = x + (tx & 1 ? 6 : 30);
  s.rect(box(jx, y + 15, 9, 24), DB32.oiledCedar)
    .rect(box(jx, y + 15, 1, 24), DB32.rope)
    .rect(box(jx + 8, y + 15, 1, 24), DB32.loulou);
  if (o.faces.up) {
    s.rect(box(x, y, T, 2), DB32.twine)
      .rect(box(x, y + 2, T, 1), DB32.rope)
      .dither(box(x, y + 2, T, 1), half(DB32.twine))
      .rect(box(x, y + 3, T, 9), DB32.rope)
      .rect(box(x, y + 12, T, 2), DB32.oiledCedar)
      .rect(box(x, y + 14, T, 1), DB32.loulou);
    for (let i = 0; i < 3; i++) {
      const gx = x + Math.floor(h(tx, ty, 700 + i) * 40);
      const gy = y + 5 + Math.floor(h(tx, ty, 703 + i) * 5);
      s.rect(box(gx, gy, 6 + i * 2, 1), DB32.oiledCedar);
    }
    const joint = x + FINE * (h(tx, ty, 600) < 0.5 ? 5 : 11);
    s.rect(box(joint, y + 3, 2, 9), DB32.oiledCedar).rect(box(joint - 1, y + 3, 1, 9), DB32.twine);
    if (h(tx, ty, 601) < 0.4) s.rect(box(x + 6, y + 6, 2, 2), DB32.topaz).set(x + 6, y + 6, DB32.heather);
  }
  if (o.faces.down) {
    s.rect(box(x, y + 39, T, 2), DB32.rope)
      .rect(box(x, y + 41, T, 7), DB32.twine)
      .dither(box(x, y + 45, T, 3), quarter(DB32.pancho));
  }
}

// Boards 12 fine wide: a 2-fine loulou gap, a lit edge, the oiled cedar
// face with two grain marks each (a dark mark with its lit partner, L6), and
// the odd nail.
function plankWall(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  for (let i = 0; i < 4; i++) {
    const bx = x + i * 12;
    s.rect(box(bx, y, 12, T), DB32.oiledCedar)
      .rect(box(bx, y, 2, T), DB32.loulou)
      .rect(box(bx + 2, y, 1, T), DB32.rope);
    for (let k = 0; k < 2; k++) {
      const gy = y + Math.floor(h(tx * 4 + i, ty, 680 + k) * 44);
      s.rect(box(bx + 5 + k * 3, gy, 1, 4), DB32.loulou).rect(box(bx + 4 + k * 3, gy, 1, 4), DB32.rope);
    }
    if (h(tx * 4 + i * 4, ty, 610) < 0.25) s.rect(box(bx + 6, y + 9, 2, 2), DB32.twine).set(bx + 7, y + 10, DB32.rope);
  }
}

// Clods lit along the top, dark grains, and in one tile in four a stone with
// its lit cap, its shaded underside and its shadow on the earth.
function packedEarth(s: FineCanvas, o: Origin): void {
  const { x, y, tx, ty } = o;
  fill(s, o, DB32.loulou);
  for (let i = 0; i < 14; i++) {
    const cx = x + Math.floor(h(tx, ty, 720 + i) * 42);
    const cy = y + 1 + Math.floor(h(tx, ty, 740 + i) * 44);
    s.rect(box(cx, cy, 6, 2), DB32.oiledCedar).rect(box(cx + 1, cy - 1, 4, 1), DB32.rope);
  }
  for (let i = 0; i < 9; i++) {
    s.rect(box(x + Math.floor(h(tx, ty, 760 + i) * 46), y + Math.floor(h(tx, ty, 770 + i) * 46), 2, 1), DB32.valhalla);
  }
  if (h(tx, ty, 660) < 0.25) {
    const px = x + 9 + Math.floor(h(tx, ty, 661) * 27);
    const py = y + 9 + Math.floor(h(tx, ty, 662) * 27);
    s.rect(box(px, py + 6, 6, 1), DB32.valhalla).disc({ cx: px + 3, cy: py + 3, r: 3.2 }, DB32.topaz);
    s.rect(box(px + 1, py, 3, 1), DB32.heather).rect(box(px, py + 1, 1, 2), DB32.heather);
    s.rect(box(px + 2, py + 5, 3, 1), DB32.dimGray);
  }
}

// Packed earth with two roots out of its underside, on the classic roots'
// columns: 2 fine wide, rope with a twine lit edge, wavering by a fine pixel
// inside their column, a twine tip, and on the long ones a side root.
function rootEarth(s: FineCanvas, o: Origin): void {
  packedEarth(s, o);
  const { x, y, tx, ty } = o;
  for (let i = 0; i < 2; i++) {
    const root = rootAt(tx, ty, i);
    const rx = x + FINE * root.x;
    const end = y + T + FINE * (root.length + 1);
    for (let k = 30; k < end - y; k++) {
      const wob = Math.sin((k + rx) * 0.35) > 0 ? 1 : 0;
      s.rect(box(rx + wob, y + k, 2, 1), k >= end - y - 2 ? DB32.twine : DB32.rope).set(rx + wob, y + k, DB32.twine);
    }
    if (root.length > 3) s.rect(box(rx + FINE, y + 51, 2, 6), DB32.rope).set(rx + FINE, y + 51, DB32.twine);
  }
}

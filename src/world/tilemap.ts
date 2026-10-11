import { DB32, TILE_SIZE } from '@constants';
import { Graphics } from 'pixi.js';

// True-neutral dark greys for the crypt — outside the DB32 palette on
// purpose. Every dark DB32 tone (valhalla, opal, loulou) carries a
// chromatic tint that reads as purple/green/blue at small scale. These
// two are RGB-balanced (R=G=B) so they're pure grey, no bias.
export const CRYPT_WALL = 0x202020; // near-black neutral grey (wall base)
export const CRYPT_FLOOR = 0x303030; // slightly lighter neutral grey (floor base)
export const CRYPT_HI = 0xcfcfcf; // bright cool-white "reflet" highlight
export const CRYPT_LO = 0x000000; // pure black mortar

// The glow grotto's rock: blue-black base, a lighter grain, and the odd
// cyan fleck of the same light the glowcaps give off.
export const GROTTO_ROCK = 0x1a2030;
export const GROTTO_GRAIN = 0x2a3346;

// The observatory hill at night. Moss gone blue-black under the moon, peat
// darker still, and granite the colour of the sky an hour after sunset.
export const HEATH_MOSS = 0x26332f;
export const HEATH_FROST = 0x9fb0cc;
export const HEATHER = 0x6a4a7e;
export const HEATHER_HI = 0x9a6aa8;
export const PEAT = 0x241c22;
export const PEAT_ROOT = 0x3a2c32;
export const GRANITE = 0x3b4354;
export const GRANITE_HI = 0x58627a;
export const GRANITE_CRACK = 0x232836;
export const LICHEN = 0x7d8a6a;
export const PUFFBALL = 0xd9c6de;
// Autumn turf: grass gone the colour of straw in the low sun.
export const TURF = 0x9a8a3e;
export const TURF_LIGHT = 0xd2c26a;
export const TURF_DARK = 0x6c5e2a;
export const PUFFBALL_SHADE = 0xa98fb4;

// Tile type. Uses a const object (not enum) so it plays nicely with
// `isolatedModules` in tsconfig.
//
// Three material families currently:
//   - Outdoor: Grass / Dirt / Stone / DarkStone — used by the meadow.
//   - Castle:  CastleBrick (wall) / CastleFloor (polished slabs) /
//              GoldPillar (classical column). Used by the Old Keep.
//              Neutral cool-grey, walls darker, floor lighter, pillars
//              warm gold for contrast.
//   - Crypt:   CryptBrick / CryptFloor. Used by the Old Keep's crypt.
//              VERY dark palette — almost-black masonry that catches just
//              enough candlelight to read. The crypt is meant to feel
//              like a cosy hideout deep underground.
//   - Grotto:  GrottoRock, the glow grotto's walls. Blue-black, so the
//              only light in the cave is what grows there.
//   - Library: Bookcase (solid — the stacks are climbed on top of) and
//              Ladder (not solid — climbed up the face of, see Player).
//   - Upland:  Heath / Peat / Granite, the observatory hill at night. Drawn
//              in night colours rather than tinted, and not the meadow's
//              grass, earth and brick: frost on the heath, roots in the
//              peat, granite in irregular blocks with lichen on it.
//   - Turf:    AutumnTurf, the kitchen garden's ground: grass gone gold, with
//              fallen leaves on it — not the meadow's green.
//   - Puffball: a giant mushroom cap on the hill. Solid, and it bounces
//              whoever lands on it (see Player).
//   - Timber:  the belfry's beams and plank floors. Warm brown against
//              the tower's grey brick, so a ledge reads as "something to
//              stand on" before the eye has found its edge.
//   - House:   the potting shed's insides. Floorboards (a floor seen in
//              section: boards where air is above it, plaster where air is
//              below), PlankWall (the mass between rooms), PackedEarth (the
//              ground under the house) and RootEarth (the same over a
//              tunnel, with roots hanging out of its underside).
// Water is shared (lakes happen in both biomes).
export const Tile = {
  Empty: 0,
  Grass: 1,
  Dirt: 2,
  Stone: 3,
  DarkStone: 4,
  Water: 5,
  CastleBrick: 6,
  CastleFloor: 7,
  GoldPillar: 8,
  CryptBrick: 9,
  CryptFloor: 10,
  Timber: 11,
  GrottoRock: 12,
  Bookcase: 13,
  Ladder: 14,
  Heath: 15,
  Peat: 16,
  Granite: 17,
  Puffball: 18,
  AutumnTurf: 19,
  Floorboards: 20,
  PlankWall: 21,
  PackedEarth: 22,
  RootEarth: 23,
} as const;

export type Tile = (typeof Tile)[keyof typeof Tile];

// Characters used in ASCII level data.
const CHAR_TO_TILE: Record<string, Tile> = {
  '.': Tile.Empty,
  G: Tile.Grass,
  D: Tile.Dirt,
  S: Tile.Stone,
  K: Tile.DarkStone,
  W: Tile.Water,
  B: Tile.CastleBrick,
  F: Tile.CastleFloor,
  P: Tile.GoldPillar,
  c: Tile.CryptBrick,
  v: Tile.CryptFloor,
  T: Tile.Timber,
  R: Tile.GrottoRock,
  L: Tile.Bookcase,
  H: Tile.Ladder,
  h: Tile.Heath,
  p: Tile.Peat,
  g: Tile.Granite,
  U: Tile.Puffball,
  a: Tile.AutumnTurf,
  f: Tile.Floorboards,
  j: Tile.PlankWall,
  e: Tile.PackedEarth,
  r: Tile.RootEarth,
};

export const TILE_COLORS: Record<Tile, number> = {
  [Tile.Empty]: 0,
  [Tile.Grass]: DB32.eltGreen,
  [Tile.Dirt]: DB32.oiledCedar,
  [Tile.Stone]: DB32.heather,
  [Tile.DarkStone]: DB32.topaz,
  [Tile.Water]: DB32.venice,
  // CastleBrick — neutral mid-grey (dimGray). The first cut used
  // deepKoamaru, which reads as muted purple-blue: wrong for the
  // grey-stone reference and explicitly disliked. dimGray is a true
  // neutral grey — no purple, no blue. Highlight + shadow come from
  // heather + valhalla in drawCastleBrick.
  [Tile.CastleBrick]: DB32.dimGray,
  // CastleFloor — one notch LIGHTER than the wall (heather over dimGray),
  // so polished slabs read as catching ambient candle light. Still in the
  // grey family, slight cool tint that says "stone."
  [Tile.CastleFloor]: DB32.heather,
  // GoldPillar — warm gold base. The big chromatic contrast against the
  // surrounding cool greys is what makes a column read as "ornamental,
  // not structural" at a glance. rainforest is a mid-gold/olive that
  // takes goldenFizz highlights and stinger shadows beautifully.
  [Tile.GoldPillar]: DB32.rainforest,
  // CryptBrick — TRUE neutral dark grey (custom, outside DB32). DB32's
  // dark tones (valhalla, opal, loulou) all carry a tint — valhalla pulls
  // blue/purple, opal pulls green, loulou pulls purple. The user wants
  // grey, not tinted dark. 0x202020 is RGB(32,32,32): channels equal,
  // no chromatic bias, nearly black but readable against the pure-black
  // crypt backdrop.
  [Tile.CryptBrick]: CRYPT_WALL,
  // CryptFloor — one notch lighter than the wall (still neutral grey)
  // so the floor catches just enough candlelight to walk by.
  [Tile.CryptFloor]: CRYPT_FLOOR,
  // Timber — oiled cedar, the same wood as the keep's door and bookshelf.
  [Tile.Timber]: DB32.oiledCedar,
  // GrottoRock — blue-black, outside DB32 like the crypt's greys: valhalla
  // is close but reads purple at this size next to the glowcaps' cyan.
  [Tile.GrottoRock]: GROTTO_ROCK,
  // Bookcase — the cedar of the keep's own bookshelf; the books are drawn
  // over it per tile.
  [Tile.Bookcase]: DB32.oiledCedar,
  // Ladder — never used as a fill: a ladder is two rails and its rungs over
  // whatever is behind it (see drawTile).
  [Tile.Ladder]: DB32.rope,
  [Tile.Heath]: HEATH_MOSS,
  [Tile.Peat]: PEAT,
  [Tile.Granite]: GRANITE,
  [Tile.Puffball]: PUFFBALL,
  [Tile.AutumnTurf]: TURF,
  // The house's floors and walls: the cedar of the shed outside, a step
  // darker for the walls so a floor reads in front of them.
  [Tile.Floorboards]: DB32.loulou,
  [Tile.PlankWall]: DB32.oiledCedar,
  // The earth under the house, darker than the garden's soil.
  [Tile.PackedEarth]: DB32.loulou,
  [Tile.RootEarth]: DB32.loulou,
};

// Solid tiles block movement. A few are intentionally NOT solid:
//   - Water: the player wades / swims through it.
//   - GoldPillar: purely decorative. Drawn into the tilemap so authors
//     can place ornamental columns straight from the ASCII (`P`) without
//     spawning a Decoration entity per column, but the player should
//     walk THROUGH them — they're ambient castle furniture, not the
//     room's structural skeleton.
const TILE_SOLID: Record<Tile, boolean> = {
  [Tile.Empty]: false,
  [Tile.Grass]: true,
  [Tile.Dirt]: true,
  [Tile.Stone]: true,
  [Tile.DarkStone]: true,
  [Tile.Water]: false,
  [Tile.CastleBrick]: true,
  [Tile.CastleFloor]: true,
  [Tile.GoldPillar]: false,
  [Tile.CryptBrick]: true,
  [Tile.CryptFloor]: true,
  [Tile.Timber]: true,
  [Tile.GrottoRock]: true,
  [Tile.Bookcase]: true,
  [Tile.Ladder]: false,
  [Tile.Heath]: true,
  [Tile.Peat]: true,
  [Tile.Granite]: true,
  [Tile.Puffball]: true,
  [Tile.AutumnTurf]: true,
  [Tile.Floorboards]: true,
  [Tile.PlankWall]: true,
  [Tile.PackedEarth]: true,
  [Tile.RootEarth]: true,
};

export class Tilemap {
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly Tile[];
  // Per-tile water "body" id. Tiles that are part of the same 4-connected
  // pool share the same positive id; non-water tiles get -1. Used so the
  // water-surface animation only ripples the pool the player is currently
  // standing in, leaving every other lake in the level still.
  readonly waterBodyId: readonly number[];

  constructor(width: number, height: number, tiles: readonly Tile[]) {
    this.width = width;
    this.height = height;
    this.tiles = tiles;
    this.waterBodyId = computeWaterBodies(width, height, tiles);
  }

  // Water body id at (tx, ty), or -1 if that tile isn't water.
  waterBodyAt(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return -1;
    return this.waterBodyId[ty * this.width + tx];
  }

  // Build a tilemap from human-readable ASCII rows (see CHAR_TO_TILE legend).
  // Throws if rows are ragged or contain unknown characters — fail-fast at boot.
  static fromAscii(rows: readonly string[]): Tilemap {
    const height = rows.length;
    const width = rows[0]?.length ?? 0;
    const tiles: Tile[] = [];
    for (let y = 0; y < height; y++) {
      const row = rows[y];
      if (row == null || row.length !== width) {
        throw new Error(`Tilemap row ${y} has length ${row?.length ?? 0}, expected ${width}`);
      }
      for (let x = 0; x < width; x++) {
        const ch = row[x];
        const t = CHAR_TO_TILE[ch];
        if (t === undefined) {
          throw new Error(`Unknown tile char '${ch}' at (${x}, ${y})`);
        }
        tiles.push(t);
      }
    }
    return new Tilemap(width, height, tiles);
  }

  at(tx: number, ty: number): Tile {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return Tile.Empty;
    }
    return this.tiles[ty * this.width + tx];
  }

  // Out-of-bounds tile solidity:
  //   - Left/right (tx < 0 or tx >= width) → SOLID (implicit side walls)
  //   - Bottom    (ty >= height)            → SOLID (implicit floor)
  //   - Top       (ty < 0)                  → NOT SOLID (open sky)
  //
  // The top exception matters: without it, the player's max jump from
  // a high platform (e.g. the meadow's row-3 grass islands) is clipped
  // because the world top acts as an invisible ceiling — the jump
  // feels short on the highest platforms. Indoor levels that need a
  // ceiling provide their own with brick tiles at the top rows;
  // outdoor levels intentionally leave the top open so the camera
  // can follow the player into the sky.
  isSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty >= this.height) return true;
    if (ty < 0) return false;
    return TILE_SOLID[this.tiles[ty * this.width + tx]];
  }
}

// 4-connected flood fill over Water tiles. Each connected pool gets a unique
// non-negative id; all other tiles get -1. Runs once at tilemap construction.
function computeWaterBodies(width: number, height: number, tiles: readonly Tile[]): number[] {
  const ids = new Array<number>(width * height).fill(-1);
  let next = 0;
  const stack: number[] = [];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] !== Tile.Water || ids[i] !== -1) continue;
    const id = next++;
    stack.push(i);
    while (stack.length > 0) {
      const j = stack.pop() as number;
      if (ids[j] !== -1) continue;
      ids[j] = id;
      const x = j % width;
      const y = (j - x) / width;
      if (x > 0 && tiles[j - 1] === Tile.Water && ids[j - 1] === -1) stack.push(j - 1);
      if (x < width - 1 && tiles[j + 1] === Tile.Water && ids[j + 1] === -1) stack.push(j + 1);
      if (y > 0 && tiles[j - width] === Tile.Water && ids[j - width] === -1) stack.push(j - width);
      if (y < height - 1 && tiles[j + width] === Tile.Water && ids[j + width] === -1) stack.push(j + width);
    }
  }
  return ids;
}

// Stable per-tile pseudo-random in [0, 1). Different tiles get reproducibly
// different decoration patterns — we want a stone block to look the same every
// time the level renders, never animated by frame.
export function tileHash(tx: number, ty: number, salt: number): number {
  const n = (tx * 374761393 + ty * 668265263 + salt * 1274126177) | 0;
  // Knuth multiplicative hash; final `>>> 0` keeps it unsigned, divide for [0,1).
  return (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
}

// Render the static tilemap (everything except water) into a single Graphics.
// Water is excluded here and rendered separately by `renderWater()` so the
// game loop can animate it (1-px bob).
//
// Visual language: solid base fill, then 1-pixel highlight/shadow edges, then
// a small amount of tile-stable detail (tufts on grass, speckles on dirt,
// cracks on stone). Avoids strokes (which sub-pixel anti-alias) — every mark
// is a `rect(...).fill(...)` so it lands on the logical pixel grid.
export function renderTilemap(map: Tilemap): Graphics {
  const g = new Graphics();
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const t = map.at(tx, ty);
      if (t === Tile.Empty || t === Tile.Water) continue;
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      drawTile(g, t, x, y, tx, ty, tileFaces(map, tx, ty));
    }
  }
  return g;
}

// Which of a tile's faces are open to the air: the tile above and the tile
// below, each neither solid nor water. A floor shows its boards only where
// it can be stood on, and its plaster only where it is a ceiling.
export interface TileFaces {
  up: boolean;
  down: boolean;
}

// Both faces open: how a tile is drawn when there is no map around it.
export const OPEN_FACES: TileFaces = { up: true, down: true };

export function tileFaces(map: Tilemap, tx: number, ty: number): TileFaces {
  const open = (y: number) => !map.isSolid(tx, y) && map.at(tx, y) !== Tile.Water;
  return { up: open(ty - 1), down: open(ty + 1) };
}

// True for a water tile whose neighbor directly above is EMPTY (air) — only
// then does the tile get the meniscus + animated surface treatment.
// Crucially: water tiles capped by a stone/dirt block above are NOT surface
// tiles. They sit inside the level body and render as solid blue, so a lake
// passing under a stone overhang doesn't draw a fake "surface line"
// underneath the stone.
export function isWaterSurface(map: Tilemap, tx: number, ty: number): boolean {
  if (map.at(tx, ty) !== Tile.Water) return false;
  return map.at(tx, ty - 1) === Tile.Empty;
}

// Static body of every water tile. Never animated.
//   - Surface tile (water above is empty/solid): leave the top
//     STATIC_BODY_TOP_OFFSET pixels blank — the animated surface fills them
//     each frame.
//   - Submerged tile (water above): fill the whole tile, no recess. That's
//     what makes a deep lake look like one continuous pool instead of a
//     stack of horizontal bands.
export function renderWaterBody(map: Tilemap): Graphics {
  const g = new Graphics();
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      if (map.at(tx, ty) !== Tile.Water) continue;
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      if (isWaterSurface(map, tx, ty)) {
        const bodyTop = y + STATIC_BODY_TOP_OFFSET;
        g.rect(x, bodyTop, TILE_SIZE, y + TILE_SIZE - bodyTop).fill(TILE_COLORS[Tile.Water]);
      } else {
        g.rect(x, y, TILE_SIZE, TILE_SIZE).fill(TILE_COLORS[Tile.Water]);
      }
    }
  }
  return g;
}

// Solid-rock backdrop for the underground portion of the level. Renders
// behind the tilemap inside the world container, so any cave interior or
// shaft opening reveals rock instead of the cornflower sky / parallax
// mountains that would otherwise show through.
//
// Visually: a dark base fill peppered with hash-stable speckles in two
// shades. The speckles add texture so the rock face doesn't read as a flat
// wall of paint, and because they're hash-derived they stay put as the
// camera moves (no shimmer).
export function renderRockBackground(width: number, startY: number, endY: number): Graphics {
  const g = new Graphics();
  // Base "rock" color — `verdigris` (a neutral medium-dark gray) rather than
  // `opal`. Opal is the color of the foreground parallax mountain, so the
  // backdrop would visually merge into the mountain whenever both appeared
  // in the same view. Verdigris is one notch lighter and slightly warmer,
  // keeping the layers distinct.
  g.rect(0, startY, width, endY - startY).fill(DB32.verdigris);

  // Geological striations — every ~12 rows, a 1-pixel darker band that
  // wavers slightly along its length (sin-modulated) so it reads as a
  // sedimentary layer instead of a ruler-straight stripe. Without these
  // the rock face was a flat field of speckle; with them it gains depth
  // and the Amiga-style "this is a cave wall, not paint" feel.
  for (let bandY = startY + 6; bandY < endY; bandY += 12) {
    const phase = bandY * 0.13;
    for (let x = 0; x < width; x++) {
      const wobble = Math.round(Math.sin(x * 0.04 + phase) * 1.5);
      g.rect(x, bandY + wobble, 1, 1).fill(DB32.opal);
    }
  }

  // Speckle pattern. Two density bands give a couple of shades, which reads
  // as mineral grain rather than dust. Pure rect() — pixel-perfect, no
  // strokes or anti-aliasing.
  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < width; x++) {
      const n = (x * 374761393 + y * 668265263) | 0;
      const h = (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
      if (h < 0.008) {
        g.rect(x, y, 1, 1).fill(DB32.dimGray);
      } else if (h < 0.016) {
        g.rect(x, y, 1, 1).fill(DB32.opal);
      }
    }
  }
  return g;
}

// Animated water surface — the highlight + sheen strip that ripples while
// the player is in the water. Rebuilt each frame into the SAME Graphics so
// the bottom-of-lake static body never moves.
//
// Only renders for SURFACE tiles (water with non-water above). Submerged
// tiles get no top edge treatment so a deep lake reads as one pool.
//
// `surfaceOffset` is in pixels: 0 = rest, negative = surface lifted (ripple
// up), positive = surface dipped (ripple down). Always rounded to an integer
// by the caller so the surface stays on the pixel grid. Applied ONLY to the
// pool whose id matches `activeBodyId`; every other water surface in the
// level stays at rest. Pass -1 (or any unused id) to keep everything still.
//
// The animated strip extends from `sy` down to the static body top, so as
// the surface moves up, the visible water grows by the offset (filler is
// the same color as the static body). No gap ever appears between strip
// and body.
export function renderWaterSurfaceInto(g: Graphics, map: Tilemap, surfaceOffset: number, activeBodyId: number): void {
  g.clear();
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      if (!isWaterSurface(map, tx, ty)) continue;
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      const localOffset = map.waterBodyAt(tx, ty) === activeBodyId ? surfaceOffset : 0;
      const sy = y + WATER_REST_DEPRESSION + localOffset;
      const bodyTop = y + STATIC_BODY_TOP_OFFSET;
      // Surface highlight (the lit "meniscus" line).
      g.rect(x, sy, TILE_SIZE, 1).fill(DB32.cornflower);
      // Darker sheen one pixel below.
      g.rect(x, sy + 1, TILE_SIZE, 1).fill(DB32.royalBlue);
      // Filler down to the static body — same color as body, so the union
      // of (surface + static body) reads as a single seamless pool.
      if (bodyTop > sy + 2) {
        g.rect(x, sy + 2, TILE_SIZE, bodyTop - (sy + 2)).fill(TILE_COLORS[Tile.Water]);
      }
      // Tile-stable sparkle. Attached to the surface so it rides the bob.
      if (tileHash(tx, ty, 200) < 0.3) {
        const sx = 2 + Math.floor(tileHash(tx, ty, 201) * (TILE_SIZE - 4));
        g.rect(x + sx, sy + 2, 1, 1).fill(DB32.lightSteel);
      }
    }
  }
}

export function drawTile(
  g: Graphics,
  t: Tile,
  x: number,
  y: number,
  tx: number,
  ty: number,
  faces: TileFaces = OPEN_FACES,
): void {
  // A ladder has no fill — the backdrop shows between its rungs.
  if (t === Tile.Ladder) {
    drawLadder(g, x, y);
    return;
  }
  // Nor does a puffball's rounded top.
  if (t === Tile.Puffball) {
    drawPuffball(g, x, y, tx);
    return;
  }

  // Base fill — every non-empty tile starts with this. (Water is excluded by
  // the caller in renderTilemap; it has its own renderer.)
  g.rect(x, y, TILE_SIZE, TILE_SIZE).fill(TILE_COLORS[t]);

  switch (t) {
    case Tile.Grass:
      drawGrass(g, x, y, tx, ty);
      break;
    case Tile.Dirt:
      drawDirt(g, x, y, tx, ty);
      break;
    case Tile.Stone:
      drawStone(g, x, y, tx, ty);
      break;
    case Tile.DarkStone:
      drawDarkStone(g, x, y, ty);
      break;
    case Tile.CastleBrick:
      drawCastleBrick(g, x, y, tx, ty);
      break;
    case Tile.CastleFloor:
      drawCastleFloor(g, x, y, tx, ty);
      break;
    case Tile.GoldPillar:
      drawGoldPillar(g, x, y);
      break;
    case Tile.CryptBrick:
      drawCryptBrick(g, x, y, tx, ty);
      break;
    case Tile.CryptFloor:
      drawCryptFloor(g, x, y, ty);
      break;
    case Tile.Timber:
      drawTimber(g, x, y, tx, ty);
      break;
    case Tile.GrottoRock:
      drawGrottoRock(g, x, y, tx, ty);
      break;
    case Tile.Bookcase:
      drawBookcase(g, x, y, tx, ty);
      break;
    case Tile.Heath:
      drawHeath(g, x, y, tx, ty);
      break;
    case Tile.Peat:
      drawPeat(g, x, y, tx, ty);
      break;
    case Tile.Granite:
      drawGranite(g, x, y, tx, ty);
      break;
    case Tile.AutumnTurf:
      drawAutumnTurf(g, x, y, tx, ty);
      break;
    case Tile.Floorboards:
      drawFloorboards(g, x, y, tx, ty, faces);
      break;
    case Tile.PlankWall:
      drawPlankWall(g, x, y, tx, ty);
      break;
    case Tile.PackedEarth:
      drawPackedEarth(g, x, y, tx, ty);
      break;
    case Tile.RootEarth:
      drawPackedEarth(g, x, y, tx, ty);
      drawRoots(g, x, y, tx, ty);
      break;
  }
}

// A floor of the potting shed's house, seen in section: a joist in the void
// between two floors, boards on top where air is above it, and the lath and
// plaster of the ceiling below where air is below it.
function drawFloorboards(g: Graphics, x: number, y: number, tx: number, ty: number, faces: TileFaces): void {
  g.rect(x + (tx & 1 ? 2 : 10), y + 5, 3, 8).fill(DB32.oiledCedar);
  if (faces.up) {
    g.rect(x, y, TILE_SIZE, 4).fill(DB32.rope);
    g.rect(x, y, TILE_SIZE, 1).fill(DB32.twine);
    g.rect(x, y + 4, TILE_SIZE, 1).fill(DB32.oiledCedar);
    g.rect(x + (tileHash(tx, ty, 600) < 0.5 ? 5 : 11), y + 1, 1, 3).fill(DB32.oiledCedar);
    if (tileHash(tx, ty, 601) < 0.4) g.rect(x + 2, y + 2, 1, 1).fill(DB32.topaz);
  }
  if (faces.down) {
    g.rect(x, y + 13, TILE_SIZE, 3).fill(DB32.twine);
    g.rect(x, y + 13, TILE_SIZE, 1).fill(DB32.rope);
  }
}

// The house's walls and the mass between its rooms: 4-px boards, each with
// a dark gap and a lit left edge, and the odd nail head.
function drawPlankWall(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  for (let i = 0; i < TILE_SIZE; i += 4) {
    g.rect(x + i, y, 1, TILE_SIZE).fill(DB32.loulou);
    g.rect(x + i + 1, y, 1, TILE_SIZE).fill(DB32.rope);
    if (tileHash(tx * 4 + i, ty, 610) < 0.25) g.rect(x + i + 2, y + 3, 1, 1).fill(DB32.twine);
  }
}

// The earth under the house: clods, a few dark grains, and in one tile in
// four a stone.
function drawPackedEarth(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  for (let i = 0; i < 5; i++) {
    const px = Math.floor(tileHash(tx, ty, 620 + i) * 14);
    const py = Math.floor(tileHash(tx, ty, 630 + i) * 15);
    g.rect(x + px, y + py, 2, 1).fill(DB32.oiledCedar);
  }
  for (let i = 0; i < 3; i++) {
    const px = Math.floor(tileHash(tx, ty, 640 + i) * 15);
    const py = Math.floor(tileHash(tx, ty, 650 + i) * 15);
    g.rect(x + px, y + py, 1, 1).fill(DB32.valhalla);
  }
  if (tileHash(tx, ty, 660) < 0.25) {
    const px = x + 3 + Math.floor(tileHash(tx, ty, 661) * 9);
    const py = y + 3 + Math.floor(tileHash(tx, ty, 662) * 9);
    g.rect(px, py, 2, 2).fill(DB32.topaz);
    g.rect(px, py, 1, 1).fill(DB32.heather);
  }
}

// One of the two roots out of the underside of an earth tile into the tunnel
// below: its column in the tile, and how far it hangs past the tile's foot.
// The longer ones carry a side root.
export interface HangingRoot {
  x: number;
  length: number;
}

export function rootAt(tx: number, ty: number, i: number): HangingRoot {
  return {
    x: 2 + Math.floor(tileHash(tx, ty, 670 + i) * 12),
    length: 2 + Math.floor(tileHash(tx, ty, 672 + i) * 5),
  };
}

function drawRoots(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  for (let i = 0; i < 2; i++) {
    const root = rootAt(tx, ty, i);
    g.rect(x + root.x, y + 10, 1, 6 + root.length).fill(DB32.rope);
    g.rect(x + root.x, y + TILE_SIZE + root.length, 1, 1).fill(DB32.twine);
    if (root.length > 3) g.rect(x + root.x + 1, y + 17, 1, 2).fill(DB32.rope);
  }
}

function drawGrass(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  // Bright top line — the horizon-marker that reads as "this is the surface."
  g.rect(x, y, TILE_SIZE, 1).fill(DB32.atlantis);

  // Darker grass body bottom — 3-row band that transitions to dirt below,
  // so the grass tile reads as having depth (turf rooted into soil) instead
  // of being a flat green slab. Classic Amiga touch.
  g.rect(x, y + TILE_SIZE - 3, TILE_SIZE, 3).fill(DB32.dell);
  // 1-px dither row at the band edge — softens the cut from mid-green to
  // dark-green so it doesn't look like a hard horizontal stripe.
  for (let i = 0; i < TILE_SIZE; i += 2) {
    g.rect(x + i, y + TILE_SIZE - 4, 1, 1).fill(DB32.dell);
  }

  // Speckled tone variation in the grass body — a few darker green pixels
  // scattered through the middle band so the surface looks like blades, not
  // a painted block.
  for (let i = 0; i < 5; i++) {
    const sx = Math.floor(tileHash(tx, ty, 60 + i) * TILE_SIZE);
    const sy = 2 + Math.floor(tileHash(tx, ty, 70 + i) * 8);
    g.rect(x + sx, y + sy, 1, 1).fill(DB32.dell);
  }
  // Two lighter blade specks above the band — catches the highlight.
  for (let i = 0; i < 2; i++) {
    const sx = Math.floor(tileHash(tx, ty, 80 + i) * TILE_SIZE);
    const sy = 1 + Math.floor(tileHash(tx, ty, 90 + i) * 6);
    g.rect(x + sx, y + sy, 1, 1).fill(DB32.atlantis);
  }

  // A few short tufts standing up off the top edge. Position and count are
  // stable per tile (no jitter across frames). Denser than before for a
  // tufted-meadow feel.
  const tuftCount = tileHash(tx, ty, 1) < 0.4 ? 3 : 4;
  for (let i = 0; i < tuftCount; i++) {
    const tx0 = Math.floor(tileHash(tx, ty, 10 + i) * (TILE_SIZE - 2)) + 1;
    g.rect(x + tx0, y - 1, 1, 1).fill(DB32.atlantis);
    // Occasional 2-px tall tuft for variety.
    if (tileHash(tx, ty, 20 + i) < 0.3) {
      g.rect(x + tx0, y - 2, 1, 1).fill(DB32.atlantis);
    }
  }

  // Sparse wildflowers — roughly 1 grass tile in 5 grows one. A 2-pixel green
  // stem with a 1- or 2-pixel red petal head on top.
  if (tileHash(tx, ty, 100) < 0.2) {
    const fx = 1 + Math.floor(tileHash(tx, ty, 101) * (TILE_SIZE - 2));
    g.rect(x + fx, y - 1, 1, 1).fill(DB32.eltGreen);
    g.rect(x + fx, y - 2, 1, 1).fill(DB32.eltGreen);
    g.rect(x + fx, y - 3, 1, 1).fill(DB32.clairvoyant);
    if (tileHash(tx, ty, 102) < 0.5) {
      g.rect(x + fx + 1, y - 3, 1, 1).fill(DB32.clairvoyant);
    }
  }
}

function drawDirt(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  // Horizontal striation — one slightly darker row, position varies per tile
  // column so the lines don't form a continuous stripe across the level.
  // Reads as compressed-earth strata rather than a flat brown surface.
  const striationY = 2 + Math.floor(tileHash(tx, ty, 70) * 10);
  g.rect(x, y + striationY, TILE_SIZE, 1).fill(DB32.loulou);

  // Speckles — denser than before, mix of darker and lighter so the surface
  // feels grainy.
  for (let i = 0; i < 7; i++) {
    const sx = Math.floor(tileHash(tx, ty, 20 + i) * (TILE_SIZE - 2)) + 1;
    const sy = Math.floor(tileHash(tx, ty, 30 + i) * (TILE_SIZE - 2)) + 1;
    g.rect(x + sx, y + sy, 1, 1).fill(DB32.loulou);
  }
  for (let i = 0; i < 3; i++) {
    const sx = Math.floor(tileHash(tx, ty, 40 + i) * (TILE_SIZE - 2)) + 1;
    const sy = Math.floor(tileHash(tx, ty, 50 + i) * (TILE_SIZE - 2)) + 1;
    g.rect(x + sx, y + sy, 1, 1).fill(DB32.rope);
  }

  // Embedded pebble — about one tile in three has a small gray rock poking
  // through the soil. Adds the "rough mineral earth" feel of Amiga dirt
  // textures instead of flat brown. Capped to topaz so it doesn't read as
  // a glowing white dot on dark soil — a softer "exposed stone" tone.
  if (tileHash(tx, ty, 80) < 0.35) {
    const px = 2 + Math.floor(tileHash(tx, ty, 81) * (TILE_SIZE - 6));
    const py = 4 + Math.floor(tileHash(tx, ty, 82) * (TILE_SIZE - 8));
    g.rect(x + px, y + py, 2, 2).fill(DB32.topaz);
    g.rect(x + px, y + py, 2, 1).fill(DB32.heather);
  }
}

// One brick of the running-bond pattern at global pixel coords (gx, gy),
// 8x8, clipped to the tile rect (tileX, tileY, 16, 16). Bevel reads as
// "lit from above" — a single-pixel top highlight, dark mortar on right
// and bottom. Left edge is intentionally NOT highlighted: the side
// highlight made each brick face read as a pale tile (Minecraft) rather
// than rough masonry (Rome AGA / Gods). The 1-px top highlight alone is
// enough to suggest sun on the upper edge without bleaching the face.
//
// Every brick of a given rock type uses the SAME face color — Amiga
// stone tilesets are uniform within a material. No per-brick accent.
//
// Only the brick edges that actually fall inside the tile are drawn — so
// bricks crossing a tile boundary look correct on both sides.
function drawBrick(
  g: Graphics,
  gx: number,
  gy: number,
  tileX: number,
  tileY: number,
  base: number,
  hi: number,
  lo: number,
): void {
  const x0 = Math.max(gx, tileX);
  const x1 = Math.min(gx + 8, tileX + TILE_SIZE);
  const y0 = Math.max(gy, tileY);
  const y1 = Math.min(gy + 8, tileY + TILE_SIZE);
  if (x0 >= x1 || y0 >= y1) return;

  g.rect(x0, y0, x1 - x0, y1 - y0).fill(base);

  // Top highlight — single pixel along the brick's top edge.
  if (gy >= tileY) {
    g.rect(x0, gy, x1 - x0, 1).fill(hi);
  }
  // Right and bottom mortar lines. Drawn after the top highlight so the
  // top-right corner ends up dark (the bevel signature).
  if (gx + 7 < tileX + TILE_SIZE) {
    g.rect(gx + 7, y0, 1, y1 - y0).fill(lo);
  }
  if (gy + 7 < tileY + TILE_SIZE) {
    g.rect(x0, gy + 7, x1 - x0, 1).fill(lo);
  }
}

// Lay out the brick pattern for a single 16x16 tile. Two brick rows per
// tile (each 8 px tall). Even brick rows are aligned (bricks at x=0,8);
// odd rows shift by +4 px (running-bond stagger). Brick row index is
// global (ty * 2 + halfRow), so the stagger reads continuously across
// vertically adjacent tiles.
function drawBrickPattern(g: Graphics, x: number, y: number, ty: number, base: number, hi: number, lo: number): void {
  for (let halfRow = 0; halfRow < 2; halfRow++) {
    const brickY = y + halfRow * 8;
    const brickRowIndex = ty * 2 + halfRow;
    const offset = (brickRowIndex & 1) === 0 ? 0 : 4;
    // First brick whose right edge is past the tile's left edge.
    const firstBrickX = Math.floor((x - offset) / 8) * 8 + offset;
    for (let brickX = firstBrickX; brickX < x + TILE_SIZE; brickX += 8) {
      drawBrick(g, brickX, brickY, x, y, base, hi, lo);
    }
  }
}

function drawStone(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  drawBrickPattern(g, x, y, ty, TILE_COLORS[Tile.Stone], DB32.lightSteel, DB32.dimGray);

  // Sparse crack — about one brick in twelve gets a single-pixel chip on
  // its face, giving the wall character without becoming busy. Same
  // shadow tone as the mortar so it stays inside the material's palette.
  if (tileHash(tx, ty, 110) < 0.18) {
    const cx = 2 + Math.floor(tileHash(tx, ty, 111) * (TILE_SIZE - 4));
    const cy = 2 + Math.floor(tileHash(tx, ty, 112) * (TILE_SIZE - 4));
    g.rect(x + cx, y + cy, 1, 1).fill(DB32.dimGray);
  }
}

function drawDarkStone(g: Graphics, x: number, y: number, ty: number): void {
  // Same brick pattern as Stone but a darker, more underground palette:
  // topaz base, heather highlight (lighter than base), valhalla shadow
  // (almost black). Reads as the same mason work, deeper in the earth.
  drawBrickPattern(g, x, y, ty, TILE_COLORS[Tile.DarkStone], DB32.heather, DB32.valhalla);
}

// Dressed castle masonry. Same running-bond pattern as Stone/DarkStone, but
// the palette is a neutral mid-grey with a cool top highlight and near-black
// mortar. Reads as "cut stone built for a wall, not raw cave rock." The
// grey was chosen explicitly to avoid any purple/violet tint — the previous
// deepKoamaru base was rejected for that reason.
function drawCastleBrick(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  drawBrickPattern(g, x, y, ty, TILE_COLORS[Tile.CastleBrick], DB32.heather, DB32.valhalla);

  // Occasional darker rivet / fixing point on the face — about one brick in
  // eight. Small touch that suggests the wall is held together by ironwork,
  // a recurring motif in Amiga castle interiors.
  if (tileHash(tx, ty, 130) < 0.12) {
    const rx = 3 + Math.floor(tileHash(tx, ty, 131) * (TILE_SIZE - 6));
    const ry = 3 + Math.floor(tileHash(tx, ty, 132) * (TILE_SIZE - 6));
    g.rect(x + rx, y + ry, 1, 1).fill(DB32.valhalla);
  }
}

// Polished castle flagstone. One notch LIGHTER than the wall (heather vs
// dimGray) so the floor catches more ambient light — the reference shows
// the same hierarchy: walls darker, floor brighter, both clearly the same
// "indoor stone" family. Highlight is lightSteel (the strongest cool light
// the palette gives short of white) so the polished sheen reads even in
// dim corners.
function drawCastleFloor(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  drawBrickPattern(g, x, y, ty, TILE_COLORS[Tile.CastleFloor], DB32.lightSteel, DB32.dimGray);

  // Very sparse polish glint — a single bright pixel on roughly one tile in
  // twelve. Mimics candlelight catching a worn edge. Same hash channel as
  // grass speckle so we never collide with another tile's variation.
  if (tileHash(tx, ty, 140) < 0.08) {
    const px = 4 + Math.floor(tileHash(tx, ty, 141) * (TILE_SIZE - 8));
    const py = 4 + Math.floor(tileHash(tx, ty, 142) * (TILE_SIZE - 8));
    g.rect(x + px, y + py, 1, 1).fill(DB32.white);
  }
}

// Crypt masonry. Same running-bond pattern as CastleBrick but in true
// neutral dark greys with BRIGHT WHITE highlights on the top bevel —
// the "reflets blancs" the user explicitly asked for. The contrast
// (near-black base + near-white edge) reads as polished dark stone
// catching candlelight, not the muted purple/green/blue tones the DB32
// dark colours produce.
function drawCryptBrick(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  drawBrickPattern(g, x, y, ty, TILE_COLORS[Tile.CryptBrick], CRYPT_HI, CRYPT_LO);

  // Sparse pure-white sparkle — about one brick in twelve catches an
  // extra glint on its face. Reinforces the "reflets blancs" feel
  // without being busy.
  if (tileHash(tx, ty, 150) < 0.08) {
    const cx = 2 + Math.floor(tileHash(tx, ty, 151) * (TILE_SIZE - 4));
    const cy = 2 + Math.floor(tileHash(tx, ty, 152) * (TILE_SIZE - 4));
    g.rect(x + cx, y + cy, 1, 1).fill(DB32.white);
  }
}

// Crypt floor — one notch lighter than the wall so the floor catches
// more of the candlelight, just enough to walk by. Same dark brick
// pattern, same bright white highlights.
function drawCryptFloor(g: Graphics, x: number, y: number, ty: number): void {
  drawBrickPattern(g, x, y, ty, TILE_COLORS[Tile.CryptFloor], CRYPT_HI, CRYPT_LO);
}

// Timber beam / plank. A lit top edge (the surface the player stands on),
// a dark underside, and two grain lines whose length varies per tile so a
// run of planks doesn't read as one printed strip. A peg every few tiles
// says "nailed down" without any extra geometry.
function drawTimber(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  g.rect(x, y, TILE_SIZE, 2).fill(DB32.rope);
  g.rect(x, y, TILE_SIZE, 1).fill(DB32.twine);
  g.rect(x, y + TILE_SIZE - 2, TILE_SIZE, 2).fill(DB32.valhalla);
  const a = 2 + Math.floor(tileHash(tx, ty, 160) * 6);
  const b = 1 + Math.floor(tileHash(tx, ty, 161) * 6);
  g.rect(x + a, y + 5, TILE_SIZE - a - 2, 1).fill(DB32.loulou);
  g.rect(x + b, y + 9, TILE_SIZE - b - 4, 1).fill(DB32.loulou);
  // Plank joint on the left edge of roughly every other tile.
  if (tileHash(tx, ty, 162) < 0.5) {
    g.rect(x, y + 2, 1, TILE_SIZE - 4).fill(DB32.valhalla);
  }
  if (tileHash(tx, ty, 163) < 0.25) {
    g.rect(x + 7, y + 3, 2, 2).fill(DB32.twine);
  }
}

// Grotto rock. Not masonry — no running bond — just grain: a few lighter
// pixels and short streaks per tile, seeded by position, and about one tile
// in fourteen holding a cyan fleck that catches the glow.
function drawGrottoRock(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  for (let i = 0; i < 5; i++) {
    const px = Math.floor(tileHash(tx, ty, 170 + i) * TILE_SIZE);
    const py = Math.floor(tileHash(tx, ty, 180 + i) * TILE_SIZE);
    const w = i < 2 ? 3 : 1;
    g.rect(x + Math.min(px, TILE_SIZE - w), y + py, w, 1).fill(GROTTO_GRAIN);
  }
  if (tileHash(tx, ty, 190) < 0.07) {
    const px = 2 + Math.floor(tileHash(tx, ty, 191) * (TILE_SIZE - 4));
    const py = 2 + Math.floor(tileHash(tx, ty, 192) * (TILE_SIZE - 4));
    g.rect(x + px, y + py, 1, 1).fill(DB32.viking);
  }
}

// Library ladder: two rails and two rungs per tile, so a column of them
// reads as one ladder with even rungs. Rails at 3 and 12 leave the player's
// 12-px body room to stand inside them.
function drawLadder(g: Graphics, x: number, y: number): void {
  g.rect(x + 2, y, 2, TILE_SIZE).fill(DB32.rope);
  g.rect(x + 12, y, 2, TILE_SIZE).fill(DB32.rope);
  g.rect(x + 2, y, 1, TILE_SIZE).fill(DB32.twine);
  g.rect(x + 12, y, 1, TILE_SIZE).fill(DB32.twine);
  for (const ry of [3, 11]) {
    g.rect(x + 4, y + ry, 8, 1).fill(DB32.twine);
    g.rect(x + 4, y + ry + 1, 8, 1).fill(DB32.oiledCedar);
  }
}

// One tile of bookcase: a shelf board across the bottom and a row of spines
// above it, colours and heights picked per spine from the tile's hash, so a
// wall of these never repeats. The top edge is lit, like timber, because the
// tops of the stacks are walked on.
function drawBookcase(g: Graphics, x: number, y: number, tx: number, ty: number): void {
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
  g.rect(x, y + 1, TILE_SIZE, TILE_SIZE - 3).fill(DB32.valhalla);
  let cx = x + 1;
  let i = 0;
  while (cx < x + TILE_SIZE - 1) {
    const w = 1 + Math.floor(tileHash(tx * 7 + i, ty, 200) * 2);
    const top = 2 + Math.floor(tileHash(tx * 7 + i, ty, 201) * 4);
    const color = spines[Math.floor(tileHash(tx * 7 + i, ty, 202) * spines.length)];
    const width = Math.min(w, x + TILE_SIZE - 1 - cx);
    g.rect(cx, y + top, width, TILE_SIZE - 3 - top).fill(color);
    g.rect(cx, y + top, width, 1).fill(DB32.pancho);
    cx += w + (tileHash(tx * 7 + i, ty, 203) < 0.15 ? 1 : 0);
    i += 1;
  }
  g.rect(x, y + TILE_SIZE - 2, TILE_SIZE, 2).fill(DB32.rope);
  g.rect(x, y, TILE_SIZE, 1).fill(DB32.twine);
}

// Heath: the surface of the hill. A line of frost along the top, moss under
// it, and sprigs of heather standing up out of it — two to four per tile,
// placed by hash, so the skyline of a run of heath is ragged, not ruled.
function drawHeath(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  g.rect(x, y, TILE_SIZE, 1).fill(HEATH_FROST);
  g.rect(x, y + TILE_SIZE - 5, TILE_SIZE, 5).fill(PEAT);
  for (let i = 0; i < TILE_SIZE; i += 3) {
    g.rect(x + i + (ty & 1), y + TILE_SIZE - 6, 1, 1).fill(PEAT);
  }
  const sprigs = 2 + Math.floor(tileHash(tx, ty, 210) * 3);
  for (let i = 0; i < sprigs; i++) {
    const sx = 1 + Math.floor(tileHash(tx, ty, 211 + i) * (TILE_SIZE - 2));
    const h = 2 + Math.floor(tileHash(tx, ty, 216 + i) * 3);
    g.rect(x + sx, y - h + 1, 1, h).fill(HEATHER);
    g.rect(x + sx, y - h + 1, 1, 1).fill(HEATHER_HI);
  }
  if (tileHash(tx, ty, 220) < 0.3) {
    g.rect(x + 4 + Math.floor(tileHash(tx, ty, 221) * 8), y + 4, 2, 1).fill(HEATH_FROST);
  }
}

// Peat: near-black, with pale roots threading through it sideways.
function drawPeat(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  for (let i = 0; i < 2; i++) {
    const ry = 2 + Math.floor(tileHash(tx, ty, 230 + i) * (TILE_SIZE - 4));
    const rx = Math.floor(tileHash(tx, ty, 232 + i) * 6);
    const len = 4 + Math.floor(tileHash(tx, ty, 234 + i) * 8);
    g.rect(x + rx, y + ry, Math.min(len, TILE_SIZE - rx), 1).fill(PEAT_ROOT);
  }
}

// Granite: no running bond. Each tile decides from its hash whether its right
// and bottom edges are a crack, so blocks come out in odd sizes — one tile,
// two, a long slab — the way a weathered outcrop splits. A lit edge sits
// above and left of each crack, and lichen spots the faces.
function drawGranite(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  const crackRight = tileHash(tx, ty, 240) < 0.4;
  const crackBottom = tileHash(tx, ty, 241) < 0.45;
  if (crackRight) {
    g.rect(x + TILE_SIZE - 1, y, 1, TILE_SIZE).fill(GRANITE_CRACK);
    g.rect(x + TILE_SIZE - 2, y + 1, 1, TILE_SIZE - 2).fill(GRANITE_HI);
  }
  if (crackBottom) {
    g.rect(x, y + TILE_SIZE - 1, TILE_SIZE, 1).fill(GRANITE_CRACK);
  }
  if (tileHash(tx, ty - 1, 241) < 0.45) {
    g.rect(x + 1, y, TILE_SIZE - 2, 1).fill(GRANITE_HI);
  }
  for (let i = 0; i < 2; i++) {
    if (tileHash(tx, ty, 244 + i) < 0.5) {
      const lx = 2 + Math.floor(tileHash(tx, ty, 246 + i) * (TILE_SIZE - 5));
      const ly = 2 + Math.floor(tileHash(tx, ty, 248 + i) * (TILE_SIZE - 5));
      g.rect(x + lx, y + ly, 2, 1).fill(LICHEN);
      g.rect(x + lx + 1, y + ly + 1, 1, 1).fill(LICHEN);
    }
  }
}

// Puffball: a fat round cap filling the tile, rounded off at the top corners,
// pale lilac with a darker underside and a couple of soft spots. Its stalk is
// whatever is drawn under it.
function drawPuffball(g: Graphics, x: number, y: number, tx: number): void {
  g.rect(x + 3, y + 1, TILE_SIZE - 6, 1).fill(PUFFBALL);
  g.rect(x + 1, y + 2, TILE_SIZE - 2, 2).fill(PUFFBALL);
  g.rect(x, y + 4, TILE_SIZE, TILE_SIZE - 7).fill(PUFFBALL);
  g.rect(x, y + TILE_SIZE - 3, TILE_SIZE, 3).fill(PUFFBALL_SHADE);
  g.rect(x + 4, y + 2, 3, 1).fill(DB32.white);
  g.rect(x + 3 + (tx % 3) * 3, y + 7, 2, 2).fill(PUFFBALL_SHADE);
  g.rect(x + 10 - (tx % 2) * 4, y + 5, 2, 1).fill(PUFFBALL_SHADE);
}

// Autumn turf: a lit top edge, straw-coloured blades standing up out of it,
// a band of soil underneath, and fallen leaves lying on it — two or three a
// tile, in the garden's reds and golds, placed by hash.
function drawAutumnTurf(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  g.rect(x, y, TILE_SIZE, 1).fill(TURF_LIGHT);
  g.rect(x, y + TILE_SIZE - 6, TILE_SIZE, 6).fill(DB32.oiledCedar);
  for (let i = 0; i < TILE_SIZE; i += 3) {
    g.rect(x + i + (ty & 1), y + TILE_SIZE - 7, 1, 1).fill(DB32.oiledCedar);
  }
  for (let i = 0; i < 3; i++) {
    const bx = Math.floor(tileHash(tx, ty, 260 + i) * TILE_SIZE);
    g.rect(x + bx, y - 1, 1, 2).fill(TURF_DARK);
  }
  const leaves = [DB32.tahitiGold, DB32.clairvoyant, DB32.rope];
  for (let i = 0; i < 3; i++) {
    if (tileHash(tx, ty, 270 + i) < 0.55) {
      const lx = 1 + Math.floor(tileHash(tx, ty, 273 + i) * (TILE_SIZE - 3));
      const ly = 2 + Math.floor(tileHash(tx, ty, 276 + i) * 5);
      g.rect(x + lx, y + ly, 2, 1).fill(leaves[i]);
    }
  }
}

// Golden classical column. Vertical "round column" shading per tile: a
// bright fluting line on the left (catching the light), a deep shadow band
// on the right (the column receding into the room), and a centre seam to
// suggest the cylindrical face. Not the brick pattern — pillars in the
// reference read as one continuous polished surface, not stacked stones.
//
// Each tile is self-contained: two pillar tiles stacked vertically still
// produce a continuous column because the per-tile pattern is identical
// top-to-bottom. Phase-3 polish can add capitals (when the tile above is
// empty) and bases (tile below is floor) by extending this with neighbor
// awareness in renderTilemap.
function drawGoldPillar(g: Graphics, x: number, y: number): void {
  const goldHi = DB32.goldenFizz;
  const goldShadow = DB32.stinger;
  const goldDeepShadow = DB32.oiledCedar;

  // Base is already filled by drawTile with TILE_COLORS[Tile.GoldPillar]
  // (rainforest). The flutes carve light/dark stripes into that base.

  // Bright catch-light along the left edge — the column is "lit from the
  // upper-left," same convention as every other tile in this game.
  g.rect(x + 2, y, 1, TILE_SIZE).fill(goldHi);

  // Centre seam — a single darker line down the middle suggests the
  // cylinder turning past its highlight.
  g.rect(x + 8, y, 1, TILE_SIZE).fill(goldShadow);

  // Right-side falloff — two adjacent dark stripes give the column visual
  // depth as it recedes from the light. The outer one is darker to fake a
  // gradient inside the 32-color palette's limits.
  g.rect(x + 13, y, 1, TILE_SIZE).fill(goldShadow);
  g.rect(x + 14, y, 1, TILE_SIZE).fill(goldDeepShadow);
}

// Solid indoor backdrop for castle / dungeon interiors. Renders a single
// near-black rectangle the size of the level — sits behind the tilemap, so
// any empty space inside the keep reads as the deep blackness of a stone
// hall lit only by candles. Replaces renderRockBackground for the indoor
// flavor, where the cave-rock texture would read as "dirt on the walls."
//
// First cut had faint horizontal bands every 24 rows in `loulou` (a dark
// plum) for "subtle depth." Against the very dark base they actually read
// as bright red stripes — wrong. Removed. Phase 3 polish can layer in
// distant pillar silhouettes or candle-glow halos to break uniformity in
// a way that reads as ambient atmosphere instead of paint scratches.
export function renderIndoorBackdrop(width: number, startY: number, endY: number): Graphics {
  const g = new Graphics();
  // valhalla — the darkest navy in DB32. Black would feel too flat against
  // the cool greys of the brickwork; valhalla keeps the room "indoors at
  // night" without disappearing.
  g.rect(0, startY, width, endY - startY).fill(DB32.valhalla);
  return g;
}

// Crypt backdrop — even darker than indoor-dark. Pure black, for the
// "candle-lit hideout deep underground" feel. Against the CryptBrick
// (opal) walls and CryptFloor (verdigris) the black backdrop reads as
// "you can't see the back of the room" which is exactly what we want.
export function renderCryptBackdrop(width: number, startY: number, endY: number): Graphics {
  const g = new Graphics();
  g.rect(0, startY, width, endY - startY).fill(DB32.black);
  return g;
}

// Grotto backdrop — the back wall of the glow grotto. Darker than its rock
// tiles so the walls stand forward, but never empty: a fine grain sampled on
// a 4-px grid (per-pixel would be millions of checks for a level this size),
// strata that waver across the whole width, and one cell in sixty holding a
// faint cyan glint, the glowcaps' light caught in the stone.
export const GROTTO_BACK = 0x0c1220;
export const GROTTO_BACK_GRAIN = 0x131b2d;
export const GROTTO_BACK_STRATA = 0x182236;
export const GROTTO_BACK_GLINT = 0x2a6b7a;

export function renderGrottoBackdrop(width: number, startY: number, endY: number): Graphics {
  const g = new Graphics();
  g.rect(0, startY, width, endY - startY).fill(GROTTO_BACK);
  for (let bandY = startY + 20; bandY < endY; bandY += 44) {
    const phase = bandY * 0.07;
    for (let x = 0; x < width; x += 2) {
      const wobble = Math.round(Math.sin(x * 0.021 + phase) * 4 + Math.sin(x * 0.007 + phase * 2) * 6);
      g.rect(x, bandY + wobble, 2, 1).fill(GROTTO_BACK_STRATA);
    }
  }
  for (let y = startY; y < endY; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const n = (x * 374761393 + y * 668265263) | 0;
      const h = (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
      if (h < 0.016) {
        g.rect(x, y, 1, 1).fill(GROTTO_BACK_GLINT);
      } else if (h < 0.2) {
        g.rect(x, y, h < 0.08 ? 2 : 1, 1).fill(GROTTO_BACK_GRAIN);
      }
    }
  }
  return g;
}

// Library backdrop — the wall behind the stacks: dark wood, a shelf every
// 24 px, and on each shelf a row of spines in colours muted almost to the
// wood's, so the room reads as books all the way up without the back wall
// ever competing with the stacks in front of it. Sampled per spine, not per
// pixel, so a hall this size is a few thousand rects.
export const LIBRARY_BACK = 0x1c1418;
export const LIBRARY_SHELF = 0x2e2018;
export const LIBRARY_SPINES = [0x3a2228, 0x2a2a3a, 0x24342a, 0x3a3020, 0x302430] as const;

export function renderLibraryBackdrop(width: number, startY: number, endY: number): Graphics {
  const g = new Graphics();
  g.rect(0, startY, width, endY - startY).fill(LIBRARY_BACK);
  for (let y = startY + 20; y < endY; y += 24) {
    g.rect(0, y, width, 2).fill(LIBRARY_SHELF);
    let x = 0;
    let i = 0;
    while (x < width) {
      const n = (x * 374761393 + y * 668265263 + i) | 0;
      const h = (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
      const w = 2 + Math.floor(h * 3);
      const tall = 12 + Math.floor(h * 7);
      if (h > 0.08) g.rect(x, y - tall, w, tall).fill(LIBRARY_SPINES[Math.floor(h * 97) % LIBRARY_SPINES.length]);
      x += w + (h < 0.15 ? 3 : 1);
      i += 1;
    }
  }
  // Pilasters every 160 px break the wall into bays.
  for (let x = 72; x < width; x += 160) g.rect(x, startY, 10, endY - startY).fill(LIBRARY_SHELF);
  return g;
}

// Masonry backdrop — the cistern's back wall: blocks 32 × 16 in running bond,
// darker than the crypt brick in front, damp streaks running down from some
// joints, and the odd patch of moss. Sampled per block.
export const MASONRY_BACK = 0x14171c;
export const MASONRY_JOINT = 0x0a0c10;
export const MASONRY_LIGHT = 0x1c2128;
export const MASONRY_DAMP = 0x101820;
export const MASONRY_MOSS = 0x1e2a1e;

export function renderMasonryBackdrop(width: number, startY: number, endY: number): Graphics {
  const g = new Graphics();
  g.rect(0, startY, width, endY - startY).fill(MASONRY_BACK);
  for (let y = startY; y < endY; y += 16) {
    g.rect(0, y, width, 1).fill(MASONRY_JOINT);
    const offset = ((y - startY) / 16) % 2 === 0 ? 0 : 16;
    for (let x = -offset; x < width; x += 32) {
      g.rect(x, y, 1, 16).fill(MASONRY_JOINT);
      const n = (x * 374761393 + y * 668265263) | 0;
      const h = (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
      if (h < 0.3) g.rect(x + 2, y + 2, 26, 1).fill(MASONRY_LIGHT);
      if (h > 0.85) g.rect(x + 6 + Math.floor(h * 16), y + 1, 2, 30).fill(MASONRY_DAMP);
      if (h > 0.6 && h < 0.63) g.rect(x + 4, y + 11, 8, 4).fill(MASONRY_MOSS);
    }
  }
  return g;
}

// Where the water surface sits inside the tile, at rest.
//   `WATER_REST_DEPRESSION` pixels from the top of the tile = the recessed
//   "bank above the water" zone (transparent, lets the underground void
//   show through).
//   `STATIC_BODY_TOP_OFFSET` pixels from the top of the tile = where the
//   never-animated body of water starts. The surface (highlight + sheen)
//   animates between these two — when it rises by 1 px, the surface line
//   moves up but the body stays put.
export const WATER_REST_DEPRESSION = 2;
export const STATIC_BODY_TOP_OFFSET = WATER_REST_DEPRESSION + 4;

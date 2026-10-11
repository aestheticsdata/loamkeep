import type { DecorationSpec } from '@entities/decoration';
import type { Entity, InteractContext } from '@entities/entity';
import type { LandmarkSpec } from '@entities/landmark';
import type { Vec2 } from '@types';
import { Tilemap } from '@world/tilemap';

// A named point inside a level. Doors target these by id, the level's default
// spawn is one of these by id, and respawn/teleport features will reuse the
// same lookup.
export interface SpawnPoint {
  id: string;
  // Top-left of the player AABB in world (logical) pixels.
  x: number;
  y: number;
}

// Which parallax flavor sits behind this level. The meadow's distant-hill
// silhouettes don't fit an indoor castle; the keep wants either nothing or
// a dim interior backdrop. Add more flavors here as new biomes arrive.
// 'night' is the belfry's sky: stars, a moon and dark hills, behind
// whatever part of a level its backdrop leaves uncovered. 'autumn' is the
// kitchen garden's: a low sun in a gold-to-violet evening sky. 'zenith' is
// the observatory's: the clearest night in the game, and the spiral in it.
export type ParallaxFlavor = 'meadow' | 'keep' | 'night' | 'autumn' | 'zenith';

// What kind of solid backdrop sits at the back of the world container,
// behind the tilemap.
//   'cave'        - dark rock texture with speckle + striation bands.
//                   Right for outdoor levels whose caves want a granite
//                   feel showing through any gap in the main floor.
//   'indoor-dark' - flat near-black (valhalla) fill. Right for indoor
//                   levels (castle, keep): the cave texture reads as
//                   "dirt on the walls" in here, which is wrong.
//   'crypt-black' - PURE black fill. The darkest backdrop available, for
//                   spaces meant to feel "candle-lit hideout deep
//                   underground" — you can't see the back of the room.
//   'grotto'      - deep blue-black rock with a fine grain, wavering strata
//                   and the odd cyan glint: a cave you can see the back of
//                   by the light of what grows in it, never a flat void.
//   'library'     - the library's back wall: shelf on shelf of books in deep
//                   shadow, behind the stacks you can stand on.
//   'masonry'     - the cistern's back wall: big dark blocks, damp streaks
//                   running down them, moss low where the water has been.
export type BackdropKind = 'cave' | 'indoor-dark' | 'crypt-black' | 'grotto' | 'library' | 'masonry';

// A rectangle of the level in tiles: top-left (col, row) and its size.
export interface TileRect {
  col: number;
  row: number;
  cols: number;
  rows: number;
}

// Whether a tile (column, row) lies inside a rectangle of tiles.
export function holdsTile(r: TileRect, tile: Vec2): boolean {
  return tile.x >= r.col && tile.x < r.col + r.cols && tile.y >= r.row && tile.y < r.row + r.rows;
}

// What the back wall of a lit room is made of, in HD (room-backdrops-hd.ts).
// Each is the room's own material one ramp step down, so anything that can
// be stood on reads in front of it.
export const ROOM_BACKDROP = {
  shed: 'shed',
  drawers: 'drawers',
  kitchen: 'kitchen',
  wallGreen: 'wall-green',
  wallRose: 'wall-rose',
  rafters: 'rafters',
  brick: 'brick',
  earth: 'earth',
  pool: 'pool',
} as const;
export type RoomBackdrop = (typeof ROOM_BACKDROP)[keyof typeof ROOM_BACKDROP];

// A room of a level lit room by room (the potting shed's house): where it
// is, what its back wall is, and how much light it has of its own — 0.62 is
// a room as it is drawn, every 0.16 less a step down the ramp.
export interface LitRoom extends TileRect {
  id: string;
  name: string;
  backdrop: RoomBackdrop;
  ambient: number;
  // The camera holds still on this room while the player is in it, instead
  // of following them: the shed, so that it looks no bigger than outside.
  holdsCamera?: boolean;
}

// A light in a lit level, in tiles: a lamp, a candle, the stove (warm: they
// scatter specks of their light on the wall behind them) or a window (cool:
// light only). It adds `strength` at its centre, falling to nothing at
// `radius`.
export interface LightSource {
  x: number;
  y: number;
  radius: number;
  strength: number;
  warm: boolean;
}

// A level lit room by room. HD only: classic draws it as it draws any dark
// interior.
export interface LevelLighting {
  rooms: readonly LitRoom[];
  lights: readonly LightSource[];
}

// Authored description of a level. Pure data + factory functions — the
// runtime `Level` (below) is built from this and mounted by Game.
//
// Per-level fields that came from constants in the single-level draft:
//   rockBgStartRow  - row where the dark "rock" backdrop begins. Meadow uses
//                     the grass row (so cave-gaps in the main floor reveal
//                     rock from above). The keep, being entirely underground,
//                     starts at row 0 so every pixel of its backdrop is rock.
//   parallax        - flavor key (see ParallaxFlavor).
//   defaultSpawnId  - the spawn used when the level is first entered.
export interface LevelSpec {
  id: string;
  // Display name (used in dev logging today; will surface in UI later).
  name: string;
  // ASCII rows fed to Tilemap.fromAscii (see CHAR_TO_TILE in tilemap.ts).
  rows: readonly string[];
  // Named spawn points — at minimum the default one. Doors target these.
  spawns: readonly SpawnPoint[];
  defaultSpawnId: string;
  landmarks: readonly LandmarkSpec[];
  decorations: readonly DecorationSpec[];
  // Factory for the level's interactive entities. Re-runs on every mount, so
  // entity instances are fresh each visit. Persistent state (e.g. a lever's
  // pulled/unpulled position) belongs in WorldState, not on the entity.
  //
  // The context passed in lets entities trigger world-affecting actions
  // without holding a reference to Game directly. Phase 1 only uses
  // `transitionTo`; later phases will extend InteractContext.
  createEntities(ctx: InteractContext): readonly Entity[];
  parallax: ParallaxFlavor;
  backdrop: BackdropKind;
  // Row at which the backdrop starts. For outdoor levels this is the grass
  // row (so cave-gaps above ground reveal rock from above); for indoor
  // levels this is row 0 (the whole level wants the indoor backdrop).
  rockBgStartRow: number;
  // When present, the backdrop is drawn only behind these rectangles instead
  // of the full-width band from rockBgStartRow down: for caves inside a hill
  // that has open sky on both sides of it.
  backdropRegions?: readonly TileRect[];
  // True when sky lies above the top row, so the camera may follow a jump
  // above it. False under a ceiling: the camera stops at row 0.
  openSky: boolean;
  // Rooms with back walls and light of their own, and the lamps in them.
  // Rooms not yet entered stay dark until the player walks in.
  lighting?: LevelLighting;
}

// Materialised level: spec + built Tilemap. Mounting still happens in Game,
// which owns the world container and player. We pre-build the Tilemap here
// because parsing ASCII rows is fail-fast (throws on ragged rows / unknown
// chars) and we'd rather discover authoring mistakes at registry-load time
// than mid-transition.
export class Level {
  readonly spec: LevelSpec;
  readonly tilemap: Tilemap;

  constructor(spec: LevelSpec) {
    this.spec = spec;
    this.tilemap = Tilemap.fromAscii(spec.rows);
  }

  spawn(id: string): SpawnPoint {
    const sp = this.spec.spawns.find((s) => s.id === id);
    if (!sp) {
      throw new Error(`Level '${this.spec.id}' has no spawn '${id}'`);
    }
    return sp;
  }
}

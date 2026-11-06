import type { Audio } from '@systems/audio';
import type { Ground, SolidBox, Walker } from '@systems/physics';
import type { WorldState } from '@systems/world-state';
import type { AABB, Vec2 } from '@types';
import type { TileRect } from '@world/level';
import type { Container } from 'pixi.js';

// Display mode for a "you can interact with this" prompt above an entity.
//   'tutorial' - full "press E" tooltip (used the first time, before the
//                player has discovered the interact mechanic on a landmark)
//   'simple'   - small "!" indicator (used afterward)
//   null       - hidden
export type PromptMode = 'tutorial' | 'simple' | null;

// Context handed to an entity when the player interacts with it (presses E
// while in range), and also to the level's `createEntities` factory.
//
// Phase 1 callbacks:
//   transitionTo - swap the active level. Doors call this on E.
//   worldState   - shared cross-level flag store. No entity uses it yet,
//                  but it's wired so phase-2 levers / pressure plates /
//                  gates can read+write without an interface change.
//
// Phase 2 will likely extend this with audio cues and tilemap-solidity
// overlay hooks (for portcullises that block movement until a flag flips).
export interface InteractContext {
  // Switch to another level at the named spawn point. Caller is responsible
  // for picking a valid spawn id; Level.spawn() throws if it doesn't exist.
  transitionTo(levelId: string, spawnId: string): void;
  readonly worldState: WorldState;
  // For the sound an interaction makes (a lever's clunk, the chains of the
  // gate it opens).
  readonly audio: Audio;
}

// Something a lever drives (see Lever): a portcullis, a vent, a pump. It is
// named by `switchId` in the lever's targets. `setActive(true, false)` is the
// lever being pulled, and plays out; `setActive(true, true)` is a lever found
// already pulled on a later visit, and is instant. `cue` plays the sound of
// it happening, if it has one.
export interface Switchable {
  readonly switchId: string;
  setActive(on: boolean, instant: boolean): void;
  cue?(audio: Audio): void;
}

export function isSwitchable(entity: Entity): entity is Entity & Switchable {
  return 'switchId' in entity && 'setActive' in entity;
}

// Something the player can catch hold of in the air and hang from: a
// chandelier, a clothesline. While they hold it, it moves them; jumping lets
// go, flung with how fast it was going.
export interface Grip {
  // Whether a body here can take hold of it.
  catches(pos: Vec2, size: Vec2): boolean;
  // Where the top-left of a body of this size goes while it holds on.
  holdAt(size: Vec2): Vec2;
  // How fast where it holds is moving, px/s.
  velocity(): Vec2;
  // Whether it lets go of its own accord now (a clothesline at its end).
  releases?(): boolean;
}

// What an entity that takes part in the physics step sees of the world: the
// player, and the ground everything stands on (the boxes of every entity
// included, its own among them).
export interface StepWorld {
  // The player, and what they are hanging from, if anything.
  player: Walker & { readonly grip?: Grip | null };
  ground: Ground;
}

// Base shape every world entity satisfies. Entities live in the active
// level's `levelLayer` container, scroll with the camera, and (for the
// interactable subset) participate in the proximity-prompt loop.
//
// Optional members are how we express capabilities without a class hierarchy:
//   - update?           → entity ticks each frame (lever cooldowns, plate
//                         depress animation, …)
//   - step?             → entity moves with the fixed physics step, before
//                         the player does (a mill wheel that carries them, a
//                         bale they push)
//   - solids?           → boxes the player collides with; the same objects
//                         every call, moved in place
//   - isPlayerInRange?  → entity is interactable; Game's prompt loop should
//                         consider it
//   - interact?         → called when player presses E while in range
//   - setPromptMode?    → entity can show/hide its proximity indicator
//   - hurts?            → whether the player's box touches a part of it that
//                         sends them back to the checkpoint, as a bramble does
//                         (a falling stone)
//   - grips?            → what the player can catch hold of (Grip)
//   - waters?           → water that is not tiles, px (a tank filling up):
//                         the player swims in it as in water tiles
//   - calm?             → updraft tiles where the air is still just now (a
//                         vent between its gusts, or one not yet switched on)
//
// An entity that's purely visual (a flickering candle, say) would set only
// `sprite` + `update`. A door is interactable but has no per-frame logic so
// it skips `update` and implements the interaction set.
export interface Entity {
  readonly sprite: Container;
  update?(dt: number): void;
  step?(dt: number, world: StepWorld): void;
  solids?(): readonly SolidBox[];
  isPlayerInRange?(playerPos: Vec2, playerSize: Vec2): boolean;
  interact?(ctx: InteractContext): void;
  setPromptMode?(mode: PromptMode): void;
  hurts?(playerPos: Vec2, playerSize: Vec2): boolean;
  grips?(): readonly Grip[];
  waters?(): readonly AABB[];
  calm?(): readonly TileRect[];
}

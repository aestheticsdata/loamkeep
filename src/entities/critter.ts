import type { Entity } from '@entities/entity';
import type { GreetingSpec } from '@systems/greeting';
import type { AABB, Vec2 } from '@types';
import type { CreatureId } from '@world/creatures';

// A creature with a page in the creatures book and a line to say the first
// time the player touches it. The hill's crowd — hare, hedgehog, bat, snail,
// frog, fireflies — all implement this, and Game greets them with one loop
// instead of one method per species the way the meadow's four were written.
export interface Critter extends Entity {
  readonly species: CreatureId;
  // The popup this creature opens: its portrait and its line.
  readonly greeting: GreetingSpec;
  // True when the popup must wait for the player to be standing: anything
  // met in mid-jump would otherwise freeze the player in the air.
  readonly greetsOnlyOnGround: boolean;
  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean;
}

export function isCritter(entity: Entity): entity is Critter {
  return 'species' in entity && 'greeting' in entity;
}

// Whether the player's box overlaps a creature's, both in world pixels.
export function touches(box: AABB, playerPos: Vec2, playerSize: Vec2): boolean {
  return (
    playerPos.x < box.x + box.width &&
    playerPos.x + playerSize.x > box.x &&
    playerPos.y < box.y + box.height &&
    playerPos.y + playerSize.y > box.y
  );
}

// A walker that paces between two x bounds, turning at each. Shared by the
// critters that walk; each one decides how fast and how it is drawn.
export interface PatrolSpec {
  x: number;
  y: number;
  minX: number;
  maxX: number;
}

import { GRAVITY, GRAVITY_FALL_MULT, TERMINAL_VELOCITY, TILE_SIZE } from '@constants';
import type { Vec2 } from '@types';
import type { Tilemap } from '@world/tilemap';

// Any dynamic body in the world (player today; NPCs, falling props later).
export interface Body {
  pos: Vec2; // top-left corner in logical pixels
  vel: Vec2; // px/s
  size: Vec2; // width/height in logical pixels
  onGround: boolean; // set by stepPhysics each tick
  // The box the body stood on at the end of its last step, if it stood on
  // one rather than on a tile: what a moving platform carries.
  standingOn?: SolidBox | null;
  // If true, stepPhysics skips its normal gravity/terminal-velocity step —
  // the caller is responsible for applying swim physics to `vel.y` instead.
  swimming?: boolean;
  // The same, for a body on a ladder: it owns vel.y while it climbs.
  climbing?: boolean;
}

// A body that walks: which way it is trying to go this step (-1, 0 or 1),
// whether or not anything lets it. What a pushed block reads.
export interface Walker extends Body {
  readonly move: number;
}

// Something solid in the world that is not a tile: a pushed bale, a mill
// paddle. Its owner moves it, and keeps the same object for as long as it
// lives, so a body can tell which one it is standing on. A one-way box is
// only ever landed on from above — a plank a body can jump up through.
export interface SolidBox {
  x: number;
  y: number;
  w: number;
  h: number;
  oneWay?: boolean;
}

// What a body collides with: the level's tiles and every box in it.
export interface Ground {
  tilemap: Tilemap;
  boxes: readonly SolidBox[];
}

// How far a body's feet may be from a box's top and still count as on it:
// a box that moved down a little since the body last stood on it.
const BOX_SNAP = 0.5;

// Advance one body by dt:
//   1. Apply asymmetric gravity — but ONLY while airborne. Adding gravity at
//      rest on the ground accumulates sub-pixel drift between snap-to-ground
//      passes and renders as a 1-pixel jitter.
//   2. Cap fall speed at TERMINAL_VELOCITY.
//   3. Move X, then resolve X collision against the tiles and the boxes.
//   4. Move Y, then resolve Y collision (also sets onGround).
//   5. Probe ground: if we ended this frame not flagged grounded but a solid
//      tile or box is directly under our feet, snap and re-flag. Catches the
//      static rest case where resolveY does nothing because vel.y is exactly 0.
//
// Axis-separated AABB collision: doing X and Y as two separate passes makes
// wall-slide behave naturally and prevents corner-grab artifacts.
export function stepPhysics(body: Body, ground: Ground, dt: number): void {
  const wasGrounded = body.onGround;

  // Normal gravity is skipped when the body is swimming — swim physics is
  // owned by the entity (see Player.update). stepPhysics still does the
  // position update and tile collision so swimming bodies bonk on walls
  // and floors the same way.
  if (!body.swimming && !body.climbing) {
    if (!wasGrounded) {
      // Airborne: normal asymmetric gravity.
      const g = body.vel.y < 0 ? GRAVITY : GRAVITY * GRAVITY_FALL_MULT;
      body.vel.y += g * dt;
    } else if (body.vel.y > 0) {
      // Grounded with leftover downward velocity (would be accumulated drift):
      // clear it. vel.y < 0 here means a jump impulse was just applied — leave
      // that alone.
      body.vel.y = 0;
    }
    if (body.vel.y > TERMINAL_VELOCITY) body.vel.y = TERMINAL_VELOCITY;
  }

  // Each frame starts not-grounded; physics below may flag it back to true.
  body.onGround = false;
  body.standingOn = null;

  body.pos.x += body.vel.x * dt;
  resolveX(body, ground.tilemap);
  resolveBoxesX(body, ground.boxes);

  const before = { top: body.pos.y, bottom: body.pos.y + body.size.y };
  body.pos.y += body.vel.y * dt;
  resolveY(body, ground.tilemap);
  resolveBoxesY(body, { boxes: ground.boxes, before });

  if (!body.onGround && body.vel.y >= 0) {
    probeGround(body, ground);
  }
}

// Moves a body by (dx, dy) — carried by what it stands on — unless that
// would put it inside a solid tile, axis by axis.
export function carry(body: Body, tilemap: Tilemap, by: Vec2): void {
  body.pos.x += by.x;
  if (overlapsTiles(body, tilemap)) body.pos.x -= by.x;
  body.pos.y += by.y;
  if (overlapsTiles(body, tilemap)) body.pos.y -= by.y;
}

function overlapsTiles(body: Body, tilemap: Tilemap): boolean {
  const x0 = Math.floor((body.pos.x + 1) / TILE_SIZE);
  const x1 = Math.floor((body.pos.x + body.size.x - 1) / TILE_SIZE);
  const y0 = Math.floor((body.pos.y + 1) / TILE_SIZE);
  const y1 = Math.floor((body.pos.y + body.size.y - 1) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) if (tilemap.isSolid(tx, ty)) return true;
  }
  return false;
}

// X collision uses a 1px vertical inset so the body doesn't catch on tile
// corners while sliding along a wall.
function resolveX(body: Body, tilemap: Tilemap): void {
  if (body.vel.x === 0) return;

  const tileTop = Math.floor((body.pos.y + 1) / TILE_SIZE);
  const tileBottom = Math.floor((body.pos.y + body.size.y - 1) / TILE_SIZE);

  if (body.vel.x > 0) {
    const tileX = Math.floor((body.pos.x + body.size.x - 1) / TILE_SIZE);
    for (let ty = tileTop; ty <= tileBottom; ty++) {
      if (tilemap.isSolid(tileX, ty)) {
        body.pos.x = tileX * TILE_SIZE - body.size.x;
        body.vel.x = 0;
        return;
      }
    }
  } else {
    const tileX = Math.floor(body.pos.x / TILE_SIZE);
    for (let ty = tileTop; ty <= tileBottom; ty++) {
      if (tilemap.isSolid(tileX, ty)) {
        body.pos.x = (tileX + 1) * TILE_SIZE;
        body.vel.x = 0;
        return;
      }
    }
  }
}

// Walls of boxes, with the same 1px vertical inset. One-way boxes have none.
function resolveBoxesX(body: Body, boxes: readonly SolidBox[]): void {
  if (body.vel.x === 0) return;
  for (const box of boxes) {
    if (box.oneWay || !overlapsY(body, box, 1) || !overlapsX(body, box, 0)) continue;
    body.pos.x = body.vel.x > 0 ? box.x - body.size.x : box.x + box.w;
    body.vel.x = 0;
    return;
  }
}

// Y collision also uses a 1px horizontal inset for the same reason.
function resolveY(body: Body, tilemap: Tilemap): void {
  if (body.vel.y === 0) return;

  const tileLeft = Math.floor((body.pos.x + 1) / TILE_SIZE);
  const tileRight = Math.floor((body.pos.x + body.size.x - 1) / TILE_SIZE);

  if (body.vel.y > 0) {
    // Falling — check the row at the body's feet.
    const tileY = Math.floor((body.pos.y + body.size.y - 1) / TILE_SIZE);
    for (let tx = tileLeft; tx <= tileRight; tx++) {
      if (tilemap.isSolid(tx, tileY)) {
        body.pos.y = tileY * TILE_SIZE - body.size.y;
        body.vel.y = 0;
        body.onGround = true;
        return;
      }
    }
  } else {
    // Rising — bonk on a ceiling tile.
    const tileY = Math.floor(body.pos.y / TILE_SIZE);
    for (let tx = tileLeft; tx <= tileRight; tx++) {
      if (tilemap.isSolid(tx, tileY)) {
        body.pos.y = (tileY + 1) * TILE_SIZE;
        body.vel.y = 0;
        return;
      }
    }
  }
}

// Where the body's edges were before this step's Y move: a box is landed on
// only by a body whose feet were above its top, and bonked only by one whose
// head was below its underside.
interface BoxPass {
  boxes: readonly SolidBox[];
  before: { top: number; bottom: number };
}

function resolveBoxesY(body: Body, pass: BoxPass): void {
  if (body.vel.y > 0 || body.onGround) {
    // Falling (or just landed on a tile): the highest box top the feet
    // crossed, if it is above the tile they stopped on.
    let landing: SolidBox | null = null;
    for (const box of pass.boxes) {
      if (!overlapsX(body, box, 1)) continue;
      if (pass.before.bottom > box.y + BOX_SNAP || body.pos.y + body.size.y < box.y) continue;
      if (!landing || box.y < landing.y) landing = box;
    }
    if (landing && landing.y <= body.pos.y + body.size.y) {
      body.pos.y = landing.y - body.size.y;
      body.vel.y = 0;
      body.onGround = true;
      body.standingOn = landing;
    }
  } else if (body.vel.y < 0) {
    for (const box of pass.boxes) {
      if (box.oneWay || !overlapsX(body, box, 1)) continue;
      const underside = box.y + box.h;
      if (pass.before.top < underside - BOX_SNAP || body.pos.y > underside) continue;
      body.pos.y = underside;
      body.vel.y = 0;
      return;
    }
  }
}

// Check the tile directly below the body. If solid, snap to its top and flag
// grounded. Called when resolveY didn't trigger (vel.y === 0) — i.e., static
// rest. Without this, onGround would flicker false every frame at rest. A box
// whose top is at the feet counts the same.
function probeGround(body: Body, ground: Ground): void {
  const tileLeft = Math.floor((body.pos.x + 1) / TILE_SIZE);
  const tileRight = Math.floor((body.pos.x + body.size.x - 1) / TILE_SIZE);
  const tileBelow = Math.floor((body.pos.y + body.size.y) / TILE_SIZE);

  for (let tx = tileLeft; tx <= tileRight; tx++) {
    if (ground.tilemap.isSolid(tx, tileBelow)) {
      body.pos.y = tileBelow * TILE_SIZE - body.size.y;
      body.onGround = true;
      return;
    }
  }
  const feet = body.pos.y + body.size.y;
  for (const box of ground.boxes) {
    if (!overlapsX(body, box, 1) || Math.abs(box.y - feet) > BOX_SNAP) continue;
    body.pos.y = box.y - body.size.y;
    body.onGround = true;
    body.standingOn = box;
    return;
  }
}

// Whether the body and the box overlap along an axis, the body's span
// narrowed by `inset` px at each end.
function overlapsX(body: Body, box: SolidBox, inset: number): boolean {
  return body.pos.x + inset < box.x + box.w && body.pos.x + body.size.x - inset > box.x;
}

function overlapsY(body: Body, box: SolidBox, inset: number): boolean {
  return body.pos.y + inset < box.y + box.h && body.pos.y + body.size.y - inset > box.y;
}

import {
  CLIMB_SIDE_SPEED,
  CLIMB_SPEED,
  CLIMB_STEP_DISTANCE,
  COYOTE_TIME,
  DB32,
  JUMP_BUFFER,
  JUMP_RELEASE_MULT,
  JUMP_VELOCITY,
  LADDER_EXIT_BOOST,
  PUFFBALL_VELOCITY,
  SUBMERGED_TINT,
  SWIM_DOWN_SPEED,
  SWIM_HORIZONTAL_SPEED,
  SWIM_STROKE_INTERVAL,
  SWIM_UP_SPEED,
  TILE_SIZE,
  WADE_SPEED,
  WALK_SPEED,
  WATER_ENTRY_VEL_CAP,
  WATER_EXIT_BOOST,
  WATER_GRAVITY,
  WATER_TERMINAL_VEL,
} from '@constants';
import { KEYS_DOWN, KEYS_JUMP, KEYS_LEFT, KEYS_RIGHT, type KeyReader } from '@systems/input';
import { type Body, stepPhysics } from '@systems/physics';
import type { Vec2 } from '@types';
import { Tile, type Tilemap } from '@world/tilemap';
import { Graphics } from 'pixi.js';

// Walk-cycle angular frequency (rad/s). One sin period spans both feet — at
// 8 rad/s a full cycle is ≈0.78 s and you see roughly 2.5 footstep transitions
// per second. Tweak if the cadence feels off vs WALK_SPEED.
const WALK_CYCLE_FREQ = 8;

// Horizontal distance (logical px) covered between two footstep SFX. The
// visual stride is sin-driven and irregular near the extremes, but audio
// cadence reads as wrong if it varies — so audio fires on raw distance, not
// on sin phase. At WALK_SPEED = 96 px/s, 20 px gives a step every ~0.21 s.
const FOOTSTEP_DISTANCE = 20;

// Procedural figure. Geometry is redrawn from scratch every frame so that the
// feet, arm, and body-bob can animate as pure integer-pixel offsets — no
// `scale` tricks, which would break pixel-art rendering for a fractional
// frame. Cost is ~20 rect() calls per frame, well below anything that matters.
//
// The character is composed bottom-up around (0, 0): feet at the origin, head
// at negative y. That puts the natural anchor at the AABB body's bottom-center
// (`pos.x + size.x/2`, `pos.y + size.y`), so no pivot offset is needed.

export class Player implements Body {
  pos: Vec2;
  vel: Vec2 = { x: 0, y: 0 };
  // Where the body was before the last physics step, and where it is drawn:
  // between the two, by how far the display frame sits into the next step.
  // Physics runs at a fixed 60 Hz; without this a 120 Hz display would show
  // the figure moving on every other frame. The camera follows `renderPos`.
  private readonly prevPos: Vec2;
  readonly renderPos: Vec2;
  readonly size: Vec2 = { x: 12, y: 16 };
  onGround = false;
  readonly sprite: Graphics;

  // One-shot event flags. Set true for a single physics step when the
  // corresponding event happens; the game loop reads them after each update()
  // to trigger SFX (or anything else that should pop on the transition).
  // Cleared at the start of every update().
  didJumpThisFrame = false;
  didBounceThisFrame = false;
  didLandThisFrame = false;
  didFootstepThisFrame = false;
  didEnterWaterThisFrame = false;
  didSwimStrokeThisFrame = false;
  // Whether the body's mid-point is currently inside a Water tile. Public so
  // the game loop can use it to pause water-surface animation while the
  // player isn't in the lake.
  inWater = false;
  // True when ANY tile the body AABB overlaps is Water — i.e., even a
  // single pixel of overlap counts. Drives the blue cast on the whole
  // figure (sprite tint) so the visual stays consistent from "first toe
  // wet" through "head submerged" without intermediate states.
  private bodyTouchesWater = false;
  // True when the player is in water AND not standing on a solid floor —
  // i.e., floating / swimming through the water column. Drives the swim
  // arm animation and the swim-stroke SFX. Setting this also tells the
  // physics pass to skip its own gravity so the entity controls vel.y.
  swimming = false;
  // True while the player is on a ladder and has taken hold of it — pressed
  // up or down there, and has not since stepped or climbed off. Like
  // `swimming`, it tells stepPhysics to leave vel.y to us.
  climbing = false;

  // Jump-feel timers (count DOWN; > 0 means active).
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;

  // Animation state.
  private facing: 1 | -1 = 1;
  private elapsedTime = 0;
  // Quantized step offset (-1 / 0 / +1) — drives the visual stride only.
  private stepOffset = 0;
  // Distance traveled since the last footstep SFX. Independent of the sin
  // phase so the audio cadence stays regular.
  private footstepAccumulator = 0;
  // Countdown to the next automatic swim-stroke SFX. Counts DOWN while
  // moving in water; reset to the interval when not moving.
  private swimStrokeTimer = 0;
  // Distance climbed since the last rung footstep.
  private climbDistance = 0;

  constructor(x: number, y: number) {
    this.pos = { x, y };
    this.prevPos = { x, y };
    this.renderPos = { x, y };
    this.sprite = new Graphics();
    this.syncSprite();
    this.interpolate(1);
  }

  // Put the body somewhere outright — a spawn, a door, a respawn — at rest,
  // with nothing to interpolate from.
  placeAt(x: number, y: number): void {
    this.pos.x = x;
    this.pos.y = y;
    this.prevPos.x = x;
    this.prevPos.y = y;
    this.vel.x = 0;
    this.vel.y = 0;
    this.interpolate(1);
  }

  // Draw the body `alpha` of the way from its previous step to its current
  // one (0..1). Called once per display frame, after the steps have run.
  // Position stays a float — the PixiJS Application has roundPixels enabled,
  // which rounds renderables once at render time. Rounding here as well would
  // compound with the camera/world container's own rounding and produce a
  // 1-pixel horizontal jitter during smooth scrolling.
  interpolate(alpha: number): void {
    this.renderPos.x = this.prevPos.x + (this.pos.x - this.prevPos.x) * alpha;
    this.renderPos.y = this.prevPos.y + (this.pos.y - this.prevPos.y) * alpha;
    this.sprite.x = this.renderPos.x + this.size.x / 2;
    this.sprite.y = this.renderPos.y + this.size.y;
  }

  // One fixed physics step (dt is always PHYSICS_STEP — see Game).
  update(input: KeyReader, dt: number, tilemap: Tilemap): void {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
    this.elapsedTime += dt;
    const wasGrounded = this.onGround;
    const wasInWater = this.inWater;

    // Clear last-frame event flags. They'll be set again below if the
    // matching event fires this frame.
    this.didJumpThisFrame = false;
    this.didBounceThisFrame = false;
    this.didLandThisFrame = false;
    this.didFootstepThisFrame = false;
    this.didEnterWaterThisFrame = false;
    this.didSwimStrokeThisFrame = false;

    // Water detection.
    //   `inWater`          = body midpoint sits in a Water tile. Drives the
    //                        SFX / swim-mode physics / water-surface anim.
    //   `bodyTouchesWater` = ANY tile the AABB overlaps is Water. Drives
    //                        the binary blue tint on the whole sprite —
    //                        as soon as the figure dips a toe in, it's
    //                        fully blue; the moment every pixel has left
    //                        the water tile, the tint clears. No partial
    //                        / per-pixel split — keeps the visual rule
    //                        trivial to predict.
    const tx = Math.floor((this.pos.x + this.size.x / 2) / TILE_SIZE);
    const midY = Math.floor((this.pos.y + this.size.y / 2) / TILE_SIZE);
    const nowInWater = tilemap.at(tx, midY) === Tile.Water;
    const leftCol = Math.floor(this.pos.x / TILE_SIZE);
    const rightCol = Math.floor((this.pos.x + this.size.x - 1) / TILE_SIZE);
    const topRowAABB = Math.floor(this.pos.y / TILE_SIZE);
    const bottomRowAABB = Math.floor((this.pos.y + this.size.y - 1) / TILE_SIZE);
    let touches = false;
    for (let col = leftCol; col <= rightCol && !touches; col++) {
      for (let row = topRowAABB; row <= bottomRowAABB; row++) {
        if (tilemap.at(col, row) === Tile.Water) {
          touches = true;
          break;
        }
      }
    }
    this.bodyTouchesWater = touches;
    if (nowInWater && !wasInWater) {
      this.didEnterWaterThisFrame = true;
      // Crush most of the falling momentum the instant we enter water —
      // otherwise the player carries their full fall velocity straight to
      // the bottom of a deep lake before drag has a chance to act.
      if (this.vel.y > WATER_ENTRY_VEL_CAP) this.vel.y = WATER_ENTRY_VEL_CAP;
    }
    this.inWater = nowInWater;
    const onLadder = !nowInWater && tilemap.at(tx, midY) === Tile.Ladder;
    const wasClimbing = this.climbing;
    // `swimming` is purely a visual + physics-bypass flag: in water AND
    // not standing on solid ground. Used by drawFigure to switch to the
    // swim arm pose and by stepPhysics to skip its own gravity.
    this.swimming = nowInWater && !this.onGround;

    // Horizontal direction input — facing follows it whether on land,
    // wading, or swimming.
    let move = 0;
    if (input.isAnyDown(KEYS_LEFT)) move -= 1;
    if (input.isAnyDown(KEYS_RIGHT)) move += 1;
    if (move > 0) this.facing = 1;
    else if (move < 0) this.facing = -1;

    const upHeld = input.isAnyDown(KEYS_JUMP);
    const downHeld = input.isAnyDown(KEYS_DOWN);
    // Take hold of a ladder by pressing up or down on it; let go by leaving
    // its column, or by standing at its foot with up released.
    this.climbing = onLadder && (wasClimbing || upHeld || downHeld);
    if (this.climbing && this.onGround && !upHeld) this.climbing = false;

    if (this.climbing) {
      // === LADDER MODE: up climbs, down descends, neither hangs.
      if (upHeld) this.vel.y = -CLIMB_SPEED;
      else if (downHeld) this.vel.y = CLIMB_SPEED;
      else this.vel.y = 0;
      if (move !== 0) {
        this.vel.x = move * CLIMB_SIDE_SPEED;
      } else {
        // Hands on the rungs: with no sideways key held, drift to the middle
        // of the ladder's column, never faster than a sideways step. Without
        // it a player who took hold a pixel or two off-centre carries those
        // pixels under the ledge at the top and climbs into its underside.
        const centreX = tx * TILE_SIZE + (TILE_SIZE - this.size.x) / 2;
        const dx = centreX - this.pos.x;
        this.vel.x = Math.sign(dx) * Math.min(Math.abs(dx) / dt, CLIMB_SIDE_SPEED);
      }
      this.climbDistance += Math.abs(this.vel.y) * dt;
      if (this.climbDistance >= CLIMB_STEP_DISTANCE) {
        this.climbDistance -= CLIMB_STEP_DISTANCE;
        this.didFootstepThisFrame = true;
      }
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    } else if (this.inWater) {
      // === WATER MODE — one rule:
      //   on ground + no jump → walk at WADE_SPEED, vel.y = 0
      //   jump held           → swim UP at SWIM_UP_SPEED
      //   down held + off ground → dive at SWIM_DOWN_SPEED
      //   otherwise off ground → slow sink (gravity capped at WATER_TERMINAL_VEL)
      const jumpDown = input.isAnyDown(KEYS_JUMP);
      const diveDown = input.isAnyDown(KEYS_DOWN);
      if (jumpDown) {
        this.vel.y = -SWIM_UP_SPEED;
      } else if (this.onGround) {
        this.vel.y = 0;
      } else if (diveDown) {
        this.vel.y = SWIM_DOWN_SPEED;
      } else {
        this.vel.y += WATER_GRAVITY * dt;
        if (this.vel.y > WATER_TERMINAL_VEL) this.vel.y = WATER_TERMINAL_VEL;
      }
      this.vel.x = move * (this.onGround ? WADE_SPEED : SWIM_HORIZONTAL_SPEED);

      // Swim stroke SFX while actually swimming (off ground) and moving.
      if (this.swimming && (move !== 0 || jumpDown || diveDown)) {
        this.swimStrokeTimer -= dt;
        if (this.swimStrokeTimer <= 0) {
          this.didSwimStrokeThisFrame = true;
          this.swimStrokeTimer = SWIM_STROKE_INTERVAL;
        }
      } else {
        this.swimStrokeTimer = SWIM_STROKE_INTERVAL;
      }

      // Land jump timers don't apply in water.
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    } else {
      // === LAND MODE (walk + jump) ===
      if (this.onGround) {
        this.coyoteTimer = COYOTE_TIME;
      } else {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      }
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

      if (input.isAnyPressed(KEYS_JUMP)) {
        this.jumpBufferTimer = JUMP_BUFFER;
      }

      this.vel.x = move * WALK_SPEED;

      // On a puffball: thrown up, unless down is held to stand on it.
      if (this.onGround && !downHeld && standingOn(this, tilemap) === Tile.Puffball) {
        this.vel.y = -PUFFBALL_VELOCITY;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.didBounceThisFrame = true;
      }

      if (this.coyoteTimer > 0 && this.jumpBufferTimer > 0) {
        this.vel.y = -JUMP_VELOCITY;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        // Suppress the jump SFX when there's a solid tile immediately
        // above the player's head — typical case: walking inside a
        // 1-tile-tall passage. The velocity above will be zeroed by the
        // ceiling collision in stepPhysics, so the player doesn't
        // visibly move; playing the "jump up" sound in that case feels
        // wrong because nothing actually happened.
        if (!hasCeilingAboveHead(this.pos, this.size, tilemap)) {
          this.didJumpThisFrame = true;
        }
      }

      if (this.vel.y < 0 && input.isAnyReleased(KEYS_JUMP)) {
        this.vel.y *= JUMP_RELEASE_MULT;
      }
    }

    // Exit boost — the frame the midpoint crosses out of water while still
    // moving up, convert the swim-up momentum into a small jump so the
    // player can pop onto a one-tile-high bank. Symmetric (works either
    // direction); needs no extra input.
    if (wasInWater && !this.inWater && this.vel.y < 0) {
      this.vel.y = Math.min(this.vel.y, -WATER_EXIT_BOOST);
    }

    // Off the top of a ladder while climbing: the same pop as out of water,
    // enough to land on the ledge the ladder leans against.
    if (wasClimbing && !onLadder && this.vel.y < 0) {
      this.vel.y = Math.min(this.vel.y, -LADDER_EXIT_BOOST);
    }
    if (!this.climbing) this.climbDistance = 0;

    // Gravity + position + tile collision. body.swimming = true makes
    // stepPhysics skip its own gravity — we own vel.y in water mode.
    stepPhysics(this, tilemap, dt);

    // Landing detection — went from airborne to grounded this frame.
    if (!wasGrounded && this.onGround) {
      this.didLandThisFrame = true;
    }

    // Walk-cycle stepOffset (visual stride). Drives both normal walking
    // and wading (on ground in water) — same pose, same sine phase.
    const stepping = this.onGround && this.vel.x !== 0;
    const phase = stepping ? Math.sin(this.elapsedTime * WALK_CYCLE_FREQ) : 0;
    this.stepOffset = Math.round(phase);

    // Footstep cadence — distance-based. Fires for both dry walking and
    // wading; the game loop picks the right SFX (footstep vs wadeStep)
    // based on `inWater`.
    if (stepping) {
      this.footstepAccumulator += Math.abs(this.vel.x) * dt;
      if (this.footstepAccumulator >= FOOTSTEP_DISTANCE) {
        this.footstepAccumulator -= FOOTSTEP_DISTANCE;
        this.didFootstepThisFrame = true;
      }
    } else {
      this.footstepAccumulator = 0;
    }

    this.syncSprite();
  }

  // Rebuild the figure each frame so feet, arm, and body-bob can swing as
  // 1-pixel integer offsets. Stays pixel-perfect — no scale-based animation.
  // Cost is ~20 rect() calls/frame. The drawing itself is the module-level
  // drawFigure(), shared with the title screen; this just derives the pose
  // from physics state. Water cast is applied uniformly via sprite.tint in
  // syncSprite — drawFigure draws with original colors.
  private paintFigure(): void {
    const walking = this.onGround && this.vel.x !== 0;
    this.sprite.clear();
    drawFigure(this.sprite, {
      airborne: !this.onGround && !this.climbing,
      swimming: this.swimming,
      climbing: this.climbing,
      climbPhase: Math.floor(this.climbDistance / (CLIMB_STEP_DISTANCE / 2)) & 1,
      stepOffset: this.stepOffset,
      bodyBob: walking ? -Math.abs(this.stepOffset) : 0,
      swimPhase: Math.sin(this.elapsedTime * 5),
    });
  }

  // Pose, facing and tint. Position is interpolate()'s job.
  //
  // scale.x = ±1 mirrors the figure in place around its vertical axis (the
  // character is drawn symmetrically around x=0, so the mirror reads as
  // "facing left"). scale.y stays at 1: any non-integer scale would break
  // pixel-art rendering.
  private syncSprite(): void {
    this.paintFigure();
    this.sprite.scale.set(this.facing, 1);
    // Binary water cast: any tile of the body in water → whole figure
    // tinted blue; otherwise normal colors. PixiJS multiplies the tint
    // into every pixel of the Graphics in one shot.
    this.sprite.tint = this.bodyTouchesWater ? SUBMERGED_TINT : 0xffffff;
  }
}

// Everything drawFigure needs to know about the current pose. Plain data,
// not a Player, so the title screen can draw the wanderer standing on a
// painted meadow with no tilemap or physics behind it.
export interface FigurePose {
  airborne: boolean;
  swimming: boolean;
  // Quantised stride (-1 / 0 / +1). Feet swing by this; the arm swings the
  // opposite way.
  stepOffset: number;
  // Vertical offset (0 or -1) of everything above the feet: the walk bob in
  // the game, the breathing on the title screen.
  bodyBob: number;
  // -1..1 driver for the front-crawl arms while swimming.
  swimPhase: number;
  // On a ladder: back to the viewer, hands up on the rungs, which hand is
  // higher alternating with `climbPhase` (0 or 1) as the player climbs.
  climbing?: boolean;
  climbPhase?: number;
}

// The hooded wanderer, drawn around (0, 0) with the feet at the origin and
// the head at negative y — the same anchor convention as every other sprite.
//
// Visual brief: a small hooded wanderer in a pale near-white cloak, with two
// gray-white boots and a darker satchel strap doubling as the visible arm.
// The 1-pixel hard outline along the cloak and hood sides is what reads as
// "Amiga sprite" rather than "Minecraft block" — the colors themselves stay
// pale-gray. Three poses: idle, walk (foot/arm swing + body-bob), jump (feet
// together, diagonal arm), plus the swim stroke.
export function drawFigure(g: Graphics, pose: FigurePose): void {
  const cloak = DB32.lightSteel;
  const cloakHi = DB32.white;
  const cloakLo = DB32.heather;
  const outline = DB32.valhalla; // 1-px hard silhouette outline
  const inside = DB32.valhalla;
  const eye = DB32.twine;
  const boots = DB32.heather;
  const strap = DB32.dimGray;

  const { airborne, swimming, stepOffset, bodyBob } = pose;

  // Feet — two 2×2 boots with a 2-pixel gap between them at rest.
  //   walking : left foot swings +stepOffset, right foot swings -stepOffset
  //             (always moving opposite — looks like alternating strides)
  //   jumping/swimming : both feet pulled together at center
  if (airborne || swimming) {
    g.rect(-2, -2, 2, 2).fill(boots);
    g.rect(0, -2, 2, 2).fill(boots);
  } else {
    g.rect(-3 + stepOffset, -2, 2, 2).fill(boots);
    g.rect(1 - stepOffset, -2, 2, 2).fill(boots);
  }

  // Cloak — main body. 10 wide × 8 tall. Layering:
  //   1. Fill base color.
  //   2. Top highlight (between the outline columns).
  //   3. Bottom shadow row.
  //   4. Side outlines — drawn LAST so they win at every corner.
  //      THIS is what carries the Amiga look: a crisp 1-px dark edge
  //      against any background. Without it the pale cloak read as a
  //      modern flat block.
  g.rect(-5, -10 + bodyBob, 10, 8).fill(cloak);
  g.rect(-4, -10 + bodyBob, 8, 1).fill(cloakHi);
  g.rect(-4, -3 + bodyBob, 8, 1).fill(cloakLo);
  g.rect(-5, -10 + bodyBob, 1, 8).fill(outline);
  g.rect(4, -10 + bodyBob, 1, 8).fill(outline);

  // Hood — 8 wide × 6 tall, sits flush on top of the cloak. Same
  // outline-last layering as the cloak so the silhouette stays crisp.
  g.rect(-4, -16 + bodyBob, 8, 6).fill(cloak);
  g.rect(-3, -16 + bodyBob, 6, 1).fill(cloakHi);
  g.rect(-4, -16 + bodyBob, 1, 6).fill(outline);
  g.rect(3, -16 + bodyBob, 1, 6).fill(outline);

  // Inside the hood: deep shadow + a single warm pixel for the eye.
  g.rect(-3, -15 + bodyBob, 6, 4).fill(inside);
  const eyeY = -13 + bodyBob + (airborne ? -2 : 0);
  g.rect(1, eyeY, 1, 1).fill(eye);

  // Arm — drawn as a 4-pixel diagonal "strap" across the cloak.
  //   walking  : shifts horizontally opposite to the step (arm/leg in
  //              counter-phase reads as natural gait)
  //   jumping  : raised diagonally up-and-forward — the "leap" pose
  //   swimming : front-crawl. Two arms at chest height, lengths
  //              alternating front/back so the figure reads as paddling
  //              even though it isn't rotated.
  //   idle     : at base position
  if (pose.climbing) {
    const high = pose.climbPhase === 1 ? 1 : 0;
    g.rect(-4, -14 - high, 1, 4).fill(strap);
    g.rect(3, -13 - (1 - high), 1, 4).fill(strap);
  } else if (swimming) {
    const frontLen = 3 + Math.round(pose.swimPhase * 2); // 1..5
    const backLen = 3 - Math.round(pose.swimPhase * 2); // 5..1
    for (let i = 0; i < frontLen; i++) {
      g.rect(2 + i, -7, 1, 1).fill(strap);
    }
    for (let i = 0; i < backLen; i++) {
      g.rect(-3 - i, -7, 1, 1).fill(strap);
    }
  } else if (airborne) {
    g.rect(0, -10, 1, 1).fill(strap);
    g.rect(1, -11, 1, 1).fill(strap);
    g.rect(2, -12, 1, 1).fill(strap);
    g.rect(3, -13, 1, 1).fill(strap);
  } else {
    const armDx = -stepOffset;
    g.rect(-4 + armDx, -7 + bodyBob, 1, 1).fill(strap);
    g.rect(-3 + armDx, -6 + bodyBob, 1, 1).fill(strap);
    g.rect(-2 + armDx, -5 + bodyBob, 1, 1).fill(strap);
    g.rect(-1 + armDx, -4 + bodyBob, 1, 1).fill(strap);
  }
}

// The tile under the middle of the body's feet.
function standingOn(body: Body, tilemap: Tilemap): Tile {
  const tx = Math.floor((body.pos.x + body.size.x / 2) / TILE_SIZE);
  const ty = Math.floor((body.pos.y + body.size.y) / TILE_SIZE);
  return tilemap.at(tx, ty);
}

// True if there is a solid tile in the row immediately above the player's
// AABB top edge — i.e. a ceiling right on the head. Used to skip the jump
// SFX in 1-tile-tall passages where the jump impulse would be zeroed by
// ceiling collision in the same frame. The 1-px horizontal inset matches
// resolveY's inset in physics.ts so the column range checked here is
// exactly the column range that would actually collide.
function hasCeilingAboveHead(pos: Vec2, size: Vec2, tilemap: Tilemap): boolean {
  const tileLeft = Math.floor((pos.x + 1) / TILE_SIZE);
  const tileRight = Math.floor((pos.x + size.x - 1) / TILE_SIZE);
  const tileY = Math.floor((pos.y - 1) / TILE_SIZE);
  for (let tx = tileLeft; tx <= tileRight; tx++) {
    if (tilemap.isSolid(tx, tileY)) return true;
  }
  return false;
}

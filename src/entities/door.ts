import { DB32, LANDMARK_INTERACT_RANGE_X, LANDMARK_INTERACT_RANGE_Y, textResolution } from '@constants';
import type { Entity, InteractContext, PromptMode } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import type { Vec2 } from '@types';
import { Container, Graphics, Text } from 'pixi.js';

// Half the visual height of a door body. Used to centre the interaction zone
// in the middle of the door rather than at its base — matches how Landmark
// places its prompt.
const DOOR_HALF_HEIGHT = 11;

// The beacon over every door to another level: where it hangs above the
// door's base, how far it bobs, and how fast. Doors come in every shape — a
// keep door, a bookshelf, a crack in the rock, a stone gate — and the beacon
// is the one thing they share, so a way through always looks like one.
const BEACON_Y = -36;
const BEACON_BOB = 2;
const BEACON_SPEED = 2.4;

// Authored description of a door. The target identifies WHERE pressing E
// leads: which level to load and which spawn point inside that level to
// place the player at. `draw` lets each door pick its own visual (a wooden
// keep door looks different from an iron portcullis or a stone archway).
export interface DoorSpec {
  id: string;
  // World-space position of the door's BASE — the point where it touches the
  // floor tile. Same convention as Landmark / Decoration.
  x: number;
  y: number;
  // Where pressing E takes the player.
  targetLevelId: string;
  targetSpawnId: string;
  // Friendly label shown in the tutorial prompt; falls back to "enter".
  promptLabel?: string;
  // Per-door art. Drawn around the origin (0, 0): feet at the origin, body
  // extending into negative y. Mirrors the Landmark drawBody convention.
  // Optional — when omitted, drawDefaultDoor (a wooden keep door) is used.
  drawBody?(g: Graphics): void;
}

// Default keep-door art. Wooden door with iron banding and small studs —
// 14 wide × 22 tall, drawn around (0, 0) with the foot on the y=0 line so
// the same anchor convention as landmarks works for doors.
//
// Visual brief (matches the dark-castle reference): outer iron frame (near-
// black + steel-blue highlight), inner wood face split into three vertical
// planks by 1-px shadow lines, a stud at each corner of the frame, and a
// small round iron handle on the right side. Reads at the game's tiny scale
// as "a door I should walk up to" without being busy.
function drawDefaultDoor(g: Graphics): void {
  const frame = DB32.valhalla;
  const frameHi = DB32.heather;
  const wood = DB32.oiledCedar;
  const woodHi = DB32.rope;
  const plankLine = DB32.valhalla;
  const stud = DB32.lightSteel;
  const handle = DB32.lightSteel;

  // Outer frame fill — full 14 × 22 silhouette.
  g.rect(-7, -22, 14, 22).fill(frame);
  // Top highlight on the frame.
  g.rect(-6, -22, 12, 1).fill(frameHi);

  // Wood face — inset 2 px from the frame on every side (so the iron frame
  // is visible as a 2-pixel border).
  g.rect(-5, -20, 10, 18).fill(wood);
  // Wood top highlight.
  g.rect(-5, -20, 10, 1).fill(woodHi);

  // Two vertical plank-divider lines split the face into three planks of
  // roughly equal width.
  g.rect(-2, -20, 1, 18).fill(plankLine);
  g.rect(1, -20, 1, 18).fill(plankLine);

  // Iron studs at the four corners of the wood face.
  g.rect(-5, -20, 1, 1).fill(stud);
  g.rect(4, -20, 1, 1).fill(stud);
  g.rect(-5, -3, 1, 1).fill(stud);
  g.rect(4, -3, 1, 1).fill(stud);

  // Small round handle on the right plank, about two-thirds down.
  g.rect(2, -10, 2, 2).fill(handle);
  // Single dark pixel inside the handle to suggest the keyhole.
  g.rect(3, -9, 1, 1).fill(DB32.valhalla);
}

// A door is interactable and triggers a level transition on E. It owns its
// in-world sprite, its proximity prompt (tutorial or simple), and ends at
// the active player-context's transitionTo callback when pressed.
//
// Doors do NOT carry a "discovered" flag — every visit through a door is the
// same transition. If a door becomes one-way or breaks, that's modelled via
// WorldState flags (phase 2+), not on the door itself.
export class Door implements Entity {
  readonly spec: DoorSpec;
  readonly sprite: Container;

  private body: Graphics;
  private readonly beacon: Graphics;
  private prompt: Container | null = null;
  private promptMode: PromptMode = null;
  // The name of the level beyond, shown on the prompt. Set by Game, which
  // owns the level registry; until then the prompt says only what to press.
  private destination = '';
  private elapsed = 0;

  constructor(spec: DoorSpec) {
    this.spec = spec;
    this.sprite = new Container();
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.body = new Graphics();
    (spec.drawBody ?? drawDefaultDoor)(this.body);
    this.sprite.addChild(this.body);
    this.beacon = new Graphics();
    drawBeacon(this.beacon);
    this.beacon.y = BEACON_Y;
    this.sprite.addChild(this.beacon);
    this.elapsed = (spec.x * 0.01) % 3;
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.beacon.y = BEACON_Y + Math.round(Math.sin(this.elapsed * BEACON_SPEED) * BEACON_BOB);
  }

  setDestination(name: string): void {
    this.destination = name;
    // Rebuild a prompt that is already up, so it carries the name.
    const mode = this.promptMode;
    this.setPromptMode(null);
    this.setPromptMode(mode);
  }

  // True if the player's body-center is inside the interaction rectangle
  // centered on the door's mid-height. Reuses the landmark interaction
  // dimensions so the proximity feel is consistent across all interactables.
  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const px = playerPos.x + playerSize.x / 2;
    const py = playerPos.y + playerSize.y / 2;
    const dx = Math.abs(px - this.spec.x);
    const dy = Math.abs(py - (this.spec.y - DOOR_HALF_HEIGHT));
    return dx <= LANDMARK_INTERACT_RANGE_X && dy <= LANDMARK_INTERACT_RANGE_Y;
  }

  setPromptMode(mode: PromptMode): void {
    if (this.promptMode === mode) return;
    if (this.prompt) {
      this.sprite.removeChild(this.prompt);
      this.prompt.destroy({ children: true });
      this.prompt = null;
    }
    this.promptMode = mode;
    // The prompt takes the beacon's place while the player is at the door.
    this.beacon.visible = mode === null;
    if (mode !== null) {
      this.prompt = mode === 'tutorial' ? this.makeTutorialPrompt() : this.makeSimplePrompt();
      this.sprite.addChild(this.prompt);
    }
  }

  // Player pressed E while in range. Delegates the transition to whoever
  // owns the context (Game).
  interact(ctx: InteractContext): void {
    ctx.transitionTo(this.spec.targetLevelId, this.spec.targetSpawnId);
  }

  // Once the player knows E, a door still says where it goes: a small label
  // with the key and the name of the level beyond. A landmark's "!" is not
  // enough here — the question at a door is not whether, but where to.
  private makeSimplePrompt(): Container {
    return this.makeLabel(this.destination ? `E  ${this.destination}` : 'E');
  }

  // Full tutorial tooltip — "press E to enter" by default; doors can pass a
  // custom label via spec.promptLabel for context-specific hints (e.g.
  // "press E to climb" for a future ladder).
  private makeTutorialPrompt(): Container {
    const action = `press E to ${this.spec.promptLabel ?? 'enter'}`;
    return this.makeLabel(this.destination ? `${action}: ${this.destination}` : action);
  }

  private makeLabel(label: string): Container {
    const c = new Container();
    const text = new Text({
      text: label,
      style: { fontFamily: 'monospace', fontSize: 7, fill: DB32.valhalla },
    });
    text.resolution = textResolution();
    const pad = 3;
    const w = Math.ceil(text.width);
    const h = Math.ceil(text.height);
    const boxBottom = -25;
    const boxTop = boxBottom - h - pad * 2;

    const bg = new Graphics()
      .rect(-w / 2 - pad, boxTop, w + pad * 2, boxBottom - boxTop)
      .fill(DB32.pancho)
      .stroke({ color: DB32.oiledCedar, width: 1 });
    text.position.set(-w / 2, boxTop + pad);

    c.addChild(bg);
    c.addChild(text);
    return c;
  }
}

// The beacon: a golden lantern-diamond with a white heart and a small arrow
// under it pointing down at the way through, in a soft round glow. Drawn
// around (0, 0); the door hangs it at BEACON_Y and bobs it.
function drawBeacon(g: Graphics): void {
  drawGlow(g, { x: 0, y: 0, radius: 11, color: DB32.goldenFizz });
  g.rect(-1, -4, 3, 1).fill(DB32.goldenFizz);
  g.rect(-2, -3, 5, 1).fill(DB32.goldenFizz);
  g.rect(-3, -2, 7, 3).fill(DB32.goldenFizz);
  g.rect(-2, 1, 5, 1).fill(DB32.goldenFizz);
  g.rect(-1, 2, 3, 1).fill(DB32.goldenFizz);
  g.rect(0, -2, 1, 3).fill(DB32.white);
  g.rect(-3, -2, 1, 3).fill(DB32.tahitiGold);
  // The arrow.
  g.rect(0, 5, 1, 3).fill(DB32.goldenFizz);
  g.rect(-1, 7, 3, 1).fill(DB32.goldenFizz);
}

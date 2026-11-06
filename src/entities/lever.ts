import { DB32, LANDMARK_INTERACT_RANGE_X, LANDMARK_INTERACT_RANGE_Y } from '@constants';
import { makePromptLabel } from '@entities/door';
import { type Entity, type InteractContext, isSwitchable, type PromptMode, type Switchable } from '@entities/entity';
import { ArtBody } from '@hd/art-body';
import type { Vec2 } from '@types';
import { Container, type Graphics } from 'pixi.js';

// How long the pull takes, s, and in how many drawings.
const PULL = 0.15;
const PULL_FRAMES = 3;
// The middle of the lever's plate, px above its base: where the player
// reaches for.
const HALF_HEIGHT = 8;

// What a lever is: a lever on a wall, or the handle of the garden's pump.
export const LEVER_LOOK = {
  lever: 'lever',
  pump: 'pump',
} as const;

export type LeverLook = (typeof LEVER_LOOK)[keyof typeof LEVER_LOOK];

export interface LeverSpec {
  id: string;
  // Its base: the middle of its tile, on the top of the tile under it.
  x: number;
  y: number;
  // The switchIds of what it drives, in its own level.
  targets: readonly string[];
  // Its WorldState flag, `<level>.<lever>` (`keep.treasury`): set once it is
  // pulled, and read back on every visit after.
  flag: string;
  // Already pulled, on a visit after the one it was pulled on.
  pulled: boolean;
  // A lever unless given.
  look?: LeverLook;
}

// A lever on a wall: E pulls it down, once, and it stays down. Pulling it
// drives its targets (see Switchable): a portcullis rises, a vent starts.
// Found down on a later visit, it sets them instantly (see connectLevers).
export class Lever implements Entity {
  readonly sprite = new Container();
  readonly spec: LeverSpec;
  private readonly body: ArtBody;
  private targets: readonly Switchable[] = [];
  private pulled: boolean;
  // How far through the pull, s; PULL once it is down.
  private time: number;
  private shownFrame = -1;
  private prompt: Container | null = null;
  private promptMode: PromptMode = null;

  constructor(spec: LeverSpec) {
    this.spec = spec;
    this.body = new ArtBody(spec.look ?? LEVER_LOOK.lever);
    this.pulled = spec.pulled;
    this.time = spec.pulled ? PULL : 0;
    this.sprite.position.set(spec.x, spec.y);
    this.sprite.addChild(this.body);
    this.redraw();
  }

  get isPulled(): boolean {
    return this.pulled;
  }

  // What it drives, found among the level's entities.
  connect(targets: readonly Switchable[]): void {
    this.targets = targets;
    if (this.pulled) for (const target of targets) target.setActive(true, true);
  }

  // In reach until it is pulled; after that there is nothing to do with it.
  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    if (this.pulled) return false;
    const dx = Math.abs(playerPos.x + playerSize.x / 2 - this.spec.x);
    const dy = Math.abs(playerPos.y + playerSize.y / 2 - (this.spec.y - HALF_HEIGHT));
    return dx <= LANDMARK_INTERACT_RANGE_X && dy <= LANDMARK_INTERACT_RANGE_Y;
  }

  interact(ctx: InteractContext): void {
    if (this.pulled) return;
    this.pulled = true;
    ctx.worldState.set(this.spec.flag, true);
    ctx.audio.clunk();
    for (const target of this.targets) {
      target.setActive(true, false);
      target.cue?.(ctx.audio);
    }
    this.setPromptMode(null);
  }

  setPromptMode(mode: PromptMode): void {
    if (this.promptMode === mode) return;
    if (this.prompt) {
      this.sprite.removeChild(this.prompt);
      this.prompt.destroy({ children: true });
      this.prompt = null;
    }
    this.promptMode = mode;
    if (mode === null) return;
    const verb = this.spec.look === LEVER_LOOK.pump ? 'pump' : 'pull';
    this.prompt = makePromptLabel(mode === 'tutorial' ? `press E to ${verb}` : 'E');
    this.sprite.addChild(this.prompt);
  }

  update(dt: number): void {
    if (!this.pulled || this.time >= PULL) return;
    this.time = Math.min(PULL, this.time + dt);
    this.redraw();
  }

  private redraw(): void {
    const frame = Math.min(PULL_FRAMES, Math.floor((this.time / PULL) * PULL_FRAMES));
    if (frame === this.shownFrame) return;
    this.shownFrame = frame;
    const down = frame / PULL_FRAMES;
    this.body.draw((g) => (this.spec.look === LEVER_LOOK.pump ? drawPump(g, down) : drawLever(g, down)));
  }
}

// Hands every lever among a level's entities the switchables it names.
export function connectLevers(entities: readonly Entity[]): void {
  const switchables = entities.filter(isSwitchable);
  for (const entity of entities) {
    if (!(entity instanceof Lever)) continue;
    entity.connect(switchables.filter((s) => entity.spec.targets.includes(s.switchId)));
  }
}

// The lever, its base at (0, 0) and its pivot in the middle of its plate:
// an 8 × 5 dimGray wall plate at the foot of the tile, lit along its top,
// two valhalla rivets; a 2-px oiledCedar shaft 10 px long, leaning 30° left
// when up and 30° right when down (`down` is how far between, 0..1), drawn
// as stair steps; a 3 × 3 brown knob with a mandy glint at its end.
function drawLever(g: Graphics, down: number): void {
  g.rect(-4, -5, 8, 5).fill(DB32.dimGray);
  g.rect(-4, -5, 8, 1).fill(DB32.heather);
  g.rect(-3, -2, 1, 1).fill(DB32.valhalla);
  g.rect(2, -2, 1, 1).fill(DB32.valhalla);
  const angle = ((-30 + 60 * down) * Math.PI) / 180;
  const pivot = { x: 0, y: -3 };
  let end = pivot;
  for (let i = 1; i <= 10; i += 2) {
    end = { x: Math.round(pivot.x + Math.sin(angle) * i), y: Math.round(pivot.y - Math.cos(angle) * i) };
    g.rect(end.x - 1, end.y - 1, 2, 2).fill(DB32.oiledCedar);
  }
  g.rect(end.x - 1, end.y - 3, 3, 3).fill(DB32.brown);
  g.rect(end.x - 1, end.y - 3, 1, 1).fill(DB32.mandy);
}

// The garden's pump, its base at (0, 0): a dimGray barrel on a stone plinth
// with a spout, and its long handle levered up from the top of the barrel —
// raised, then pushed down (`down`, 0..1) the way a pump is worked.
function drawPump(g: Graphics, down: number): void {
  g.rect(-6, -3, 12, 3).fill(DB32.topaz);
  g.rect(-6, -3, 12, 1).fill(DB32.heather);
  g.rect(-3, -16, 6, 13).fill(DB32.dimGray);
  g.rect(-3, -16, 1, 13).fill(DB32.heather);
  g.rect(2, -16, 1, 13).fill(DB32.valhalla);
  g.rect(-4, -17, 8, 1).fill(DB32.heather);
  g.rect(3, -12, 4, 2).fill(DB32.dimGray);
  g.rect(6, -10, 1, 2).fill(DB32.venice);
  const angle = ((-40 + 70 * down) * Math.PI) / 180;
  for (let i = 1; i <= 12; i += 2) {
    const x = Math.round(-Math.cos(angle) * i);
    const y = Math.round(-17 + Math.sin(angle) * i);
    g.rect(x - 1, y - 1, 2, 2).fill(DB32.oiledCedar);
  }
}

import { PHYSICS_STEP, TILE_SIZE } from '@constants';
import type { Grip } from '@entities/entity';
import { Player } from '@entities/player';
import { SwingingChandelier } from '@entities/swinging-chandelier';
import { ART_MODE, setArtMode } from '@hd/art-mode';
import { KEYS_JUMP, KEYS_LEFT, type KeyReader } from '@systems/input';
import { loadLevel } from '@world/levels';
import { KEEP_CHANDELIERS } from '@world/levels/old-keep';
import { describe, expect, it } from 'vitest';

// Only the swing is under test: draw in classic, which needs no canvas.
setArtMode(ART_MODE.classic);

const T = TILE_SIZE;
const map = loadLevel('old-keep').tilemap;
// One swing, in physics steps.
const SWING = Math.round(1.4 / PHYSICS_STEP);
// The east tribune's west edge: the last tile of it west of its ladder.
const EDGE = (() => {
  let col = 41;
  while (map.isSolid(col - 1, 24)) col--;
  return col;
})();
// How long a jump key is held, steps: a full jump.
const HOLD = 24;

// The keys of a player who walks west the whole way and presses jump on the
// steps it is told to.
class Keys implements KeyReader {
  jumpPressed = false;
  jumpHeld = 0;
  isAnyDown(codes: readonly string[]): boolean {
    if (codes === KEYS_LEFT) return true;
    return codes === KEYS_JUMP && this.jumpHeld > 0;
  }
  isAnyPressed(codes: readonly string[]): boolean {
    return codes === KEYS_JUMP && this.jumpPressed;
  }
  isAnyReleased(): boolean {
    return false;
  }
  press(): void {
    this.jumpPressed = true;
    this.jumpHeld = HOLD;
  }
  tick(): void {
    this.jumpPressed = false;
    this.jumpHeld = Math.max(0, this.jumpHeld - 1);
  }
}

// How a try went: which chandeliers were caught, in order, and where the
// player came down at the end (the tile row their feet are on, and the
// column of their middle), if they did.
interface Outcome {
  caught: number[];
  landed: { col: number; row: number } | null;
}

// From the east tribune (row 24), walking west to its edge: jump on step
// `jumpAt`, and let go of the n-th chandelier caught `holds[n]` steps after
// catching it. Runs the real player and the real swings.
function attempt(jumpAt: number, holds: readonly number[]): Outcome {
  const chandeliers = KEEP_CHANDELIERS.map((spec) => new SwingingChandelier(spec));
  const grips: Grip[] = chandeliers;
  const player = new Player(41 * T + 2, 23 * T);
  const keys = new Keys();
  const world = { tilemap: map, boxes: [], currents: [], grips, waters: [], calm: [] };
  const caught: number[] = [];
  let heldFor = 0;
  let wasAirborne = false;
  for (let step = 0; step < jumpAt + 6 * SWING; step++) {
    if (step === jumpAt) keys.press();
    for (const c of chandeliers) c.step(PHYSICS_STEP, { player, ground: world });
    if (player.grip && ++heldFor === holds[caught.length - 1]) keys.press();
    const before = player.grip;
    player.update(keys, PHYSICS_STEP, world);
    keys.tick();
    if (player.grip && player.grip !== before) {
      caught.push(grips.indexOf(player.grip));
      heldFor = 0;
    }
    // Before the jump, the player only walks to the tribune's west edge.
    if (step < jumpAt && player.pos.x < EDGE * T) player.placeAt(EDGE * T, 23 * T);
    if (step > jumpAt) wasAirborne ||= !player.onGround;
    if (wasAirborne && player.onGround) {
      return { caught, landed: { col: Math.floor((player.pos.x + 6) / T), row: Math.floor((player.pos.y + 16) / T) } };
    }
  }
  return { caught, landed: null };
}

describe('the chapel chandeliers', () => {
  // A route the handoff draws (marker 23): from the east tribune, catch B
  // (index 1), let go onto A (index 0), and let go onto the west tribune
  // (row 20, cols 4-14). Searched over every step to jump on in a swing and
  // every step to let go on.
  it('carry the player from the east tribune by B and A to the Reliquary', () => {
    const steps = Array.from({ length: SWING }, (_, i) => i + 1);
    let found: string | null = null;
    for (const jumpAt of steps) {
      if (found) break;
      if (attempt(jumpAt, []).caught[0] !== 1) continue;
      for (const first of steps) {
        if (found) break;
        const onA = attempt(jumpAt, [first]);
        if (onA.caught.join() !== '1,0') continue;
        for (const second of steps) {
          const end = attempt(jumpAt, [first, second]);
          if (end.landed && end.landed.row === 20 && end.landed.col >= 4 && end.landed.col <= 14) {
            found = `jump on ${jumpAt}, let go of B after ${first}, of A after ${second}`;
            break;
          }
        }
      }
    }
    expect(found).not.toBeNull();
  });
});

import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from '@constants';
import { Container, Sprite, Texture } from 'pixi.js';

// The title ⇄ meadow hand-off, as a tiled wave wipe: a band of blackness
// crosses the screen on the diagonal, and each 16-px square fades on its own
// as the wave reaches it. Every machine this game is pretending to be cut
// between screens on a tile grid — one full-screen alpha ramp is a video
// crossfade, which is not this idiom.
//
// Frame-counted rather than time-based on purpose, exactly as the fade it
// replaces was: a throttled tab just gets a slower cut.
//
// Usage: out(frames, swap) covers the screen and calls `swap` on the fully
// covered frame, so the caller can rebuild the scene while nothing is visible;
// in(frames) then uncovers whatever is there now. `running` is true for the
// whole trip and Game refuses menu input while it is.

// The squares are the world's own tile grid — 20 × 14 of them — so the screen
// goes under along the lines the meadow is built on, which is what makes the
// effect read as *this* game being wiped rather than a generic shader.
const CELL = TILE_SIZE;
const COLS = SCREEN_WIDTH / CELL;
const ROWS = SCREEN_HEIGHT / CELL;

// How far the wave front leans off vertical: rows count this much against
// columns, so the front runs top-right to bottom-left and the wave travels out
// of the upper left towards the middle of the right-hand edge. A vertical
// front reads as a slide projector; the lean is what makes it a wave.
const WAVE_TILT = 0.45;
// Phase of the last square the wave reaches, so phase divides down into [0, 1].
const WAVE_SPAN = COLS - 1 + (ROWS - 1) * WAVE_TILT;
// How much of the whole trip one square spends part-way faded — the width of
// the soft band. At 0.3 about six columns of squares are mid-fade at any
// moment, which reads as a gradient rather than as a hard edge.
const WAVE_SOFTNESS = 0.3;

export class ScreenFade {
  readonly container: Container;
  // One square per cell, built once. The wave is animated by writing `alpha`
  // on each of them — 280 property writes a frame, and one batched draw, since
  // they all share Texture.WHITE. The equivalent Graphics would have to clear
  // and re-describe 280 filled rects every tick, which is a lot of tessellation
  // for a cut that only ever animates opacity.
  private readonly cells: Sprite[] = [];
  private framesLeft = 0;
  private total = 0;
  private direction: 'in' | 'out' = 'out';
  private onDone: (() => void) | null = null;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = new Sprite(Texture.WHITE);
        cell.tint = DB32.black;
        cell.position.set(col * CELL, row * CELL);
        cell.setSize(CELL, CELL);
        cell.visible = false;
        this.cells.push(cell);
        this.container.addChild(cell);
      }
    }
  }

  get running(): boolean {
    return this.framesLeft > 0;
  }

  out(frames: number, onDone: () => void): void {
    this.begin('out', frames, onDone);
  }

  in(frames: number, onDone: (() => void) | null = null): void {
    this.begin('in', frames, onDone);
  }

  // Advance one frame. Called once per ticker tick, before anything reads
  // `running`, so a cut that ends this frame hands control back this frame.
  step(): void {
    if (this.framesLeft === 0) return;
    this.framesLeft -= 1;
    const progress = 1 - this.framesLeft / this.total; // 0 → 1 across the cut
    this.paint(this.direction === 'out' ? progress : 1 - progress);
    if (this.framesLeft === 0) {
      const done = this.onDone;
      this.onDone = null;
      if (this.direction === 'in') this.container.visible = false;
      done?.();
    }
  }

  private begin(direction: 'in' | 'out', frames: number, onDone: (() => void) | null): void {
    this.direction = direction;
    this.total = frames;
    this.framesLeft = frames;
    this.onDone = onDone;
    this.container.visible = true;
    // 'in' opens where 'out' ended — fully covered, since the caller rebuilt
    // the scene underneath on that same frame.
    this.paint(direction === 'out' ? 0 : 1);
  }

  // Set every square to the alpha the wave has it at this frame.
  private paint(coverage: number): void {
    // Going back, the wave keeps travelling the same way rather than
    // retreating: the squares it reached first are the first to let the scene
    // through, so the whole title ⇄ meadow trip reads as one band crossing.
    const mirror = this.direction === 'in';
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const phase = (col + row * WAVE_TILT) / WAVE_SPAN;
        // Squares start their own fade in phase order and all finish together
        // on the last frame, each taking WAVE_SOFTNESS of the trip to do it.
        // The swap frame is every square at a flat 1 rather than 280 floats
        // trusted to all land there: one square showing the next scene pop in
        // is exactly the artefact this replaced the crossfade to be rid of.
        const start = (mirror ? 1 - phase : phase) * (1 - WAVE_SOFTNESS);
        const reach = (coverage - start) / WAVE_SOFTNESS;
        const alpha = coverage >= 1 ? 1 : Math.max(0, Math.min(1, reach));
        const cell = this.cells[row * COLS + col];
        cell.visible = alpha > 0;
        cell.alpha = alpha;
      }
    }
  }
}

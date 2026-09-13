import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH } from '@constants';
import { Graphics } from 'pixi.js';

// Full-screen black veil for the title ⇄ meadow hand-off. Frame-counted
// rather than time-based on purpose: "12-frame fade" is the Amiga idiom,
// and at 60 Hz that is a fifth of a second — exactly as long as a cut should
// take. A throttled tab just gets a slightly longer fade.
//
// Usage: out(frames, swap) darkens to black and calls `swap` on the fully
// black frame, so the caller can rebuild the scene while nothing is visible;
// in(frames) then reveals whatever is there now. `running` is true for the
// whole trip and Game refuses menu input while it is.
export class ScreenFade {
  readonly container: Graphics;
  private framesLeft = 0;
  private total = 0;
  private direction: 'in' | 'out' = 'out';
  private onDone: (() => void) | null = null;

  constructor() {
    this.container = new Graphics().rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(DB32.black);
    this.container.alpha = 0;
    this.container.visible = false;
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
  // `running`, so a fade that ends this frame hands control back this frame.
  step(): void {
    if (this.framesLeft === 0) return;
    this.framesLeft -= 1;
    const progress = 1 - this.framesLeft / this.total; // 0 → 1 across the fade
    this.container.alpha = this.direction === 'out' ? progress : 1 - progress;
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
    this.container.alpha = direction === 'out' ? 0 : 1;
  }
}

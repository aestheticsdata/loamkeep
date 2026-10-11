// Keyboard input tracking. Uses KeyboardEvent.code (physical key position) so
// the same source key works regardless of layout (QWERTY/AZERTY/etc.).
//
// Three states per key:
//   - "down":     held this frame (good for movement)
//   - "pressed":  went from up to down this frame (good for jump start)
//   - "released": went from down to up this frame (good for variable-height jump)

export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.down.has(e.code)) {
      this.pressed.add(e.code);
    }
    this.down.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (this.down.has(e.code)) {
      this.released.add(e.code);
    }
    this.down.delete(e.code);
  };

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  isAnyDown(codes: readonly string[]): boolean {
    for (const c of codes) if (this.down.has(c)) return true;
    return false;
  }

  isPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  isAnyPressed(codes: readonly string[]): boolean {
    for (const c of codes) if (this.pressed.has(c)) return true;
    return false;
  }

  isReleased(code: string): boolean {
    return this.released.has(code);
  }

  isAnyReleased(codes: readonly string[]): boolean {
    for (const c of codes) if (this.released.has(c)) return true;
    return false;
  }

  // This frame's edges, for StepInput to carry over to the physics step.
  pressedCodes(): ReadonlySet<string> {
    return this.pressed;
  }

  releasedCodes(): ReadonlySet<string> {
    return this.released;
  }

  // Call at the end of every game tick so "pressed"/"released" only fire on the
  // frame of the corresponding key event.
  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }
}

// What the player reads from the keyboard. Input answers it per frame;
// StepInput answers it per physics step.
export interface KeyReader {
  isAnyDown(codes: readonly string[]): boolean;
  isAnyPressed(codes: readonly string[]): boolean;
  isAnyReleased(codes: readonly string[]): boolean;
}

// The keyboard as the fixed physics step sees it. Frames and steps don't line
// up: on a 120 Hz display half the frames run no step, and a jump pressed on
// one of those would be cleared by endFrame() before any step read it. So the
// frame's edges are latched here and held until a step consumes them; on a
// frame that runs two steps, only the first sees the press, as at 60 fps.
export class StepInput implements KeyReader {
  private readonly input: Input;
  private pressed = new Set<string>();
  private released = new Set<string>();

  constructor(input: Input) {
    this.input = input;
  }

  // Once per frame, before the steps run.
  latch(): void {
    for (const c of this.input.pressedCodes()) this.pressed.add(c);
    for (const c of this.input.releasedCodes()) this.released.add(c);
  }

  // After each step — and whenever the world is paused, so a press made just
  // before a popup opened doesn't fire when it closes.
  consume(): void {
    this.pressed.clear();
    this.released.clear();
  }

  isAnyDown(codes: readonly string[]): boolean {
    return this.input.isAnyDown(codes);
  }

  isAnyPressed(codes: readonly string[]): boolean {
    for (const c of codes) if (this.pressed.has(c)) return true;
    return false;
  }

  isAnyReleased(codes: readonly string[]): boolean {
    for (const c of codes) if (this.released.has(c)) return true;
    return false;
  }
}

// Binding sets — duplicated to support both QWERTY (WASD) and AZERTY (ZQSD) and arrows.
export const KEYS_LEFT = ['ArrowLeft', 'KeyA', 'KeyQ'] as const;
export const KEYS_RIGHT = ['ArrowRight', 'KeyD'] as const;
export const KEYS_JUMP = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'] as const;
// Used to dive faster while swimming. Has no effect on land.
export const KEYS_DOWN = ['ArrowDown', 'KeyS'] as const;
export const KEYS_INTERACT = ['KeyE'] as const;
// Respawn-at-surface key. Temporary escape hatch for getting out of the
// underground until proper ascent mechanics (ladders / double-jump) land.
export const KEYS_RESPAWN = ['KeyR'] as const;

// Title-screen bindings. Up is KEYS_JUMP minus Space: on the menu, Space
// confirms instead of moving the cursor, so the two sets have to differ.
export const KEYS_UP = ['ArrowUp', 'KeyW', 'KeyZ'] as const;
// Confirm the highlighted menu entry. E and Space per the design; Enter
// because every title screen accepts it and nothing else claims the key.
export const KEYS_CONFIRM = ['KeyE', 'Space', 'Enter', 'NumpadEnter'] as const;
// Step back: gallery → title, meadow → title.
export const KEYS_BACK = ['Escape'] as const;

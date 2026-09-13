import { DB32, SCREEN_WIDTH, textResolution } from '@constants';
import type { Audio } from '@systems/audio';
import { type Input, KEYS_CONFIRM, KEYS_DOWN, KEYS_UP } from '@systems/input';
import { drawPixelText, measurePixelText, PIXEL_FONT_HEIGHT } from '@systems/pixel-font';
import {
  BIRD_COUNT,
  birdFrame,
  DEFAULT_TITLE_MOOD,
  drawBackdrop,
  drawPlate,
  drawScenery,
  drawTitleBird,
  drawTitleRabbit,
  drawWanderer,
  drawWordmark,
  drawWordmarkRule,
  groundTop,
  paintClouds,
  paintCryptCandle,
  paintForeground,
  paintKeepLights,
  paintMist,
  paintTufts,
  paintTwinkle,
  RABBIT_X,
  rabbitTwitch,
  TITLE_MOODS,
  type TitleMood,
  type TitleMoodName,
  WANDERER_X,
  type WandererFrame,
  WORDMARK_Y,
  wandererFrame,
} from '@systems/title-art';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';

// What the menu asked for. Game turns `go` into a fade + level load and
// `open` into the sketchbook gallery; the title itself never touches either.
export type TitleAction = { go: 'meadow'; spawn: 'default' } | { open: 'sketchbook' };

// All screen copy is English: lowercase mono for the small lines, matching
// `press E to enter` in the world, and the 5×7 bitmap font for the menu.
const TAGLINE = 'An old keep, a meadow, all day to wander.';
const KEY_LINE = 'arrows walk    space jump    E look closer';
const ENTER_LABEL = 'ENTER THE MEADOW';

// Menu column: rows on the 16-px rhythm, cursor triangle 8 px to the left.
// The two-row block is centred in its plate rather than placed at the
// design's y=112, which left it hugging the plate's bottom edge.
const MENU_X = 24;
const MENU_PLATE_X = 14;
const MENU_PLATE_Y = 106;
const MENU_PLATE_H = 30;
const MENU_ROW_H = 16;
const MENU_FIRST_Y = MENU_PLATE_Y + Math.round((MENU_PLATE_H - (MENU_ROW_H + PIXEL_FONT_HEIGHT)) / 2);
const CURSOR_X = MENU_X - 8;
// Horizontal breathing room between a label and its plate edge, both sides.
const MENU_PAD_X = MENU_X - MENU_PLATE_X;

// Cursor blink: 1.15 s cycle, lit for the first 0.78 s of it.
const CURSOR_PERIOD = 1.15;
const CURSOR_ON = 0.78;

// The copper-bar sweep across the wordmark: a 22-px white band travelling
// left→right at 52 px/s on a 470-px cycle, so it crosses, rests, and returns.
const SWEEP_SPEED = 52;
const SWEEP_CYCLE = 470;
const SWEEP_WIDTH = 22;
const SWEEP_LEAD = 80;

const SMALL_TEXT: TextStyleOptions = { fontFamily: 'monospace', fontSize: 8 };

interface MenuEntry {
  label: string;
  color: number;
  // The sketchbook is skipped by the cursor while it is empty — a thing to
  // fill, never a locked door, so there is no error beep either.
  selectable: boolean;
}

// The first thing the player sees: one quiet scene of the world (see
// title-art.ts), the wordmark, two menu entries and the keys. Owns the
// scene clock and the menu cursor; knows nothing about levels or storage.
//
// Layer order, bottom → top, mirroring Game's stage comment:
//   backdrop                 sky bands, stars, sun          (static)
//   clouds / twinkle / birds                                (animated)
//   scenery                  hills, keep, ground, decor, path (static)
//   keep lights / mist / tufts / crypt candle               (animated)
//   rabbit, wanderer         existing entity drawings, idle
//   foreground               near grass blades
//   ui                       wordmark, rule, tagline, menu, key line
export class TitleScreen {
  readonly container: Container;

  private readonly mood: TitleMood;
  private readonly audio: Audio;
  // Scene clock in seconds. Keeps running while the gallery is open and
  // across trips into the meadow, so the scene never visibly restarts.
  private t = 0;

  private readonly clouds = new Graphics();
  private readonly twinkle = new Graphics();
  private readonly birds: Graphics[] = [];
  private readonly birdWings: (0 | 1)[] = [];
  private readonly keepLights = new Graphics();
  private readonly mist = new Graphics();
  private readonly tufts = new Graphics();
  private readonly cryptCandle = new Graphics();
  private readonly rabbit = new Graphics();
  private rabbitTwitching = false;
  private readonly wanderer = new Graphics();
  private wandererPose: WandererFrame;
  private readonly foreground = new Graphics();
  private readonly sweep = new Graphics();

  // Menu, drawn in the bitmap font. Rebuilt whenever the sketchbook count
  // changes; the cursor is its own Graphics so blinking never touches it.
  private readonly menuLayer = new Container();
  private readonly cursor = new Graphics();
  private entries: MenuEntry[] = [];
  private cursorRow = 0;
  private cursorClock = 0;
  private cursorShown = true;

  constructor(audio: Audio, moodName: TitleMoodName = DEFAULT_TITLE_MOOD) {
    this.audio = audio;
    this.mood = TITLE_MOODS[moodName];
    this.container = new Container();
    const mood = this.mood;

    const backdrop = new Graphics();
    drawBackdrop(backdrop, mood);
    this.container.addChild(backdrop, this.clouds, this.twinkle);

    for (let i = 0; i < BIRD_COUNT; i++) {
      const bird = new Graphics();
      const frame = birdFrame(i, 0);
      drawTitleBird(bird, mood, frame.wingFrame);
      bird.position.set(frame.x, frame.y);
      this.birds.push(bird);
      this.birdWings.push(frame.wingFrame);
      this.container.addChild(bird);
    }

    const scenery = new Graphics();
    drawScenery(scenery, mood);
    this.container.addChild(scenery, this.keepLights, this.mist, this.tufts, this.cryptCandle);

    this.rabbit.position.set(RABBIT_X, groundTop(RABBIT_X));
    drawTitleRabbit(this.rabbit, false);
    this.container.addChild(this.rabbit);

    // Feet one row into the grass so the boots sit on the surface, not
    // hover over the highlight row.
    this.wanderer.position.set(WANDERER_X, groundTop(WANDERER_X) + 1);
    this.wandererPose = wandererFrame(0);
    drawWanderer(this.wanderer, this.wandererPose);
    this.container.addChild(this.wanderer, this.foreground);

    this.container.addChild(this.buildUi());
    this.setSketchbookPages(0, 0);
    this.tick(0);
  }

  // Relabel the second entry from the store: `(EMPTY)` and dimmed while
  // nothing has been found, `3/8` and fully lit once pages exist. Game
  // calls this every time the title is shown.
  setSketchbookPages(discovered: number, total: number): void {
    const U = this.mood.ui;
    const empty = discovered === 0;
    this.entries = [
      { label: ENTER_LABEL, color: U.active, selectable: true },
      {
        label: empty ? 'SKETCHBOOK (EMPTY)' : `SKETCHBOOK ${discovered}/${total}`,
        color: empty ? U.idle : U.active,
        selectable: !empty,
      },
    ];
    if (!this.entries[this.cursorRow].selectable) this.cursorRow = 0;
    this.rebuildMenu();
    this.paintCursor();
  }

  // Advance the scene by dt seconds. Runs every frame in title mode,
  // whether or not input is live.
  tick(dt: number): void {
    this.t += dt;
    const t = this.t;
    const mood = this.mood;

    paintClouds(this.clouds, mood, t);
    paintTwinkle(this.twinkle, mood, t);
    for (let i = 0; i < this.birds.length; i++) {
      const frame = birdFrame(i, t);
      const bird = this.birds[i];
      bird.position.set(frame.x, frame.y);
      if (frame.wingFrame !== this.birdWings[i]) {
        this.birdWings[i] = frame.wingFrame;
        bird.clear();
        drawTitleBird(bird, mood, frame.wingFrame);
      }
    }

    paintKeepLights(this.keepLights, mood, t);
    paintMist(this.mist, mood, t);
    paintTufts(this.tufts, mood, t);
    paintCryptCandle(this.cryptCandle, t);

    const twitch = rabbitTwitch(t);
    if (twitch !== this.rabbitTwitching) {
      this.rabbitTwitching = twitch;
      this.rabbit.clear();
      drawTitleRabbit(this.rabbit, twitch);
    }

    const pose = wandererFrame(t);
    if (pose.bodyBob !== this.wandererPose.bodyBob || pose.hem !== this.wandererPose.hem) {
      this.wandererPose = pose;
      this.wanderer.clear();
      drawWanderer(this.wanderer, pose);
    }

    paintForeground(this.foreground, mood, t);

    // Whole-pixel sweep position so the band steps across, never smears.
    const sweepX = Math.floor((t * SWEEP_SPEED) % SWEEP_CYCLE) - SWEEP_LEAD;
    this.sweep.clear();
    drawWordmark(this.sweep, mood.ui.shine, 0, 0, { x: sweepX, y: WORDMARK_Y - 2, w: SWEEP_WIDTH, h: 32 });

    this.cursorClock += dt;
    const shown = this.cursorClock % CURSOR_PERIOD < CURSOR_ON;
    if (shown !== this.cursorShown) {
      this.cursorShown = shown;
      this.cursor.visible = shown;
    }
  }

  // Menu input for one frame. Null when nothing was chosen. Sounds are
  // played here: the cursor tick on a move, the discovery chord for setting
  // out, the book opening for the gallery.
  handleInput(input: Input): TitleAction | null {
    const up = input.isAnyPressed(KEYS_UP);
    const down = input.isAnyPressed(KEYS_DOWN);
    if (up !== down) {
      const next = this.nextSelectable(this.cursorRow, up ? -1 : 1);
      if (next !== this.cursorRow) {
        this.cursorRow = next;
        // Restart the blink so the cursor is visible on its new row at once.
        this.cursorClock = 0;
        this.cursorShown = true;
        this.cursor.visible = true;
        this.paintCursor();
        this.audio.footstep();
      }
    }

    if (input.isAnyPressed(KEYS_CONFIRM)) {
      if (this.cursorRow === 0) {
        this.audio.discover();
        return { go: 'meadow', spawn: 'default' };
      }
      this.audio.openBook();
      return { open: 'sketchbook' };
    }
    return null;
  }

  // Next selectable row in `dir`, wrapping at both ends. Returns `from`
  // when nothing else can be selected, which the caller treats as no move.
  private nextSelectable(from: number, dir: -1 | 1): number {
    const n = this.entries.length;
    for (let step = 1; step < n; step++) {
      const i = (from + dir * step + n) % n;
      if (this.entries[i].selectable) return i;
    }
    return from;
  }

  // Static UI: wordmark (shadow, body, lit top rows), rule, tagline on its
  // plate, the menu layer and cursor, the key line on its plate. Every plate
  // is sized from the measured text.
  private buildUi(): Container {
    const ui = new Container();
    const U = this.mood.ui;

    const wordmark = new Graphics();
    drawWordmark(wordmark, U.shadow, 2, 2);
    drawWordmark(wordmark, U.title);
    drawWordmark(wordmark, U.titleHi, 0, 0, { x: 0, y: WORDMARK_Y, w: SCREEN_WIDTH, h: 10 });
    drawWordmarkRule(wordmark, this.mood);
    ui.addChild(wordmark, this.sweep);

    // Tagline, left-aligned on the menu column on purpose: centred, it
    // collides with the flagpole. No drop shadow on the mono lines: the
    // plate carries the contrast, and a shadow offset by a whole logical
    // pixel under a thin antialiased glyph reads as a second copy.
    const tagline = makeText(TAGLINE, { ...SMALL_TEXT, fill: U.tagline });
    const taglinePlate = new Graphics();
    const taglineW = Math.ceil(tagline.width) + 8;
    drawPlate(taglinePlate, 20, 58, taglineW, 15);
    centerText(tagline, 20, 58, taglineW, 15);
    ui.addChild(taglinePlate, tagline);

    ui.addChild(this.menuLayer, this.cursor);

    const keyLine = makeText(KEY_LINE, { ...SMALL_TEXT, fill: U.hint });
    const keyPlateW = Math.ceil(keyLine.width) + 10;
    const keyPlateX = Math.round(SCREEN_WIDTH / 2 - keyPlateW / 2);
    const keyPlate = new Graphics();
    drawPlate(keyPlate, keyPlateX, 203, keyPlateW, 14);
    centerText(keyLine, keyPlateX, 203, keyPlateW, 14);
    ui.addChild(keyPlate, keyLine);

    return ui;
  }

  // Plate sized from the widest label, then each row in the bitmap font over
  // a 1-px black copy — under 1-px strokes that offset reads as depth, the
  // way a bitmap font's shadow does, not as doubling.
  private rebuildMenu(): void {
    for (const child of this.menuLayer.removeChildren()) child.destroy();

    const maxW = Math.max(...this.entries.map((entry) => measurePixelText(entry.label)));
    const menu = new Graphics();
    drawPlate(menu, MENU_PLATE_X, MENU_PLATE_Y, maxW + MENU_PAD_X * 2, MENU_PLATE_H);
    for (let i = 0; i < this.entries.length; i++) {
      const { label, color } = this.entries[i];
      const y = MENU_FIRST_Y + i * MENU_ROW_H;
      drawPixelText(menu, label, MENU_X + 1, y + 1, DB32.black);
      drawPixelText(menu, label, MENU_X, y, color);
    }
    this.menuLayer.addChild(menu);
  }

  // Three-step triangle beside the highlighted row.
  private paintCursor(): void {
    const y = MENU_FIRST_Y + this.cursorRow * MENU_ROW_H + 1;
    const color = this.mood.ui.active;
    this.cursor.clear();
    this.cursor.rect(CURSOR_X, y, 1, 5).fill(color);
    this.cursor.rect(CURSOR_X + 1, y + 1, 1, 3).fill(color);
    this.cursor.rect(CURSOR_X + 2, y + 2, 1, 1).fill(color);
  }
}

function makeText(text: string, style: TextStyleOptions): Text {
  const t = new Text({ text, style });
  // Rasterise at device resolution so the glyphs land 1:1 on screen pixels.
  t.resolution = textResolution();
  return t;
}

// Centre a text's measured box inside a plate, on whole pixels. Measured,
// not hard-coded: the box height depends on which monospace font the
// browser picked, and a line that is 2 px low on a 14-px plate shows.
function centerText(text: Text, x: number, y: number, w: number, h: number): void {
  text.position.set(x + Math.round((w - text.width) / 2), y + Math.round((h - text.height) / 2));
}

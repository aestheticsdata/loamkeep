import { DB32, SCREEN_WIDTH } from '@constants';
import { ArtBody } from '@hd/art-body';
import { ART_KIND, draws, registerArt } from '@hd/art-mode';
import { ArtText } from '@hd/art-text';
import { bake, FineSprite } from '@hd/bake';
import { menuTextHd } from '@hd/book-font';
import { type CritterLayers, flatten } from '@hd/critter-hd';
import { FINE, FineCanvas } from '@hd/fine-canvas';
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
import {
  cursorHd,
  plateHd,
  sceneryHd,
  titleBackdropHd,
  wandererHd,
  wordmarkHd,
  wordmarkRuleHd,
} from '@systems/title-hd';
import { TitleSkyHd } from '@systems/title-sky-hd';
import { TitleTuftsHd } from '@systems/title-tufts-hd';
import { Container, Graphics, type TextStyleOptions } from 'pixi.js';

// What the menu asked for. Game turns `go` into a fade + level load, `open`
// into that book's gallery and `map` into the world map; the title itself
// never touches any of them, and never learns what a book id means.
export type TitleAction = { go: 'meadow'; spawn: 'default' } | { open: string } | { map: true };

// One book as the menu shows it: the id to hand back when it is chosen, the
// label to draw, and how much of it is written. Game builds these from the
// book registry and the store — the title screen knows about neither, which
// is why a new book costs this screen no code at all.
export interface SketchbookRow {
  id: string;
  label: string;
  discovered: number;
  total: number;
}

// All screen copy is English: lowercase mono for the small lines, matching
// `press E to enter` in the world, and the 5×7 bitmap font for the menu.
const TAGLINE = 'An old keep, a meadow, all day to wander.';
const KEY_LINE = '← → walk    ↑/space jump    E look closer';
const ENTER_LABEL = 'ENTER THE MEADOW';
const MAP_LABEL = 'MAP OF THE WORLD';

// Menu column: rows on the 16-px rhythm, cursor triangle 8 px to the left.
// The plate is sized from its contents — widest label plus MENU_PAD_X each
// side, the whole row block plus MENU_PAD_Y above and below — so the gaps are
// equal by construction. The design's fixed 30-px plate around a 23-px block
// could not be centred on whole pixels (4 px above, 3 below).
const MENU_X = 24;
const MENU_PLATE_X = 14;
const MENU_PLATE_Y = 106;
const MENU_ROW_H = 16;
const MENU_PAD_X = MENU_X - MENU_PLATE_X;
const MENU_PAD_Y = 4;
const MENU_FIRST_Y = MENU_PLATE_Y + MENU_PAD_Y;
const CURSOR_X = MENU_X - 8;

// The plate around n rows: (n - 1) steps of the rhythm, plus the last row's
// glyphs, plus the padding. The menu grows downward from MENU_PLATE_Y at 106
// and the key line's plate starts at 203, so the bottom edge lands at 137 for
// one book, 169 for three, 185 for four — 18 px of air. A fifth book leaves
// 2 px and a sixth runs into the key line; at that point MENU_PLATE_Y moves
// up rather than the rows getting tighter.
function menuPlateHeight(rows: number): number {
  return (rows - 1) * MENU_ROW_H + PIXEL_FONT_HEIGHT + MENU_PAD_Y * 2;
}

// Plate padding around the two mono lines: the measured text box plus this
// much on every side, so each line sits centred whatever box height the
// browser's monospace font produces.
const TAGLINE_PAD = { x: 4, y: 3 } as const;
const KEYS_PAD = { x: 5, y: 2 } as const;

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
  // A book with nothing in it is skipped by the cursor — a thing to fill,
  // never a locked door, so there is no error beep either.
  selectable: boolean;
  // What choosing this row means. Held per row so confirming is a lookup
  // rather than a switch on which row the cursor happens to be sitting on.
  action: TitleAction;
}

// The first thing the player sees: one quiet scene of the world (see
// title-art.ts), the wordmark, the menu — the meadow and a row per book —
// and the keys. Owns the scene clock and the menu cursor; knows nothing about
// levels, books or storage.
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
  // The clouds, mist and twinkles in HD, slid in fine steps.
  private readonly skyHd: TitleSkyHd;
  private readonly twinkle = new Graphics();
  private readonly birds: ArtBody[] = [];
  private readonly birdWings: (0 | 1)[] = [];
  private readonly keepLights = new Graphics();
  private readonly mist = new Graphics();
  private readonly tufts = new Graphics();
  private readonly tuftsHd: TitleTuftsHd;
  private readonly cryptCandle = new Graphics();
  private readonly rabbit = new ArtBody('rabbit');
  private rabbitTwitching = false;
  private readonly wanderer = new ArtBody('wanderer');
  private wandererPose: WandererFrame;
  private readonly foreground = new Graphics();
  private readonly sweep = new Graphics();
  // The sweep in HD: the chamfered wordmark in the shine colour, baked once
  // and seen through a mask that steps across it — never baked per frame.
  private readonly sweepHd = new FineSprite();
  private readonly sweepMask = new Graphics();

  // Menu, drawn in the bitmap font. Rebuilt whenever the book counts change;
  // the cursor is its own Graphics so blinking never touches it.
  private readonly menuLayer = new Container();
  private readonly cursor = new Container();
  private readonly cursorMark = new Graphics();
  private readonly cursorHd = new FineSprite();
  private entries: MenuEntry[] = [];
  private cursorRow = 0;
  private cursorClock = 0;
  private cursorShown = true;

  constructor(audio: Audio, moodName: TitleMoodName = DEFAULT_TITLE_MOOD) {
    this.audio = audio;
    this.mood = TITLE_MOODS[moodName];
    this.container = new Container();
    const mood = this.mood;

    const backdrop = new ArtBody('title-backdrop');
    backdrop.draw(
      (g) => drawBackdrop(g, mood),
      () => titleBackdropHd(mood),
    );
    this.skyHd = new TitleSkyHd(mood);
    registerArt({ classic: this.clouds, hd: this.skyHd.clouds });
    registerArt({ classic: this.twinkle, hd: this.skyHd.twinkle });
    registerArt({ classic: this.mist, hd: this.skyHd.mist });
    this.container.addChild(backdrop, this.clouds, this.skyHd.clouds, this.twinkle, this.skyHd.twinkle);

    for (let i = 0; i < BIRD_COUNT; i++) {
      const bird = new ArtBody('bird');
      const frame = birdFrame(i, 0);
      bird.draw((g) => drawTitleBird(g, mood, frame.wingFrame));
      bird.position.set(frame.x, frame.y);
      this.birds.push(bird);
      this.birdWings.push(frame.wingFrame);
      this.container.addChild(bird);
    }

    const scenery = new ArtBody('title-scenery');
    scenery.draw((g) => drawScenery(g, mood), sceneryHd);
    this.tuftsHd = new TitleTuftsHd(mood);
    registerArt({ classic: this.tufts, hd: this.tuftsHd.container });
    this.container.addChild(
      scenery,
      this.keepLights,
      this.mist,
      this.skyHd.mist,
      this.tufts,
      this.tuftsHd.container,
      this.cryptCandle,
    );

    this.rabbit.position.set(RABBIT_X, groundTop(RABBIT_X));
    this.rabbit.draw((g) => drawTitleRabbit(g, false));
    this.container.addChild(this.rabbit);

    // Feet one row into the grass so the boots sit on the surface, not
    // hover over the highlight row.
    this.wanderer.position.set(WANDERER_X, groundTop(WANDERER_X) + 1);
    this.wandererPose = wandererFrame(0);
    this.drawWanderer();
    this.container.addChild(this.wanderer, this.foreground);

    this.container.addChild(this.buildUi());
    // One row until Game reports the books — showTitle() does that before the
    // title is ever visible, so this arrangement is never seen.
    this.setSketchbooks([]);
    this.tick(0);
  }

  // Rebuild the menu from the store: the meadow on top, then one row per
  // book, each reading `3/13` — dimmed at `0/13`, because a book with nothing in
  // it cannot be opened, and fully lit once pages exist. Game calls this every
  // time the title is shown.
  //
  // The count is there at zero rather than the `(EMPTY)` this used to read,
  // because the denominator is the useful half: thirteen landmarks, four
  // creatures, six plants is what the game *is*, and a player who has found
  // none of them is exactly the player who needs telling how many there are.
  // `(EMPTY)` told them the opposite — three rows of nothing to do — and since
  // the store is localStorage, that is what every first-time visitor met.
  setSketchbooks(books: readonly SketchbookRow[]): void {
    const U = this.mood.ui;
    const meadow: MenuEntry = {
      label: ENTER_LABEL,
      color: U.active,
      selectable: true,
      action: { go: 'meadow', spawn: 'default' },
    };
    // The map, always there: it is how a player finds the places the books
    // count, and it has nothing in it that needs earning first.
    const map: MenuEntry = { label: MAP_LABEL, color: U.active, selectable: true, action: { map: true } };
    this.entries = [
      meadow,
      map,
      ...books.map((book): MenuEntry => {
        const empty = book.discovered === 0;
        return {
          label: `${book.label} ${book.discovered}/${book.total}`,
          color: empty ? U.idle : U.active,
          selectable: !empty,
          action: { open: book.id },
        };
      }),
    ];
    // Fall back to the top row if the cursor's book just emptied, or if there
    // are fewer rows than there were — the meadow is always selectable.
    if (this.cursorRow >= this.entries.length || !this.entries[this.cursorRow].selectable) {
      this.cursorRow = 0;
    }
    this.rebuildMenu();
    this.paintCursor();
  }

  // Advance the scene by dt seconds. Runs every frame in title mode,
  // whether or not input is live.
  tick(dt: number): void {
    this.t += dt;
    const t = this.t;
    const mood = this.mood;

    if (draws(ART_KIND.classic)) {
      paintClouds(this.clouds, mood, t);
      paintTwinkle(this.twinkle, mood, t);
      paintMist(this.mist, mood, t);
    }
    if (draws(ART_KIND.hd)) this.skyHd.tick(t);
    for (let i = 0; i < this.birds.length; i++) {
      const frame = birdFrame(i, t);
      const bird = this.birds[i];
      bird.position.set(frame.x, frame.y);
      if (frame.wingFrame !== this.birdWings[i]) {
        this.birdWings[i] = frame.wingFrame;
        bird.draw((g) => drawTitleBird(g, mood, frame.wingFrame));
      }
    }

    paintKeepLights(this.keepLights, mood, t);
    if (draws(ART_KIND.classic)) paintTufts(this.tufts, mood, t);
    if (draws(ART_KIND.hd)) this.tuftsHd.tick(t);
    paintCryptCandle(this.cryptCandle, t);

    const twitch = rabbitTwitch(t);
    if (twitch !== this.rabbitTwitching) {
      this.rabbitTwitching = twitch;
      this.rabbit.draw((g) => drawTitleRabbit(g, twitch));
    }

    const pose = wandererFrame(t);
    if (pose.bodyBob !== this.wandererPose.bodyBob || pose.hem !== this.wandererPose.hem) {
      this.wandererPose = pose;
      this.drawWanderer();
    }

    paintForeground(this.foreground, mood, t);

    // Whole-pixel sweep position so the band steps across, never smears.
    const sweepX = Math.floor((t * SWEEP_SPEED) % SWEEP_CYCLE) - SWEEP_LEAD;
    if (draws(ART_KIND.classic)) {
      this.sweep.clear();
      drawWordmark(this.sweep, mood.ui.shine, 0, 0, { x: sweepX, y: WORDMARK_Y - 2, w: SWEEP_WIDTH, h: 32 });
    }
    this.sweepMask
      .clear()
      .rect(sweepX, WORDMARK_Y - 2, SWEEP_WIDTH, 32)
      .fill(DB32.white);

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
      const { action } = this.entries[this.cursorRow];
      if ('open' in action || 'map' in action) {
        this.audio.openBook();
      } else {
        this.audio.discover();
      }
      return action;
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

    const wordmark = new ArtBody('wordmark');
    wordmark.draw(
      (g) => {
        drawWordmark(g, U.shadow, 2, 2);
        drawWordmark(g, U.title);
        drawWordmark(g, U.titleHi, 0, 0, { x: 0, y: WORDMARK_Y, w: SCREEN_WIDTH, h: 10 });
      },
      () => wordmarkHd({ face: U.title, top: U.titleHi, shadow: U.shadow }),
    );
    const rule = new ArtBody('wordmark-rule');
    rule.draw((g) => drawWordmarkRule(g, this.mood), wordmarkRuleHd);
    this.sweepHd.show(bake(flatten(wordmarkHd({ face: U.shine, top: null, shadow: null }))));
    this.sweepHd.mask = this.sweepMask;
    registerArt({ classic: this.sweep, hd: this.sweepHd });
    ui.addChild(wordmark, rule, this.sweep, this.sweepHd, this.sweepMask);

    // Tagline, left-aligned on the menu column on purpose: centred, it
    // collides with the flagpole. No drop shadow on the mono lines: the
    // plate carries the contrast, and a shadow offset by a whole logical
    // pixel under a thin antialiased glyph reads as a second copy.
    const tagline = makeText(TAGLINE, { ...SMALL_TEXT, fill: U.tagline }, TAGLINE_COLUMNS);
    ui.addChild(plateAround(tagline, { x: 20, y: 58 }, TAGLINE_PAD), tagline);

    this.cursorHd.show(bake(cursorHd(this.mood.ui.active)));
    registerArt({ classic: this.cursorMark, hd: this.cursorHd });
    this.cursor.addChild(this.cursorMark, this.cursorHd);
    ui.addChild(this.menuLayer, this.cursor);

    const keyLine = makeText(KEY_LINE, { ...SMALL_TEXT, fill: U.hint });
    ui.addChild(plateAround(keyLine, { x: null, y: 203 }, KEYS_PAD), keyLine);

    return ui;
  }

  // Plate sized from the widest label, then each row in the bitmap font over
  // a 1-px black copy — under 1-px strokes that offset reads as depth, the
  // way a bitmap font's shadow does, not as doubling.
  private rebuildMenu(): void {
    for (const child of this.menuLayer.removeChildren()) child.destroy();

    const maxW = Math.max(...this.entries.map((entry) => measurePixelText(entry.label)));
    // The plate keeps the menu legible over a moving scene: translucent in
    // classic, dithered black in HD.
    const plateBox = {
      x: MENU_PLATE_X,
      y: MENU_PLATE_Y,
      w: maxW + MENU_PAD_X * 2,
      h: menuPlateHeight(this.entries.length),
    };
    const plate = new Graphics();
    drawPlate(plate, plateBox.x, plateBox.y, plateBox.w, plateBox.h);
    const plateHdSprite = new FineSprite();
    plateHdSprite.show(bake(plateHd(plateBox)));
    registerArt({ classic: plate, hd: plateHdSprite });
    const menu = new ArtBody('title-menu');
    menu.draw(
      (g) => {
        for (let i = 0; i < this.entries.length; i++) {
          const { label, color } = this.entries[i];
          const y = MENU_FIRST_Y + i * MENU_ROW_H;
          drawPixelText(g, label, MENU_X + 1, y + 1, DB32.black);
          drawPixelText(g, label, MENU_X, y, color);
        }
      },
      () => this.menuHd(),
    );
    this.menuLayer.addChild(plate, plateHdSprite, menu);
  }

  // The menu on the fine grid: each row in the menu font's HD recipe, its
  // drop shadow one fine pixel, not one logical.
  private menuHd(): CritterLayers {
    const rows = this.entries.map((entry, i) => ({ entry, y: MENU_FIRST_Y + i * MENU_ROW_H }));
    const top = MENU_FIRST_Y * FINE;
    const canvas = new FineCanvas({
      x: MENU_X * FINE,
      y: top,
      w: Math.max(...this.entries.map((e) => measurePixelText(e.label))) * FINE + 6,
      h: this.entries.length * MENU_ROW_H * FINE + 6,
    });
    for (const { entry, y } of rows) {
      const text = menuTextHd(entry.label, entry.color);
      text.forInk((x, fy, c) => canvas.set(MENU_X * FINE + x, y * FINE + fy, c));
    }
    return { body: canvas, halo: null };
  }

  private drawWanderer(): void {
    const pose = this.wandererPose;
    this.wanderer.draw(
      (g) => drawWanderer(g, pose),
      () => wandererHd(pose),
    );
  }

  // Three-step triangle beside the highlighted row.
  private paintCursor(): void {
    const y = MENU_FIRST_Y + this.cursorRow * MENU_ROW_H + 1;
    const color = this.mood.ui.active;
    this.cursorMark.clear();
    this.cursorMark.rect(CURSOR_X, y, 1, 5).fill(color);
    this.cursorMark.rect(CURSOR_X + 1, y + 1, 1, 3).fill(color);
    this.cursorMark.rect(CURSOR_X + 2, y + 2, 1, 1).fill(color);
    this.cursorHd.position.set(CURSOR_X, y);
  }
}

// The title's small lines are set in HD at 3 fine a dot — classic's own
// pixel — rather than the book's 2: on the title they stand alone over a
// moving scene, at the size classic shows them.
const TITLE_TEXT_DOT = 3;

// The tagline at that size runs into the keep, so in HD it is two lines.
const TAGLINE_COLUMNS = 24;

function makeText(text: string, style: TextStyleOptions, columns?: number): ArtText {
  return new ArtText({ text, style, dot: TITLE_TEXT_DOT, columns });
}

// Where a plate goes: its left edge (null to centre it on the screen) and
// its top, logical px.
interface PlateAt {
  x: number | null;
  y: number;
}

// A plate fitted around a text's measured box with `pad` on every side, the
// text placed at the padding offset. Measured, not hard-coded: the box
// height depends on which monospace font the browser picked, and a line
// that sits 1 px low on a 14-px plate shows. Each art gets its own plate,
// fitted to its own text — classic's translucent, HD's dithered.
function plateAround(text: ArtText, at: PlateAt, pad: { x: number; y: number }): Container {
  const left = (w: number) => at.x ?? Math.round(SCREEN_WIDTH / 2 - w / 2);
  const w = Math.ceil(text.classic.width) + pad.x * 2;
  const h = Math.ceil(text.classic.height) + pad.y * 2;
  const x = left(w);
  const plate = new Graphics();
  drawPlate(plate, x, at.y, w, h);
  text.position.set(x + pad.x, at.y + pad.y);

  const hdW = Math.ceil(text.hdWidth) + pad.x * 2;
  const hdH = Math.ceil(text.hdHeight) + pad.y * 2;
  const hdX = left(hdW);
  const plateHdSprite = new FineSprite();
  plateHdSprite.show(bake(plateHd({ x: hdX, y: at.y, w: hdW, h: hdH })));
  text.alignHd(hdX - x);
  registerArt({ classic: plate, hd: plateHdSprite });
  const both = new Container();
  both.addChild(plate, plateHdSprite);
  return both;
}

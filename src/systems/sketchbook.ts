import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH, textResolution } from '@constants';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';

// One leaf of a book: the only three fields a page actually renders. A
// landmark spec is one of these plus where it stands in the world; a creature
// page is one of these and nothing else, so it never has to pretend it sits
// on a tile.
export interface SketchbookPage {
  name: string;
  description: string;
  // Populate the given Graphics with the illustration. Drawn around the
  // origin (0, 0); the sketchbook positions the result inside the frame.
  drawSketch(g: Graphics): void;
}

// Fit a world drawing onto a leaf. The in-world drawings are sized for a
// 320-px screen and anchored with their base on the y = 0 line; a page wants
// them several times larger and centred on the anchor it positions. Landmarks
// draw themselves at page size, so this is for everything that does not:
// a creature, a plant, anything already standing in the world.
//
// `top` and `bottom` are the drawing's own ink extents, read off its draw
// function; the midpoint of those is what lands on the anchor. Scales are
// whole numbers so a scaled pixel stays square.
//
// Ink taller than about 60 px runs into the footer, which is the real ceiling
// on how large a page may draw something.
export function scaledSketch(
  draw: (g: Graphics) => void,
  scale: number,
  top: number,
  bottom: number,
): (g: Graphics) => void {
  const lift = Math.round(((top + bottom) / 2) * scale);
  return (g) => {
    g.setTransform(scale, 0, 0, scale, 0, -lift);
    draw(g);
    g.resetTransform();
  };
}

// Frame geometry inside the 320×224 logical viewport.
const FRAME_X = 40;
const FRAME_Y = 32;
const FRAME_W = 240;
const FRAME_H = 160;

// What sits at the bottom of a page, plus an optional page number in the
// top-right corner. The in-game page carries a single close hint; the
// title-screen gallery swaps in the page-turning keys and numbers its
// leaves. Same parchment either way — the layout is never forked.
export interface PageFooter {
  hint: string;
  corner?: string;
}

const DEFAULT_FOOTER: PageFooter = { hint: '[ press E to close ]' };

// Modal overlay shown when the player discovers a landmark. Pauses gameplay
// while visible. Content is rebuilt every show() so each page gets its own
// leaf.
export class Sketchbook {
  readonly container: Container;
  private readonly content: Container;
  private _visible = false;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Dim the world behind the overlay.
    const backdrop = new Graphics().rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill({ color: DB32.valhalla, alpha: 0.7 });
    this.container.addChild(backdrop);

    // Parchment-like frame with a wooden border.
    const frame = new Graphics().rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).fill(DB32.pancho);
    const border = new Graphics().rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).stroke({ color: DB32.oiledCedar, width: 2 });
    this.container.addChild(frame);
    this.container.addChild(border);

    // Per-page content lives here, recreated each show().
    this.content = new Container();
    this.container.addChild(this.content);
  }

  show(page: SketchbookPage, footer: PageFooter = DEFAULT_FOOTER): void {
    this.clearContent();

    // Title
    const title = makeText(page.name, {
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: DB32.valhalla,
    });
    title.position.set(FRAME_X + 12, FRAME_Y + 10);
    this.content.addChild(title);

    // Underline separator
    const sep = new Graphics().rect(FRAME_X + 12, FRAME_Y + 32, FRAME_W - 24, 1).fill(DB32.oiledCedar);
    this.content.addChild(sep);

    // Sketch — provided by the page. Centered in the left column.
    const sketch = new Graphics();
    page.drawSketch(sketch);
    sketch.position.set(FRAME_X + 50, FRAME_Y + 110);
    this.content.addChild(sketch);

    // Description on the right column, word-wrapped.
    const description = makeText(page.description, {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: DB32.valhalla,
      wordWrap: true,
      wordWrapWidth: 130,
      lineHeight: 13,
    });
    description.position.set(FRAME_X + 110, FRAME_Y + 46);
    this.content.addChild(description);

    this.addFooter(footer);
    this.reveal();
  }

  // A leaf with nothing on it but one centred line — the gallery's last
  // page, where the count of pages still blank lives. Same parchment, so it
  // reads as part of the same book rather than a separate notice.
  showNote(line: string, footer: PageFooter): void {
    this.clearContent();

    const note = makeText(line, { fontFamily: 'monospace', fontSize: 8, fill: DB32.valhalla });
    note.position.set(
      FRAME_X + Math.round((FRAME_W - note.width) / 2),
      FRAME_Y + Math.round((FRAME_H - note.height) / 2),
    );
    this.content.addChild(note);

    this.addFooter(footer);
    this.reveal();
  }

  hide(): void {
    this._visible = false;
    this.container.visible = false;
    this.clearContent();
  }

  isVisible(): boolean {
    return this._visible;
  }

  // Hint centred along the bottom edge; page number (when given) tucked into
  // the top-right corner on the title's line, right-aligned to the margin.
  private addFooter(footer: PageFooter): void {
    const hint = makeText(footer.hint, {
      fontFamily: 'monospace',
      fontSize: 8,
      fill: DB32.dimGray,
    });
    hint.position.set(FRAME_X + Math.round((FRAME_W - hint.width) / 2), FRAME_Y + FRAME_H - 16);
    this.content.addChild(hint);

    if (footer.corner !== undefined) {
      const corner = makeText(footer.corner, {
        fontFamily: 'monospace',
        fontSize: 8,
        fill: DB32.dimGray,
      });
      corner.position.set(FRAME_X + FRAME_W - 12 - Math.ceil(corner.width), FRAME_Y + 13);
      this.content.addChild(corner);
    }
  }

  private reveal(): void {
    this._visible = true;
    this.container.visible = true;
  }

  private clearContent(): void {
    // Remove and destroy children so text textures don't pile up.
    for (const child of this.content.removeChildren()) {
      child.destroy();
    }
  }
}

function makeText(text: string, style: TextStyleOptions): Text {
  const t = new Text({ text, style });
  // Rasterise at device resolution so the glyphs land 1:1 on screen pixels.
  t.resolution = textResolution();
  return t;
}

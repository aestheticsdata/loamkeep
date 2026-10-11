import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH } from '@constants';
import { ART_KIND, draws, registerArt } from '@hd/art-mode';
import { ArtText } from '@hd/art-text';
import { bake, FineSprite } from '@hd/bake';
import { bookWrap } from '@hd/book-font';
import { FINE } from '@hd/fine-canvas';
import { parchmentHd, ruleHd } from '@systems/parchment-hd';
import { shownLarge } from '@systems/portrait-hd';
import { CanvasTextMetrics, Container, Graphics, TextStyle, type TextStyleOptions } from 'pixi.js';

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

// The description column, to the right of the illustration: where it starts,
// how wide it wraps, and the pitch of its lines.
const TEXT_X = FRAME_X + 110;
const TEXT_Y = FRAME_Y + 46;
const TEXT_WRAP_W = 130;
const TEXT_LINE_H = 13;

// The chamfer passes a page's sketch takes in HD: drawn at page size, its
// shapes are several logical pixels wide.
const SKETCH_CHAMFER = 2;

// The footer hint's own line, which the description has to stop clear of.
const HINT_Y = FRAME_Y + FRAME_H - 16;

// How many wrapped lines one leaf holds — seven at the current geometry.
// Derived from the column rather than written down, so moving the text or the
// hint re-budgets the page instead of quietly letting it overrun again.
const LINES_PER_LEAF = Math.floor((HINT_Y - TEXT_Y) / TEXT_LINE_H);

// The same budget for the book font in HD: lines 10 px apart, glyphs 4 px
// (12 fine) an advance at body size.
const BOOK_LINE_H = 10;
const BOOK_ADVANCE_FINE = 12;
const BOOK_LINES_PER_LEAF = Math.floor((HINT_Y - TEXT_Y) / BOOK_LINE_H);

const DESCRIPTION_STYLE: TextStyleOptions = {
  fontFamily: 'monospace',
  fontSize: 9,
  fill: DB32.valhalla,
  wordWrap: true,
  wordWrapWidth: TEXT_WRAP_W,
  lineHeight: TEXT_LINE_H,
};

// The same style as an instance, for measuring where the wraps fall. Held
// apart from the one the Text objects are built with on purpose: a Text
// subscribes to any style instance it is handed and never unsubscribes when
// it is destroyed, so sharing this one would leave a listener behind on every
// page turn.
const DESCRIPTION_METRICS_STYLE = new TextStyle(DESCRIPTION_STYLE);

// What sits at the bottom of a page, plus an optional page number in the
// top-right corner. The in-game page carries a single close hint; the
// title-screen gallery swaps in the page-turning keys and numbers its
// leaves. Same parchment either way — the layout is never forked.
export interface PageFooter {
  hint: string;
  corner?: string;
}

const DEFAULT_FOOTER: PageFooter = { hint: '[ press E to close ]' };

// Shown in place of the caller's hint whenever the page in hand runs to more
// than one leaf, so a description that breaks off mid-sentence always says
// which keys carry on. The gallery hands it in for every page, since a deck
// always turns.
export const TURN_PAGE_HINT = '[ ← → turn page    E close ]';

// Which leaf of a page to open on. Turning forward into a page opens its
// first leaf and turning back into one opens its last, the way a book does.
export type LeafEdge = 'first' | 'last';

// Modal overlay shown when the player discovers a landmark. Pauses gameplay
// while visible. Content is rebuilt every show() so each page gets its own
// leaf.
export class Sketchbook {
  readonly container: Container;
  private readonly content: Container;
  private _visible = false;

  // The page on show, its description already split at the line budget, and
  // which leaf of it is drawn. A note has no page and no leaves, so it simply
  // never turns.
  private page: SketchbookPage | null = null;
  private footer: PageFooter = DEFAULT_FOOTER;
  private leaves: readonly string[] = [];
  private leafIndex = 0;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Dim the world behind the overlay.
    const backdrop = new Graphics().rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill({ color: DB32.valhalla, alpha: 0.7 });
    this.container.addChild(backdrop);
    // In HD there is no veil: the world behind steps two places down its
    // ramp instead (rampDownFilter, applied by Game while this is open).
    registerArt({ classic: backdrop, hd: new Container() });

    // Parchment-like frame with a wooden border.
    const frame = new Graphics().rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).fill(DB32.pancho);
    const border = new Graphics().rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).stroke({ color: DB32.oiledCedar, width: 2 });
    const paper = new Container();
    paper.addChild(frame, border);
    const paperHd = new FineSprite();
    paperHd.show(bake(parchmentHd({ x: FRAME_X, y: FRAME_Y, w: FRAME_W, h: FRAME_H })));
    registerArt({ classic: paper, hd: paperHd });
    this.container.addChild(paper, paperHd);

    // Per-page content lives here, recreated each show().
    this.content = new Container();
    this.container.addChild(this.content);

    // Clipped to the parchment, so whatever a page ends up drawing it can
    // never paint over the border and out onto the world. Leaf-splitting is
    // what keeps the text readable; this is the guarantee that a page which
    // outgrows its frame reads as a page, not as a bug.
    const clip = new Graphics().rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).fill(DB32.pancho);
    this.container.addChild(clip);
    this.content.mask = clip;
  }

  // Open a page. A description too long for one leaf is split, and the
  // reader turns the rest with turnLeaf().
  show(page: SketchbookPage, footer: PageFooter = DEFAULT_FOOTER, open: LeafEdge = 'first'): void {
    this.page = page;
    this.footer = footer;
    this.leaves = splitIntoLeaves(page.description);
    this.leafIndex = open === 'last' ? this.leaves.length - 1 : 0;
    this.renderLeaf();
    this.reveal();
  }

  // A leaf with nothing on it but one centred line — the gallery's last
  // page, where the count of pages still blank lives. Same parchment, so it
  // reads as part of the same book rather than a separate notice.
  showNote(line: string, footer: PageFooter): void {
    this.clearContent();
    this.page = null;
    this.leaves = [];
    this.leafIndex = 0;

    const note = makeText(line, { fontFamily: 'monospace', fontSize: 8, fill: DB32.valhalla });
    note.position.set(
      FRAME_X + Math.round((FRAME_W - note.classic.width) / 2),
      FRAME_Y + Math.round((FRAME_H - note.classic.height) / 2),
    );
    this.content.addChild(note);

    this.addFooter(footer);
    this.reveal();
  }

  // Turn one leaf of the page on show, back or forward. Answers false when
  // there is no such leaf — a book has two covers — which is how the gallery
  // knows the arrow key is free and moves on to the next page of its deck.
  turnLeaf(delta: number): boolean {
    const next = this.leafIndex + Math.sign(delta);
    if (next === this.leafIndex || next < 0 || next >= this.leaves.length) return false;
    this.leafIndex = next;
    this.renderLeaf();
    return true;
  }

  hide(): void {
    this._visible = false;
    this.container.visible = false;
    this.clearContent();
    this.page = null;
    this.leaves = [];
    this.leafIndex = 0;
  }

  isVisible(): boolean {
    return this._visible;
  }

  // Draw the leaf at `leafIndex`. The title, the rule and the illustration
  // repeat on every leaf of a page: a continued page has to read as the same
  // page, and the unchanged heading is what says so.
  private renderLeaf(): void {
    if (this.page === null) return;
    this.clearContent();

    // Title
    const title = makeText(this.page.name, {
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: DB32.valhalla,
    });
    title.position.set(FRAME_X + 12, FRAME_Y + 10);
    this.content.addChild(title);

    // Underline separator
    const sep = new Graphics().rect(FRAME_X + 12, FRAME_Y + 32, FRAME_W - 24, 1).fill(DB32.oiledCedar);
    const sepHd = new FineSprite();
    sepHd.show(bake(ruleHd({ x: FRAME_X + 12, y: FRAME_Y + 32, w: FRAME_W - 24, h: 1 })));
    registerArt({ classic: sep, hd: sepHd });
    this.content.addChild(sep, sepHd);

    // Sketch — provided by the page. Centered in the left column.
    const sketch = new Graphics();
    const page = this.page;
    page.drawSketch(sketch);
    sketch.position.set(FRAME_X + 50, FRAME_Y + 110);
    // In HD the sketch is drawn at page size, chamfered as a drawing that
    // size, never a small sprite enlarged.
    const sketchHd = shownLarge((g) => page.drawSketch(g), { scale: 1, chamfer: SKETCH_CHAMFER });
    sketchHd.position.set(FRAME_X + 50, FRAME_Y + 110);
    registerArt({ classic: sketch, hd: sketchHd });
    this.content.addChild(sketch, sketchHd);

    // Description on the right column, already wrapped to the column and cut
    // to a leaf's worth of lines.
    const description = makeText(this.leaves[this.leafIndex], DESCRIPTION_STYLE);
    description.position.set(TEXT_X, TEXT_Y);
    this.content.addChild(description);

    // A page that carries on takes the turning keys in place of the caller's
    // hint, whichever caller it is.
    this.addFooter(this.leaves.length > 1 ? { ...this.footer, hint: TURN_PAGE_HINT } : this.footer);
  }

  // Hint centred along the bottom edge; page number (when given) tucked into
  // the top-right corner on the title's line, right-aligned to the margin.
  private addFooter(footer: PageFooter): void {
    const hint = makeText(footer.hint, {
      fontFamily: 'monospace',
      fontSize: 8,
      fill: DB32.dimGray,
    });
    hint.position.set(FRAME_X + Math.round((FRAME_W - hint.classic.width) / 2), HINT_Y);
    this.content.addChild(hint);

    if (footer.corner !== undefined) {
      const corner = makeText(footer.corner, {
        fontFamily: 'monospace',
        fontSize: 8,
        fill: DB32.dimGray,
      });
      corner.position.set(FRAME_X + FRAME_W - 12 - Math.ceil(corner.classic.width), FRAME_Y + 13);
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
      child.destroy({ children: true });
    }
  }
}

// Wrap a description to the column and deal it out into leaves of at most
// LINES_PER_LEAF lines. Measured with the very style the page is drawn in, so
// the split falls exactly where the rendered line breaks do; the six short
// descriptions come back as a single leaf holding the same lines they always
// had.
//
// In HD alone the page is set in the book font, whose lines are a character
// count and 10 px apart (RECIPES §8), so it is paged by those; classic and
// split keep classic's breaks, which the book font always fits.
function splitIntoLeaves(description: string): readonly string[] {
  const lines = draws(ART_KIND.classic)
    ? CanvasTextMetrics.measureText(description, DESCRIPTION_METRICS_STYLE).lines
    : bookWrap(description, Math.floor((TEXT_WRAP_W * FINE) / BOOK_ADVANCE_FINE));
  const perLeaf = draws(ART_KIND.classic) ? LINES_PER_LEAF : BOOK_LINES_PER_LEAF;
  const leaves: string[] = [];
  for (let i = 0; i < lines.length; i += perLeaf) {
    leaves.push(lines.slice(i, i + perLeaf).join('\n'));
  }
  // An empty description still gets a leaf, so a page is never leafless.
  return leaves.length > 0 ? leaves : [''];
}

function makeText(text: string, style: TextStyleOptions): ArtText {
  return new ArtText({ text, style });
}

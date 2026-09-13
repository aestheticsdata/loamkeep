import { type Input, KEYS_BACK, KEYS_INTERACT, KEYS_LEFT, KEYS_RIGHT } from '@systems/input';
import type { LeafEdge, Sketchbook, SketchbookPage } from '@systems/sketchbook';
import { TURN_PAGE_HINT } from '@systems/sketchbook';

export type GalleryEvent = 'turned' | 'closed' | null;

// One book as read from the title: a deck of the pages already written, in
// the book's own order, ending on one leaf that says how many are still
// blank — a count, never the names, because the names are the only
// discovery the game has. Rendering is delegated to Sketchbook so this and
// the in-game page can never drift apart.
export class TitleSketchbook {
  private readonly book: Sketchbook;
  private readonly pages: readonly SketchbookPage[];
  private readonly blankPages: number;
  // 0..pages.length; the last index is the blank-count leaf.
  private index = 0;

  constructor(book: Sketchbook, pages: readonly SketchbookPage[], blankPages: number) {
    this.book = book;
    this.pages = pages;
    this.blankPages = blankPages;
    this.render('first');
  }

  // One call per frame while open. Reports what happened so Game can play
  // the matching sound; on 'closed' the caller hides the overlay.
  update(input: Input): GalleryEvent {
    if (input.isAnyPressed(KEYS_INTERACT) || input.isAnyPressed(KEYS_BACK)) return 'closed';

    let dir = 0;
    if (input.isAnyPressed(KEYS_LEFT)) dir -= 1;
    if (input.isAnyPressed(KEYS_RIGHT)) dir += 1;
    if (dir === 0) return null;

    // A page long enough to run to a second leaf takes the arrow first: the
    // deck only moves on once the reader is off the end of the page in hand.
    if (this.book.turnLeaf(dir)) return 'turned';

    // No wrap: a book has two covers.
    const next = Math.min(this.pages.length, Math.max(0, this.index + dir));
    if (next === this.index) return null;
    this.index = next;
    // Turning back lands on the end of the page behind, so ← then → returns
    // the reader to where they were rather than re-reading from the top.
    this.render(dir < 0 ? 'last' : 'first');
    return 'turned';
  }

  private render(open: LeafEdge): void {
    if (this.index < this.pages.length) {
      this.book.show(
        this.pages[this.index],
        { hint: TURN_PAGE_HINT, corner: `${this.index + 1} / ${this.pages.length}` },
        open,
      );
    } else {
      this.book.showNote(blankPagesLine(this.blankPages), { hint: TURN_PAGE_HINT });
    }
  }
}

function blankPagesLine(n: number): string {
  if (n === 0) return 'every page is written';
  return n === 1 ? '1 page still blank' : `${n} pages still blank`;
}

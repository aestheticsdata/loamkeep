import type { LandmarkSpec } from '@entities/landmark';
import { type Input, KEYS_BACK, KEYS_INTERACT, KEYS_LEFT, KEYS_RIGHT } from '@systems/input';
import type { Sketchbook } from '@systems/sketchbook';

// Same bracketed grammar as `[ press E to close ]`, with the paging keys.
const NAV_HINT = '[ ← → turn page    E close ]';

export type GalleryEvent = 'turned' | 'closed' | null;

// The sketchbook as read from the title: a deck of the pages already
// written, in world order, ending on one leaf that says how many are still
// blank — a count, never the names, because the names are the only
// discovery the game has. Rendering is delegated to Sketchbook so this and
// the in-game page can never drift apart.
export class TitleSketchbook {
  private readonly book: Sketchbook;
  private readonly pages: readonly LandmarkSpec[];
  private readonly blankPages: number;
  // 0..pages.length; the last index is the blank-count leaf.
  private index = 0;

  constructor(book: Sketchbook, pages: readonly LandmarkSpec[], blankPages: number) {
    this.book = book;
    this.pages = pages;
    this.blankPages = blankPages;
    this.render();
  }

  // One call per frame while open. Reports what happened so Game can play
  // the matching sound; on 'closed' the caller hides the overlay.
  update(input: Input): GalleryEvent {
    if (input.isAnyPressed(KEYS_INTERACT) || input.isAnyPressed(KEYS_BACK)) return 'closed';

    let dir = 0;
    if (input.isAnyPressed(KEYS_LEFT)) dir -= 1;
    if (input.isAnyPressed(KEYS_RIGHT)) dir += 1;
    if (dir === 0) return null;

    // No wrap: a book has two covers.
    const next = Math.min(this.pages.length, Math.max(0, this.index + dir));
    if (next === this.index) return null;
    this.index = next;
    this.render();
    return 'turned';
  }

  private render(): void {
    if (this.index < this.pages.length) {
      this.book.show(this.pages[this.index], {
        hint: NAV_HINT,
        corner: `${this.index + 1} / ${this.pages.length}`,
      });
    } else {
      this.book.showNote(blankPagesLine(this.blankPages), { hint: NAV_HINT });
    }
  }
}

function blankPagesLine(n: number): string {
  if (n === 0) return 'every page is written';
  return n === 1 ? '1 page still blank' : `${n} pages still blank`;
}

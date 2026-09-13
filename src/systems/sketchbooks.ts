import type { SketchbookPage } from '@systems/sketchbook';
import { CREATURES_BOOK_ID, FLORA_BOOK_ID, LANDMARKS_BOOK_ID, landmarkPageId } from '@systems/sketchbook-store';
import { CREATURE_PAGES } from '@world/creatures';
import { FLORA_PAGES } from '@world/flora';
import { listLandmarkPages } from '@world/levels';

// One leaf of a book as the game tracks it: the id the store writes down, and
// the page the sketchbook draws. Two fields rather than one because an id has
// to survive a rename — the landmarks book keys on '<level>.<landmark>', never
// on 'Old Cairn' — while a page carries no id at all.
export interface BookPage {
  id: string;
  page: SketchbookPage;
}

// A book, which is one row of the title menu and one gallery behind it.
// `pages()` is a function, not an array: a table of contents is derived — the
// landmarks book walks the level registry — and computing it once at module
// load would freeze it.
export interface SketchbookBook {
  id: string;
  // Drawn in the 5×7 bitmap font, which holds A–Z, 0–9, '/', '(', ')' and
  // space and throws on anything else. So: no hyphens, no apostrophes.
  label: string;
  pages(): BookPage[];
}

// Every book, in menu order. Registering one here is the whole of adding one:
// the menu row, its count, its gallery and its storage all follow.
//
// Four books is the comfortable ceiling — a fifth leaves 2 px under the menu
// plate and a sixth runs into the key line, at which point MENU_PLATE_Y in
// title-screen.ts moves up rather than the rows getting tighter.
export const SKETCHBOOKS: readonly SketchbookBook[] = [
  {
    id: LANDMARKS_BOOK_ID,
    label: 'LANDMARKS',
    // In level-registry order (meadow → keep → crypt, then authoring order
    // inside each level), so adding a landmark to any level updates this
    // book's count and its gallery order for free.
    pages: () =>
      listLandmarkPages().map(({ levelId, spec }) => ({
        id: landmarkPageId(levelId, spec.id),
        page: spec,
      })),
  },
  {
    id: CREATURES_BOOK_ID,
    label: 'CREATURES',
    // Authored rather than derived: a species is not registered anywhere the
    // way a landmark is registered on a level, and one page covers however
    // many of the thing the world holds.
    pages: () => CREATURE_PAGES.map(({ id, page }) => ({ id, page })),
  },
  {
    id: FLORA_BOOK_ID,
    label: 'FLORA',
    // Authored for the same reason the creatures book is, and keyed by
    // species for the same reason too. The one difference is invisible from
    // here: these pages are written by walking past, not by pressing E.
    pages: () => FLORA_PAGES.map(({ id, page }) => ({ id, page })),
  },
];

// The book with this id. Throws rather than returning undefined: the only
// caller is the menu handing back an id it was given from this very list, so
// a miss is a wiring bug, not a state to render.
export function getBook(id: string): SketchbookBook {
  const book = SKETCHBOOKS.find((candidate) => candidate.id === id);
  if (book === undefined) {
    throw new Error(`Unknown sketchbook id '${id}'. Known: ${SKETCHBOOKS.map((b) => b.id).join(', ')}`);
  }
  return book;
}

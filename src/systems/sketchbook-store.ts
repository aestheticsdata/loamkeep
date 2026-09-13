// The one thing Loamkeep keeps between sessions: which sketchbook pages the
// player has written. WorldState stays in memory on purpose — a lever
// resetting on reload costs nothing — but a page is the only proof the
// player went somewhere, and losing it on refresh would make the title
// screen's book entries a lie.
//
// Storage is one versioned JSON blob in localStorage. Every access is
// guarded: private-mode Safari throws on setItem, a blocked origin throws on
// getItem, and a hand-edited blob can fail to parse. None of that may reach
// the boot path, so a broken store simply reads as an empty book.

// The key keeps its `.v1` suffix now that the blob inside is v2: renaming it
// would orphan every page already written. The version that counts is the one
// in the JSON, which load() migrates forward.
const STORAGE_KEY = 'loamkeep.sketchbook.v1';

// v1 was landmark-only by construction — one flat list, no room for a second
// book. v2 keys a list per book.
interface StoredV1 {
  version: 1;
  discovered: string[];
}

interface StoredV2 {
  version: 2;
  books: Record<string, string[]>;
}

// The books, by the names they are written to disk under. They live here
// rather than in the registry because these strings end up inside the blob:
// the migration below has to spell the landmarks one, and a book renamed here
// is every one of its pages forgotten.
export const LANDMARKS_BOOK_ID = 'landmarks';
export const CREATURES_BOOK_ID = 'creatures';

// Landmark pages are keyed '<level-id>.<landmark-id>' — the WorldState naming
// convention — and never by display name, so renaming Old Cairn keeps the
// player's page and two levels may reuse a landmark id without colliding.
export function landmarkPageId(levelId: string, landmarkId: string): string {
  return `${levelId}.${landmarkId}`;
}

export class SketchbookStore {
  private readonly books: Map<string, Set<string>>;

  constructor() {
    this.books = load();
  }

  has(bookId: string, pageId: string): boolean {
    return this.books.get(bookId)?.has(pageId) ?? false;
  }

  // Write-through: the whole blob is rewritten on every new page. Pages
  // arrive minutes apart, so there is nothing worth batching.
  add(bookId: string, pageId: string): void {
    let pages = this.books.get(bookId);
    if (pages === undefined) {
      pages = new Set();
      this.books.set(bookId, pages);
    }
    if (pages.has(pageId)) return;
    pages.add(pageId);
    this.save();
  }

  private save(): void {
    const books: Record<string, string[]> = {};
    for (const [bookId, pages] of this.books) {
      books[bookId] = [...pages];
    }
    const blob: StoredV2 = { version: 2, books };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
    } catch {
      // Quota or private mode: the page still exists for this session.
    }
  }
}

function load(): Map<string, Set<string>> {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (privacy settings, sandboxed frame): nothing to read.
    return new Map();
  }
  if (raw === null) return new Map();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Not JSON — someone edited it by hand. Start over rather than crash.
    return new Map();
  }

  if (isStoredV2(parsed)) {
    return new Map(Object.entries(parsed.books).map(([bookId, pages]) => [bookId, new Set(pages)]));
  }
  // A save from before the books were plural. Its flat list is the landmarks
  // book, and landmark page ids never changed shape, so the strings carry
  // straight over: someone who had found six pages still has six. The blob is
  // rewritten as v2 the next time a page is written, not here — reading must
  // never be the thing that touches storage.
  if (isStoredV1(parsed)) {
    return new Map([[LANDMARKS_BOOK_ID, new Set(parsed.discovered)]]);
  }
  // Right JSON, wrong shape: a hand-edited blob again. Empty book.
  return new Map();
}

function isStoredV1(value: unknown): value is StoredV1 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { version?: unknown; discovered?: unknown };
  return v.version === 1 && isStringArray(v.discovered);
}

function isStoredV2(value: unknown): value is StoredV2 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { version?: unknown; books?: unknown };
  if (v.version !== 2) return false;
  if (typeof v.books !== 'object' || v.books === null || Array.isArray(v.books)) return false;
  return Object.values(v.books as Record<string, unknown>).every(isStringArray);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

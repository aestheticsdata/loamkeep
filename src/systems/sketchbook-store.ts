// The one thing Loamkeep keeps between sessions: which sketchbook pages the
// player has written. WorldState stays in memory on purpose — a lever
// resetting on reload costs nothing — but a page is the only proof the
// player went somewhere, and losing it on refresh would make the title
// screen's SKETCHBOOK entry a lie.
//
// Storage is one versioned JSON blob in localStorage. Every access is
// guarded: private-mode Safari throws on setItem, a blocked origin throws on
// getItem, and a hand-edited blob can fail to parse. None of that may reach
// the boot path, so a broken store simply reads as an empty book.

const STORAGE_KEY = 'loamkeep.sketchbook.v1';

interface StoredSketchbook {
  version: 1;
  discovered: string[];
}

// Pages are keyed '<level-id>.<landmark-id>' — the WorldState naming
// convention — and never by display name, so renaming Old Cairn keeps the
// player's page and two levels may reuse a landmark id without colliding.
export function landmarkPageId(levelId: string, landmarkId: string): string {
  return `${levelId}.${landmarkId}`;
}

export class SketchbookStore {
  private readonly discovered: Set<string>;

  constructor() {
    this.discovered = new Set(load());
  }

  has(pageId: string): boolean {
    return this.discovered.has(pageId);
  }

  // Write-through: the whole blob is rewritten on every new page. Pages
  // arrive minutes apart, so there is nothing worth batching.
  add(pageId: string): void {
    if (this.discovered.has(pageId)) return;
    this.discovered.add(pageId);
    save([...this.discovered]);
  }
}

function load(): string[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (privacy settings, sandboxed frame): nothing to read.
    return [];
  }
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredSketchbook(parsed) ? parsed.discovered : [];
  } catch {
    // Not JSON — someone edited it by hand. Start over rather than crash.
    return [];
  }
}

function save(discovered: string[]): void {
  const blob: StoredSketchbook = { version: 1, discovered };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
  } catch {
    // Quota or private mode: the page still exists for this session.
  }
}

function isStoredSketchbook(value: unknown): value is StoredSketchbook {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { version?: unknown; discovered?: unknown };
  return v.version === 1 && Array.isArray(v.discovered) && v.discovered.every((id) => typeof id === 'string');
}

import type { Container } from 'pixi.js';

// Which art the game draws. Classic is the shipped look and stays the default
// until the HD pass is done (LOA-42). Split draws both, classic on the left
// half of the stage and HD on the right — the A/B tool every HD ticket is
// judged with.
export const ART_MODE = { classic: 'classic', hd: 'hd', split: 'split' } as const;
export type ArtMode = (typeof ART_MODE)[keyof typeof ART_MODE];

// The two kinds of drawing a sprite can carry. Split needs to show one and
// then the other within the same frame, so a sprite keeps both.
export const ART_KIND = { classic: 'classic', hd: 'hd' } as const;
export type ArtKind = (typeof ART_KIND)[keyof typeof ART_KIND];

const ART_KEY = 'loamkeep.art';
const FINE_MOTION_KEY = 'loamkeep.fineMotion';

function isArtMode(value: unknown): value is ArtMode {
  return Object.values(ART_MODE).includes(value as ArtMode);
}

// Every storage access is wrapped: a private window, blocked site data or a
// full quota must cost the preference, never the game.
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not remembered, still applied.
  }
}

// HD is the default (LOA-42). A `?art=classic` in the URL wins over what is
// stored, so a capture or a shared link opens in the art it names; classic
// stays one console word away: `__loamkeep.art('classic')`.
function initialMode(): ArtMode {
  const fromUrl = new URLSearchParams(window.location.search).get('art');
  if (isArtMode(fromUrl)) return fromUrl;
  const stored = readStored(ART_KEY);
  return isArtMode(stored) ? stored : ART_MODE.hd;
}

let mode: ArtMode = typeof window === 'undefined' ? ART_MODE.hd : initialMode();
let fine = typeof window === 'undefined' ? true : readStored(FINE_MOTION_KEY) !== 'false';

export function artMode(): ArtMode {
  return mode;
}

export function setArtMode(next: ArtMode): void {
  mode = next;
  writeStored(ART_KEY, next);
  showArt(next === ART_MODE.classic ? ART_KIND.classic : ART_KIND.hd);
}

// Whether this frame needs the given kind of drawing brought up to date.
// Split draws both.
export function draws(kind: ArtKind): boolean {
  if (mode === ART_MODE.split) return true;
  return kind === ART_KIND.classic ? mode === ART_MODE.classic : mode !== ART_MODE.classic;
}

// Fine motion (L8): HD animation in fine-pixel steps — the stride, the bob,
// the swim arms. Off, every HD frame is a classic frame redrawn.
export function fineMotion(): boolean {
  return fine;
}

export function setFineMotion(on: boolean): void {
  fine = on;
  writeStored(FINE_MOTION_KEY, String(on));
}

// A sprite's two drawings. The pair is what split view flips between.
export interface ArtPair {
  classic: Container;
  hd: Container;
}

const pairs = new Set<ArtPair>();

// Registers a sprite's two drawings and shows the one the mode asks for.
// A pair whose containers have been destroyed drops out on its own.
export function registerArt(pair: ArtPair): ArtPair {
  pairs.add(pair);
  pair.classic.visible = mode === ART_MODE.classic;
  pair.hd.visible = mode !== ART_MODE.classic;
  return pair;
}

// Forgets a pair whose sprite is going away.
export function unregisterArt(pair: ArtPair): void {
  pairs.delete(pair);
}

// Shows one kind of drawing on every registered sprite.
export function showArt(kind: ArtKind): void {
  for (const pair of pairs) {
    if (pair.classic.destroyed || pair.hd.destroyed) {
      pairs.delete(pair);
      continue;
    }
    pair.classic.visible = kind === ART_KIND.classic;
    pair.hd.visible = kind === ART_KIND.hd;
  }
}

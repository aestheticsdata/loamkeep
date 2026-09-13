import { DB32 } from '@constants';
import type { Graphics } from 'pixi.js';

// The meadow's growing things, drawn once and used twice: planted in the
// world as `Decoration`s, and enlarged onto a leaf of the flora sketchbook.
// They live here rather than in meadow.ts — where they were first drawn —
// because a drawing a book renders is no longer one level's private scenery,
// and the mushroom already grows in two places.
//
// Drawing convention matches the rest of the world: origin (0, 0) at the
// base, everything extending into negative y.
//
// The meadow's boulder and pebbles stayed behind in the level file. They are
// scenery with no page, and a book called FLORA has no business holding
// gravel.

// A species with a page in the flora book. This is the id the store writes
// down, so renaming one is forgetting every page already written — and it is
// keyed by species, not by position: the same oak stands at two columns and
// the mushroom grows down in the cavern.
export type FloraId = 'small-tree' | 'pine-tree' | 'tall-oak' | 'giant-tree' | 'bush' | 'mushroom';

function drawSmallTree(g: Graphics): void {
  const trunk = DB32.oiledCedar;
  const leafMid = DB32.eltGreen;
  const leafLight = DB32.atlantis;
  const leafDark = DB32.dell;
  // Trunk.
  g.rect(-1, -6, 2, 6).fill(trunk);
  // Canopy (round-ish, three stacked rectangles narrowing toward the top).
  g.rect(-4, -10, 8, 4).fill(leafMid);
  g.rect(-3, -13, 6, 3).fill(leafMid);
  g.rect(-2, -15, 4, 2).fill(leafMid);
  // Highlights and shadows.
  g.rect(-2, -15, 4, 1).fill(leafLight);
  g.rect(-3, -13, 1, 1).fill(leafLight);
  g.rect(2, -13, 1, 1).fill(leafLight);
  g.rect(-4, -7, 8, 1).fill(leafDark);
}

function drawPineTree(g: Graphics): void {
  const trunk = DB32.oiledCedar;
  const leafMid = DB32.dell;
  const leafLight = DB32.eltGreen;
  // Trunk.
  g.rect(-1, -6, 2, 6).fill(trunk);
  // Three tiers of triangular canopy, narrowing toward the top.
  g.rect(-5, -10, 10, 4).fill(leafMid);
  g.rect(-5, -10, 10, 1).fill(leafLight);
  g.rect(-4, -14, 8, 4).fill(leafMid);
  g.rect(-4, -14, 8, 1).fill(leafLight);
  g.rect(-3, -18, 6, 4).fill(leafMid);
  g.rect(-3, -18, 6, 1).fill(leafLight);
  g.rect(-1, -19, 2, 1).fill(leafLight);
}

// Big oak — 14 wide × 22 tall, the most imposing of the three. Thick trunk
// with a root flare, plus a four-tier rounded canopy.
function drawTallOak(g: Graphics): void {
  const trunk = DB32.oiledCedar;
  const trunkHi = DB32.rope;
  const leafMid = DB32.eltGreen;
  const leafLight = DB32.atlantis;
  const leafDark = DB32.dell;

  // Trunk — 4 px wide, 8 px tall.
  g.rect(-2, -8, 4, 8).fill(trunk);
  // Highlight along the left edge for a sense of light direction.
  g.rect(-2, -8, 1, 8).fill(trunkHi);
  // Root flare — 1 row wider than the trunk at ground level.
  g.rect(-3, -1, 6, 1).fill(trunk);

  // Canopy in four tiers: widest at the bottom, narrowing toward the crown.
  // Bottom tier — 14 wide.
  g.rect(-7, -12, 14, 4).fill(leafMid);
  g.rect(-7, -12, 14, 1).fill(leafLight);
  // Bottom-of-canopy shadow band.
  g.rect(-7, -9, 14, 1).fill(leafDark);

  // Middle tier — 12 wide.
  g.rect(-6, -16, 12, 4).fill(leafMid);
  g.rect(-6, -16, 12, 1).fill(leafLight);

  // Upper tier — 8 wide.
  g.rect(-4, -20, 8, 4).fill(leafMid);
  g.rect(-4, -20, 8, 1).fill(leafLight);

  // Crown — 4 wide.
  g.rect(-2, -22, 4, 2).fill(leafMid);
  g.rect(-2, -22, 4, 1).fill(leafLight);
}

// Giant tree — 18 wide × 30 tall, an ancient landmark-sized oak. Tapered
// trunk (wider at the base), root flare, knot detail, and a five-tier
// rounded canopy that reaches above row-6 platforms.
function drawGiantTree(g: Graphics): void {
  const trunk = DB32.oiledCedar;
  const trunkHi = DB32.rope;
  const trunkShadow = DB32.loulou;
  const leafMid = DB32.eltGreen;
  const leafLight = DB32.atlantis;
  const leafDark = DB32.dell;

  // Trunk in two segments: 6-wide base + 4-wide upper, giving a slight
  // taper that reads as "this thing has been here a long time."
  g.rect(-3, -6, 6, 6).fill(trunk);
  g.rect(-3, -6, 1, 6).fill(trunkHi);
  g.rect(-2, -12, 4, 6).fill(trunk);
  g.rect(-2, -12, 1, 6).fill(trunkHi);
  // Single dark knot near the middle of the upper trunk.
  g.rect(0, -8, 2, 1).fill(trunkShadow);
  // Root flare — 8 wide, 1 tall at ground level.
  g.rect(-4, -1, 8, 1).fill(trunk);

  // Canopy in five tiers. Bottom row carries a shadow band so the bottom
  // edge doesn't blend into the row directly under it.
  // Bottom tier — 18 wide (the widest of any tree in this level).
  g.rect(-9, -16, 18, 4).fill(leafMid);
  g.rect(-9, -16, 18, 1).fill(leafLight);
  g.rect(-9, -13, 18, 1).fill(leafDark);

  // Second tier — 16 wide.
  g.rect(-8, -20, 16, 4).fill(leafMid);
  g.rect(-8, -20, 16, 1).fill(leafLight);

  // Third tier — 14 wide.
  g.rect(-7, -24, 14, 4).fill(leafMid);
  g.rect(-7, -24, 14, 1).fill(leafLight);

  // Fourth tier — 10 wide.
  g.rect(-5, -28, 10, 4).fill(leafMid);
  g.rect(-5, -28, 10, 1).fill(leafLight);

  // Crown — 6 wide.
  g.rect(-3, -30, 6, 2).fill(leafMid);
  g.rect(-3, -30, 6, 1).fill(leafLight);
}

function drawBush(g: Graphics): void {
  const leafMid = DB32.eltGreen;
  const leafLight = DB32.atlantis;
  const leafDark = DB32.dell;
  g.rect(-3, -4, 6, 4).fill(leafMid);
  g.rect(-3, -4, 6, 1).fill(leafLight);
  g.rect(-4, -2, 1, 2).fill(leafMid);
  g.rect(3, -2, 1, 2).fill(leafMid);
  g.rect(-3, -1, 6, 1).fill(leafDark);
}

function drawMushroom(g: Graphics): void {
  const cap = DB32.clairvoyant;
  // A shade under the old pancho stem, which was the sketchbook parchment's
  // own colour to the byte: on a page the stem vanished and left a cap
  // floating. Still pale against cavern stone, which is all it was there for.
  const stem = DB32.twine;
  // Stem.
  g.rect(-1, -2, 2, 2).fill(stem);
  // Cap (slightly wider than the stem, with a tiny dome on top).
  g.rect(-3, -4, 6, 2).fill(cap);
  g.rect(-2, -5, 4, 1).fill(cap);
  // White spots on the cap — classic mushroom motif.
  g.rect(-2, -4, 1, 1).fill(DB32.lightSteel);
  g.rect(1, -3, 1, 1).fill(DB32.lightSteel);
}

// Every species by id, so a plant is placed by name and can never be handed
// the wrong drawing — and so the book and the world are guaranteed to show
// the same thing.
//
// `height` is how far the drawing reaches above its base, read off the rects
// above. The base is the y = 0 line by the drawing convention, so this is the
// whole of it, and it is what a page scales a plant by to fit a leaf.
export interface PlantDrawing {
  draw(g: Graphics): void;
  height: number;
}

export const PLANTS: Record<FloraId, PlantDrawing> = {
  'small-tree': { draw: drawSmallTree, height: 15 },
  'pine-tree': { draw: drawPineTree, height: 19 },
  'tall-oak': { draw: drawTallOak, height: 22 },
  'giant-tree': { draw: drawGiantTree, height: 30 },
  bush: { draw: drawBush, height: 4 },
  mushroom: { draw: drawMushroom, height: 5 },
};

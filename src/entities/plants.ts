import { DB32 } from '@constants';
import { drawGlow } from '@entities/glow';
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
export type FloraId =
  | 'small-tree'
  | 'pine-tree'
  | 'tall-oak'
  | 'giant-tree'
  | 'bush'
  | 'mushroom'
  | 'glowcap'
  | 'shelf-fungus'
  | 'glow-moss'
  | 'squash'
  | 'bean-trellis'
  | 'sunflower'
  | 'heather'
  | 'apple-tree';

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

// The glow grotto's three. Their light is a drawGlow halo behind them —
// cyan, or amber for the shelf fungus; the moss has only its own bright
// points. Static: a decoration is drawn once, and the grotto's movement is
// the moths'.

// Glowcap — a tall, thin-stemmed mushroom with a domed cap that gives off
// cyan light. 7 wide × 10 tall, plus its halo.
function drawGlowcap(g: Graphics): void {
  drawGlow(g, { x: 0, y: -8, radius: 12, color: DB32.viking });
  // Stem, pale and slightly bent.
  g.rect(0, -5, 1, 5).fill(DB32.lightSteel);
  g.rect(-1, -2, 1, 2).fill(DB32.lightSteel);
  // Cap.
  g.rect(-3, -8, 7, 2).fill(DB32.viking);
  g.rect(-2, -9, 5, 1).fill(DB32.viking);
  g.rect(-1, -10, 3, 1).fill(DB32.lightSteel);
  // Gills under the cap, and the brightest point on its crown.
  g.rect(-2, -6, 5, 1).fill(DB32.venice);
  g.rect(0, -10, 1, 1).fill(DB32.white);
}

// Shelf fungus — a pair of amber brackets stacked on a stump of rock, with a
// faint warm glow. 9 wide × 6 tall.
function drawShelfFungus(g: Graphics): void {
  drawGlow(g, { x: 1, y: -4, radius: 7, color: DB32.tahitiGold });
  g.rect(-2, -6, 3, 6).fill(DB32.opal);
  g.rect(-5, -3, 6, 1).fill(DB32.tahitiGold);
  g.rect(-4, -2, 4, 1).fill(DB32.rope);
  g.rect(0, -6, 5, 1).fill(DB32.tahitiGold);
  g.rect(1, -5, 3, 1).fill(DB32.rope);
  g.rect(-5, -3, 1, 1).fill(DB32.goldenFizz);
  g.rect(4, -6, 1, 1).fill(DB32.goldenFizz);
}

// Glow moss — a low mat over the stone with green-cyan points of light in
// it. 10 wide × 2 tall.
function drawGlowMoss(g: Graphics): void {
  g.rect(-5, -2, 10, 2).fill(DB32.dell);
  g.rect(-4, -2, 1, 1).fill(DB32.atlantis);
  g.rect(-1, -2, 1, 1).fill(DB32.viking);
  g.rect(2, -2, 1, 1).fill(DB32.atlantis);
  g.rect(4, -1, 1, 1).fill(DB32.viking);
  g.rect(-3, -1, 2, 1).fill(DB32.eltGreen);
}

// The kitchen garden's three, in autumn: what is left at the end of the
// season, not the summer version.

// Squash — a sprawl of big leaves on a vine, with one ripe orange squash
// lying in them. 14 wide × 7 tall.
function drawSquash(g: Graphics): void {
  const leaf = DB32.dell;
  const leafHi = DB32.christi;
  const vine = DB32.rainforest;
  g.rect(-7, -1, 14, 1).fill(vine);
  g.rect(-6, -5, 5, 4).fill(leaf);
  g.rect(-5, -6, 3, 1).fill(leaf);
  g.rect(-6, -5, 2, 1).fill(leafHi);
  g.rect(3, -4, 4, 3).fill(leaf);
  g.rect(4, -5, 2, 1).fill(leaf);
  g.rect(3, -4, 1, 1).fill(DB32.rainforest);
  // The squash itself, ribbed.
  g.rect(-1, -4, 5, 4).fill(DB32.tahitiGold);
  g.rect(-2, -3, 7, 2).fill(DB32.tahitiGold);
  g.rect(0, -4, 1, 4).fill(DB32.rope);
  g.rect(2, -4, 1, 4).fill(DB32.rope);
  g.rect(-1, -4, 1, 1).fill(DB32.twine);
  g.rect(1, -5, 1, 1).fill(vine);
}

// Bean trellis — three canes tied at the top in a wigwam, with a vine gone
// yellow climbing them and a few pods left hanging. 10 wide × 20 tall.
function drawBeanTrellis(g: Graphics): void {
  const cane = DB32.rope;
  for (let i = 0; i < 18; i++) {
    const spread = Math.floor((18 - i) / 4);
    g.rect(-spread - 1, -i - 1, 1, 1).fill(cane);
    g.rect(spread, -i - 1, 1, 1).fill(cane);
  }
  g.rect(0, -19, 1, 19).fill(cane);
  g.rect(-1, -19, 3, 1).fill(DB32.twine);
  // The vine, yellowing, and the last pods.
  for (const [x, y] of [
    [-4, -3],
    [3, -5],
    [-3, -8],
    [2, -10],
    [-2, -13],
    [1, -15],
  ] as const) {
    g.rect(x, y, 2, 2).fill(DB32.rainforest);
    g.rect(x, y, 1, 1).fill(DB32.plum);
  }
  g.rect(-4, -7, 1, 3).fill(DB32.atlantis);
  g.rect(3, -12, 1, 3).fill(DB32.atlantis);
}

// Sunflower — tall, its head heavy and bowed, the petals gone ragged. 9 wide
// × 24 tall.
function drawSunflower(g: Graphics): void {
  g.rect(0, -18, 1, 18).fill(DB32.dell);
  g.rect(-3, -9, 3, 2).fill(DB32.dell);
  g.rect(1, -13, 3, 2).fill(DB32.dell);
  // The bowed head, facing down and right.
  g.rect(0, -23, 5, 5).fill(DB32.goldenFizz);
  g.rect(-1, -22, 1, 3).fill(DB32.goldenFizz);
  g.rect(5, -21, 1, 2).fill(DB32.tahitiGold);
  g.rect(1, -22, 3, 3).fill(DB32.oiledCedar);
  g.rect(2, -21, 1, 1).fill(DB32.stinger);
  g.rect(0, -24, 2, 1).fill(DB32.tahitiGold);
}

// Heather — the observatory hill's. A low clump of woody stems with purple
// flower spikes, frosted at the tips. 10 wide × 6 tall.
function drawHeather(g: Graphics): void {
  g.rect(-5, -2, 10, 2).fill(0x26332f);
  for (const [x, h] of [
    [-4, 4],
    [-2, 6],
    [0, 5],
    [2, 6],
    [4, 3],
  ] as const) {
    g.rect(x, -h, 1, h).fill(0x6a4a7e);
    g.rect(x, -h, 1, 2).fill(0x9a6aa8);
    g.rect(x, -h, 1, 1).fill(0x9fb0cc);
  }
  g.rect(-3, -1, 1, 1).fill(DB32.rope);
  g.rect(1, -1, 1, 1).fill(DB32.rope);
}

// Apple tree — the orchard's: a short crooked trunk, a round crown going
// yellow at the edges, and the last red apples in it. 20 wide × 28 tall.
export function drawAppleTree(g: Graphics): void {
  const trunk = DB32.oiledCedar;
  g.rect(-2, -12, 4, 12).fill(trunk);
  g.rect(-1, -12, 1, 12).fill(DB32.rope);
  g.rect(2, -16, 2, 4).fill(trunk);
  g.rect(-4, -15, 2, 3).fill(trunk);
  g.rect(-9, -24, 18, 10).fill(DB32.dell);
  g.rect(-7, -27, 14, 3).fill(DB32.dell);
  g.rect(-10, -21, 20, 5).fill(DB32.dell);
  g.rect(-6, -26, 8, 2).fill(DB32.christi);
  g.rect(-9, -18, 3, 2).fill(DB32.rainforest);
  g.rect(6, -22, 3, 3).fill(DB32.rainforest);
  for (const [x, y] of [
    [-6, -20],
    [3, -24],
    [6, -17],
    [-2, -16],
    [0, -21],
  ] as const) {
    g.rect(x, y, 2, 2).fill(DB32.clairvoyant);
    g.rect(x, y, 1, 1).fill(DB32.brown);
  }
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
  glowcap: { draw: drawGlowcap, height: 20 },
  'shelf-fungus': { draw: drawShelfFungus, height: 11 },
  'glow-moss': { draw: drawGlowMoss, height: 2 },
  squash: { draw: drawSquash, height: 6 },
  'bean-trellis': { draw: drawBeanTrellis, height: 19 },
  sunflower: { draw: drawSunflower, height: 24 },
  heather: { draw: drawHeather, height: 6 },
  'apple-tree': { draw: drawAppleTree, height: 27 },
};

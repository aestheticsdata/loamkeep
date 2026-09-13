import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH } from '@constants';
import { drawBird } from '@entities/bird';
import { drawFigure } from '@entities/player';
import { drawRabbit } from '@entities/rabbit';
import type { Graphics } from 'pixi.js';

// The painted meadow the title screen stands in front of: dawn sky, sun,
// three hill silhouettes, the keep, the ground cross-section, and the small
// life that moves in it. Every number here is from the design reference
// (design_handoff_title_screen/Title Screen.dc.html), authored in the same
// 320×224 space as the rest of the game.
//
// It does NOT reuse ParallaxBackground's 'meadow' flavor: that one is a flat
// daytime blue with grey hills at horizon 128 for scrolling gameplay, while
// the title wants seven dawn bands, a rising sun and a horizon at 150. The
// two are different pictures of the same place, so this file paints its own.
//
// Two kinds of painter:
//   draw*(g, mood)     - static, built once into a Graphics at boot.
//   paint*(g, mood, t) - animated, clear()ed and repainted every frame from
//                        the scene clock `t` (seconds). Everything moves a
//                        little and nothing moves fast.

// ---------------------------------------------------------------------------
// Moods. Dawn is the shipped default; dusk and night exist in the design
// file with the same geometry. Adding one is a data edit here plus a name in
// TitleMoodName — the painters never hard-code a colour.
// ---------------------------------------------------------------------------

export interface HillLayer {
  maxH: number;
  freq: number;
  seed: number;
  color: number;
  // 1-px sun-catching edge along the ridge; null for the farthest layer.
  rim: number | null;
}

export interface TitleMood {
  // Sky bands, top y → colour, top to bottom. The last band runs to the horizon.
  bands: readonly (readonly [number, number])[];
  stars: { count: number; maxY: number };
  sun: { x: number; y: number; rings: readonly (readonly [number, number])[] } | null;
  // Far to near; each is drawn over the previous one.
  hills: readonly HillLayer[];
  cloud: readonly [number, number];
  ground: {
    hi: number;
    grass: number;
    lo: number;
    dirt: number;
    dirtLo: number;
    speck: number;
    tuft: number;
    flower: number;
    path: number;
  };
  keep: { body: number; dark: number; rim: number; glow: number; flag: number };
  stone: { body: number; lo: number };
  bird: number;
  mist: number;
  // Conifers and the near grass blades — the darkest thing on screen.
  foreground: number;
  ui: {
    title: number;
    titleHi: number;
    shine: number;
    shadow: number;
    rule: number;
    tagline: number;
    active: number;
    idle: number;
    hint: number;
  };
}

export type TitleMoodName = 'dawn';

export const DEFAULT_TITLE_MOOD: TitleMoodName = 'dawn';

export const TITLE_MOODS: Record<TitleMoodName, TitleMood> = {
  dawn: {
    bands: [
      [0, DB32.valhalla],
      [22, DB32.deepKoamaru],
      [48, DB32.smokeyAsh],
      [74, DB32.brown],
      [98, DB32.tahitiGold],
      [120, DB32.twine],
      [136, DB32.pancho],
    ],
    stars: { count: 22, maxY: 60 },
    sun: {
      x: 178,
      y: 120,
      rings: [
        [20, DB32.twine],
        [15, DB32.tahitiGold],
        [10, DB32.goldenFizz],
        [5, DB32.white],
      ],
    },
    hills: [
      { maxH: 22, freq: 0.03, seed: 0.9, color: DB32.brown, rim: null },
      { maxH: 36, freq: 0.021, seed: 1.3, color: DB32.loulou, rim: DB32.brown },
      { maxH: 56, freq: 0.014, seed: 2.7, color: DB32.valhalla, rim: DB32.tahitiGold },
    ],
    cloud: [DB32.pancho, DB32.twine],
    ground: {
      hi: DB32.christi,
      grass: DB32.dell,
      lo: DB32.opal,
      dirt: DB32.oiledCedar,
      dirtLo: DB32.loulou,
      speck: DB32.rope,
      tuft: DB32.atlantis,
      flower: DB32.clairvoyant,
      path: DB32.twine,
    },
    keep: {
      body: DB32.valhalla,
      dark: DB32.black,
      rim: DB32.tahitiGold,
      glow: DB32.goldenFizz,
      flag: DB32.clairvoyant,
    },
    stone: { body: DB32.topaz, lo: DB32.verdigris },
    bird: DB32.valhalla,
    mist: DB32.pancho,
    foreground: DB32.valhalla,
    ui: {
      title: DB32.pancho,
      titleHi: DB32.goldenFizz,
      shine: DB32.white,
      shadow: DB32.loulou,
      rule: DB32.tahitiGold,
      tagline: DB32.twine,
      active: DB32.goldenFizz,
      idle: DB32.topaz,
      hint: DB32.twine,
    },
  },
};

// ---------------------------------------------------------------------------
// Shared geometry
// ---------------------------------------------------------------------------

// Where the sky ends and the hills begin. Lower than the gameplay parallax's
// 128 because there is no tilemap under this scene — the ground is painted.
const HORIZON_Y = 150;
// The keep is planted in the grass: its walls run to here and the ground
// (painted after it) covers the last few rows.
const KEEP_BASE_Y = 174;

// Where the wanderer and the rabbit stand.
export const WANDERER_X = 76;
export const RABBIT_X = 112;

// Surface height of the meadow at column x. Two slow sines so it rolls
// rather than ripples; ±2 px in total.
export function groundTop(x: number): number {
  return 168 + Math.round(1.4 * Math.sin(x / 47) + Math.sin(x / 17 + 2));
}

// Cheap deterministic noise in [0, 1). The scene must look the same on every
// boot, so nothing here may call Math.random().
export function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// One pixel-art rect. Positions are rounded so a fractional animation value
// never lands a sprite off the grid; zero-area rects (from clipping) are
// skipped rather than handed to Pixi.
function px(g: Graphics, x: number, y: number, w: number, h: number, color: number, alpha?: number): void {
  if (w <= 0 || h <= 0) return;
  g.rect(Math.round(x), Math.round(y), w, h).fill(alpha === undefined ? color : { color, alpha });
}

// Filled disc as row spans — the only round thing on screen is the sun.
function disc(g: Graphics, cx: number, cy: number, r: number, color: number): void {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    px(g, cx - w, cy + dy, w * 2 + 1, 1, color);
  }
}

// Ridge height of a hill layer at column x: two sines, the second at 2.6×
// the frequency so the peaks vary without repeating across 320 px.
function hillHeight(layer: HillLayer, x: number): number {
  const a = 0.5 + 0.5 * Math.sin(x * layer.freq + layer.seed);
  const b = 0.5 + 0.5 * Math.sin(x * layer.freq * 2.6 + layer.seed * 4);
  return Math.round((layer.maxH * (0.45 + 0.4 * a + 0.25 * b)) / 1.1);
}

// The sky colour behind a given row — what a star turns into when it blinks off.
function bandColorAt(mood: TitleMood, y: number): number {
  let color = mood.bands[0][1];
  for (const [top, c] of mood.bands) {
    if (y >= top) color = c;
  }
  return color;
}

function starAt(i: number, maxY: number): { x: number; y: number } {
  return { x: Math.floor(hash(i, 3.7) * SCREEN_WIDTH), y: Math.floor(hash(i, 8.1) * maxY) };
}

// ---------------------------------------------------------------------------
// Static layers
// ---------------------------------------------------------------------------

// Behind everything: sky bands, stars, sun. Clouds, twinkles and birds are
// painted between this and the scenery so the hills occlude them.
export function drawBackdrop(g: Graphics, mood: TitleMood): void {
  drawSky(g, mood);
  drawStars(g, mood);
  if (mood.sun !== null) {
    for (const [r, color] of mood.sun.rings) disc(g, mood.sun.x, mood.sun.y, r, color);
  }
}

// Everything solid from the horizon down: hills, conifers, keep, ground,
// decor, path. Painted in that order so each covers the base of the last.
export function drawScenery(g: Graphics, mood: TitleMood): void {
  drawHills(g, mood);
  drawConifers(g, mood);
  drawKeep(g, mood);
  drawGround(g, mood);
  drawDecor(g, mood);
  drawPath(g, mood);
}

function drawSky(g: Graphics, mood: TitleMood): void {
  const bands = mood.bands;
  for (let i = 0; i < bands.length; i++) {
    const [y0, color] = bands[i];
    const y1 = i + 1 < bands.length ? bands[i + 1][0] : HORIZON_Y;
    px(g, 0, y0, SCREEN_WIDTH, y1 - y0, color);
    if (i === 0) continue;
    // Dither the seam: the lower colour bleeds 1 px up every 2 px on the row
    // above it and every 4 px two rows above — the copper-bar trick that
    // makes seven flat bands read as a gradient.
    for (let x = 0; x < SCREEN_WIDTH; x += 2) px(g, x, y0 - 1, 1, 1, color);
    for (let x = 1; x < SCREEN_WIDTH; x += 4) px(g, x, y0 - 2, 1, 1, color);
  }
}

function drawStars(g: Graphics, mood: TitleMood): void {
  const { count, maxY } = mood.stars;
  for (let i = 0; i < count; i++) {
    const { x, y } = starAt(i, maxY);
    // The lowest stars are already fading into the dawn.
    const near = y > maxY - 26;
    px(g, x, y, 1, 1, near ? DB32.heather : DB32.lightSteel);
  }
}

function drawHills(g: Graphics, mood: TitleMood): void {
  for (const layer of mood.hills) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      const h = hillHeight(layer, x);
      // Run 32 px below the horizon so the ground can rise into it without a seam.
      px(g, x, HORIZON_Y - h, 1, h + 32, layer.color);
      if (layer.rim !== null) px(g, x, HORIZON_Y - h, 1, 1, layer.rim);
    }
  }
}

// Four five-row triangles standing on the nearest ridge.
const CONIFER_XS = [26, 118, 152, 300] as const;

function drawConifers(g: Graphics, mood: TitleMood): void {
  const ridge = mood.hills[mood.hills.length - 1];
  for (const x of CONIFER_XS) {
    const base = HORIZON_Y - hillHeight(ridge, x);
    for (let k = 0; k < 5; k++) {
      px(g, x - Math.floor(k / 2), base - 6 + k, 1 + Math.floor(k / 2) * 2, 1, mood.foreground);
    }
    px(g, x, base - 1, 1, 2, mood.foreground);
  }
}

// Main block, two towers, crenellations, porch, flagpole. Only the top edges
// and the two outer corners catch the sun: outlining the whole silhouette
// made it read as scaffolding.
function drawKeep(g: Graphics, mood: TitleMood): void {
  const K = mood.keep;
  const base = KEEP_BASE_Y;

  px(g, 206, 104, 46, base - 104, K.body);
  px(g, 190, 88, 18, base - 88, K.body);
  px(g, 250, 70, 22, base - 70, K.body);
  for (let x = 206; x < 252; x += 8) px(g, x, 100, 4, 4, K.body);
  for (let x = 190; x < 208; x += 8) px(g, x, 84, 4, 4, K.body);
  for (let x = 250; x < 272; x += 8) px(g, x, 66, 4, 4, K.body);

  px(g, 190, 88, 18, 1, K.rim, 0.5);
  px(g, 208, 104, 42, 1, K.rim, 0.5);
  px(g, 250, 70, 22, 1, K.rim, 0.5);
  for (let x = 206; x < 252; x += 8) px(g, x, 100, 4, 1, K.rim, 0.5);
  for (let x = 190; x < 208; x += 8) px(g, x, 84, 4, 1, K.rim, 0.5);
  for (let x = 250; x < 272; x += 8) px(g, x, 66, 4, 1, K.rim, 0.5);
  px(g, 190, 88, 1, base - 88, K.rim, 0.22);
  px(g, 271, 70, 1, base - 70, K.rim, 0.22);

  // Faint stone courses across the main block.
  for (let y = 118; y < base; y += 12) px(g, 207, y, 44, 1, K.dark, 0.45);

  // Porch: dark doorway, two arch steps, a lit frame edge either side.
  px(g, 221, 140, 14, base - 140, K.dark);
  px(g, 223, 136, 10, 4, K.dark);
  px(g, 225, 134, 6, 2, K.dark);
  px(g, 220, 140, 1, base - 140, K.rim, 0.35);
  px(g, 235, 140, 1, base - 140, K.rim, 0.35);

  // Flagpole on the right tower. The banner itself waves in paintKeepLights.
  px(g, 260, 42, 1, 25, K.rim);
}

// Soil cross-section: grass rows, dirt to the bottom edge, speckles, a wavy
// darker seam, and the bottom 8 px shaded so the screen has a floor.
function drawGround(g: Graphics, mood: TitleMood): void {
  const G = mood.ground;
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    const top = groundTop(x);
    px(g, x, top, 1, 1, G.hi);
    px(g, x, top + 1, 1, 2, G.grass);
    px(g, x, top + 3, 1, 2, G.lo);
    px(g, x, top + 5, 1, SCREEN_HEIGHT - (top + 5), G.dirt);
    for (let y = top + 7; y < SCREEN_HEIGHT; y += 3) {
      const h = hash(x, y);
      if (h > 0.87) px(g, x, y, 1, 1, G.speck);
      else if (h < 0.05) px(g, x, y, 1, 1, G.dirtLo);
    }
    px(g, x, 194 + Math.round(2 * Math.sin(x / 23)), 1, 1, G.dirtLo);
    px(g, x, 216, 1, 8, G.dirtLo, 0.3);
  }
}

const BUSH_XS = [22, 300] as const;
const STANDING_STONE_X = 138;
// All above y=194 so none of them ever touches the key-line plate.
const BURIED_STONES = [
  [26, 188, 9, 5],
  [96, 186, 7, 4],
  [166, 190, 8, 5],
  [204, 184, 10, 4],
  [292, 190, 8, 5],
] as const;
const CRYPT_POCKET = { x: 250, y: 186, w: 17, h: 10 } as const;

function drawDecor(g: Graphics, mood: TitleMood): void {
  const G = mood.ground;

  for (const x of BUSH_XS) {
    const top = groundTop(x);
    px(g, x - 3, top - 3, 7, 3, G.lo);
    px(g, x - 2, top - 5, 5, 2, G.grass);
    px(g, x - 1, top - 6, 3, 1, G.hi);
  }

  // Standing stone on the way to the keep — a future landmark, undocumented.
  const sx = STANDING_STONE_X;
  const st = groundTop(sx);
  px(g, sx, st - 9, 4, 9, mood.stone.body);
  px(g, sx, st - 9, 1, 9, mood.stone.lo);
  px(g, sx + 1, st - 10, 2, 1, mood.stone.body);
  px(g, sx + 4, st - 1, 3, 1, mood.stone.lo);

  for (const [x, y, w, h] of BURIED_STONES) {
    px(g, x, y, w, h, mood.stone.lo);
    px(g, x, y, w, 1, mood.stone.body, 0.7);
  }

  // One black pocket in the soil with a lit lip: the only hint that there is
  // anything under the meadow. Its candle burns in paintCryptCandle.
  px(g, CRYPT_POCKET.x, CRYPT_POCKET.y, CRYPT_POCKET.w, CRYPT_POCKET.h, DB32.black);
  px(g, CRYPT_POCKET.x, CRYPT_POCKET.y, CRYPT_POCKET.w, 1, mood.stone.lo);
}

// Dotted, never solid: three pixels every seven from the wanderer's feet to
// the porch. This is the whole invitation.
function drawPath(g: Graphics, mood: TitleMood): void {
  for (let x = 92; x < 222; x += 7) {
    const top = groundTop(x);
    px(g, x, top, 3, 1, mood.ground.path, 0.5);
    px(g, x + 1, top + 1, 2, 1, mood.ground.path, 0.22);
  }
}

// ---------------------------------------------------------------------------
// Animated layers — behind the scenery
// ---------------------------------------------------------------------------

// y, drift (px/s), width. Three rows of falling alpha per streak.
const CLOUD_STREAKS = [
  [30, 0.9, 46],
  [86, 1.5, 34],
  [102, 0.6, 58],
] as const;

export function paintClouds(g: Graphics, mood: TitleMood, t: number): void {
  g.clear();
  for (let i = 0; i < CLOUD_STREAKS.length; i++) {
    const [y, drift, w] = CLOUD_STREAKS[i];
    const x = ((t * drift + i * 137) % 420) - 60;
    const c = mood.cloud[i % 2];
    px(g, x, y, w, 1, c, 0.75);
    px(g, x + 5, y + 1, w - 12, 1, c, 0.5);
    px(g, x + 12, y - 1, w - 26, 1, c, 0.35);
  }
}

// The first seven stars brighten to white on the crest of their sine and
// vanish into the sky at its trough; in between the static star shows.
const TWINKLE_COUNT = 7;

export function paintTwinkle(g: Graphics, mood: TitleMood, t: number): void {
  g.clear();
  for (let i = 0; i < TWINKLE_COUNT; i++) {
    const { x, y } = starAt(i, Math.min(64, mood.stars.maxY));
    const f = Math.sin(t * 2.1 + i * 1.7);
    if (f > 0.55) px(g, x, y, 1, 1, DB32.white);
    else if (f < -0.85) px(g, x, y, 1, 1, bandColorAt(mood, y));
  }
}

// Three birds crossing left to right at 9/12/15 px/s with a 2 px bob,
// wrapping off the right edge. Each owns a Graphics so only the flap frame
// triggers a redraw; the position is just moved.
export const BIRD_COUNT = 3;

export interface BirdFrame {
  x: number;
  y: number;
  wingFrame: 0 | 1;
}

export function birdFrame(i: number, t: number): BirdFrame {
  return {
    x: Math.round(((t * (9 + i * 3) + i * 150) % 400) - 40),
    // drawBird's body row sits at local y=-2; +2 puts it on the design's row.
    y: 52 + i * 13 + Math.round(2 * Math.sin(t * 0.7 + i)) + 2,
    wingFrame: Math.floor(t * 5 + i) % 2 === 0 ? 1 : 0,
  };
}

export function drawTitleBird(g: Graphics, mood: TitleMood, wingFrame: 0 | 1): void {
  drawBird(g, wingFrame, mood.bird);
}

// ---------------------------------------------------------------------------
// Animated layers — in front of the scenery
// ---------------------------------------------------------------------------

const KEEP_WINDOWS = [
  [196, 100],
  [214, 122],
  [226, 122],
  [240, 122],
  [256, 90],
  [262, 108],
] as const;

// Lit windows, the porch glow with its pool of light on the grass, and the
// banner. The porch is the only thing on screen the eye is pulled toward.
export function paintKeepLights(g: Graphics, mood: TitleMood, t: number): void {
  g.clear();
  const K = mood.keep;

  // Same recipe as tall-candle / chandelier: a slow per-window sine with a
  // faster jitter riding on it, quantised to three brightness steps.
  for (let i = 0; i < KEEP_WINDOWS.length; i++) {
    const [x, y] = KEEP_WINDOWS[i];
    const f = 0.5 + 0.5 * Math.sin(t * 2.7 + i * 1.9) * (0.7 + 0.3 * Math.sin(t * 7.3 + i));
    const c = f > 0.66 ? K.glow : f > 0.3 ? DB32.tahitiGold : DB32.twine;
    px(g, x - 1, y - 1, 4, 5, K.glow, 0.12 + f * 0.1);
    px(g, x, y, 2, 3, c);
  }

  const gf = 0.6 + 0.4 * Math.sin(t * 1.9);
  px(g, 223, 148, 10, 18, DB32.oiledCedar, 0.45);
  px(g, 224, 152, 8, 14, DB32.tahitiGold, 0.28 + gf * 0.16);
  px(g, 226, 156, 4, 10, K.glow, 0.22 + gf * 0.2);
  px(g, 219, 167, 18, 2, K.glow, 0.1 + gf * 0.07);
  px(g, 222, 169, 12, 2, K.glow, 0.07 + gf * 0.06);

  // Banner on the flagpole: a fixed hoist and a tail that lifts and drops 1 px.
  const wave = Math.round(Math.sin(t * 2.4));
  px(g, 261, 43, 3, 3, K.flag);
  px(g, 264, 43 + wave, 2, 3, K.flag);
  px(g, 266, 44 + wave, 1, 2, K.flag, 0.6);
}

// Three rows of dashes drifting at different speeds along the foot of the hills.
export function paintMist(g: Graphics, mood: TitleMood, t: number): void {
  g.clear();
  for (let i = 0; i < 3; i++) {
    const y = 156 + i * 3;
    const off = Math.round(t * (3 + i)) % 8;
    for (let x = -8 + off; x < SCREEN_WIDTH; x += 8) px(g, x, y, 5, 1, mood.mist, 0.16 - i * 0.04);
  }
}

// Grass tufts every 6 px where the hash allows, top pixel swaying ±1; a red
// flower pixel where it doesn't.
export function paintTufts(g: Graphics, mood: TitleMood, t: number): void {
  g.clear();
  const G = mood.ground;
  for (let x = 3; x < SCREEN_WIDTH; x += 6) {
    const h = hash(x, 7);
    const top = groundTop(x);
    if (h > 0.52) {
      const sway = Math.round(Math.sin(t * 1.4 + x * 0.21));
      px(g, x, top - 1, 1, 1, G.tuft);
      px(g, x + sway, top - 2, 1, 1, G.tuft);
      if (h > 0.86) px(g, x + sway, top - 3, 1, 1, G.tuft);
    } else if (h < 0.09) {
      px(g, x, top - 2, 1, 1, G.flower);
    }
  }
}

// One candle pixel inside the crypt pocket, with a faint halo.
export function paintCryptCandle(g: Graphics, t: number): void {
  g.clear();
  const f = 0.5 + 0.5 * Math.sin(t * 4.3);
  px(g, 252, 188, 9, 7, DB32.goldenFizz, 0.07 + f * 0.09);
  px(g, 256, 192, 1, 2, f > 0.45 ? DB32.goldenFizz : DB32.tahitiGold);
  px(g, 255, 194, 3, 1, DB32.twine, 0.7);
}

// Near grass blades along the bottom edge, 5–11 px tall, tips swaying.
export function paintForeground(g: Graphics, mood: TitleMood, t: number): void {
  g.clear();
  for (let x = 2; x < SCREEN_WIDTH; x += 11) {
    const h = 5 + Math.floor(hash(x, 21) * 7);
    const sway = Math.round(Math.sin(t * 1.1 + x * 0.13));
    for (let k = 0; k < h; k++) {
      px(g, x + (k > h - 3 ? sway : 0), SCREEN_HEIGHT - k, 1, 1, mood.foreground);
    }
  }
}

// ---------------------------------------------------------------------------
// The two figures. Both are redrawn only when their quantised frame changes.
// ---------------------------------------------------------------------------

export interface WandererFrame {
  // -1 lifts everything above the boots by a pixel: one slow breath.
  bodyBob: 0 | -1;
  // A pixel of cloak lifting off the back — the hem in the morning air.
  hem: boolean;
}

export function wandererFrame(t: number): WandererFrame {
  return {
    bodyBob: Math.sin(t * 1.05) > 0.62 ? -1 : 0,
    hem: Math.sin(t * 1.7) > 0.4,
  };
}

// The real player figure, idle, facing the keep. He does not walk on the
// title — he is waiting for the player.
export function drawWanderer(g: Graphics, frame: WandererFrame): void {
  drawFigure(g, { airborne: false, swimming: false, stepOffset: 0, bodyBob: frame.bodyBob, swimPhase: 0 });
  if (frame.hem) px(g, -6, -6 + frame.bodyBob, 1, 3, DB32.valhalla);
}

export function rabbitTwitch(t: number): boolean {
  return Math.sin(t * 1.3) > 0.62;
}

// The meadow rabbit's own drawing, standing still on the path facing the
// keep; only the front ear lifts by a pixel now and then.
export function drawTitleRabbit(g: Graphics, twitch: boolean): void {
  drawRabbit(g, 0);
  if (twitch) px(g, 4, -11, 1, 1, DB32.twine);
}

// ---------------------------------------------------------------------------
// Wordmark. Seven 5×8 bitmap glyphs drawn with rect() at 3× — no font file,
// which keeps the repo asset-free. Each glyph advances 6 columns (5 of ink
// plus a bearing) and the letters are tracked 3 px apart on top of that.
// ---------------------------------------------------------------------------

export const WORDMARK = 'LOAMKEEP';
export const WORDMARK_Y = 24;
const WORDMARK_SCALE = 3;
const WORDMARK_TRACKING = 3;
const GLYPH_ADVANCE = 6;

const GLYPHS: Record<string, readonly string[]> = {
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  A: ['.XXX.', 'X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X', 'X...X'],
  K: ['X...X', 'X..X.', 'X.X..', 'XX...', 'XX...', 'X.X..', 'X..X.', 'X...X'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....', 'XXXXX'],
  P: ['XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
};

export interface WordmarkLayout {
  // Left edge of the first glyph, centred on the screen.
  x0: number;
  // First ink column to last ink column plus bearing, tracking included.
  width: number;
}

export function wordmarkLayout(): WordmarkLayout {
  const advance = GLYPH_ADVANCE * WORDMARK_SCALE + WORDMARK_TRACKING;
  const width = WORDMARK.length * advance - WORDMARK_TRACKING;
  return { x0: Math.round(SCREEN_WIDTH / 2 - width / 2), width };
}

export interface PixelClip {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Paint every ink pixel of the wordmark as a 3×3 block in `color`, offset by
// (dx, dy), keeping only what falls inside `clip`. The clip is how the
// highlight covers the top rows and how the sweep travels — a straight
// rectangle intersected per block, so not a single blurred pixel.
export function drawWordmark(g: Graphics, color: number, dx = 0, dy = 0, clip?: PixelClip): void {
  const { x0 } = wordmarkLayout();
  const advance = GLYPH_ADVANCE * WORDMARK_SCALE + WORDMARK_TRACKING;
  let gx = x0 + dx;
  for (const ch of WORDMARK) {
    const rows = GLYPHS[ch];
    if (rows === undefined) throw new Error(`No wordmark glyph for '${ch}'`);
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] !== 'X') continue;
        let bx = gx + c * WORDMARK_SCALE;
        let by = WORDMARK_Y + dy + r * WORDMARK_SCALE;
        let bw = WORDMARK_SCALE;
        let bh = WORDMARK_SCALE;
        if (clip !== undefined) {
          const left = Math.max(bx, clip.x);
          const top = Math.max(by, clip.y);
          const right = Math.min(bx + bw, clip.x + clip.w);
          const bottom = Math.min(by + bh, clip.y + clip.h);
          bx = left;
          by = top;
          bw = right - left;
          bh = bottom - top;
        }
        px(g, bx, by, bw, bh, color);
      }
    }
    gx += advance;
  }
}

// The rule under the wordmark: 1 px spanning the wordmark plus 4 px each
// side, then six dots every 2 px fading out at both ends.
export function drawWordmarkRule(g: Graphics, mood: TitleMood): void {
  const { x0, width } = wordmarkLayout();
  const y = WORDMARK_Y + 30;
  px(g, x0 - 4, y, width + 8, 1, mood.ui.rule);
  for (let i = 0; i < 6; i++) {
    px(g, x0 - 6 - i * 2, y, 1, 1, mood.ui.rule, 0.6 - i * 0.1);
    px(g, x0 + width + 5 + i * 2, y, 1, 1, mood.ui.rule, 0.6 - i * 0.1);
  }
}

// Dithered dark backing shared by every text group: black at .34 with a
// 1-px edge every 2 px at .26. It is what keeps 8-px text legible over both
// sky and hillside; size it from measured text, never a hard-coded width.
export function drawPlate(g: Graphics, x: number, y: number, w: number, h: number): void {
  px(g, x, y, w, h, DB32.black, 0.34);
  for (let i = x; i < x + w; i += 2) {
    px(g, i, y - 1, 1, 1, DB32.black, 0.26);
    px(g, i, y + h, 1, 1, DB32.black, 0.26);
  }
  for (let j = y; j < y + h; j += 2) {
    px(g, x - 1, j, 1, 1, DB32.black, 0.26);
    px(g, x + w, j, 1, 1, DB32.black, 0.26);
  }
}

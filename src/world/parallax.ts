import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH } from '@constants';
import type { Camera } from '@systems/camera';
import type { Vec2 } from '@types';
import type { ParallaxFlavor } from '@world/level';
import { Container, Graphics } from 'pixi.js';

// Y position of the silhouette horizon line, in logical pixels.
// Matched to the grass row top so hill peaks rise into the sky band that
// sits above the tilemap.
const HORIZON_Y = 128;

interface ParallaxLayer {
  graphics: Graphics;
  scrollFactor: number; // 1 = same as camera, 0 = static
  // Vertical counterpart. The meadow's layers all track the camera 1:1 so
  // the painted horizon stays on the grass row; the night sky is behind a
  // tall tower and wants real vertical depth instead.
  scrollFactorY: number;
}

// The night sky behind the belfry. Unlike the meadow's, its layers are drawn
// in SCREEN space and slide by a fraction of the camera on both axes, so the
// stars barely move while the player climbs forty rows past them.
//
// NIGHT_HORIZON_Y is where the far hills' foot sits on screen with the camera
// at y = 0, tuned to the belfry: from the bell chamber (camera ≈ 180) the hills
// show just above its floor, and from the roof's peak (camera ≈ -60) they sink
// to the bottom of the screen.
const NIGHT_SKY = DB32.valhalla;
const NIGHT_GLOW = DB32.deepKoamaru;
const NIGHT_HILLS_FAR = 0x18162a;
const NIGHT_HILLS_NEAR = 0x0e0d16;
const NIGHT_HORIZON_Y = 204;
const NIGHT_HILLS_FY = 0.3;
const NIGHT_STARS_FY = 0.06;
const NIGHT_MOON_FY = 0.03;

// A stack of distant hill silhouettes. Each layer is a single Graphics polygon;
// its x/y is offset every frame by a fraction of the camera position to fake
// depth. Far layer is drawn first (behind), near layer on top.
//
// One instance per session — `rebuild(flavor, widthPx)` swaps the layer set
// on level transition. The 'meadow' flavor is the outdoor mountain stack
// (sky + 3 hill silhouettes); the 'keep' flavor renders nothing (an indoor
// castle has no distant horizon — the rock backdrop in the world container
// fills any visible gap behind walls).
export class ParallaxBackground {
  readonly container: Container;
  private layers: ParallaxLayer[] = [];

  constructor(flavor: ParallaxFlavor, levelWidthPx: number) {
    this.container = new Container();
    this.rebuild(flavor, levelWidthPx);
  }

  // Replace the layer set for a new level. Clears the existing container,
  // destroys the old Graphics (Pixi otherwise keeps the GPU buffers around
  // until next GC), then populates fresh layers per the flavor's recipe.
  rebuild(flavor: ParallaxFlavor, levelWidthPx: number): void {
    for (const layer of this.layers) {
      layer.graphics.destroy();
    }
    this.layers = [];
    this.container.removeChildren();

    if (flavor === 'meadow') {
      this.buildMeadowLayers(levelWidthPx);
    } else if (flavor === 'night') {
      this.buildNightLayers(levelWidthPx);
    } else if (flavor === 'keep') {
      // Indoor flavor: no sky, no hills. The rock backdrop in the world
      // container handles every visible "behind the walls" pixel. If we
      // later want a subtle interior-depth effect (faint distant pillars,
      // hallway recession), add the layers here.
    }
  }

  update(camera: Camera): void {
    // Float positions — the Application's roundPixels rounds once at render
    // time. See camera.ts / player.ts for the same reasoning.
    //
    // Vertical scroll factor is fixed at 1 (the parallax tracks camera.pos.y
    // 1:1) so the painted horizon line stays glued to the world's grass row
    // even when the camera follows the player above the level's top edge.
    // Without this, jumping from a high platform would expose a band of sky
    // between the parallax mountains and the grass surface.
    for (const layer of this.layers) {
      layer.graphics.x = -camera.pos.x * layer.scrollFactor;
      layer.graphics.y = -camera.pos.y * layer.scrollFactorY;
    }
  }

  private buildNightLayers(levelWidthPx: number): void {
    const width = levelWidthPx + SCREEN_WIDTH;

    // Sky: one flat night blue glued to the viewport, with a lighter band
    // low down where the horizon glows. 1-px dither on the seam, the
    // copper-bar treatment the meadow's sky dropped and the night keeps.
    const sky = new Graphics();
    sky.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(NIGHT_SKY);
    sky.rect(0, 168, SCREEN_WIDTH, SCREEN_HEIGHT - 168).fill(NIGHT_GLOW);
    for (let x = 0; x < SCREEN_WIDTH; x += 2) {
      sky.rect(x + ((x >> 1) & 1), 167, 1, 1).fill(NIGHT_GLOW);
    }
    this.addLayer(sky, { x: 0, y: 0 });

    this.addLayer(makeStarField(width, 0x5eed), { x: NIGHT_STARS_FY, y: NIGHT_STARS_FY });
    this.addLayer(makeMoon(), { x: NIGHT_MOON_FY, y: NIGHT_MOON_FY });

    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: NIGHT_HORIZON_Y,
        baseY: NIGHT_HORIZON_Y + 400,
        maxHeight: 28,
        pointSpacing: 24,
        frequency: 0.5,
        seed: 4.1,
        color: NIGHT_HILLS_FAR,
      }),
      { x: 0.15, y: NIGHT_HILLS_FY },
    );
    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: NIGHT_HORIZON_Y + 14,
        baseY: NIGHT_HORIZON_Y + 400,
        maxHeight: 20,
        pointSpacing: 12,
        frequency: 0.9,
        seed: 0.6,
        color: NIGHT_HILLS_NEAR,
      }),
      { x: 0.3, y: NIGHT_HILLS_FY + 0.08 },
    );
  }

  private buildMeadowLayers(levelWidthPx: number): void {
    // Layer width must cover the visible viewport at any camera position:
    //   layer_width >= screen_width + max_camera_x * scroll_factor
    // Using the level width is generous and works for scroll_factor <= 1.
    const width = levelWidthPx;

    // Sky gradient — drawn first so the mountains paint over it. Doesn't
    // scroll horizontally (scrollFactor = 0): the sky stays glued to the
    // viewport while mountains slide across. Vertically it tracks the
    // camera (handled in update()) so the horizon-line band lines up with
    // the world's grass row no matter where the camera is. Horizontal
    // bands plus 1-px dithering between them is the classic 16-bit Amiga
    // sky treatment (copper-bar effect, baked into geometry).
    this.addLayer(makeSkyGradient(SCREEN_WIDTH, HORIZON_Y), { x: 0, y: 1 });

    // Far-far: barely-darker-than-sky silhouette, slowest scroll, lowest
    // peaks. A third tier of distance — without it the jump from sky to
    // the heather layer felt abrupt. Atmospheric perspective: this one
    // nearly merges with the sky.
    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: HORIZON_Y,
        maxHeight: 22,
        pointSpacing: 48,
        frequency: 0.4,
        seed: 0.9,
        color: DB32.lightSteel,
      }),
      { x: 0.15, y: 1 },
    );

    // Far: hazy blue-gray, slower scroll, lower peaks. The tone is close to
    // the cornflower sky on purpose — atmospheric perspective makes distant
    // mountains nearly merge with the sky.
    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: HORIZON_Y,
        maxHeight: 36,
        pointSpacing: 32,
        frequency: 0.5,
        seed: 1.3,
        color: DB32.heather,
        rimColor: DB32.lightSteel,
      }),
      { x: 0.3, y: 1 },
    );

    // Near: dark green-gray, faster scroll, taller and more jagged. The
    // contrast vs the far layer is what reads as "depth." Rim light along
    // the top edge of the silhouette suggests the sun catching the peaks —
    // a small touch that lifts the layer out of "flat shape" territory.
    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: HORIZON_Y,
        maxHeight: 56,
        pointSpacing: 16,
        frequency: 0.8,
        seed: 2.7,
        color: DB32.opal,
        rimColor: DB32.verdigris,
      }),
      { x: 0.6, y: 1 },
    );
  }

  private addLayer(graphics: Graphics, factor: Vec2): void {
    this.container.addChild(graphics);
    this.layers.push({ graphics, scrollFactor: factor.x, scrollFactorY: factor.y });
  }
}

interface HillSilhouetteOptions {
  width: number;
  horizonY: number;
  maxHeight: number;
  pointSpacing: number;
  frequency: number;
  seed: number;
  color: number;
  // Where the fill closes below the ridge line. Defaults to the horizon:
  // the meadow's hills only fill the sky band above the grass. The night's
  // move vertically, so they need a body that reaches below the screen.
  baseY?: number;
  // Optional 1-px rim highlight along the top edge of the silhouette —
  // suggests sun catching the peaks. Omit for the most distant layer
  // (the rim would imply too much detail at that distance).
  rimColor?: number;
}

// Generate an organic hill silhouette as a filled polygon. The top edge is
// formed by sampling a multi-octave sine; the bottom is closed off below the
// horizon so the fill extends down behind the tilemap. When `rimColor` is
// set, a second polygon traces the top edge one pixel higher in that tint,
// producing a sun-catching rim along the ridges.
function makeHillSilhouette(opts: HillSilhouetteOptions): Graphics {
  const numPoints = Math.floor(opts.width / opts.pointSpacing) + 1;
  const points: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * opts.width;
    const t = i * opts.frequency;
    const h =
      (Math.sin(t + opts.seed) * 0.5 +
        Math.sin(t * 2.3 + opts.seed * 1.7) * 0.3 +
        Math.sin(t * 4.1 + opts.seed * 2.4) * 0.2) *
        0.5 +
      0.5;
    points.push(x, opts.horizonY - h * opts.maxHeight);
  }

  // Close the polygon AT the horizon — the silhouette only fills the sky
  // band above the surface. Below the horizon there's nothing (transparent),
  // so the underground rock backdrop in the world container shows through
  // any cave openings instead of these mountain colors bleeding down.
  points.push(opts.width, opts.baseY ?? opts.horizonY);
  points.push(0, opts.baseY ?? opts.horizonY);

  const g = new Graphics().poly(points).fill(opts.color);

  // Rim light: a 1-pixel band along the top edge of the silhouette in a
  // lighter tone. Built by tracing the sampled top points twice — once at
  // the original Y and once one pixel above — and filling the thin strip
  // between them. Reads as "sun on the ridge" without forcing a per-pixel
  // edge detection.
  if (opts.rimColor !== undefined) {
    const rim: number[] = [];
    const halfPoints = points.length - 4; // exclude the 2 horizon closure points
    for (let i = 0; i < halfPoints; i += 2) {
      rim.push(points[i], points[i + 1] - 1);
    }
    for (let i = halfPoints - 2; i >= 0; i -= 2) {
      rim.push(points[i], points[i + 1]);
    }
    g.poly(rim).fill(opts.rimColor);
  }

  return g;
}

// Clean light-blue sky. A single solid color (no bands, no dithering) —
// the cleanest possible backdrop, sky reads as sky and stays out of the
// way of the action. The blue is balanced: enough red to never look
// violet, low enough green to never look turquoise.
//
// Color chosen outside the DB32 ramp because the palette's blues all
// pulled either toward purple (cornflower, royalBlue, deepKoamaru) or
// toward cyan/turquoise (viking). This shade — RGB(136, 182, 232) —
// sits squarely between those extremes: a Mario-sky / Trap-Runner-sky
// kind of clear daylight blue.
const SKY_COLOR = 0x88b6e8;

function makeSkyGradient(width: number, horizonY: number): Graphics {
  const g = new Graphics();
  // Top is far above any reachable camera position. The vertical scroll
  // factor is 1, so when the camera looks up the screen reveals more of
  // this band — it has to extend well past any plausible camera Y.
  const skyTop = horizonY - 320;
  g.rect(0, skyTop, width, horizonY - skyTop).fill(SKY_COLOR);
  return g;
}

// Scattered stars over a band a little taller than the screen — at a vertical
// factor of 0.06 the whole belfry climb moves them about thirty pixels. Seeded,
// so the sky is the same every visit. Most are 1-px dim points; one in nine is
// a bright one with a cross of fainter pixels round it.
function makeStarField(width: number, seed: number): Graphics {
  const g = new Graphics();
  let state = seed;
  const next = (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const top = -40;
  const bottom = SCREEN_HEIGHT - 40;
  const count = Math.floor((width * (bottom - top)) / 260);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(next() * width);
    const y = Math.floor(top + next() * (bottom - top));
    const bright = next() < 0.11;
    if (bright) {
      g.rect(x, y, 1, 1).fill(DB32.white);
      g.rect(x - 1, y, 1, 1).fill(DB32.heather);
      g.rect(x + 1, y, 1, 1).fill(DB32.heather);
      g.rect(x, y - 1, 1, 1).fill(DB32.heather);
      g.rect(x, y + 1, 1, 1).fill(DB32.heather);
    } else {
      g.rect(x, y, 1, 1).fill(next() < 0.5 ? DB32.heather : DB32.topaz);
    }
  }
  return g;
}

// A waxing moon, built from horizontal runs so its edge stays on the pixel
// grid (a Graphics circle would be antialiased into mush at x3). The dark
// bite is the sky colour laid over a second disc offset to the left.
function makeMoon(): Graphics {
  const g = new Graphics();
  const cx = 252;
  const cy = 38;
  const disc = (ox: number, r: number, color: number): void => {
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy));
      g.rect(cx + ox - half, cy + dy, half * 2 + 1, 1).fill(color);
    }
  };
  disc(0, 12, DB32.deepKoamaru);
  disc(0, 10, DB32.lightSteel);
  disc(0, 9, DB32.pancho);
  disc(-6, 9, NIGHT_SKY);
  // Two craters on the lit side.
  g.rect(cx + 4, cy - 4, 2, 2).fill(DB32.twine);
  g.rect(cx + 6, cy + 3, 1, 1).fill(DB32.twine);
  return g;
}

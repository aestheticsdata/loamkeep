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
// stars barely move while the player climbs a hundred rows past them.
//
// The hills' horizon is worked out from the level's height (nightHorizonY):
// with the camera at the bottom of the level — the belfry's roof walk — the
// far hills' foot sits low on the screen, and as the player climbs the tower
// they sink out of view, until from the spire there is only sky.
const NIGHT_HILLS_BOTTOM_Y = 176;
// Where the horizon glow starts, with the camera as low as it goes.
const NIGHT_GLOW_TOP_Y = 168;
const NIGHT_SKY = DB32.valhalla;
const NIGHT_GLOW = DB32.deepKoamaru;
const NIGHT_HILLS_FAR = 0x18162a;
const NIGHT_HILLS_NEAR = 0x0e0d16;
const NIGHT_HILLS_FY = 0.08;
const NIGHT_STARS_FY = 0.06;
const NIGHT_MOON_FY = 0.03;

// The kitchen garden's evening. Its layers track the camera 1:1 vertically
// like the meadow's, so the horizon stays glued to the garden's ground,
// which is what AUTUMN_HORIZON_Y is. The sky is bands of warm to
// cool from the horizon up, dithered at each seam: the copper bars the meadow
// gave up for a flat blue, which an evening needs. The garden's ground is row
// 56; its dovecote's roof is forty rows above it.
const AUTUMN_HORIZON_Y = 56 * 16;

// The observatory's sky. Screen-space like the night's, but deeper and far
// fuller, with a band of faint dust across it and the spiral constellation
// overhead — placed, in screen coordinates, so that from the summit (camera
// at about x 1574, y 408) it hangs centred above the Sighting Stone.
const ZENITH_SKY = 0x0c0b1a;
const ZENITH_FACTOR = 0.05;
const SPIRAL_CENTRE_X = 247;
const SPIRAL_CENTRE_Y = 78;
const AUTUMN_BANDS: readonly (readonly [number, number])[] = [
  // [height above the horizon where the band starts, colour]
  [0, 0xf4cf7a],
  [24, 0xeaa25f],
  [52, 0xc97a63],
  [88, 0x9a6474],
  [132, 0x6b5a82],
  [190, 0x45466e],
];

// A stack of distant hill silhouettes. Each layer is a single Graphics polygon;
// its x/y is offset every frame by a fraction of the camera position to fake
// depth. Far layer is drawn first (behind), near layer on top.
//
// One instance per session — `rebuild(flavor, levelSize)` swaps the layer set
// on level transition. The 'meadow' flavor is the outdoor mountain stack
// (sky + 3 hill silhouettes); the 'keep' flavor renders nothing (an indoor
// castle has no distant horizon — the rock backdrop in the world container
// fills any visible gap behind walls).
export class ParallaxBackground {
  readonly container: Container;
  private layers: ParallaxLayer[] = [];

  constructor(flavor: ParallaxFlavor, levelSize: Vec2) {
    this.container = new Container();
    this.rebuild(flavor, levelSize);
  }

  // Replace the layer set for a new level. Clears the existing container,
  // destroys the old Graphics (Pixi otherwise keeps the GPU buffers around
  // until next GC), then populates fresh layers per the flavor's recipe.
  // `levelSize` is the level in pixels: x its width, y its height.
  rebuild(flavor: ParallaxFlavor, levelSize: Vec2): void {
    const levelWidthPx = levelSize.x;
    for (const layer of this.layers) {
      layer.graphics.destroy();
    }
    this.layers = [];
    this.container.removeChildren();

    if (flavor === 'meadow') {
      this.buildMeadowLayers(levelWidthPx);
    } else if (flavor === 'zenith') {
      this.buildZenithLayers(levelSize);
    } else if (flavor === 'autumn') {
      this.buildAutumnLayers(levelWidthPx);
    } else if (flavor === 'night') {
      this.buildNightLayers(levelSize);
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

  private buildNightLayers(levelSize: Vec2): void {
    const levelWidthPx = levelSize.x;
    // Where the hills' foot must sit (with no camera offset) for it to land at
    // NIGHT_HILLS_BOTTOM_Y when the camera is as low as this level lets it go.
    const nightHorizonY = NIGHT_HILLS_BOTTOM_Y + Math.max(0, levelSize.y - SCREEN_HEIGHT) * NIGHT_HILLS_FY;
    const fieldHeight = SCREEN_HEIGHT + levelSize.y * NIGHT_STARS_FY;
    const width = levelWidthPx + SCREEN_WIDTH;

    // Sky: one flat night blue glued to the viewport.
    const sky = new Graphics();
    sky.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(NIGHT_SKY);
    this.addLayer(sky, { x: 0, y: 0 });

    // A lighter band low down where the horizon glows, just above the far
    // hills and scrolling with them, so a tall level's camera never sees it
    // hanging in the sky with the hills gone below. 1-px dither on the seam,
    // the copper-bar treatment the meadow's sky dropped and the night keeps.
    const glowTop = nightHorizonY - (NIGHT_HILLS_BOTTOM_Y - NIGHT_GLOW_TOP_Y);
    const glow = new Graphics();
    glow.rect(0, glowTop, SCREEN_WIDTH, 400).fill(NIGHT_GLOW);
    for (let x = 0; x < SCREEN_WIDTH; x += 2) {
      glow.rect(x + ((x >> 1) & 1), glowTop - 1, 1, 1).fill(NIGHT_GLOW);
    }
    this.addLayer(glow, { x: 0, y: NIGHT_HILLS_FY });

    this.addLayer(makeStarField(width, 0x5eed, fieldHeight), { x: NIGHT_STARS_FY, y: NIGHT_STARS_FY });
    this.addLayer(makeMoon(), { x: NIGHT_MOON_FY, y: NIGHT_MOON_FY });

    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: nightHorizonY,
        baseY: nightHorizonY + 400,
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
        horizonY: nightHorizonY + 14,
        baseY: nightHorizonY + 400,
        maxHeight: 20,
        pointSpacing: 12,
        frequency: 0.9,
        seed: 0.6,
        color: NIGHT_HILLS_NEAR,
      }),
      { x: 0.3, y: NIGHT_HILLS_FY + 0.08 },
    );
  }

  private buildZenithLayers(levelSize: Vec2): void {
    const width = levelSize.x + SCREEN_WIDTH;
    const levelHeightPx = levelSize.y;
    // One flat colour: a lighter horizon band, glued to the screen as the
    // sky is, showed as a box behind the terraces. The dust band is the
    // variation this sky has.
    const sky = new Graphics();
    sky.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(ZENITH_SKY);
    this.addLayer(sky, { x: 0, y: 0 });
    this.addLayer(makeDustBand(width), { x: ZENITH_FACTOR, y: ZENITH_FACTOR });
    // Tall enough for the observatory's camera to run its whole height
    // without the field's bottom edge ever coming up into view.
    const fieldHeight = SCREEN_HEIGHT + levelHeightPx * ZENITH_FACTOR * 1.6;
    this.addLayer(makeStarField(width, 0x51a7, fieldHeight), { x: ZENITH_FACTOR, y: ZENITH_FACTOR });
    this.addLayer(makeStarField(width, 0x0b5e, fieldHeight), { x: ZENITH_FACTOR * 1.6, y: ZENITH_FACTOR * 1.6 });
    this.addLayer(makeSpiralConstellation(), { x: ZENITH_FACTOR, y: ZENITH_FACTOR });
  }

  private buildAutumnLayers(levelWidthPx: number): void {
    const width = levelWidthPx;
    this.addLayer(makeAutumnSky(SCREEN_WIDTH), { x: 0, y: 1 });
    this.addLayer(makeLowSun(), { x: 0.05, y: 1 });
    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: AUTUMN_HORIZON_Y,
        maxHeight: 26,
        pointSpacing: 40,
        frequency: 0.45,
        seed: 2.2,
        color: 0xa8686e,
      }),
      { x: 0.15, y: 1 },
    );
    this.addLayer(
      makeHillSilhouette({
        width,
        horizonY: AUTUMN_HORIZON_Y,
        maxHeight: 40,
        pointSpacing: 24,
        frequency: 0.6,
        seed: 5.1,
        color: DB32.loulou,
        rimColor: 0xd98a5a,
      }),
      { x: 0.3, y: 1 },
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
function makeStarField(width: number, seed: number, height = SCREEN_HEIGHT): Graphics {
  const g = new Graphics();
  let state = seed;
  const next = (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const top = -40;
  const bottom = height - 40;
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

// The garden's evening sky: AUTUMN_BANDS from the horizon up, each seam
// dithered one pixel into the band below, and the topmost band running on
// far above any camera position, as the meadow's does.
function makeAutumnSky(width: number): Graphics {
  const g = new Graphics();
  const top = AUTUMN_HORIZON_Y - 1400;
  for (let i = 0; i < AUTUMN_BANDS.length; i++) {
    const [start, color] = AUTUMN_BANDS[i];
    const end = i + 1 < AUTUMN_BANDS.length ? AUTUMN_BANDS[i + 1][0] : AUTUMN_HORIZON_Y - top;
    g.rect(0, AUTUMN_HORIZON_Y - end, width, end - start).fill(color);
    if (i + 1 < AUTUMN_BANDS.length) {
      const seam = AUTUMN_HORIZON_Y - end;
      for (let x = 0; x < width; x += 2) {
        g.rect(x + ((x >> 1) & 1), seam, 1, 1).fill(AUTUMN_BANDS[i + 1][1]);
      }
    }
  }
  return g;
}

// A big low sun half behind the hills, built from pixel rows like the moon.
function makeLowSun(): Graphics {
  const g = new Graphics();
  const cx = 220;
  const cy = AUTUMN_HORIZON_Y - 14;
  for (const [r, color] of [
    [22, 0xf6dc8c],
    [17, DB32.goldenFizz],
    [14, 0xfff6c8],
  ] as const) {
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy));
      g.rect(cx - half, cy + dy, half * 2 + 1, 1).fill(color);
    }
  }
  return g;
}

// A diagonal band of faint dust across the zenith sky: the milky way, done
// as sparse dim pixels so it reads as a haze of stars rather than a stripe.
function makeDustBand(width: number): Graphics {
  const g = new Graphics();
  let state = 0x2b1d;
  const next = (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = 0; i < width * 3; i++) {
    const x = next() * width;
    const across = (next() + next() + next() - 1.5) * 22;
    // From low on the left to high on the right, whatever the level's width.
    const y = 170 - (x / width) * 140 + across;
    g.rect(Math.floor(x), Math.floor(y), 1, 1).fill({ color: DB32.deepKoamaru, alpha: 0.9 });
  }
  return g;
}

// The spiral, in stars: the square coil carved on the Marker, the Throne and
// the tomb, its corners marked by the brightest stars in the sky and its
// runs by fainter ones, with a dotted line between — the way a chart would
// draw it. Outside in, the same turn the carvings take.
function makeSpiralConstellation(): Graphics {
  const g = new Graphics();
  const corners: readonly (readonly [number, number])[] = [
    [-60, -34],
    [60, -34],
    [60, 34],
    [-44, 34],
    [-44, -18],
    [44, -18],
    [44, 18],
    [-28, 18],
    [-28, -2],
    [12, -2],
  ];
  const at = (x: number, y: number): [number, number] => [SPIRAL_CENTRE_X + x, SPIRAL_CENTRE_Y + y];
  for (let i = 0; i + 1 < corners.length; i++) {
    const [ax, ay] = at(...corners[i]);
    const [bx, by] = at(...corners[i + 1]);
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 3; s < steps - 2; s += 4) {
      const x = Math.round(ax + ((bx - ax) * s) / steps);
      const y = Math.round(ay + ((by - ay) * s) / steps);
      g.rect(x, y, 1, 1).fill({ color: DB32.royalBlue, alpha: 0.7 });
    }
    // A fainter star midway along each run.
    const mx = Math.round((ax + bx) / 2);
    const my = Math.round((ay + by) / 2);
    g.rect(mx, my, 1, 1).fill(DB32.lightSteel);
  }
  for (const corner of corners) {
    const [x, y] = at(...corner);
    g.rect(x - 1, y - 1, 3, 3).fill({ color: DB32.lightSteel, alpha: 0.35 });
    g.rect(x, y - 2, 1, 5).fill(DB32.heather);
    g.rect(x - 2, y, 5, 1).fill(DB32.heather);
    g.rect(x, y, 1, 1).fill(DB32.white);
  }
  return g;
}

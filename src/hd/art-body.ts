import { DB32 } from '@constants';
import { paintGlow } from '@entities/glow';
import { ART_KIND, draws, fineMotion, registerArt } from '@hd/art-mode';
import { BakeCache, FineSprite } from '@hd/bake';
import { type ClassicRecorder, record } from '@hd/classic-recorder';
import { type CritterHdOptions, type CritterLayers, critterHd, flatten } from '@hd/critter-hd';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { LIT_RAMP } from '@hd/palette';
import { Container, Graphics } from 'pixi.js';

// A sprite's body in both arts, for every creature that redraws a Graphics
// when its pose changes. `draw` takes the classic drawing and, optionally, a
// hand-made HD recipe; without one the common recipe derives the HD drawing
// from the classic. The pose is keyed by what the classic drawing paints, so
// a continuous phase that only ever draws a handful of shapes (the eel's
// wave) bakes a handful of textures, and two poses that look alike share
// one. Bakes are shared by every creature of the species.
export class ArtBody extends Container {
  private readonly classic = new Graphics();
  private readonly hd = new FineSprite();
  private readonly bakes: BakeCache;
  private readonly options: CritterHdOptions;
  private shownClassic: string | null = null;
  private shownHd: string | null = null;
  // The last drawing, kept so a change of light can redraw it.
  private last: Drawing | null = null;
  // How many steps down LIT_RAMP the HD drawing is shaded.
  private steps = 0;

  constructor(species: string, options: CritterHdOptions = {}) {
    super();
    this.bakes = cacheFor(species);
    this.options = options;
    this.addChild(this.classic, this.hd);
    registerArt({ classic: this.classic, hd: this.hd, refresh: () => this.refresh() });
  }

  draw(classic: (g: Graphics) => void, hd?: (recorded: ClassicRecorder) => CritterLayers): void {
    const recorded = record(classic);
    this.last = { classic, recorded, key: signature(recorded), hd };
    this.refresh();
  }

  // Brings each drawing the mode shows up to the last pose drawn.
  private refresh(): void {
    if (draws(ART_KIND.classic)) this.showClassic();
    if (draws(ART_KIND.hd)) this.showHd();
  }

  private showClassic(): void {
    const last = this.last;
    if (!last || last.key === this.shownClassic) return;
    this.shownClassic = last.key;
    this.classic.clear();
    last.classic(this.classic);
  }

  // Shades the HD drawing `steps` down LIT_RAMP — the light where it stands
  // in a lit level (world/lighting.ts). Classic is never shaded.
  setShade(steps: number): void {
    if (steps === this.steps) return;
    this.steps = steps;
    if (draws(ART_KIND.hd)) this.showHd();
  }

  private showHd(): void {
    const last = this.last;
    if (!last) return;
    const key = this.steps > 0 ? `${last.key}|${this.steps}` : last.key;
    if (key === this.shownHd) return;
    this.shownHd = key;
    this.hd.show(
      this.bakes.get(key, () => {
        const layers = flatten(last.hd ? last.hd(last.recorded) : critterHd(last.recorded, this.options));
        return this.steps > 0 ? stepDown(layers, this.steps) : layers;
      }),
    );
    showGlows(this.hd, last.recorded, this.options.softLight);
  }
}

// What an ArtBody last drew: the classic drawing, its recording and key,
// and its own HD recipe if it has one.
interface Drawing {
  classic: (g: Graphics) => void;
  recorded: ClassicRecorder;
  key: string;
  hd?: (recorded: ClassicRecorder) => CritterLayers;
}

// Tones that are a light themselves — a flame, a lamp's heart — and stay lit
// however dark the room round them.
const LIGHTS: readonly number[] = [DB32.goldenFizz, DB32.white];

// A copy of a raster with every pixel `steps` down LIT_RAMP, but its lights.
function stepDown(canvas: FineCanvas, steps: number): FineCanvas {
  const out = new FineCanvas({ x: canvas.x0, y: canvas.y0, w: canvas.w, h: canvas.h });
  canvas.forInk((x, y, c) => {
    let shaded = c;
    if (!LIGHTS.includes(c)) for (let i = 0; i < steps; i++) shaded = LIT_RAMP.get(shaded)?.[1] ?? shaded;
    out.set(x, y, shaded);
  });
  return out;
}

// Shades every body in a sprite (a creature, a landmark, a decoration) by
// the light it stands in.
export function shadeArt(sprite: Container, steps: number): void {
  if (sprite instanceof ArtBody) sprite.setShade(steps);
  for (const child of sprite.children) if (child instanceof ArtBody) child.setShade(steps);
}

// Classic's soft light under an HD sprite, in its own logical space: the
// rings of every light the drawing records, and with `soft` its translucent
// rects too (the glowfish's halo). Light is the one thing HD draws with
// alpha (glow.ts). A sprite with no light carries no Graphics.
export function showGlows(sprite: FineSprite, recorded: ClassicRecorder, soft = false): void {
  const rects = soft ? recorded.rects.filter((r) => r.alpha > 0 && r.alpha < 1) : [];
  let layer = sprite.children[0] instanceof Graphics ? sprite.children[0] : null;
  if (recorded.glows.length === 0 && rects.length === 0) {
    layer?.clear();
    return;
  }
  if (!layer) {
    layer = new Graphics();
    sprite.addChildAt(layer, 0);
  }
  layer.clear();
  for (const glow of recorded.glows) paintGlow(layer, glow);
  for (const r of rects) layer.rect(r.x, r.y, r.w, r.h).fill({ color: r.color, alpha: r.alpha });
}

function signature(recorded: ClassicRecorder): string {
  const rects = recorded.rects.map((r) => `${r.x},${r.y},${r.w},${r.h},${r.color},${r.alpha}`);
  const glows = recorded.glows.map((g) => `g${g.x},${g.y},${g.radius},${g.color}`);
  return [...rects, ...glows].join(';');
}

const caches = new Map<string, BakeCache>();

function cacheFor(species: string): BakeCache {
  let cache = caches.get(species);
  if (!cache) {
    cache = new BakeCache();
    caches.set(species, cache);
  }
  return cache;
}

// One member of a swarm: where it is (logical px, unrounded — classic rounds
// it to the logical pixel, HD with fine motion to the fine one), how classic
// draws it around (0, 0), and optionally how HD does — with a key of its own,
// for a member whose classic drawing varies continuously (a fading alpha)
// but whose HD look comes in a few steps.
export interface SwarmMember {
  x: number;
  y: number;
  draw: (g: Graphics) => void;
  hd?: { key: string; draw: () => CritterLayers };
}

// A swarm in both arts — bees, fireflies, spores: things whose members each
// move every frame, so the swarm can't be baked whole the way a creature's
// pose is. Classic draws every member into one Graphics as it always has; HD
// gives each member a sprite and each member's look one baked texture.
export class ArtSwarm extends Container {
  private readonly classic = new Graphics();
  private readonly hd = new Container();
  private readonly bakes: BakeCache;
  private readonly options: CritterHdOptions;
  // What each member sprite shows, so a sprite is only re-shown, and its
  // glow repainted, when its member's look changes.
  private readonly shown: string[] = [];

  constructor(species: string, options: CritterHdOptions = {}) {
    super();
    this.bakes = cacheFor(species);
    this.options = options;
    this.addChild(this.classic, this.hd);
    registerArt({ classic: this.classic, hd: this.hd });
  }

  draw(members: readonly SwarmMember[]): void {
    if (draws(ART_KIND.classic)) {
      const g = this.classic;
      g.clear();
      for (const m of members) {
        g.setTransform(1, 0, 0, 1, Math.round(m.x), Math.round(m.y));
        m.draw(g);
      }
      g.resetTransform();
    }
    if (draws(ART_KIND.hd)) {
      const step = fineMotion() ? FINE : 1;
      members.forEach((m, i) => {
        const sprite = this.sprite(i);
        const own = m.hd;
        const key = own ? `hd:${own.key}` : null;
        if (key === null || this.shown[i] !== key) {
          const recorded = record(m.draw);
          const bakeKey = key ?? signature(recorded);
          if (this.shown[i] !== bakeKey) {
            sprite.show(this.bakes.get(bakeKey, () => flatten(own ? own.draw() : critterHd(recorded, this.options))));
            showGlows(sprite, recorded, this.options.softLight);
            this.shown[i] = bakeKey;
          }
        }
        sprite.position.set(Math.round(m.x * step) / step, Math.round(m.y * step) / step);
        sprite.visible = true;
      });
      for (let i = members.length; i < this.hd.children.length; i++) this.hd.children[i].visible = false;
    }
  }

  private sprite(i: number): FineSprite {
    while (this.hd.children.length <= i) this.hd.addChild(new FineSprite());
    return this.hd.children[i] as FineSprite;
  }
}

import { paintGlow } from '@entities/glow';
import { ART_KIND, draws, fineMotion, registerArt } from '@hd/art-mode';
import { BakeCache, FineSprite } from '@hd/bake';
import { type ClassicRecorder, record } from '@hd/classic-recorder';
import { type CritterHdOptions, type CritterLayers, critterHd, flatten } from '@hd/critter-hd';
import { FINE } from '@hd/fine-canvas';
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

  constructor(species: string, options: CritterHdOptions = {}) {
    super();
    this.bakes = cacheFor(species);
    this.options = options;
    this.addChild(this.classic, this.hd);
    registerArt({ classic: this.classic, hd: this.hd });
  }

  draw(classic: (g: Graphics) => void, hd?: (recorded: ClassicRecorder) => CritterLayers): void {
    const recorded = record(classic);
    const key = signature(recorded);
    if (draws(ART_KIND.classic) && key !== this.shownClassic) {
      this.shownClassic = key;
      this.classic.clear();
      classic(this.classic);
    }
    if (draws(ART_KIND.hd) && key !== this.shownHd) {
      this.shownHd = key;
      this.hd.show(this.bakes.get(key, () => flatten(hd ? hd(recorded) : critterHd(recorded, this.options))));
      showGlows(this.hd, recorded, this.options.softLight);
    }
  }
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

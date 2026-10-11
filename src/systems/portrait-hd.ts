import { DB32 } from '@constants';
import { BakeCache, FineSprite } from '@hd/bake';
import { record } from '@hd/classic-recorder';
import { flatten, portraitHd } from '@hd/critter-hd';
import type { Graphics } from 'pixi.js';

// Portraits are baked once per drawing and scale: a page shown twice, or a
// greeting met again, reuses its texture.
const bakes = new BakeCache();

// The tones that give light in a portrait, left lit by selout.
const LIGHTS = [DB32.goldenFizz, DB32.white, DB32.viking, DB32.tahitiGold];

// A drawing shown large, in HD: drawn as a portrait the size it is shown
// (portraitHd), `scale` times its own size (1 for a sketch already drawn at
// page size). Positioned like the classic Graphics it stands in for, which is
// scaled where this is not.
export function shownLarge(draw: (g: Graphics) => void, scale: number): FineSprite {
  const native = record(draw);
  const scaled = record((g) => {
    g.setTransform(scale, 0, 0, scale, 0, 0);
    draw(g);
    g.resetTransform();
  });
  const rects = native.rects.map((r) => [r.x, r.y, r.w, r.h, r.color, r.alpha].join(','));
  const glows = native.glows.map((g) => [g.x, g.y, g.radius, g.color].join(','));
  const key = [scale, ...rects, '|', ...glows].join(';');
  const sprite = new FineSprite();
  sprite.show(bakes.get(key, () => flatten(portraitHd({ native, scaled, scale }, { emissive: LIGHTS }))));
  return sprite;
}

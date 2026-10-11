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

// How a drawing is shown large: the scale classic enlarges it by (1 for a
// sketch already drawn at page size), and how many chamfer passes its blocks
// take at that size.
export interface LargeDrawing {
  scale: number;
  chamfer: number;
}

// A drawing shown large, in HD: recorded at its displayed scale and drawn as
// a portrait that size (portraitHd). Positioned like the classic Graphics it
// stands in for, which is scaled where this is not.
export function shownLarge(draw: (g: Graphics) => void, large: LargeDrawing): FineSprite {
  const { scale, chamfer } = large;
  const recorded = record((g) => {
    if (scale !== 1) g.setTransform(scale, 0, 0, scale, 0, 0);
    draw(g);
    if (scale !== 1) g.resetTransform();
  });
  const rects = recorded.rects.map((r) => [r.x, r.y, r.w, r.h, r.color, r.alpha].join(','));
  const glows = recorded.glows.map((g) => [g.x, g.y, g.radius, g.color].join(','));
  const key = [scale, chamfer, ...rects, '|', ...glows].join(';');
  const sprite = new FineSprite();
  sprite.show(bakes.get(key, () => flatten(portraitHd(recorded, chamfer, { emissive: LIGHTS }))));
  return sprite;
}

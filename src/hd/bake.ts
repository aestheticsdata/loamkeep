import { FINE, type FineCanvas } from '@hd/fine-canvas';
import { Container, Sprite, Texture } from 'pixi.js';

// A raster baked into a texture, with the fine-grid offset of its top-left
// pixel from the sprite's anchor.
export interface BakedFine {
  texture: Texture;
  x0: number;
  y0: number;
}

// Bakes a fine raster into a texture, once. Opaque pixels only: the HD pass
// has no alpha (L1), so a pixel is the colour or it is not there.
export function bake(canvas: FineCanvas): BakedFine {
  const element = document.createElement('canvas');
  element.width = Math.max(1, canvas.w);
  element.height = Math.max(1, canvas.h);
  paint(element, canvas);
  return { texture: Texture.from(element), x0: canvas.x0, y0: canvas.y0 };
}

// Writes a raster into a canvas element of the same size, every pixel of it:
// an empty fine pixel clears to transparent.
function paint(element: HTMLCanvasElement, canvas: FineCanvas): void {
  const ctx = element.getContext('2d');
  if (!ctx) throw new Error('No 2D context to bake an HD sprite');
  const image = ctx.createImageData(element.width, element.height);
  for (let i = 0; i < canvas.pixels.length; i++) {
    const c = canvas.pixels[i];
    if (c < 0) continue;
    image.data[i * 4] = (c >> 16) & 255;
    image.data[i * 4 + 1] = (c >> 8) & 255;
    image.data[i * 4 + 2] = c & 255;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

// A texture that is redrawn in place, for the few HD surfaces that move
// every frame (the water a swimmer is in): the same canvas element and the
// same texture, repainted and re-uploaded, rather than a new one a frame.
export class LiveTexture {
  readonly baked: BakedFine;
  private readonly element: HTMLCanvasElement;

  constructor(canvas: FineCanvas) {
    this.element = document.createElement('canvas');
    this.element.width = Math.max(1, canvas.w);
    this.element.height = Math.max(1, canvas.h);
    paint(this.element, canvas);
    this.baked = { texture: Texture.from(this.element), x0: canvas.x0, y0: canvas.y0 };
  }

  // Repaints from a raster the same size and place as the first.
  update(canvas: FineCanvas): void {
    paint(this.element, canvas);
    this.baked.texture.source.update();
  }

  destroy(): void {
    this.baked.texture.destroy(true);
  }
}

// Bakes each pose the first time it is asked for and hands back the same
// texture after that. Keyed by a string the owner builds from the pose.
export class BakeCache {
  private readonly baked = new Map<string, BakedFine>();

  get(key: string, draw: () => FineCanvas): BakedFine {
    let hit = this.baked.get(key);
    if (!hit) {
      hit = bake(draw());
      this.baked.set(key, hit);
    }
    return hit;
  }
}

// An HD sprite that stands in for a classic Graphics: anchored at the same
// origin, mirrored by the same scale.x = -1. The baked texture is one texel
// per fine pixel, so it sits at a third of the scale of the logical space it
// lives in, offset to where its top-left fine pixel belongs.
export class FineSprite extends Container {
  private readonly image = new Sprite();

  constructor() {
    super();
    this.image.scale.set(1 / FINE);
    this.addChild(this.image);
  }

  show(baked: BakedFine): void {
    this.image.texture = baked.texture;
    this.image.position.set(baked.x0 / FINE, baked.y0 / FINE);
  }
}

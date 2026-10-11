import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH } from '@constants';
import { ART_KIND, ART_MODE, artMode, showArt } from '@hd/art-mode';
import { FINE } from '@hd/fine-canvas';
import { drawPixelText, measurePixelText, PIXEL_FONT_HEIGHT } from '@systems/pixel-font';
import { type Application, Container, Graphics, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js';

const HALF = SCREEN_WIDTH / 2;

// The A/B tool: the left half of the stage in classic art over the HD frame,
// a hairline between them, each side tagged. Every frame in split mode, the
// stage is rendered once with every sprite showing its classic drawing into
// a texture, then the HD frame renders as normal with that texture's left
// half laid over it. Sprites without an HD drawing yet show the same thing on
// both sides, which is the point: the seam only shows what changed.
export class SplitView {
  // Goes on top of the stage, above the fade.
  readonly container = new Container();
  private readonly app: Application;
  private readonly classicHalf = new Sprite();
  private target: RenderTexture | null = null;

  constructor(app: Application) {
    this.app = app;
    this.classicHalf.scale.set(1 / FINE);
    const divider = new Graphics().rect(HALF, 0, 1 / FINE, SCREEN_HEIGHT).fill(DB32.white);
    this.container.addChild(
      this.classicHalf,
      divider,
      tag('CLASSIC', 4),
      tag('HD', SCREEN_WIDTH - 4 - measurePixelText('HD')),
    );
    this.container.visible = false;
  }

  // Called once a frame, after the game has updated and before Pixi renders.
  update(): void {
    if (artMode() !== ART_MODE.split) {
      this.container.visible = false;
      return;
    }
    const renderer = this.app.renderer;
    const target = this.targetFor(renderer.resolution);
    this.container.visible = false;
    showArt(ART_KIND.classic);
    renderer.render({ container: this.app.stage, target, clear: true });
    showArt(ART_KIND.hd);
    this.container.visible = true;
  }

  // The classic pass renders at the device ratio, like the stage, so the two
  // halves meet pixel for pixel. Rebuilt when browser zoom moves the ratio.
  private targetFor(resolution: number): RenderTexture {
    if (this.target && this.target.source.resolution === resolution) return this.target;
    this.target?.destroy(true);
    const width = SCREEN_WIDTH * FINE;
    const height = SCREEN_HEIGHT * FINE;
    this.target = RenderTexture.create({ width, height, resolution });
    this.classicHalf.texture = new Texture({
      source: this.target.source,
      frame: new Rectangle(0, 0, width / 2, height),
    });
    return this.target;
  }
}

// A side's name in the menu's bitmap font, on a dark plate.
function tag(text: string, x: number): Graphics {
  const g = new Graphics();
  const w = measurePixelText(text);
  g.rect(x - 2, 4 - 2, w + 4, PIXEL_FONT_HEIGHT + 4).fill(DB32.valhalla);
  drawPixelText(g, text, x, 4, DB32.pancho);
  return g;
}

import { bake, FineSprite } from '@hd/bake';
import { FINE } from '@hd/fine-canvas';
import { CLOUD_COUNT, cloudStreak, cloudX, MIST_ROWS, mistRow, type TitleMood, twinkles } from '@systems/title-art';
import { cloudHd, mistRowHd } from '@systems/title-hd';
import { Container, Graphics } from 'pixi.js';

// One fine pixel in logical px: where an HD layer's position snaps to.
const STEP = 1 / FINE;

function snap(x: number): number {
  return Math.round(x * FINE) / FINE;
}

// The title's moving sky in HD: the clouds and the mist, each baked once and
// slid a fine pixel at a time (L8), and the twinkling stars as 2×2 points
// over the HD stars. The classic layers they stand in for are repainted
// every frame; these are only moved.
export class TitleSkyHd {
  readonly clouds = new Container();
  readonly mist = new Container();
  readonly twinkle = new Graphics();
  private readonly cloudSprites: FineSprite[] = [];
  private readonly mistSprites: FineSprite[] = [];

  constructor(private readonly mood: TitleMood) {
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const sprite = new FineSprite();
      sprite.show(bake(cloudHd(cloudStreak(i, mood))));
      this.cloudSprites.push(sprite);
      this.clouds.addChild(sprite);
    }
    for (let i = 0; i < MIST_ROWS; i++) {
      const row = mistRow(i);
      const sprite = new FineSprite();
      sprite.show(bake(mistRowHd(row.y, mood.mist, row.density)));
      this.mistSprites.push(sprite);
      this.mist.addChild(sprite);
    }
  }

  tick(t: number): void {
    this.cloudSprites.forEach((sprite, i) => {
      sprite.x = snap(cloudX(i, t));
    });
    this.mistSprites.forEach((sprite, i) => {
      sprite.x = snap((t * mistRow(i).speed) % 8);
    });
    this.twinkle.clear();
    for (const star of twinkles(this.mood, t)) {
      if (star.color === null) continue;
      this.twinkle.rect(star.x + STEP, star.y + STEP, 2 * STEP, 2 * STEP).fill(star.color);
    }
  }
}

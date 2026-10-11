import { BakeCache, FineSprite } from '@hd/bake';
import { type TitleMood, TUFT, type TuftSite, tuftLean, tuftSites } from '@systems/title-art';
import { type TuftPose, type TuftTones, tuftHd } from '@systems/title-hd';
import { Container } from 'pixi.js';

// A tuft's sprite, where it grows, and the sway step it shows.
interface TuftSprite {
  sprite: FineSprite;
  site: TuftSite;
  sway: number;
}

// How far a tuft's tips lean at full sway, fine px: classic's whole logical
// pixel, in two steps.
const MAX_SWAY = 2;

// The title's grass tufts and flowers in HD. Every pose is baked once (two
// tuft heights and a flower, five sway steps each); each frame a sprite only
// swaps its texture when its tuft's lean crosses a step.
export class TitleTuftsHd {
  readonly container = new Container();
  private readonly bakes = new BakeCache();
  private readonly tones: TuftTones;
  private readonly sprites: TuftSprite[] = [];

  constructor(mood: TitleMood) {
    this.tones = { grass: mood.ground.tuft, flower: mood.ground.flower };
    for (const site of tuftSites()) {
      const sprite = new FineSprite();
      sprite.position.set(site.x, site.top);
      this.container.addChild(sprite);
      this.sprites.push({ sprite, site, sway: Number.NaN });
    }
  }

  tick(t: number): void {
    for (const entry of this.sprites) {
      const reach = entry.site.kind === TUFT.flower ? 1 : MAX_SWAY;
      const sway = Math.round(tuftLean(entry.site.x, t) * reach);
      if (sway === entry.sway) continue;
      entry.sway = sway;
      const pose: TuftPose = { kind: entry.site.kind, sway };
      entry.sprite.show(this.bakes.get(`${pose.kind}|${sway}`, () => tuftHd(pose, this.tones)));
    }
  }
}

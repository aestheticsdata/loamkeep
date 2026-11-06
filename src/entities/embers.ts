import { DB32, TILE_SIZE } from '@constants';
import type { Entity } from '@entities/entity';
import { drawGlow } from '@entities/glow';
import { ArtBody } from '@hd/art-body';
import type { TileRect } from '@world/level';
import { Container, type Graphics } from 'pixi.js';

// Three drawings, this many a second.
const FRAMES = 3;
const RATE = 8;

// The light over a bed of embers (the keep's hearth, hazard tiles in the
// embers look, which are drawn still): a warm glow across it and sparks that
// flicker over the coals, three drawings in turn.
export class Embers implements Entity {
  readonly sprite = new Container();
  private readonly body = new ArtBody('embers', { emissive: [DB32.goldenFizz, DB32.tahitiGold, DB32.brown] });
  private readonly cols: number;
  private time = 0;
  private shown = -1;

  constructor(area: TileRect) {
    this.cols = area.cols;
    this.sprite.position.set(area.col * TILE_SIZE, (area.row + area.rows) * TILE_SIZE);
    this.sprite.addChild(this.body);
    this.update(0);
  }

  update(dt: number): void {
    this.time += dt;
    const frame = Math.floor(this.time * RATE) % FRAMES;
    if (frame === this.shown) return;
    this.shown = frame;
    const pose = { cols: this.cols, frame };
    this.body.draw((g) => drawSparks(g, pose));
  }
}

// How the sparks are drawn: across how many tiles, and which of the three.
interface SparkPose {
  cols: number;
  frame: number;
}

// Drawn with its bottom-left at (0, 0), the top of the floor under the coals:
// a glow over the middle and, per tile, two sparks whose heights and colours
// change with the frame.
function drawSparks(g: Graphics, pose: SparkPose): void {
  const w = pose.cols * TILE_SIZE;
  drawGlow(g, { x: w / 2, y: -4, radius: w / 2 + 2 + pose.frame, color: DB32.tahitiGold });
  for (let c = 0; c < pose.cols; c++) {
    for (let i = 0; i < 2; i++) {
      const k = (c * 2 + i + pose.frame) % 3;
      const x = c * TILE_SIZE + 3 + i * 7 + k;
      const y = -9 - k * 3;
      g.rect(x, y, 1, 1).fill(k === 0 ? DB32.goldenFizz : k === 1 ? DB32.tahitiGold : DB32.brown);
    }
  }
}

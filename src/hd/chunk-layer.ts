import { bake } from '@hd/bake';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { Container, Sprite } from 'pixi.js';

// A rectangle in logical px.
export interface LogicalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// What a chunk layer paints: `width` × `height` logical px from (`left`,
// `top`) — the origin, 0 unless said — drawn by `paint` into whatever fine
// canvas (a chunk) it is handed, in the source's own fine coordinates.
export interface ChunkSource {
  left?: number;
  top?: number;
  width: number;
  height: number;
  paint(canvas: FineCanvas): void;
}

// A chunk is 128 logical px square: 384 fine, 590 KB of texture, painted in
// about 5 ms. The stage sees 320×224, so at most twelve are on screen. (At
// 256 a chunk took up to 25 ms — a dropped frame each time one came into
// the margin while scrolling.)
const CHUNK = 128;
// Chunks this far past the view's edge are baked ahead, one a frame, so a
// walk never meets one being drawn; past three times that they are let go.
const AHEAD = 128;
const KEEP = 384;

interface Chunk {
  // null: the chunk painted nothing, and has no texture.
  sprite: Sprite | null;
  col: number;
  row: number;
}

// A static HD layer too big for one texture — a level's backdrop, tiles and
// water — baked in chunks on demand around the camera and freed when it has
// moved far away. The bundle baked a level in one texture; the Observatory
// would be 9216×4800 fine px that way (see the HD spec).
export class ChunkLayer {
  readonly container = new Container();
  private readonly source: ChunkSource;
  private readonly chunks = new Map<string, Chunk>();

  constructor(source: ChunkSource) {
    this.source = source;
  }

  // Every chunk the view touches is baked now; one more in the margin
  // around it, if any is missing; chunks far off the view are freed.
  show(view: LogicalRect): void {
    for (const [col, row] of this.cellsIn(view, 0)) this.ensure(col, row);
    for (const [col, row] of this.cellsIn(view, AHEAD)) {
      if (!this.chunks.has(key(col, row))) {
        this.ensure(col, row);
        break;
      }
    }
    for (const [k, chunk] of this.chunks) {
      const left = this.left + chunk.col * CHUNK;
      const top = this.top + chunk.row * CHUNK;
      const far =
        left + CHUNK < view.x - KEEP ||
        left > view.x + view.w + KEEP ||
        top + CHUNK < view.y - KEEP ||
        top > view.y + view.h + KEEP;
      if (far) {
        free(chunk);
        this.chunks.delete(k);
      }
    }
  }

  destroy(): void {
    for (const chunk of this.chunks.values()) free(chunk);
    this.chunks.clear();
    this.container.destroy({ children: true });
  }

  private get left(): number {
    return this.source.left ?? 0;
  }

  private get top(): number {
    return this.source.top ?? 0;
  }

  private *cellsIn(view: LogicalRect, margin: number): Generator<[number, number]> {
    const x = view.x - this.left;
    const y = view.y - this.top;
    const c0 = Math.max(0, Math.floor((x - margin) / CHUNK));
    const c1 = Math.min(Math.ceil(this.source.width / CHUNK) - 1, Math.floor((x + view.w + margin) / CHUNK));
    const r0 = Math.max(0, Math.floor((y - margin) / CHUNK));
    const r1 = Math.min(Math.ceil(this.source.height / CHUNK) - 1, Math.floor((y + view.h + margin) / CHUNK));
    for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) yield [col, row];
  }

  private ensure(col: number, row: number): void {
    const k = key(col, row);
    if (this.chunks.has(k)) return;
    const canvas = new FineCanvas({
      x: (this.left + col * CHUNK) * FINE,
      y: (this.top + row * CHUNK) * FINE,
      w: Math.min(CHUNK, this.source.width - col * CHUNK) * FINE,
      h: Math.min(CHUNK, this.source.height - row * CHUNK) * FINE,
    });
    this.source.paint(canvas);
    let sprite: Sprite | null = null;
    if (canvas.pixels.some((c) => c >= 0)) {
      sprite = new Sprite(bake(canvas).texture);
      sprite.scale.set(1 / FINE);
      sprite.position.set(this.left + col * CHUNK, this.top + row * CHUNK);
      this.container.addChild(sprite);
    }
    this.chunks.set(k, { sprite, col, row });
  }
}

function key(col: number, row: number): string {
  return `${col},${row}`;
}

function free(chunk: Chunk): void {
  chunk.sprite?.destroy({ texture: true, textureSource: true });
}

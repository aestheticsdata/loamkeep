import type { ClassicRecorder } from '@hd/classic-recorder';
import { FINE, type FineCanvas } from '@hd/fine-canvas';

// The footprint law (L1): an HD drawing, downsampled ÷3 by majority — a
// logical pixel is ink when at least 5 of its 9 fine pixels are — must cover
// exactly the logical pixels the classic drawing covers. Returns how many
// logical pixels disagree, so 0 is a pass. `layers` are the HD rasters that
// make up the sprite's body; a halo is a separate layer and is left out.
export function footprint(classic: ClassicRecorder, layers: FineCanvas | readonly FineCanvas[]): number {
  return footprintDiff(classic, layers).length;
}

// The logical pixels the two drawings disagree on, as "x,y" — what to look
// at when the footprint test fails.
export function footprintDiff(classic: ClassicRecorder, layers: FineCanvas | readonly FineCanvas[]): string[] {
  const mask = classic.mask();
  const list: readonly FineCanvas[] = Array.isArray(layers) ? layers : [layers as FineCanvas];

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const cell of mask) {
    const [x, y] = cell.split(',').map(Number);
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  for (const f of list) {
    x0 = Math.min(x0, Math.floor(f.x0 / FINE));
    y0 = Math.min(y0, Math.floor(f.y0 / FINE));
    x1 = Math.max(x1, Math.ceil((f.x0 + f.w) / FINE));
    y1 = Math.max(y1, Math.ceil((f.y0 + f.h) / FINE));
  }

  const off: string[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let n = 0;
      for (let j = 0; j < FINE; j++) {
        for (let i = 0; i < FINE; i++) if (list.some((f) => f.ink(x * FINE + i, y * FINE + j))) n++;
      }
      if (n >= 5 !== mask.has(`${x},${y}`)) off.push(`${x},${y}${n >= 5 ? ' +' : ' -'}${n}`);
    }
  }
  return off;
}

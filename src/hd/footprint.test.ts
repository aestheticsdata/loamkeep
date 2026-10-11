import { record, up } from '@hd/classic-recorder';
import { FineCanvas } from '@hd/fine-canvas';
import { footprint } from '@hd/footprint';
import { describe, expect, it } from 'vitest';

const square = record((g) => {
  g.rect(0, 0, 2, 2).fill(0xffffff);
});

describe('footprint', () => {
  it('passes the classic drawing lifted ×3', () => {
    expect(footprint(square, up(square))).toBe(0);
  });

  it('passes a drawing that shaves 4 of a logical pixel’s 9 fine pixels', () => {
    const shaved = up(square).clear([
      [0, 0],
      [1, 0],
      [0, 1],
      [2, 0],
    ]);
    expect(footprint(square, shaved)).toBe(0);
  });

  it('fails one that shaves 5', () => {
    const shaved = up(square).clear([
      [0, 0],
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
    ]);
    expect(footprint(square, shaved)).toBe(1);
  });

  it('fails an empty drawing by every pixel the classic covers', () => {
    expect(footprint(square, new FineCanvas({ x: 0, y: 0, w: 6, h: 6 }))).toBe(4);
  });

  it('ignores translucent classic fills', () => {
    const glow = record((g) => {
      g.rect(0, 0, 2, 2).fill({ color: 0xffffff, alpha: 0.5 });
    });
    expect(footprint(glow, new FineCanvas({ x: 0, y: 0, w: 6, h: 6 }))).toBe(0);
  });
});

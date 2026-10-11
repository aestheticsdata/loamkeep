import { FineCanvas } from '@hd/fine-canvas';
import { smoothScale, toLogical } from '@hd/smooth-scale';
import { describe, expect, it } from 'vitest';

const A = 0x123456;
const B = 0x654321;

function canvas(cells: readonly (readonly [number, number, number])[]): FineCanvas {
  const s = new FineCanvas({ x: 0, y: 0, w: 4, h: 4 });
  for (const [x, y, c] of cells) s.set(x, y, c);
  return s;
}

describe('smoothScale', () => {
  it('cuts the outer corners of a block along the diagonal and keeps its middle', () => {
    const out = smoothScale(
      canvas([
        [0, 0, A],
        [1, 0, A],
        [0, 1, A],
        [1, 1, A],
      ]),
      6,
    );
    expect(out.ink(0, 0)).toBe(false);
    expect(out.ink(2, 0)).toBe(true);
    expect(out.ink(0, 2)).toBe(true);
    expect(out.get(6, 6)).toBe(A);
  });

  it('fills an inner corner with the colour of the two neighbours meeting at it', () => {
    const out = smoothScale(
      canvas([
        [0, 0, A],
        [1, 0, A],
        [0, 1, A],
      ]),
      6,
    );
    expect(out.get(6, 6)).toBe(A);
    expect(out.ink(11, 11)).toBe(false);
  });

  it('leaves a lone pixel and a one-pixel diagonal whole', () => {
    const lone = smoothScale(canvas([[1, 1, B]]), 4);
    expect(lone.get(4, 4)).toBe(B);
    expect(lone.get(7, 7)).toBe(B);
    const diagonal = smoothScale(
      canvas([
        [0, 0, A],
        [1, 1, A],
        [2, 2, A],
      ]),
      4,
    );
    expect(diagonal.get(4, 4)).toBe(A);
    expect(diagonal.get(7, 7)).toBe(A);
  });

  it('adds no tone the drawing did not have', () => {
    const out = smoothScale(
      canvas([
        [0, 0, A],
        [1, 0, B],
        [0, 1, B],
        [1, 1, A],
        [2, 1, A],
      ]),
      5,
    );
    const tones = new Set<number>();
    out.forInk((_x, _y, c) => tones.add(c));
    expect([...tones].sort()).toEqual([A, B].sort());
  });
});

describe('toLogical', () => {
  it('reads each logical pixel at its centre', () => {
    const fine = new FineCanvas({ x: -3, y: -3, w: 6, h: 6 });
    fine.rect({ x: -3, y: -3, w: 3, h: 3 }, A).rect({ x: 0, y: 0, w: 3, h: 3 }, B);
    const out = toLogical(fine, 3);
    expect(out.get(-1, -1)).toBe(A);
    expect(out.get(0, 0)).toBe(B);
    expect(out.ink(0, -1)).toBe(false);
  });
});

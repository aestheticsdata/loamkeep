import { FineCanvas } from '@hd/fine-canvas';
import { loOf } from '@hd/palette';
import { PIXEL_GLYPHS } from '@systems/pixel-font';

// "Loam Book" (RECIPES §8): the in-game text face in HD, in place of the
// browser's monospace. Its capitals are the menu's own 5×7 glyphs, so the
// title and the books share one alphabet; lowercase adds a 5-dot x-height
// and 2-dot descenders. Nine rows a glyph, six dots an advance. A bitmap
// table: no font file is loaded.
const ROWS = 9;
const ADVANCE = 6;

export const BOOK: Record<string, readonly string[]> = {};
for (const [ch, rows] of Object.entries(PIXEL_GLYPHS)) BOOK[ch] = [...rows, '.....', '.....'];

// A glyph drawn from `start` rows down, the rest of its nine left blank.
function glyph(ch: string, start: number, rows: readonly string[]): void {
  const g = Array<string>(ROWS).fill('.....');
  rows.forEach((r, i) => {
    g[start + i] = r;
  });
  BOOK[ch] = g;
}

// From design_handoff_hd_pass/prototype/engine.js.
glyph('a', 2, ['.XXX.', '....X', '.XXXX', 'X...X', '.XXXX']);
glyph('b', 0, ['X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.']);
glyph('c', 2, ['.XXXX', 'X....', 'X....', 'X....', '.XXXX']);
glyph('d', 0, ['....X', '....X', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX']);
glyph('e', 2, ['.XXX.', 'X...X', 'XXXXX', 'X....', '.XXXX']);
glyph('f', 0, ['..XX.', '.X...', 'XXXX.', '.X...', '.X...', '.X...', '.X...']);
glyph('g', 2, ['.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX', '....X', 'XXXX.']);
glyph('h', 0, ['X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', 'X...X']);
glyph('i', 0, ['..X..', '.....', '.XX..', '..X..', '..X..', '..X..', '.XXX.']);
glyph('j', 0, ['...X.', '.....', '..XX.', '...X.', '...X.', '...X.', '...X.', '...X.', 'XXX..']);
glyph('k', 0, ['X....', 'X....', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.']);
glyph('l', 0, ['.XX..', '..X..', '..X..', '..X..', '..X..', '..X..', '.XXX.']);
glyph('m', 2, ['XX.X.', 'X.X.X', 'X.X.X', 'X.X.X', 'X...X']);
glyph('n', 2, ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X']);
glyph('o', 2, ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.']);
glyph('p', 2, ['XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....']);
glyph('q', 2, ['.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX', '....X', '....X']);
glyph('r', 2, ['X.XX.', 'XX..X', 'X....', 'X....', 'X....']);
glyph('s', 2, ['.XXXX', 'X....', '.XXX.', '....X', 'XXXX.']);
glyph('t', 0, ['.X...', '.X...', 'XXXX.', '.X...', '.X...', '.X...', '..XX.']);
glyph('u', 2, ['X...X', 'X...X', 'X...X', 'X...X', '.XXXX']);
glyph('v', 2, ['X...X', 'X...X', 'X...X', '.X.X.', '..X..']);
glyph('w', 2, ['X...X', 'X...X', 'X.X.X', 'X.X.X', '.X.X.']);
glyph('x', 2, ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X']);
glyph('y', 2, ['X...X', 'X...X', 'X...X', 'X...X', '.XXXX', '....X', '.XXX.']);
glyph('z', 2, ['XXXXX', '...X.', '..X..', '.X...', 'XXXXX']);
glyph('.', 6, ['..X..']);
glyph(',', 5, ['..X..', '..X..', '.X...']);
glyph('!', 0, ['..X..', '..X..', '..X..', '..X..', '..X..', '.....', '..X..']);
glyph('?', 0, ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.....', '..X..']);
glyph("'", 0, ['..X..', '..X..', '.X...']);
glyph('-', 3, ['.XXX.']);
glyph(':', 2, ['..X..', '.....', '.....', '.....', '..X..']);
glyph('[', 0, ['.XXX.', '.X...', '.X...', '.X...', '.X...', '.X...', '.XXX.']);
glyph(']', 0, ['.XXX.', '...X.', '...X.', '...X.', '...X.', '...X.', '.XXX.']);
glyph('+', 2, ['..X..', '..X..', 'XXXXX', '..X..', '..X..']);
glyph('=', 2, ['.....', 'XXXXX', '.....', 'XXXXX']);
glyph('<', 1, ['...X.', '..X..', '.X...', '..X..', '...X.']);
glyph('>', 1, ['.X...', '..X..', '...X.', '..X..', '.X...']);
glyph('*', 1, ['.....', 'X.X.X', '.XXX.', 'X.X.X']);
glyph('#', 1, ['.X.X.', 'XXXXX', '.X.X.', 'XXXXX', '.X.X.']);
glyph('%', 0, ['XX..X', 'XX.X.', '...X.', '..X..', '.X...', '.X.XX', 'X..XX']);
// The glyphs the game's texts use that the bundle had none for.
glyph('—', 3, ['XXXXX']);
glyph(';', 2, ['..X..', '.....', '.....', '.....', '..X..', '..X..', '.X...']);
glyph('"', 0, ['.X.X.', '.X.X.', 'X.X..']);
glyph('←', 1, ['..X..', '.X...', 'XXXXX', '.X...', '..X..']);
glyph('→', 1, ['..X..', '...X.', 'XXXXX', '...X.', '..X..']);
glyph('↑', 0, ['..X..', '.XXX.', 'X.X.X', '..X..', '..X..', '..X..']);
glyph('↓', 1, ['..X..', '..X..', '..X..', 'X.X.X', '.XXX.', '..X..']);

// The width of a line in fine px, ink to ink, at `dot` fine px a dot.
export function bookWidth(text: string, dot: number): number {
  return Math.max(0, [...text].length * ADVANCE - 1) * dot;
}

// One run of text: the top-left of its first glyph's cell, in fine px.
export interface BookRun {
  text: string;
  x: number;
  y: number;
  color: number;
  dot: number;
}

// Stamps a line of text. A character with no glyph draws as '?', so a missing
// one shows up on screen instead of vanishing.
export function drawBook(canvas: FineCanvas, run: BookRun): void {
  let gx = run.x;
  for (const ch of run.text) {
    const rows = BOOK[ch] ?? BOOK['?'];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < 5; c++) {
        if (rows[r][c] === 'X')
          canvas.rect({ x: gx + c * run.dot, y: run.y + r * run.dot, w: run.dot, h: run.dot }, run.color);
      }
    }
    gx += ADVANCE * run.dot;
  }
}

// Wraps by character count (RECIPES §8), keeping the text's own line breaks.
export function bookWrap(text: string, columns: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if ([...next].length > columns && line) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out;
}

// The menu font on the fine grid (RECIPES §8, `menuHD`): each dot 3×3; where
// two dots touch only at a corner, one fine pixel bridges each elbow; a
// 1-fine drop shadow one step down the ramp. Drawn with its top-left at
// (0, 0).
export function menuTextHd(text: string, color: number): FineCanvas {
  const on = new Set<string>();
  let gx = 0;
  for (const ch of text) {
    const rows = PIXEL_GLYPHS[ch] ?? PIXEL_GLYPHS[' '];
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === 'X') on.add(`${gx + c},${r}`);
    });
    gx += ADVANCE;
  }
  const has = (a: number, b: number) => on.has(`${a},${b}`);
  const ink = new FineCanvas({ x: 0, y: 0, w: gx * 3 + 1, h: 7 * 3 + 1 });
  for (const key of on) {
    const [a, b] = key.split(',').map(Number);
    ink.rect({ x: a * 3, y: b * 3, w: 3, h: 3 }, color);
    for (const da of [1, -1]) {
      if (has(a + da, b + 1) && !has(a + da, b) && !has(a, b + 1)) {
        ink.set(da > 0 ? a * 3 + 3 : a * 3 - 1, b * 3 + 2, color);
        ink.set(da > 0 ? a * 3 + 2 : a * 3, b * 3 + 3, color);
      }
    }
  }
  const out = new FineCanvas({ x: 0, y: 0, w: ink.w, h: ink.h });
  const shade = loOf(color);
  ink.forInk((x, y) => {
    if (!ink.ink(x + 1, y + 1)) out.set(x + 1, y + 1, shade);
  });
  return out.blit(ink);
}

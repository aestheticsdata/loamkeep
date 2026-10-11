import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOK } from '@hd/book-font';
import { describe, expect, it } from 'vitest';

// Every file that holds words the player reads: the books, the greetings,
// the levels' landmark pages and door labels, the title and the map.
const ROOT = join(import.meta.dirname, '..');
const SOURCES = [
  ...['systems', 'world', 'world/levels', 'entities'].flatMap((dir) =>
    readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .map((f) => join(ROOT, dir, f)),
  ),
];

// The prose in a file: string literals with a space in them, which is what
// sets a sentence apart from an import path, a key or a type name.
function prose(source: string): string[] {
  const literals = source.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) ?? [];
  return literals
    .map((l) => l.slice(1, -1).replace(/\$\{[^}]*\}/g, ''))
    .filter((l) => / /.test(l) && !/^\s*\/\//.test(l));
}

describe('the book font', () => {
  it('has a glyph for every character the game writes', () => {
    const missing = new Map<string, string>();
    let lines = 0;
    for (const file of SOURCES) {
      for (const line of prose(readFileSync(file, 'utf8'))) {
        lines++;
        for (const ch of line) if (!(ch in BOOK) && ch !== '\\') missing.set(ch, `${file.slice(ROOT.length)}: ${line}`);
      }
    }
    // The books alone run to well over a hundred lines: a scan that found
    // a handful read nothing.
    expect(lines).toBeGreaterThan(300);
    expect([...missing]).toEqual([]);
  });
});

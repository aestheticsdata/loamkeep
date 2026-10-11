import { textResolution } from '@constants';
import { ART_KIND, draws, registerArt } from '@hd/art-mode';
import { BakeCache, FineSprite } from '@hd/bake';
import { bookWidth, bookWrap, drawBook } from '@hd/book-font';
import { FINE, FineCanvas } from '@hd/fine-canvas';
import { Container, Text, type TextStyleOptions } from 'pixi.js';

// Body text at 2 fine px a dot; titles — anything set at 12 px or more in
// classic — at 3. A line of body text is 10 logical px (RECIPES §8).
const TITLE_SIZE = 12;
const BODY_PITCH = 30;
const TITLE_PITCH = 45;

const bakes = new BakeCache();

// What an ArtText shows: the classic Text's own options, read by both arts.
export interface ArtTextSpec {
  text: string;
  style: TextStyleOptions;
}

// Text in both arts: the classic Pixi Text exactly as it was, and in HD the
// same words in the book font, top-left at the same point. Layout keeps
// reading the classic Text's measurements (`classic.width`), which the book
// face, narrower at every size the game uses, always fits inside.
export class ArtText extends Container {
  readonly classic: Text;
  private readonly hd = new FineSprite();

  constructor(spec: ArtTextSpec) {
    super();
    this.classic = new Text({ text: spec.text, style: spec.style });
    this.classic.resolution = textResolution();
    this.addChild(this.classic, this.hd);
    registerArt({ classic: this.classic, hd: this.hd });
    if (draws(ART_KIND.hd)) this.hd.show(bakes.get(key(spec), () => bookCanvas(spec)));
  }
}

function dotOf(style: TextStyleOptions): number {
  return (typeof style.fontSize === 'number' ? style.fontSize : 8) >= TITLE_SIZE ? 3 : 2;
}

function colorOf(style: TextStyleOptions): number {
  return typeof style.fill === 'number' ? style.fill : 0x222034;
}

function key(spec: ArtTextSpec): string {
  const { style } = spec;
  return `${dotOf(style)}|${colorOf(style)}|${style.wordWrap ? style.wordWrapWidth : 0}|${spec.text}`;
}

// The lines, wrapped by character count when the classic Text wraps, set
// in the book font.
function bookCanvas(spec: ArtTextSpec): FineCanvas {
  const { style } = spec;
  const dot = dotOf(style);
  const pitch = dot === 3 ? TITLE_PITCH : BODY_PITCH;
  const columns = style.wordWrap && style.wordWrapWidth ? Math.floor((style.wordWrapWidth * FINE) / (6 * dot)) : 0;
  const lines = columns > 0 ? bookWrap(spec.text, columns) : spec.text.split('\n');
  const width = Math.max(1, ...lines.map((line) => bookWidth(line, dot)));
  const canvas = new FineCanvas({ x: 0, y: 0, w: width, h: Math.max(1, lines.length * pitch) });
  lines.forEach((text, i) => {
    drawBook(canvas, { text, x: 0, y: i * pitch, color: colorOf(style), dot });
  });
  return canvas;
}
